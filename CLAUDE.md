# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project implements an MCP (Model Context Protocol) client as an Electron desktop application with HTTP proxy support for security testing and traffic inspection using Burp Suite.

The core architecture is: MCP Client (Desktop App) → HTTP Proxy (Burp Suite on localhost:8080) → Remote MCP Server

## Project Status

This is a new project. The SRD (Software Requirements Document) is located at `docs/MCP_Client_with_Proxy_Support_SRD.md`. All development should follow this SRD.

## Technology Stack

- **Framework**: Electron (desktop application)
- **Language**: JavaScript/Node.js
- **HTTP Client**: axios with https-proxy-agent
- **UI**: HTML/CSS with optional React components
- **Proxy**: Burp Suite (localhost:8080)

## Project Structure

When implementing, the project will have:
- `main.js` - Electron main process (handles IPC and proxy configuration)
- `preload.js` - Electron preload script (exposes secure IPC bridge)
- `renderer.js` - UI logic and MCP client class
- `index.html` - Application interface
- `package.json` - Project configuration and dependencies

## Common Commands

Development:
```bash
npm start                 # Run the Electron app in development mode
```

Building:
```bash
npm run build            # Build for current platform
npm run build:mac        # Build for macOS (DMG and ZIP)
npm run build:win        # Build for Windows (NSIS and portable)
npm run build:linux      # Build for Linux (AppImage and DEB)
```

## Key Architecture Details

### IPC Communication

The application uses Electron's IPC (Inter-Process Communication) with two main handlers:
- `mcp-request` - Sends MCP requests through the configured proxy
- `test-proxy` - Tests proxy connectivity before connecting to MCP server

All network requests are handled in the main process for security, with results returned to the renderer via IPC.

### Proxy Configuration

The proxy is configured using `https-proxy-agent` and attached to axios requests. The proxy settings are:
- Host: localhost (configurable)
- Port: 8080 (configurable)
- Can be enabled/disabled via UI toggle

Both HTTP and HTTPS proxying are supported through the same agent configuration.

### MCP Protocol Implementation

The client implements core MCP methods:
- `initialize` - Establishes connection with protocol version and capabilities
- `tools/list` - Lists available tools from the server
- `tools/call` - Executes a specific tool with arguments

All requests follow the JSON-RPC 2.0 format with sequential request IDs.

## Security Considerations

This is a defensive security tool for authorized testing only:
- Proxy decrypts HTTPS traffic (requires Burp CA certificate installation)
- Only use on systems with explicit permission
- All traffic is logged for inspection
- Credentials should never be hardcoded

## Development Notes

- The preload script uses `contextIsolation: true` for security
- The main window opens DevTools by default during development
- Request/response logging is built into the MCPClient class
- Proxy configuration is persistent within the session but not saved to disk

## Burp Suite Setup

Before using the application:
1. Start Burp Suite with proxy listener on 127.0.0.1:8080
2. For HTTPS servers: Install Burp CA certificate in system trust store
3. Configure scope in Burp to focus on MCP server traffic
4. Enable intercept to inspect requests before forwarding
