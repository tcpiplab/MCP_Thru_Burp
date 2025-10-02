# MCP Client with Proxy Support - Implementation Guide

## Overview
This guide provides a complete implementation for building an MCP (Model Context Protocol) client with HTTP proxy support for security testing and traffic inspection using Burp Suite.

## Architecture

```
MCP Client (Desktop App) → HTTP Proxy (Burp Suite on localhost:8080) → Remote MCP Server
```

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic knowledge of JavaScript/React
- Burp Suite (for traffic inspection)

---

## Electron Implementation

### 1. Project Setup

Create a new directory and initialize the project:

```bash
mkdir mcp-proxy-client
cd mcp-proxy-client
npm init -y
```

Install dependencies:

```bash
npm install electron electron-builder
npm install axios https-proxy-agent
npm install react react-dom
npm install --save-dev @electron-forge/cli webpack
```

### 2. Main Process (main.js)

Create `main.js` in the project root:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('mcp-request', async (event, config) => {
  const { url, method, data, proxyUrl } = config;
  
  const axiosConfig = {
    method,
    url,
    data,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000
  };
  
  if (proxyUrl) {
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.httpsAgent = proxyAgent;
    axiosConfig.httpAgent = proxyAgent;
  }
  
  try {
    const startTime = Date.now();
    const response = await axios(axiosConfig);
    const endTime = Date.now();
    
    return { 
      success: true, 
      data: response.data,
      status: response.status,
      headers: response.headers,
      duration: endTime - startTime
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
});

ipcMain.handle('test-proxy', async (event, proxyUrl) => {
  try {
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    await axios.get('https://www.google.com', {
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
      timeout: 5000
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 3. Preload Script (preload.js)

Create `preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mcpClient', {
  sendRequest: (config) => ipcRenderer.invoke('mcp-request', config),
  testProxy: (proxyUrl) => ipcRenderer.invoke('test-proxy', proxyUrl)
});
```

### 4. HTML (index.html)

Create `index.html`:

```html



  
  
  


  

  


```

### 5. Renderer Process (renderer.js)

Create `renderer.js`:

```javascript
class MCPClient {
  constructor() {
    this.serverUrl = '';
    this.proxyHost = 'localhost';
    this.proxyPort = '8080';
    this.proxyEnabled = true;
    this.requestId = 1;
    this.trafficLog = [];
  }

  async initialize(serverUrl) {
    this.serverUrl = serverUrl;
    
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: "mcp-proxy-client",
          version: "1.0.0"
        }
      }
    };
    
    return await this.sendMCPRequest(request);
  }

  async listTools() {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "tools/list",
      params: {}
    };
    
    return await this.sendMCPRequest(request);
  }

  async callTool(toolName, args) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    return await this.sendMCPRequest(request);
  }

  async sendMCPRequest(data) {
    const proxyUrl = this.proxyEnabled 
      ? `http://${this.proxyHost}:${this.proxyPort}`
      : null;
    
    const config = {
      url: this.serverUrl,
      method: 'POST',
      data: data,
      proxyUrl: proxyUrl
    };
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      request: data,
      proxyUrl: proxyUrl
    };
    
    const result = await window.mcpClient.sendRequest(config);
    
    logEntry.response = result;
    this.trafficLog.push(logEntry);
    
    return result;
  }

  async testConnection() {
    const proxyUrl = `http://${this.proxyHost}:${this.proxyPort}`;
    return await window.mcpClient.testProxy(proxyUrl);
  }
}

const client = new MCPClient();
window.mcpClientInstance = client;

console.log('MCP Client ready');
```

### 6. Package Configuration (package.json)

Update your `package.json`:

```json
{
  "name": "mcp-proxy-client",
  "version": "1.0.0",
  "description": "MCP Client with Proxy Support for Security Testing",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux"
  },
  "keywords": ["mcp", "proxy", "burp", "security"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "https-proxy-agent": "^7.0.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "build": {
    "appId": "com.mcpclient.app",
    "productName": "MCP Proxy Client",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "renderer.js",
      "index.html"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Development"
    }
  }
}
```

---

## Burp Suite Configuration

### 1. Start Burp Suite
- Launch Burp Suite Professional or Community Edition
- Go to **Proxy → Options**

### 2. Configure Proxy Listener
- Ensure listener is running on `127.0.0.1:8080`
- Check the "Running" checkbox if disabled
- Click "Edit" to modify settings if needed

### 3. Enable Interception
- Go to **Proxy → Intercept**
- Toggle "Intercept is on" to capture requests
- Use "Forward" to send requests after inspection

### 4. HTTPS/TLS Setup (for HTTPS MCP servers)
- Navigate to `http://burp` while proxy is active
- Download "CA Certificate"
- Install certificate in your system trust store:
  - **macOS**: Open Keychain Access, import certificate, mark as trusted
  - **Windows**: Import to "Trusted Root Certification Authorities"
  - **Linux**: Copy to `/usr/local/share/ca-certificates/` and run `update-ca-certificates`

### 5. Scope Configuration (Optional)
- Go to **Target → Scope**
- Add your MCP server domain to scope
- Enable "Use advanced scope control"

---

## Usage

### Running the Application

```bash
npm start
```

### Building Distributable

```bash
npm run build
```

Output will be in the `dist/` directory.

### Testing with Burp Suite

1. Start Burp Suite and ensure proxy is running on `localhost:8080`
2. Launch the MCP Client application
3. Enter your MCP server URL (e.g., `https://mcp-server.example.com/mcp`)
4. Enable proxy checkbox
5. Set proxy host to `localhost` and port to `8080`
6. Click "Connect"
7. In Burp Suite, go to **Proxy → HTTP history** to see all MCP traffic

### Example MCP Requests

You'll see requests like:

```json
POST /mcp HTTP/1.1
Host: mcp-server.example.com
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "clientInfo": { "name": "mcp-proxy-client", "version": "1.0.0" }
  }
}
```

---

## Security Considerations

⚠️ **Important**: This tool is designed for authorized security testing only.

- Only use on systems you have explicit permission to test
- Store proxy credentials securely if authentication is required
- Be aware that Burp Suite will decrypt HTTPS traffic
- Follow responsible disclosure practices for any findings
- Comply with applicable laws and regulations

---

## Troubleshooting

### Proxy Connection Fails
- Verify Burp Suite is running
- Check proxy listener is on `127.0.0.1:8080`
- Ensure no firewall is blocking localhost connections

### HTTPS Certificate Errors
- Install Burp's CA certificate in system trust store
- Restart application after installing certificate

### MCP Server Unreachable
- Test connectivity without proxy first
- Check MCP server URL is correct
- Verify network connectivity

---

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [Axios Proxy Configuration](https://axios-http.com/docs/req_config)

---

## License

MIT License - Use responsibly and ethically.

## Contributing

Contributions welcome! Please ensure all security testing features are used responsibly.