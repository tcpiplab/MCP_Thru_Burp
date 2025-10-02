class MCPClient {
  constructor() {
    this.serverUrl = '';
    this.bearerToken = '';
    this.proxyHost = 'localhost';
    this.proxyPort = '8080';
    this.proxyEnabled = true;
    this.rejectUnauthorized = false;
    this.requestId = 1;
    this.trafficLog = [];
    this.connected = false;
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
      proxyUrl: proxyUrl,
      rejectUnauthorized: this.rejectUnauthorized,
      bearerToken: this.bearerToken
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
    return await window.mcpClient.testProxy(proxyUrl, this.rejectUnauthorized);
  }

  getTrafficLog() {
    return this.trafficLog;
  }

  clearTrafficLog() {
    this.trafficLog = [];
  }
}

const client = new MCPClient();

const serverUrlInput = document.getElementById('serverUrl');
const bearerTokenInput = document.getElementById('bearerToken');
const proxyEnabledCheckbox = document.getElementById('proxyEnabled');
const rejectUnauthorizedCheckbox = document.getElementById('rejectUnauthorized');
const proxyHostInput = document.getElementById('proxyHost');
const proxyPortInput = document.getElementById('proxyPort');
const testProxyBtn = document.getElementById('testProxyBtn');
const connectBtn = document.getElementById('connectBtn');
const listToolsBtn = document.getElementById('listToolsBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const connectionStatus = document.getElementById('connectionStatus');
const operationStatus = document.getElementById('operationStatus');
const trafficLog = document.getElementById('trafficLog');

function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status ${type}`;
  element.classList.remove('hidden');
}

function hideStatus(element) {
  element.classList.add('hidden');
}

function updateTrafficLog() {
  const logs = client.getTrafficLog();
  if (logs.length === 0) {
    trafficLog.innerHTML = '<div style="color: #6a9955;">Waiting for requests...</div>';
    return;
  }

  trafficLog.innerHTML = logs.map(entry => {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const requestJson = JSON.stringify(entry.request, null, 2);

    let responseHtml = '';
    if (entry.response.success) {
      const responseJson = JSON.stringify(entry.response.data, null, 2);
      responseHtml = `<div class="log-response">Response (${entry.response.status}, ${entry.response.duration}ms):<pre>${responseJson}</pre></div>`;
    } else {
      responseHtml = `<div class="log-error">Error: ${entry.response.error}<pre>${JSON.stringify(entry.response.data, null, 2)}</pre></div>`;
    }

    const proxyInfo = entry.proxyUrl ? ` via proxy ${entry.proxyUrl}` : ' (direct connection)';

    return `
      <div class="log-entry">
        <div class="log-timestamp">${timestamp}${proxyInfo}</div>
        <div class="log-request">Request:<pre>${requestJson}</pre></div>
        ${responseHtml}
      </div>
    `;
  }).reverse().join('');
}

testProxyBtn.addEventListener('click', async () => {
  testProxyBtn.disabled = true;
  hideStatus(connectionStatus);

  try {
    client.proxyHost = proxyHostInput.value;
    client.proxyPort = proxyPortInput.value;
    client.rejectUnauthorized = !rejectUnauthorizedCheckbox.checked;

    showStatus(connectionStatus, 'Testing proxy connection...', 'info');

    const result = await client.testConnection();

    if (result.success) {
      showStatus(connectionStatus, 'Proxy connection successful!', 'success');
    } else {
      showStatus(connectionStatus, `Proxy connection failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(connectionStatus, `Error testing proxy: ${error.message}`, 'error');
  } finally {
    testProxyBtn.disabled = false;
  }
});

connectBtn.addEventListener('click', async () => {
  connectBtn.disabled = true;
  hideStatus(connectionStatus);

  try {
    const serverUrl = serverUrlInput.value.trim();
    if (!serverUrl) {
      showStatus(connectionStatus, 'Please enter a server URL', 'error');
      connectBtn.disabled = false;
      return;
    }

    client.bearerToken = bearerTokenInput.value.trim();
    client.proxyEnabled = proxyEnabledCheckbox.checked;
    client.proxyHost = proxyHostInput.value;
    client.proxyPort = proxyPortInput.value;
    client.rejectUnauthorized = !rejectUnauthorizedCheckbox.checked;

    showStatus(connectionStatus, 'Connecting to MCP server...', 'info');

    const result = await client.initialize(serverUrl);
    updateTrafficLog();

    if (result.success) {
      client.connected = true;
      showStatus(connectionStatus, 'Connected to MCP server successfully!', 'success');
      listToolsBtn.disabled = false;
    } else {
      showStatus(connectionStatus, `Connection failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(connectionStatus, `Error connecting: ${error.message}`, 'error');
  } finally {
    connectBtn.disabled = false;
  }
});

listToolsBtn.addEventListener('click', async () => {
  listToolsBtn.disabled = true;
  hideStatus(operationStatus);

  try {
    showStatus(operationStatus, 'Fetching available tools...', 'info');

    const result = await client.listTools();
    updateTrafficLog();

    if (result.success) {
      const toolCount = result.data.result?.tools?.length || 0;
      showStatus(operationStatus, `Found ${toolCount} available tool(s). Check the log for details.`, 'success');
    } else {
      showStatus(operationStatus, `Failed to list tools: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(operationStatus, `Error listing tools: ${error.message}`, 'error');
  } finally {
    listToolsBtn.disabled = false;
  }
});

clearLogBtn.addEventListener('click', () => {
  client.clearTrafficLog();
  updateTrafficLog();
  hideStatus(operationStatus);
});

console.log('MCP Client ready');