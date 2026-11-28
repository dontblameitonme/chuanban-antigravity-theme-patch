# Patched Edition 维护与上游同步说明

本仓库是基于上游 [Anarcadia/chuanban-antigravity-theme-patch](https://github.com/Anarcadia/chuanban-antigravity-theme-patch) 的个人定制版。  
**任何 AI Agent 在拉取/合并上游更新或修改配置时，必须严格遵守以下定制清单，无需用户再次复述。**

---

## 一、核心定制要求（合并上游时严禁破坏）

| 序号 | 定制项 | 要求说明 | 实现位置与关键配置 |
| :---: | :--- | :--- | :--- |
| **1** | **保留原生字体** | 不更换字体，保留 Antigravity 原生 `Google Sans Flex`（UI/正文）与 `Google Sans Code`（代码）；无需下载或安装第三方字体包。 | [user/custom.js](user/custom.js)：`cleanFontFaces()` 清空并禁用 `#ag-font-faces`；`stripCustomOverrides()` 剥离 `#ag-custom-fonts` 中全部 `@font-face` 与 `FONT_PROPS` 字体属性。 |
| **2** | **默认英文 UI** | 保持官方英文界面，不开启汉化，不运行翻译 DOM 观察器。 | [user/config.json](user/config.json)：`"installedLocale": "none"`，`"modules.i18n": false`。 |
| **3** | **原生底部输入框** | 还原 Antigravity 原生默认输入框样式，不使用火漆封印边框或自定义按钮样式。 | [user/config.json](user/config.json)：`"modules.composerWaxSeal": false`；[user/custom.js](user/custom.js)：`COMPOSER_RULE_RE` 剥离全部 composer 相关规则。 |
| **4** | **完整指标胶囊** | 保留模型选择右侧的实时指标胶囊并开启完整 Token 统计（`"metricsMode": "full"`，显示单步/本轮/会话累计输入输出 Token 数），**去掉左侧小竖线**，并使用**纯 Windows 系统字体**。 | [user/config.json](user/config.json)：`"modules.metrics": true`，`"metricsMode": "full"`；[user/custom.css](user/custom.css)：`#ag-live-metrics-pill` 设置 `border-left: none !important;` 及 `font-family: system-ui, "Segoe UI", "Microsoft YaHei UI", sans-serif !important;`。 |
| **5** | **Claude 加深暖暗色** | 整体采用 Claude 暖炭黑配色，并**进一步加深主画布与侧栏底色**；同时**去掉左侧会话选中框最左侧的 2px 高亮竖线**，保留纯圆角胶囊选中背景。 | [user/config.json](user/config.json)：`"darkPreset": "claude-warm"`；[user/custom.css](user/custom.css)：主画布 `#191816`、侧栏 `#131210`、卡片/输入框 `#21201D`、选中行 `#2B2925`，且 `.agy-sidebar-row[data-selected="true"]` 强制 `box-shadow: none !important;`。 |
| **6** | **精简版文档** | `README.md` 保持 Patched Edition 简洁风格；文档与仓库链接指向 `dontblameitonme/chuanban-antigravity-theme-patch`。 | [README.md](README.md)、[SKILL.md](SKILL.md)。 |

---

## 二、合并上游更新标准流程（供 AI Agent 执行）

当用户要求检查或同步上游更新时，按以下流程执行：

### 1. 拉取并查看上游差异
```bash
git fetch upstream
git log --oneline HEAD..upstream/main
git diff --stat HEAD...upstream/main
```

### 2. 合并与冲突处理原则
执行 `git merge upstream/main` 后：
- **`core/*` 与 `install.mjs`**：直接采用上游最新版本，不篡改 `core/` 只读内核。
- **`user/config.json`**：吸收上游新增的功能开关（如 `tokenAnalytics`、`cdpAutoRelaunch` 等），但**必须锁定保留** `"installedLocale": "none"`、`"metricsMode": "full"`、`"modules.i18n": false`、`"modules.composerWaxSeal": false`、`"darkPreset": "claude-warm"`。
- **`user/custom.js`**：保留现有剥离逻辑；若上游在 `core/theme.css` 或 `core/runtime.js` 中新增了字体变量、字体 `<style>` 标签或新的输入框选择器，需同步补充到 `FONT_PROPS`、`cleanFontFaces()` 或 `COMPOSER_RULE_RE`。
- **`user/custom.css`**：保留现有去竖线、系统字体与加深暗色变量覆盖；若上游修改了选中态或底色选择器优先级，需确保 `custom.css` 仍能覆盖生效。
- **`README.md`**：保持 Patched Edition 简洁风格，仅同步更新版本号/适配版本徽章与上游特性折叠列表。
- **`SKILL.md`**：吸收上游最新运维文档，但 GitHub 代码仓库链接保留为 `https://github.com/dontblameitonme/chuanban-antigravity-theme-patch`。

### 3. 本地部署与实机验收
在仓库根目录执行部署并同步 `user/` 层：
```bash
node install.mjs install --sync-user
node install.mjs verify
```
随后通过 CDP 检查当前激活窗口的计算样式，确认以下关键指标全部符合预期后再提交推送：
- `uiLang === "en"`，`waxSeal === "off"`，`darkPreset === "claude-warm"`
- `body` 背景色为 `rgb(25, 24, 22)`（`#191816`），侧栏背景色为 `rgb(19, 18, 16)`（`#131210`）
- `.agy-sidebar-row[data-selected="true"]` 的 `boxShadow === "none"`
- `body` 字体为原生 `"Google Sans Flex"`
- `#ag-live-metrics-pill` 的 `borderLeftWidth === "0px"` 且字体为 `system-ui, "Segoe UI", "Microsoft YaHei UI", sans-serif`

### 4. 提交并推送到云端
```bash
git add -A
git commit -m "merge: upstream <version> while preserving custom styles"
git push origin main
```
