// Keep the existing API shape while presenting lists as a single editor.
export const bulletsToText = (rows = []) => rows.map(row => `• ${row.text || ''}`).join('\n');

export function textToBullets(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim().replace(/^(?:[•●▪\-*+](?:\s+|$)|\d+[.)]\s+)/, '').trim())
    .filter(Boolean)
    .map(text => ({ text }));
}

export const codeLinesToText = (lines = []) => lines.map(line => (line.tokens || []).map(token => token.text || '').join('')).join('\n');

function codeTokens(text) {
  // A lightweight display highlighter; code is always stored and rendered as text.
  const parts = text.match(/\/\/.*$|#[^\n]*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|export|default|import|from|class|new|if|else|async|await|def|self|True|False|None|true|false|null)\b|\b\d+(?:\.\d+)?\b|\s+|[a-zA-Z_$][\w$]*|./g) || [''];
  return parts.map(text => ({ text, tone: /^(\/\/|#)/.test(text) ? 'muted' : /^["'`]/.test(text) ? 'green' : /^(const|let|var|function|return|export|default|import|from|class|new|if|else|async|await|def|self)$/.test(text) ? 'purple' : /^(true|false|null|True|False|None|\d)/.test(text) ? 'orange' : 'default' }));
}

export function textToCodeLines(text, previous = []) {
  const byText = new Map(previous.map(line => [codeLinesToText([line]), line]));
  return text.replace(/\r\n?/g, '\n').split('\n').map((text, index) => {
    // Preserve manually chosen colors on unchanged lines, including after moving them.
    if (previous[index] && codeLinesToText([previous[index]]) === text) return previous[index];
    return byText.get(text) || { tokens: codeTokens(text) };
  });
}

export function editorError(errors, path) {
  return [...new Set(Object.entries(errors).filter(([key]) => key === path || key.startsWith(`${path}.`)).map(([, message]) => message))].join(' ');
}
