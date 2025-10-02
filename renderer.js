class MCPClient {
  constructor() {
    this.serverUrl = '';
    this.bearerToken = '';
    this.customHeaders = {};
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

  async listPrompts() {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "prompts/list",
      params: {}
    };

    return await this.sendMCPRequest(request);
  }

  async getPrompt(name, args) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "prompts/get",
      params: {
        name: name,
        arguments: args || {}
      }
    };

    return await this.sendMCPRequest(request);
  }

  async listResources() {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "resources/list",
      params: {}
    };

    return await this.sendMCPRequest(request);
  }

  async readResource(uri) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "resources/read",
      params: {
        uri: uri
      }
    };

    return await this.sendMCPRequest(request);
  }

  async subscribeResource(uri) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "resources/subscribe",
      params: {
        uri: uri
      }
    };

    return await this.sendMCPRequest(request);
  }

  async complete(ref, argument) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "completion/complete",
      params: {
        ref: ref,
        argument: argument
      }
    };

    return await this.sendMCPRequest(request);
  }

  async setLoggingLevel(level) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "logging/setLevel",
      params: {
        level: level
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
      bearerToken: this.bearerToken,
      customHeaders: this.customHeaders
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
const listPromptsBtn = document.getElementById('listPromptsBtn');
const listResourcesBtn = document.getElementById('listResourcesBtn');
const getPromptBtn = document.getElementById('getPromptBtn');
const readResourceBtn = document.getElementById('readResourceBtn');
const setLoggingBtn = document.getElementById('setLoggingBtn');
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

function showModal(title, fields, onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  let fieldsHtml = '';
  fields.forEach(field => {
    if (field.type === 'textarea') {
      fieldsHtml += `
        <div class="form-group">
          <label for="modal-${field.id}">${field.label}</label>
          <textarea id="modal-${field.id}" placeholder="${field.placeholder || ''}"></textarea>
        </div>
      `;
    } else {
      fieldsHtml += `
        <div class="form-group">
          <label for="modal-${field.id}">${field.label}</label>
          <input type="${field.type}" id="modal-${field.id}" placeholder="${field.placeholder || ''}">
        </div>
      `;
    }
  });

  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      ${fieldsHtml}
      <div class="modal-buttons">
        <button id="modal-cancel">Cancel</button>
        <button id="modal-submit">Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cancelBtn = modal.querySelector('#modal-cancel');
  const submitBtn = modal.querySelector('#modal-submit');

  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  submitBtn.addEventListener('click', () => {
    const values = {};
    fields.forEach(field => {
      const input = modal.querySelector(`#modal-${field.id}`);
      values[field.id] = input.value;
    });
    document.body.removeChild(modal);
    onSubmit(values);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
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
    client.customHeaders = collectCustomHeaders();
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
      listPromptsBtn.disabled = false;
      listResourcesBtn.disabled = false;
      getPromptBtn.disabled = false;
      readResourceBtn.disabled = false;
      setLoggingBtn.disabled = false;
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

listPromptsBtn.addEventListener('click', async () => {
  listPromptsBtn.disabled = true;
  hideStatus(operationStatus);

  try {
    showStatus(operationStatus, 'Fetching available prompts...', 'info');

    const result = await client.listPrompts();
    updateTrafficLog();

    if (result.success) {
      const promptCount = result.data.result?.prompts?.length || 0;
      showStatus(operationStatus, `Found ${promptCount} available prompt(s). Check the log for details.`, 'success');
    } else {
      showStatus(operationStatus, `Failed to list prompts: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(operationStatus, `Error listing prompts: ${error.message}`, 'error');
  } finally {
    listPromptsBtn.disabled = false;
  }
});

listResourcesBtn.addEventListener('click', async () => {
  listResourcesBtn.disabled = true;
  hideStatus(operationStatus);

  try {
    showStatus(operationStatus, 'Fetching available resources...', 'info');

    const result = await client.listResources();
    updateTrafficLog();

    if (result.success) {
      const resourceCount = result.data.result?.resources?.length || 0;
      showStatus(operationStatus, `Found ${resourceCount} available resource(s). Check the log for details.`, 'success');
    } else {
      showStatus(operationStatus, `Failed to list resources: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(operationStatus, `Error listing resources: ${error.message}`, 'error');
  } finally {
    listResourcesBtn.disabled = false;
  }
});

getPromptBtn.addEventListener('click', () => {
  showModal('Get Prompt', [
    { label: 'Prompt Name', id: 'promptName', type: 'text', placeholder: 'Enter prompt name' },
    { label: 'Arguments (JSON)', id: 'promptArgs', type: 'textarea', placeholder: '{}' }
  ], async (values) => {
    const promptName = values.promptName.trim();
    if (!promptName) {
      showStatus(operationStatus, 'Prompt name is required', 'error');
      return;
    }

    let args = {};
    if (values.promptArgs.trim()) {
      try {
        args = JSON.parse(values.promptArgs);
      } catch (e) {
        showStatus(operationStatus, 'Invalid JSON for arguments', 'error');
        return;
      }
    }

    getPromptBtn.disabled = true;
    hideStatus(operationStatus);

    try {
      showStatus(operationStatus, `Getting prompt "${promptName}"...`, 'info');

      const result = await client.getPrompt(promptName, args);
      updateTrafficLog();

      if (result.success) {
        showStatus(operationStatus, `Successfully retrieved prompt "${promptName}". Check the log for details.`, 'success');
      } else {
        showStatus(operationStatus, `Failed to get prompt: ${result.error}`, 'error');
      }
    } catch (error) {
      showStatus(operationStatus, `Error getting prompt: ${error.message}`, 'error');
    } finally {
      getPromptBtn.disabled = false;
    }
  });
});

readResourceBtn.addEventListener('click', async () => {
  showModal('Read Resource', [
    { id: 'uri', label: 'Resource URI', type: 'text', placeholder: 'file:///path/to/resource' }
  ], async (values) => {
    const uri = values.uri;
    if (!uri) return;

    readResourceBtn.disabled = true;
    hideStatus(operationStatus);

    try {
      showStatus(operationStatus, `Reading resource "${uri}"...`, 'info');

      const result = await client.readResource(uri);
      updateTrafficLog();

      if (result.success) {
        showStatus(operationStatus, `Successfully read resource "${uri}". Check the log for details.`, 'success');
      } else {
        showStatus(operationStatus, `Failed to read resource: ${result.error}`, 'error');
      }
    } catch (error) {
      showStatus(operationStatus, `Error reading resource: ${error.message}`, 'error');
    } finally {
      readResourceBtn.disabled = false;
    }
  });
});

setLoggingBtn.addEventListener('click', async () => {
  showModal('Set Logging Level', [
    { id: 'level', label: 'Logging Level', type: 'text', placeholder: 'debug, info, notice, warning, error, critical, alert, emergency' }
  ], async (values) => {
    const level = values.level.trim();
    if (!level) return;

    const validLevels = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
    if (!validLevels.includes(level.toLowerCase())) {
      showStatus(operationStatus, 'Invalid logging level', 'error');
      return;
    }

    setLoggingBtn.disabled = true;
    hideStatus(operationStatus);

    try {
      showStatus(operationStatus, `Setting logging level to "${level}"...`, 'info');

      const result = await client.setLoggingLevel(level.toLowerCase());
      updateTrafficLog();

      if (result.success) {
        showStatus(operationStatus, `Successfully set logging level to "${level}".`, 'success');
      } else {
        showStatus(operationStatus, `Failed to set logging level: ${result.error}`, 'error');
      }
    } catch (error) {
      showStatus(operationStatus, `Error setting logging level: ${error.message}`, 'error');
    } finally {
      setLoggingBtn.disabled = false;
    }
  });
});

clearLogBtn.addEventListener('click', () => {
  client.clearTrafficLog();
  updateTrafficLog();
  hideStatus(operationStatus);
});

const customHeadersContainer = document.getElementById('customHeadersContainer');
const addHeaderBtn = document.getElementById('addHeaderBtn');

function collectCustomHeaders() {
  const headers = {};
  const headerRows = customHeadersContainer.querySelectorAll('.custom-header-row');

  headerRows.forEach(row => {
    const nameInput = row.querySelector('.header-name');
    const valueInput = row.querySelector('.header-value');
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();

    if (name && value) {
      headers[name] = value;
    }
  });

  return headers;
}

function addHeaderRow() {
  const row = document.createElement('div');
  row.className = 'custom-header-row';
  row.innerHTML = `
    <input type="text" class="header-name" placeholder="Header-Name">
    <input type="text" class="header-value" placeholder="Header-Value">
    <button type="button" class="remove-header-btn" style="padding: 8px 12px; margin-left: 5px;">Remove</button>
  `;

  const removeBtn = row.querySelector('.remove-header-btn');
  removeBtn.addEventListener('click', () => {
    if (customHeadersContainer.querySelectorAll('.custom-header-row').length > 1) {
      row.remove();
    }
  });

  customHeadersContainer.appendChild(row);
}

addHeaderBtn.addEventListener('click', () => {
  addHeaderRow();
});

document.querySelectorAll('.remove-header-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const row = e.target.closest('.custom-header-row');
    if (customHeadersContainer.querySelectorAll('.custom-header-row').length > 1) {
      row.remove();
    }
  });
});

console.log('MCP Client ready');