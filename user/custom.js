/**
 * user/custom.js — 用户/对方 Agent 专属前端扩展钩子
 * 在 core/runtime.js 执行完毕后于独立 try/catch 沙箱中调用。
 *
 * 当前配置：
 * 1. 剥离 core/theme.css 中的全部字体与排版覆盖，保留 Antigravity 原生默认字体；
 * 2. 剥离 core/theme.css 中的底部输入框（composer / send-button / voice-live-pill）样式覆盖，恢复原生默认输入框样式；
 * 3. 保留主题配色以及模型选择右侧的实时指标胶囊布局与样式。
 */
((ctx) => {
  const FONT_PROPS = [
    '--vscode-font-family',
    '--editor-font-family',
    '--font-sans',
    '--font-mono',
    '--default-font-family',
    '--default-mono-font-family',
    '--font-family',
    '--sdk-font-family',
    '--sdk-font-family-mono',
    '--sdk-comment-font-family',
    '--font-weight-light',
    '--font-weight-normal',
    '--font-weight-medium',
    '--font-weight-semibold',
    '--font-weight-bold',
    '--font-weight-black',
    '--agy-gsf-h1-wght',
    '--agy-gsf-h3-wght',
    '--agy-gsf-bold-wght',
    '--agy-gsf-italic',
    '--agy-gsf-slnt',
    '--ag-chat-font-size',
    'font-family',
    'font-variation-settings',
    'font-weight',
    'font-style',
    'font-size',
    'font-variant-numeric',
    'letter-spacing',
    'line-height',
    '-webkit-font-smoothing'
  ];

  const COMPOSER_RULE_RE = /agentSidePanelInputBox|surface-composer|send-button|voice-live-pill|input-cancel-button/;

  function isMetricsRule(sel) {
    return (
      sel.includes('#ag-live-metrics-pill') ||
      sel.includes('#ag-live-metrics-tooltip') ||
      sel.includes('data-ag-row-mode')
    );
  }

  function stripCustomOverrides(container) {
    const rules = container && container.cssRules;
    if (!rules) return false;
    let changed = false;
    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i];
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        container.deleteRule(i);
        changed = true;
        continue;
      }
      if (rule.type === CSSRule.STYLE_RULE && rule.style) {
        const sel = rule.selectorText || '';
        if (isMetricsRule(sel)) {
          continue;
        }
        if (COMPOSER_RULE_RE.test(sel)) {
          container.deleteRule(i);
          changed = true;
          continue;
        }
        for (let j = 0; j < FONT_PROPS.length; j++) {
          if (rule.style.getPropertyValue(FONT_PROPS[j])) {
            rule.style.removeProperty(FONT_PROPS[j]);
            changed = true;
          }
        }
        if (rule.cssRules && rule.cssRules.length > 0 && stripCustomOverrides(rule)) {
          changed = true;
        }
        if (rule.style.length === 0 && (!rule.cssRules || rule.cssRules.length === 0)) {
          container.deleteRule(i);
          changed = true;
        }
        continue;
      }
      if (rule.cssRules) {
        if (stripCustomOverrides(rule)) changed = true;
        if (rule.cssRules.length === 0) {
          container.deleteRule(i);
          changed = true;
        }
      }
    }
    return changed;
  }

  function cleanFontFaces() {
    const ffStyle = document.getElementById('ag-font-faces');
    if (ffStyle) {
      ffStyle.disabled = true;
      if (ffStyle.sheet) {
        try {
          while (ffStyle.sheet.cssRules.length > 0) {
            ffStyle.sheet.deleteRule(0);
          }
        } catch {}
      }
      ffStyle.textContent = '';
    }
  }

  function applyCleanOverrides() {
    cleanFontFaces();
    const baseStyle = document.getElementById('ag-custom-fonts');
    if (!baseStyle || !baseStyle.sheet || baseStyle.dataset.agUserStripped === '1') return;
    if (stripCustomOverrides(baseStyle.sheet)) {
      const strippedCss = Array.from(baseStyle.sheet.cssRules)
        .map((r) => r.cssText)
        .join('\n');
      baseStyle.textContent = strippedCss;
    }
    baseStyle.dataset.agUserStripped = '1';
  }

  applyCleanOverrides();

  ctx.onCleanup(() => {
    const baseStyle = document.getElementById('ag-custom-fonts');
    if (baseStyle) {
      delete baseStyle.dataset.agUserStripped;
    }
  });
})(ctx);
