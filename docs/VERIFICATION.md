# 验证与验收清单 (Verification Checklist)

本项目部署或更新后，应当按照以下规范逐项自检验收：

## 1. 字体生效验证 (Typography Verification)
- 检查正文段落计算样式，确认 `font-family` 包含 `Sarasa UI Slab SC`（或其回退字体 `Sarasa Gothic SC` / `Anthropic Serif`）。
- 检查代码块与终端：确认代码块（`code` / `pre` / `.monaco-editor`）渲染为等宽打字机衬线（`Anthropic Mono` 或 `Sarasa Mono Slab SC`）。
- 检查输入框：输入框独立配置打字机板状衬线，1:2 中西文等宽，清晰整洁。

## 2. 色彩层级与防白屏验证 (Colors & White-screen Immunity)
- 打开「系统设置 → 外观界面」：
  - 确认设置弹窗秒级流畅打开，开发者工具控制台无 `TypeError: Cannot read properties of undefined (reading 'background')` 报错。
  - 界面绝不白屏（在原型层始终汇报为合法的 `Default Light`）。
- 默认高对比版检验：
  - 正文主区背景：通透微暖亮白 `#FCFCFB`；
  - 正文文字：石墨深黑 `#1F1E1D`；
  - 左侧栏背景：暖白燕麦色 `#F7F5F0`；
  - 输入框底色：微暖棕 `#F9F7F2`，外轮廓线清晰；
  - 底部模型名称与操作图标（Gemini 3.8 Flash / Turbo 模式等）：呈现纯黑深墨色 `#0A0A0A`（去除原生 0.7 模糊灰度滤镜）；
  - 界面三栏竖线与按钮轮廓线清晰明朗。

## 3. 切换与深色模式隔离验证 (Flavor Switching & Dark Mode Isolation)
- 预设切换：
  - 通过控制台或设置执行：
    ```javascript
    localStorage.setItem("theme-color-flavor", "claude-desktop-purewhite"); // 切为 Claude 净白
    localStorage.setItem("theme-color-flavor", "vintage-deep");              // 切为 复古深色
    localStorage.setItem("theme-color-flavor", "high-contrast");             // 切回 高对比版
    ```
    确认能在三种风格间秒级热切换。
- 深色隔离：
  - 在系统设置中切换至深色模式（Dark Theme）时，浅色自定义覆盖变量自动让出控制权，100% 回退官方深色样式。

## 4. 排除区安全验证 (Localization Safe Boundaries)
- 汉化作用域检查：
  - 确认侧边栏（新建对话、历史对话）、设置面板（常规设置、执行策略、权限等）、通用操作按钮已成功汉化。
  - 严密保护区验证：确认代码块、终端、智能体回复正文、输入框内文字、文件树路径中的英文绝对未被汉化字典误伤替换。

## 5. 设置弹窗防死锁与路由 State 验证 (TanStack Router Fix)
- 快速连续点击设置按钮，或在弹窗退出动画期间点击：
  - 确认弹窗可以正常流畅再次打开，不会卡死。
  - 检查 `window.history.state`，确认保留了 TanStack Router 所需的路由键（如 `__TSR_key`、`__TSR_index` 等）。

## 6. 常驻与自愈验证 (Daemon & Self-healing)
- 完全退出并重开 Antigravity 客户端，确认补丁在无人干预下自动恢复生效。
- 守护进程自检：在控制台手动清除 `#ag-custom-fonts` 元素，确认守护进程在 2.5 秒内自动检测并热注入恢复。
