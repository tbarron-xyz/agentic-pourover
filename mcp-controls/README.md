# mcp-controls MCP Server

A Model Context Protocol server for physical control systems

This is a TypeScript-based MCP server that implements a control system for liquid dispensing and camera operations. It provides tools for:

- Controlling valve positions for liquid dispensing
- Capturing and retrieving camera images
- Tracking total liquid dispensed
- Time-based operations

## Features

### Tools
- `getImage` - Get current image from the camera
  - Returns sequential images (dry.jpg, wet.jpg, left.jpg, right.jpg, top.jpg, bottom2.jpg)
  - Provides base64-encoded image data with JPEG format

- Valve Control Tools:
  - `openLeftValve` - Open left valve and dispense specified mL
  - `openRightValve` - Open right valve and dispense specified mL  
  - `openTopValve` - Open top valve and dispense specified mL
  - `openBottomValve` - Open bottom valve and dispense specified mL
  - `openCenterValve` - Open center valve and dispense specified mL
  - All valve tools require:
    - `mL` (number): Milliliters to dispense
    - `reason` (string): Why are you taking this action?

- `time_wait` - Wait for specified number of seconds
  - Takes `n_seconds` parameter for duration

- `getDispensed` - Get the total amount of liquid dispensed
  - Returns cumulative total in milliliters

## Architecture

This MCP server uses HTTP-based communication via Express.js with the StreamableHTTPServerTransport. It runs as a web server that handles MCP protocol requests over HTTP rather than stdio.

### Server Configuration
- Default port: 3003 (configurable via `--mcpPort` argument)
- Endpoint: `/mcp` for POST, GET, and DELETE requests
- Session-based transport management
- Supports server-to-client notifications via Server-Sent Events

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-controls": {
      "command": "node",
      "args": ["/path/to/mcp-controls/build/index.js", "--mcpPort", "3003"]
    }
  }
}
```