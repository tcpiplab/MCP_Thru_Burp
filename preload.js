const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mcpClient', {
  sendRequest: (config) => ipcRenderer.invoke('mcp-request', config),
  testProxy: (proxyUrl, rejectUnauthorized) => ipcRenderer.invoke('test-proxy', proxyUrl, rejectUnauthorized)
});