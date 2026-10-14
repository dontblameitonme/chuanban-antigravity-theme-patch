/**
 * chuanban-antigravity-theme-patch: Client-side Injection Script
 * Injected into Google Antigravity via Chrome DevTools Protocol (CDP)
 */
(function () {
  'use strict';

  // 0. 版本探针
  const PATCH_VERSION = "20261013-high-contrast-v1";
  window.__ag_patch_version = PATCH_VERSION;

  // 1. 三大预设定义与防崩溃保护
  const PRESETS = {
    HIGH_CONTRAST: "high-contrast",
    CLAUDE_PUREWHITE: "claude-desktop-purewhite",
    VINTAGE_DEEP: "vintage-deep",
    LEGACY_WARM_WHITE: "chuanban-warm-white",
    LEGACY_OFFICIAL: "claude-desktop-official",
    LEGACY_CHUANBAN: "absoulutely-chuanban"
  };
  const ALL_CUSTOM_PRESETS = new Set(Object.values(PRESETS));

  function syncPresetAttribute() {
    try {
      // 穿透包装层，迁移底层物理存储中的历史非法值
      const stored = Storage.prototype.getItem.call(localStorage, "theme-preset-light");
      if (ALL_CUSTOM_PRESETS.has(stored)) {
        try {
          Storage.prototype.setItem.call(localStorage, "theme-preset-light", "Default Light");
        } catch (e) {}
      }
      const flavor = Storage.prototype.getItem.call(localStorage, "theme-color-flavor") || PRESETS.HIGH_CONTRAST;
      const currentBg = (window.getComputedStyle(document.documentElement).getPropertyValue("--background") || "").trim().toUpperCase();
      const isWarmBg = (currentBg === "#FBF9F5" || currentBg === "#FCFCFB");

      if (flavor === PRESETS.HIGH_CONTRAST || flavor === PRESETS.LEGACY_WARM_WHITE || flavor === "高对比版") {
        document.documentElement.setAttribute("data-ag-preset", PRESETS.HIGH_CONTRAST);
      } else if (flavor === PRESETS.CLAUDE_PUREWHITE || flavor === PRESETS.LEGACY_OFFICIAL || flavor === "ClaudeDesktop 净白") {
        document.documentElement.setAttribute("data-ag-preset", PRESETS.CLAUDE_PUREWHITE);
      } else if (flavor === PRESETS.VINTAGE_DEEP || flavor === PRESETS.LEGACY_CHUANBAN || flavor === "复古深色" || isWarmBg) {
        document.documentElement.setAttribute("data-ag-preset", PRESETS.VINTAGE_DEEP);
      } else {
        document.documentElement.removeAttribute("data-ag-preset");
      }
    } catch (e) {
      console.error("[AG-Patch] syncPresetAttribute error:", e);
    }
  }

  // 2. 拦截 localStorage 防止非官方预设名污染导致系统设置弹窗白屏崩溃
  if (!window.__ag_preset_hooked) {
    window.__ag_preset_hooked = true;
    try {
      const originalGet = localStorage.getItem.bind(localStorage);
      localStorage.getItem = function (k) {
        const val = originalGet(k);
        if (k === "theme-preset-light" && ALL_CUSTOM_PRESETS.has(val)) {
          return "Default Light";
        }
        return val;
      };

      const originalSet = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function (k, v) {
        if (k === "theme-preset-light" && ALL_CUSTOM_PRESETS.has(v)) {
          v = "Default Light";
        }
        originalSet(k, v);
        if (k === "theme-preset-light" || k === "theme-mode" || k === "theme-color-flavor") {
          setTimeout(syncPresetAttribute, 50);
        }
      };
    } catch (e) {
      console.error("[AG-Patch] localStorage hook error:", e);
    }
  }
  syncPresetAttribute();

  // 3. 样式注入与 DOM 脏检查
  const FONTS_CSS = `
/* UI 控件层 */
button, nav, select, [role="tab"], [role="menu"], [role="menubar"], [role="menuitem"], .bg-sidebar, header, nav * {
  font-family: 'Anthropic Sans', 'Styrene B', system-ui, -apple-system, BlinkMacSystemFont, 'Sarasa UI SC', '更纱黑体 UI SC', sans-serif !important;
}
/* 阅读正文层 */
.prose, .markdown, .prose p, .prose li, .prose blockquote, .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6,
.markdown p, .markdown li, .markdown blockquote, .markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6,
article p, article li, [class*="chat-message"] p, [class*="chat-message"] li {
  font-family: 'Anthropic Serif', 'Tiempos Text', Georgia, Cambria, 'Sarasa Mono Slab SC', '等距更纱黑体 Slab SC', 'Sarasa Gothic SC', '更纱黑体 SC', serif !important;
  line-height: 1.62;
}
/* 代码与终端层 */
code, pre, pre *, kbd, samp, .monaco-editor, .monaco-editor *, .xterm, .xterm *, [class*="language-"], [class*="code-block"], [class*="terminal"] {
  font-family: 'Anthropic Mono', 'Sarasa Mono Slab SC', '等距更纱黑体 Slab SC', ui-monospace, SFMono-Regular, monospace !important;
}
/* 主输入框编辑区 */
div[contenteditable="true"], textarea, [data-composer], .ProseMirror,
#antigravity\\.agentSidePanelInputBox textarea, #antigravity\\.agentSidePanelInputBox div[contenteditable="true"] {
  font-family: 'Sarasa Mono Slab SC', '等距更纱黑体 Slab SC', 'Anthropic Mono', monospace !important;
}
`;

  const PRESETS_CSS = `
/* 1. 高对比版（默认） */
html[data-ag-preset="high-contrast"] body.theme-light {
  --background: #FCFCFB !important;
  --foreground: #1F1E1D !important;
  --sidebar: #F7F5F0 !important;
  --sidebar-secondary: #ECE9E1 !important;
  --sidebar-border: rgba(0, 0, 0, 0.35) !important;
  --border: rgba(0, 0, 0, 0.38) !important;
  --card: #F9F7F2 !important;
  --card-border: rgba(0, 0, 0, 0.35) !important;
  --secondary-foreground: #0A0A0A !important;
}
html[data-ag-preset="high-contrast"] .bg-sidebar { background-color: var(--sidebar) !important; }
html[data-ag-preset="high-contrast"] .bg-border { background-color: rgba(0, 0, 0, 0.28) !important; }
html[data-ag-preset="high-contrast"] a[class*="inline-flex"],
html[data-ag-preset="high-contrast"] .bg-sidebar a { border-color: rgba(0, 0, 0, 0.32) !important; }
html[data-ag-preset="high-contrast"] #antigravity\\.agentSidePanelInputBox span,
html[data-ag-preset="high-contrast"] #antigravity\\.agentSidePanelInputBox button {
  color: #0A0A0A !important;
  opacity: 1 !important;
}

/* 2. ClaudeDesktop 净白 */
html[data-ag-preset="claude-desktop-purewhite"] body.theme-light {
  --background: #FCFCFB !important;
  --sidebar: #FBFBF9 !important;
  --sidebar-secondary: #EDECE9 !important;
  --sidebar-muted: #F3F2EF !important;
  --sidebar-border: #F0F0EE !important;
}
html[data-ag-preset="claude-desktop-purewhite"] .bg-sidebar { background-color: var(--sidebar) !important; }
html[data-ag-preset="claude-desktop-purewhite"] .bg-border { background-color: var(--sidebar-border) !important; }

/* 3. 复古深色 */
html[data-ag-preset="vintage-deep"] body.theme-light {
  --background: #FBF9F5 !important;
  --foreground: #2C2B29 !important;
  --primary: #D97757 !important;
  --sidebar: #F1E8DC !important;
  --sidebar-secondary: #E6DCCE !important;
  --sidebar-border: #E0D4C3 !important;
}
html[data-ag-preset="vintage-deep"] .bg-sidebar { background-color: var(--sidebar) !important; }
html[data-ag-preset="vintage-deep"] .bg-border { background-color: var(--sidebar-border) !important; }
`;

  function injectStyle(id, css) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      (document.head || document.documentElement).appendChild(el);
    }
    // DOM 脏检查，仅不一致时赋值
    if (el.textContent !== css) {
      el.textContent = css;
    }
  }

  injectStyle("ag-custom-fonts", FONTS_CSS);
  injectStyle("ag-custom-presets", PRESETS_CSS);

  // 4. 修复 TanStack Router 弹窗死锁 Bug
  if (!window.__ag_settings_guard_installed) {
    window.__ag_settings_guard_installed = true;
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest && e.target.closest('[data-testid="settings-button"]');
      if (!btn) return;
      const hasDialog = !!document.querySelector('[role="dialog"]');
      const urlHasSettings = window.location.search.includes("settingsOpen=true");
      // 弹窗实际未打开，但 URL 残留了 settingsOpen=true，判定为死锁
      if (!hasDialog && urlHasSettings) {
        const url = new URL(window.location.href);
        url.searchParams.delete("settingsOpen");
        url.searchParams.delete("settingsScreen");
        // 必须保留 window.history.state，避免抹去 TanStack Router 的 __TSR_key / __TSR_index
        window.history.replaceState(window.history.state, "", url.toString());
      }
    }, true); // 捕获阶段执行，先于 React 事件
  }

  // 5. 局部汉化 (DOM TreeWalker + MutationObserver)
  const LOCALIZATION_EXACT = {
    "New Conversation": "新建对话",
    "Conversation History": "历史对话",
    "Settings": "系统设置",
    "Automations": "自动化任务",
    "Customizations": "技能与自定义",
    "General": "常规设置",
    "Execution": "执行策略",
    "Global Permissions": "全局权限",
    "Tool Permissions": "工具权限",
    "Network Access Rules": "网络访问规则",
    "Application": "应用配置",
    "Prevent Sleep": "防止电脑休眠",
    "Keep In Menu Bar": "保持在系统菜单栏",
    "Folders": "项目目录",
    "Permission Settings": "权限设置",
    "Inherit Global": "继承全局",
    "MCP Tools": "MCP 工具",
    "Rules": "项目规则",
    "Delete Project": "删除项目",
    "Shortcuts": "快捷键",
    "Models & Usage": "模型与用量",
    "Feedback Type": "反馈类型",
    "Appearance": "外观设置",
    "Proceed": "确认执行",
    "Cancel": "取消",
    "Copy": "复制",
    "Running": "运行中",
    "Completed": "已完成"
  };

  const LOCALIZATION_PATTERNS = [
    { regex: /^(\d+)\s+active\s+conversations$/i, replace: "$1 个进行中的会话" },
    { regex: /^(\d+)\s+files?\s+changed$/i, replace: "$1 个文件变更" },
    { regex: /^Show\s+(\d+)\s+breakdowns?$/i, replace: "展开明细 ($1 项)" },
    { regex: /^Worked for\s+(\d+[smhd])$/i, replace: "已工作 $1" },
    { regex: /^Thought for\s+(\d+[smhd])$/i, replace: "已思考 $1" }
  ];

  const EXCLUDED_SELECTOR = [
    'code', 'pre', 'kbd', 'samp', '[class*="language-"]', '.monaco-editor', '.xterm',
    '.prose', '.markdown', '[class*="chat-message"]',
    'input', 'textarea', '[contenteditable="true"]',
    '[class*="group/file-title"]', '[class*="file-title"]', '[class*="file-path"]', '[data-path]'
  ].join(',');

  function shouldExcludeNode(node) {
    if (!node || !node.parentElement) return true;
    return !!node.parentElement.closest(EXCLUDED_SELECTOR);
  }

  function translateText(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (LOCALIZATION_EXACT[trimmed]) {
      return text.replace(trimmed, LOCALIZATION_EXACT[trimmed]);
    }
    for (const item of LOCALIZATION_PATTERNS) {
      if (item.regex.test(trimmed)) {
        return text.replace(trimmed, trimmed.replace(item.regex, item.replace));
      }
    }
    return null;
  }

  function localizeNode(rootNode) {
    if (!rootNode || shouldExcludeNode(rootNode)) return;
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (shouldExcludeNode(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      const translated = translateText(currentNode.nodeValue);
      if (translated !== null && translated !== currentNode.nodeValue) {
        currentNode.nodeValue = translated;
      }
    }
  }

  // 首次全量扫描
  localizeNode(document.body);

  // MutationObserver 增量扫描
  if (!window.__ag_localization_observer) {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const added of m.addedNodes) {
            if (added.nodeType === Node.ELEMENT_NODE) {
              localizeNode(added);
            } else if (added.nodeType === Node.TEXT_NODE) {
              localizeNode(added.parentElement);
            }
          }
        } else if (m.type === 'characterData') {
          if (!shouldExcludeNode(m.target)) {
            const translated = translateText(m.target.nodeValue);
            if (translated !== null && translated !== m.target.nodeValue) {
              m.target.nodeValue = translated;
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    window.__ag_localization_observer = observer;
  }

  console.log(`[AG-Patch] ${PATCH_VERSION} loaded and verified.`);
})();
