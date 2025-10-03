# MCP Thru Burp

A desktop application that routes Model Context Protocol (MCP) traffic through Burp Suite for security testing and analysis. This tool acts as an MCP client that proxies all requests through Burp Suite, allowing you to inspect, modify, and test MCP server communications.



## Features

- **Full MCP Protocol Support**: Connect to any MCP server and execute all standard operations
- **Burp Suite Integration**: Route all traffic through Burp Suite for inspection and modification
- **Bearer Token Authentication**: Support for token-based authentication
- **Custom Headers**: Add custom HTTP headers to all requests
- **TLS Certificate Handling**: Option to ignore self-signed certificate errors
- **Traffic Logging**: View all requests and responses in real-time
- **Modal-Based UI**: Clean interface with modal dialogs for all operations

## Supported MCP Operations

- List Tools
- Call Tool
- List Prompts
- Get Prompt
- List Resources
- Read Resource
- Set Logging Level

## Prerequisites

- **Node.js**: Version 14 or higher
- **npm**: Comes with Node.js
- **Burp Suite**: Community or Professional edition (listening on localhost:8080 by default)

## Installation

### 1. Install Node.js and npm

#### macOS
```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nodejs npm
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install nodejs npm
```

#### Windows
Download and install from [nodejs.org](https://nodejs.org/)

Or using Chocolatey:
```powershell
choco install nodejs
```

### 2. Clone or Download the Repository

```bash
git clone https://github.com/yourusername/MCP_Thru_Burp.git
cd MCP_Thru_Burp
```

Or download and extract the ZIP file from GitHub.

### 3. Install Dependencies

```bash
npm install
```

## Usage

### 1. Start Burp Suite

- Launch Burp Suite (Community or Professional)
- Ensure the proxy listener is running on `localhost:8080` (default)
- Configure Burp to intercept HTTPS traffic if needed
- Go to Proxy > Options > Proxy Listeners and verify the listener is active

### 2. Launch MCP Thru Burp

```bash
npm start
```

The application window will open automatically.

### 3. Configure Connection Settings

1. **MCP Server URL**: Enter the URL of your MCP server (e.g., `https://mcp-server.example.com/mcp`)
2. **Bearer Token** (optional): If your server requires authentication, enter your token
3. **Custom Headers** (optional): Add any custom headers required by your server
4. **Proxy Configuration**:
   - Enable/disable proxy routing through Burp
   - Modify proxy host/port if not using default (localhost:8080)
5. **TLS Certificate Errors**: Keep "Ignore TLS Certificate Errors" checked to accept Burp's self-signed certificate

### 4. Test Proxy Connection (Optional)

Click "Test Proxy Connection" to verify Burp Suite is accessible and accepting connections.

### 5. Connect to MCP Server

Click "Connect to MCP Server". If successful, all operation buttons will be enabled.

### 6. Perform MCP Operations

Use the operation buttons to interact with the MCP server:

- **List Tools**: Retrieve all available tools from the server
- **Call Tool**: Execute a specific tool with optional JSON arguments
- **List Prompts**: Get all available prompts
- **Get Prompt**: Retrieve a specific prompt with optional arguments
- **List Resources**: Get all available resources
- **Read Resource**: Read a specific resource by URI
- **Set Logging Level**: Configure server logging verbosity

All requests and responses will appear in the Traffic Log section and in Burp Suite's HTTP history.

## Troubleshooting

### Connection Issues

**Error: "self signed certificate in certificate chain"**
- Ensure "Ignore TLS Certificate Errors" is checked
- Verify Burp Suite is running and the proxy listener is active

**Error: "Connection failed: Request failed with status code 401"**
- Verify your Bearer Token is correct
- Check that the token is properly configured in the server

**Error: "ECONNREFUSED"**
- Ensure Burp Suite is running
- Verify the proxy host and port are correct (default: localhost:8080)
- Check that Burp's proxy listener is bound to all interfaces or localhost

### Application Issues

**Application won't start**
- Verify Node.js is installed: `node --version`
- Ensure dependencies are installed: `npm install`
- Check for port conflicts

**Operations not working**
- Ensure you've successfully connected to the MCP server first
- Check the Traffic Log for error details
- Verify the request/response in Burp Suite's HTTP history

## Building Standalone Executables

To create distributable executables for each platform:

### macOS
```bash
npm run build:mac
```
Output: `dist/MCP Thru Burp-1.0.0.dmg` and `.zip`

### Windows
```bash
npm run build:win
```
Output: `dist/MCP Thru Burp Setup 1.0.0.exe` and portable `.exe`

### Linux
```bash
npm run build:linux
```
Output: `dist/MCP Thru Burp-1.0.0.AppImage` and `.deb`

**Note**: Cross-platform building may require additional tools. It's recommended to build on the target platform.

## Development

### Project Structure

```
MCP_Thru_Burp/
├── main.js           # Electron main process
├── preload.js        # IPC bridge between main and renderer
├── renderer.js       # MCP client logic
├── index.html        # Application UI
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Key Dependencies

- **Electron**: Desktop application framework
- **Axios**: HTTP client for MCP requests
- **https-proxy-agent**: HTTP/HTTPS proxy support

## Security Considerations

- This tool is designed for **security testing purposes only**
- The "Ignore TLS Certificate Errors" option should only be used in testing environments
- Be cautious when handling sensitive authentication tokens
- Never commit credentials to version control

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.