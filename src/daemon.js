/**
 * chuanban-antigravity-theme-patch: CDP Daemon Process
 * Monitors Antigravity CDP port, connects via WebSocket, and applies dynamic injection & healing.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const WebSocket = require('ws');

// 补丁探针版本
const EXPECTED_PATCH_VERSION = "20261013-high-contrast-v1";
const CHECK_INTERVAL_MS = 2500;
const INJECT_SCRIPT_PATH = path.join(__dirname, 'inject.js');

// 命令行参数支持
const args = process.argv.slice(2);
const IS_ONCE = args.includes('--once');
const CUSTOM_PORT_INDEX = args.indexOf('--port');
const CUSTOM_PORT = CUSTOM_PORT_INDEX !== -1 ? parseInt(args[CUSTOM_PORT_INDEX + 1], 10) : null;

/**
 * 获取 DevToolsActivePort 文件路径（跨平台支持）
 */
function getPortFilePath() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity', 'DevToolsActivePort');
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Antigravity', 'DevToolsActivePort');
  } else {
    return path.join(os.homedir(), '.config', 'Antigravity', 'DevToolsActivePort');
  }
}

/**
 * 读取当前 CDP 端口
 */
function readCDPPort() {
  if (CUSTOM_PORT && !isNaN(CUSTOM_PORT)) {
    return CUSTOM_PORT;
  }
  if (process.env.CDP_PORT) {
    const port = parseInt(process.env.CDP_PORT, 10);
    if (!isNaN(port)) return port;
  }

  const portFile = getPortFilePath();
  if (!fs.existsSync(portFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(portFile, 'utf8').trim();
    const lines = content.split(/\r?\n/);
    if (lines.length > 0) {
      const port = parseInt(lines[0].trim(), 10);
      if (!isNaN(port) && port > 0) {
        return port;
      }
    }
  } catch (err) {
    console.error(`[Daemon] Error reading DevToolsActivePort file (${portFile}):`, err.message);
  }
  return null;
}

/**
 * 请求 http://127.0.0.1:<PORT>/json 获取页面 target 列表
 */
function fetchTargets(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          resolve(targets);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

/**
 * 守护进程主控制类
 */
class AntigravityCDPDaemon {
  constructor() {
    this.ws = null;
    this.targetId = null;
    this.currentSessionId = null;
    this.newDocumentScriptId = null;
    this.messageId = 1;
    this.callbacks = new Map();
    this.checkTimer = null;
    this.isInjecting = false;
  }

  sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket is not connected'));
      }
      const id = this.messageId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  loadInjectionScript() {
    return fs.readFileSync(INJECT_SCRIPT_PATH, 'utf8');
  }

  async connectAndInject(port, target) {
    console.log(`[Daemon] Connecting to page target "${target.title || target.url}" at ${target.webSocketDebuggerUrl}`);
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(target.webSocketDebuggerUrl);

      this.ws.on('open', async () => {
        console.log('[Daemon] WebSocket connection established.');
        try {
          const injectScript = this.loadInjectionScript();

          // 步骤 2.1: 持久注入（去重防累积）
          if (!this.newDocumentScriptId) {
            const addRes = await this.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
              source: injectScript
            });
            this.newDocumentScriptId = addRes.identifier;
            console.log(`[Daemon] Registered Page.addScriptToEvaluateOnNewDocument (Script ID: ${this.newDocumentScriptId})`);
          }

          // 步骤 2.2: 实时生效 (Runtime.evaluate)
          await this.sendCommand('Runtime.evaluate', {
            expression: injectScript,
            returnByValue: true
          });
          console.log('[Daemon] Runtime.evaluate executed successfully.');

          resolve();
        } catch (err) {
          console.error('[Daemon] Error during initial injection:', err.message);
          reject(err);
        }
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject } = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || 'CDP Error'));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          // Ignore parse errors for events
        }
      });

      this.ws.on('close', () => {
        console.log('[Daemon] WebSocket closed. Resetting session state.');
        this.cleanUpConnection();
      });

      this.ws.on('error', (err) => {
        console.error('[Daemon] WebSocket error:', err.message);
        this.cleanUpConnection();
        reject(err);
      });
    });
  }

  cleanUpConnection() {
    if (this.ws) {
      try { this.ws.terminate(); } catch (e) {}
      this.ws = null;
    }
    this.newDocumentScriptId = null;
    this.callbacks.clear();
  }

  /**
   * 步骤 5: 自愈巡检 (每 2.5 秒)
   */
  async runHealthCheck() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.isInjecting) return;

    try {
      this.isInjecting = true;
      const res = await this.sendCommand('Runtime.evaluate', {
        expression: `Boolean(document.getElementById("ag-custom-fonts") && window.__ag_patch_version === "${EXPECTED_PATCH_VERSION}")`,
        returnByValue: true
      });

      const isHealthy = res && res.result && res.result.value === true;
      if (!isHealthy) {
        console.warn('[Daemon] Health check failed or outdated. Performing hot re-injection...');
        const injectScript = this.loadInjectionScript();
        await this.sendCommand('Runtime.evaluate', {
          expression: injectScript,
          returnByValue: true
        });
        console.log('[Daemon] Hot re-injection succeeded.');
      }
    } catch (err) {
      console.warn('[Daemon] Health check exception:', err.message);
    } finally {
      this.isInjecting = false;
    }
  }

  start() {
    console.log('====================================================');
    console.log(' chuanban-antigravity-theme-patch Daemon started');
    console.log(` Target Version: ${EXPECTED_PATCH_VERSION}`);
    console.log('====================================================');

    const loop = async () => {
      try {
        const port = readCDPPort();
        if (!port) {
          if (!this.ws) {
            const expectedPath = getPortFilePath();
            console.log(`[Daemon] Waiting for Antigravity DevToolsActivePort at: ${expectedPath}`);
          }
          return;
        }

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          const targets = await fetchTargets(port);
          // 找到 type === "page" 且含有 webSocketDebuggerUrl 的页面
          const pageTarget = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
          if (pageTarget) {
            await this.connectAndInject(port, pageTarget);
            if (IS_ONCE) {
              console.log('[Daemon] Single-run injection completed (--once). Exiting cleanly.');
              process.exit(0);
            }
          } else {
            console.log('[Daemon] Antigravity port detected, but no eligible page target found yet.');
          }
        } else {
          // 已经连接，执行巡检自愈
          await this.runHealthCheck();
        }
      } catch (err) {
        // 忽略常规轮询错误
      }
    };

    // 立即执行一次
    loop();

    // 开启定时轮询与巡检
    this.checkTimer = setInterval(loop, CHECK_INTERVAL_MS);
  }

  stop() {
    console.log('[Daemon] Stopping daemon...');
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.cleanUpConnection();
  }
}

// 启动守护进程
const daemon = new AntigravityCDPDaemon();
daemon.start();

// 优雅退出监听
process.on('SIGINT', () => {
  daemon.stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  daemon.stop();
  process.exit(0);
});
