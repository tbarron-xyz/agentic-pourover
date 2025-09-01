#!/usr/bin/env node
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint no-empty-pattern: 0 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from "express";
import { v4 } from "uuid";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import minimist from 'minimist';
import { readFileSync } from 'fs';
// Global variables for the new tools
var dispensed = 0;
var getImageCallCount = 0;
var argv = minimist(process.argv.slice(2));
var app = express();
app.use(express.json());
// Map to store transports by session ID
var transports = {};
// Handle POST requests for client-to-server communication
app.post('/mcp', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, transport, server_1, valvePositions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sessionId = req.headers['mcp-session-id'];
                if (!(sessionId && transports[sessionId])) return [3 /*break*/, 1];
                // Reuse existing transport
                transport = transports[sessionId];
                return [3 /*break*/, 4];
            case 1:
                if (!(!sessionId && isInitializeRequest(req.body))) return [3 /*break*/, 3];
                // New initialization request
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: function () { return v4(); },
                    onsessioninitialized: function (sessionId) {
                        // Store the transport by session ID
                        transports[sessionId] = transport;
                    },
                    // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
                    // locally, make sure to set:
                    // enableDnsRebindingProtection: true,
                    // allowedHosts: ['127.0.0.1'],
                });
                // Clean up transport when closed
                transport.onclose = function () {
                    if (transport.sessionId) {
                        delete transports[transport.sessionId];
                    }
                };
                server_1 = new McpServer({
                    name: "mcp-server-controls",
                    version: "1.0.0"
                }, { capabilities: { tools: {} } });
                // Register getImage tool
                server_1.registerTool("getImage", {
                    description: "Get current image from the camera",
                    inputSchema: {},
                }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var imageFile, imagePath, imageBuffer, base64Data, errorMessage;
                    return __generator(this, function (_c) {
                        getImageCallCount++;
                        imageFile = getImageCallCount < 1 ? "dry.jpg" :
                            getImageCallCount < 2 ? "wet.jpg" :
                                getImageCallCount < 3 ? "left.jpg" :
                                    getImageCallCount < 4 ? "right.jpg" : getImageCallCount < 5 ? "top.jpg" : "bottom2.jpg";
                        imagePath = "./" + imageFile;
                        try {
                            imageBuffer = readFileSync(imagePath);
                            base64Data = imageBuffer.toString('base64');
                            console.log("returning data");
                            return [2 /*return*/, {
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
                                }];
                        }
                        catch (error) {
                            console.log("returning error");
                            errorMessage = error instanceof Error ? error.message : String(error);
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: "text",
                                            text: "Error reading image file ".concat(imageFile, ": ").concat(errorMessage),
                                        },
                                    ],
                                }];
                        }
                        return [2 /*return*/];
                    });
                }); });
                valvePositions = ["Left", "Right", "Top", "Bottom", "Center"];
                valvePositions.forEach(function (position) {
                    server_1.registerTool("open".concat(position, "Valve"), {
                        description: "Open ".concat(position.toLowerCase(), " valve and dispense specified mL"),
                        inputSchema: {
                            mL: z.number().describe("Milliliters to dispense"),
                            reason: z.string().describe("Why are you taking this action?")
                        },
                    }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var mL = _b.mL;
                        return __generator(this, function (_c) {
                            dispensed += mL;
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: "text",
                                            text: "Opened ".concat(position.toLowerCase(), " valve and dispensed ").concat(mL, " mL. Total dispensed: ").concat(dispensed, " mL"),
                                        },
                                    ],
                                }];
                        });
                    }); });
                });
                // Register time_wait tool
                server_1.registerTool("time_wait", {
                    description: "Wait for specified number of seconds",
                    inputSchema: { n_seconds: z.number().describe("Number of seconds to wait"),
                    },
                }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var n_seconds = _b.n_seconds;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, n_seconds * 1000); })];
                            case 1:
                                _c.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Waited for ".concat(n_seconds, " seconds"),
                                            },
                                        ],
                                    }];
                        }
                    });
                }); });
                // Register getDispensed tool
                server_1.registerTool("getDispensed", {
                    description: "Get the total amount dispensed",
                    inputSchema: {},
                }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    return __generator(this, function (_c) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: dispensed.toString(),
                                    },
                                ],
                            }];
                    });
                }); });
                // Connect to the MCP server
                return [4 /*yield*/, server_1.connect(transport)];
            case 2:
                // Connect to the MCP server
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                // Invalid request
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return [2 /*return*/];
            case 4: 
            // Handle the request
            return [4 /*yield*/, transport.handleRequest(req, res, req.body)];
            case 5:
                // Handle the request
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Reusable handler for GET and DELETE requests
var handleSessionRequest = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, transport;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sessionId = req.headers['mcp-session-id'];
                if (!sessionId || !transports[sessionId]) {
                    res.status(400).send('Invalid or missing session ID');
                    return [2 /*return*/];
                }
                transport = transports[sessionId];
                return [4 /*yield*/, transport.handleRequest(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);
// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);
console.log("listening");
app.listen(argv["mcpPort"] || 3003);
