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
  const { url, method, data, proxyUrl, rejectUnauthorized, bearerToken, customHeaders } = config;

  console.log('MCP Request config:', { url, proxyUrl, rejectUnauthorized, hasBearerToken: !!bearerToken, customHeaders });

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const axiosConfig = {
    method,
    url,
    data,
    headers: headers,
    timeout: 30000
  };

  if (proxyUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = rejectUnauthorized ? '1' : '0';
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    axiosConfig.httpsAgent = proxyAgent;
    axiosConfig.httpAgent = proxyAgent;
  } else if (rejectUnauthorized === false) {
    const https = require('https');
    axiosConfig.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
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

ipcMain.handle('test-proxy', async (event, proxyUrl, rejectUnauthorized) => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = rejectUnauthorized ? '1' : '0';
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