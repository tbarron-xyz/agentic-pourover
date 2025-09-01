#!/usr/bin/env node
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint no-empty-pattern: 0 */

import express from "express";
import { v4 } from "uuid";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod";
import minimist from 'minimist';
import { readFileSync } from 'fs';
import { join } from 'path';

// Global variables for the new tools
let dispensed: number = 0;
let getImageCallCount: number = 0;

const argv = minimist(process.argv.slice(2));

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req: express.Request, res: express.Response) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => v4(),
            onsessioninitialized: (sessionId) => {
                // Store the transport by session ID
                transports[sessionId] = transport;
            },
            // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
            // locally, make sure to set:
            // enableDnsRebindingProtection: true,
            // allowedHosts: ['127.0.0.1'],
            });

        // Clean up transport when closed
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };
        const server = new McpServer({
        name: "mcp-server-controls",
        version: "1.0.0"
        }, { capabilities: { tools: {}}});

        // Register getImage tool
        server.registerTool(
            "getImage",
            {
                description: "Get current image from the camera",
                inputSchema: {},
            },
            async ({ }) => {
                getImageCallCount++;
                const imageFile = getImageCallCount < 1 ? "dry.jpg" : 
                    getImageCallCount < 2 ? "wet.jpg" :
                    getImageCallCount < 3 ? "left.jpg" :
                    getImageCallCount < 4 ? "right.jpg" : getImageCallCount < 5 ? "top.jpg" : "bottom2.jpg";
                const imagePath = "./" + imageFile;

                try {
                    const imageBuffer = readFileSync(imagePath);
                    const base64Data = imageBuffer.toString('base64');
                    console.log("returning data");
                    return {
                        content: [
                            {
                                type: "image",
                                data: base64Data,
                                mimeType: "image/jpeg"
                            },
                            {
                                type: 'text',
                                text: "The image was provided above"
                            }
                        ],
                    };
                } catch (error) {
                    console.log("returning error");
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error reading image file ${imageFile}: ${errorMessage}`,
                            },
                        ],
                    };
                }
            }
        );

        // Register valve opening tools
        const valvePositions = ["Left", "Right", "Top", "Bottom", "Center"];

        valvePositions.forEach(position => {
            server.registerTool(
                `open${position}Valve`,
                {
                    description: `Open ${position.toLowerCase()} valve and dispense specified mL`,
                    inputSchema: {
                            mL: z.number().describe("Milliliters to dispense"),
                            reason: z.string().describe("Why are you taking this action?")
                    },
                },
                async ({ mL }: { mL: number }) => {
                    dispensed += mL;
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Opened ${position.toLowerCase()} valve and dispensed ${mL} mL. Total dispensed: ${dispensed} mL`,
                            },
                        ],
                    };
                }
            );
        });

        // Register time_wait tool
        server.registerTool(
            "time_wait",
            {
                description: "Wait for specified number of seconds",
                inputSchema: {n_seconds: z.number().describe("Number of seconds to wait"),
                        },
            },
            async ({ n_seconds }: { n_seconds: number }) => {
                await new Promise(resolve => setTimeout(resolve, n_seconds * 1000));
                return {
                    content: [
                        {
                            type: "text",
                            text: `Waited for ${n_seconds} seconds`,
                        },
                    ],
                };
            }
        );

        // Register getDispensed tool
        server.registerTool(
            "getDispensed",
            {
                description: "Get the total amount dispensed",
                inputSchema: {},
            },
            async ({ }) => {
                return {
                    content: [
                        {
                            type: "text",
                            text: dispensed.toString(),
                        },
                    ],
                };
            }
        );

        // Connect to the MCP server
        await server.connect(transport);
    } else {
        // Invalid request
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
            },
            id: null,
        });
        return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);
console.log("listening");
app.listen(argv["mcpPort"] || 3003);
