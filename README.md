# chuanban-antigravity-theme-patch (川办 Antigravity 界面补丁)

> **Original Project Reference**: Originally designed and created by **Noel** ([chuanban-antigravity-theme-patch](https://drive.google.com/drive/folders/1NX92SgVUqtSjWg6bt6sIJXy-cn7J_boC)).

---

## 📖 项目简介 (Overview)

`chuanban-antigravity-theme-patch` 是专为 **Google Antigravity** 客户端打造的非侵入式外观、排版、汉化与稳定性补丁。

本方案**不修改** `/Applications/Antigravity.app` 原生二进制文件或重新打包 `.asar`（避免破坏系统代码签名、更新失效与安全告警），而是基于 **Chrome DevTools Protocol (CDP)** 在运行时动态注入高质量 CSS 与前端自愈脚本。

---

## ✨ 核心特性 (Key Features)

### 1. 🎨 Claude 风格三大调色预设
- **高对比版（`high-contrast`，推荐首选 / 默认）**：
  - 正文背景 `#FCFCFB`（通透温润微暖亮白）、文字 `#1F1E1D`（高清晰石墨深黑）；
  - 侧栏 `#F7F5F0`（暖白燕麦色），输入框 `#F9F7F2`；
  - 消除底部模型（Gemini 3.8 Flash 等）与按钮的 `opacity: 0.7` 灰度滤镜，提升至高对比纯黑墨色 `#0A0A0A`；
  - 强化主操作胶囊按钮与三栏分割线。
- **ClaudeDesktop 净白（`claude-desktop-purewhite`）**：
  - 像素级还原 Anthropic 官方桌面端的极简两栏微暖净白风格。
- **复古深色（`vintage-deep` / 原 absoulutely-chuanban）**：
  - 致敬复古牛皮纸手稿风格，陶土砖红强调色与浓郁羊皮纸底色。
- **官方原生出厂复原（`Default Light`）**：
  - 切回出厂浅色或深色模式时，自动 100% 撤销自定义变量，干净利落。

### 2. 🔤 字体层次化排版 (Typography Hierarchy)
- **UI 控件层**：几何无衬线（Anthropic Sans / Styrene B / Sarasa UI SC）。
- **阅读正文层**：古典书卷衬线（Anthropic Serif / Tiempos Text / Sarasa Slab SC，行高 1.62）。
- **代码与终端层**：等宽打字机衬线（Anthropic Mono / Sarasa Mono Slab SC / Monaco）。
- **主输入框编辑区**：Codex 同款打字机粗衬线（Sarasa Mono Slab SC，1:2 中西文等宽）。

### 3. 🛡️ 架构级防 React 白屏死锁
- Antigravity 原生将主题预设列表硬编码，写入未知预设会导致 React 抛出 `TypeError: Cannot read properties of undefined (reading 'background')` 导致设置变白屏。
- 本方案挂载 `localStorage.getItem` 拦截器，对 React 始终回退合法的官方基准 `"Default Light"`，自定义预设通过独立的 `theme-color-flavor` 安全调度。

### 4. 🌐 精准局部汉化与安全排除边界
- 基于 DOM `TreeWalker` 与 `MutationObserver` 实时汉化。
- 汉化覆盖：侧栏导航、系统设置全部面板、通用操作与动态会话/耗时正则。
- **严格排除区**：代码块、终端、AI 对话内容、Markdown 文章、输入框与文件路径绝对排除，杜绝技术词汇误伤。

### 5. ⚡ TanStack Router 弹窗死锁自愈修复
- 解决快速点击设置按钮时 URL 残留 `settingsOpen=true` 导致无法再次打开弹窗的官方 Bug。
- 在事件捕获阶段主动清洗残留参数，并严格保留 `window.history.state`（保留 `__TSR_key` / `__TSR_index`）。

### 6. 🔄 CDP 守护进程与常驻自愈
- Node.js 守护进程监听 `DevToolsActivePort`。
- 双通道注入：`Page.addScriptToEvaluateOnNewDocument` 持久注入 + `Runtime.evaluate` 实时注入。
- 每 2.5 秒自愈巡检探针版本，支持 macOS LaunchAgent 及 Windows 计划任务开机静默常驻。

---

## 📦 字体下载 (Font Resources)

推荐安装完整字体以获得最佳渲染体验：
- **Google Drive 公开共享库**：[点击下载字体包](https://drive.google.com/drive/folders/1NX92SgVUqtSjWg6bt6sIJXy-cn7J_boC)
  - Anthropic 官方字体族：`AnthropicSans`、`AnthropicSerif`、`AnthropicMono`
  - 更纱黑体超集族：`Sarasa-SuperTTC.ttc`（包含 `Sarasa UI SC`、`Sarasa UI Slab SC`、`Sarasa Mono Slab SC` 等）
- macOS 亦可通过 Homebrew 安装更纱黑体：
  ```bash
  brew install --cask font-sarasa-gothic
  ```

---

## 🚀 快速上手 (Quick Start)

### 准备环境
- Node.js (建议 18+)
- 运行中的 Google Antigravity 客户端

### 安装与运行

#### 方式 A: 临时单次注入 (无需常驻)
```bash
npm install
npm run inject
```

#### 方式 B: 前台常驻守护
```bash
npm install
npm start
```

#### 方式 C: 操作系统后台常驻服务
- **macOS**：
  ```bash
  npm run install:mac
  ```
  自动生成并注册用户级 LaunchAgent (`~/Library/LaunchAgents/com.antigravity.theme-patch.plist`)。
- **Windows**：
  ```powershell
  npm run install:win
  ```
  自动生成静默运行脚本并注册 Windows 登录计划任务。

---

## 🎨 切换配色预设

在 Antigravity 开发者工具控制台中执行：

```javascript
// 切换为 ClaudeDesktop 净白
localStorage.setItem("theme-color-flavor", "claude-desktop-purewhite");

// 切换为 复古深色
localStorage.setItem("theme-color-flavor", "vintage-deep");

// 切换回 高对比版 (默认)
localStorage.setItem("theme-color-flavor", "high-contrast");
```

---

## 🧹 卸载与复原 (Uninstall)

1. **卸载常驻守护服务**：
   - macOS: `npm run uninstall:mac`
   - Windows: `npm run uninstall:win`
2. **复原出厂设置**：
   - 在 Antigravity 打开「系统设置 → 外观设置」，选择官方的 **Default Light** 或 **Dark Theme**。
3. **彻底删除**：
   - 直接删除本补丁项目文件夹即可，不留任何残留。

---

## 📄 许可协议

MIT License
