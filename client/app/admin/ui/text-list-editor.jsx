'use client';

import { useState } from 'react';
import { bulletsToText, textToBullets, codeLinesToText, textToCodeLines } from '@/utils/admin-text-editors.mjs';

export default function TextListEditor({ value, onChange, mode = 'bullets', ...props }) {
  const format = mode === 'code' ? codeLinesToText : bulletsToText;
  const [draft, setDraft] = useState(() => ({ source: value, text: format(value) }));
  // Retain unfinished lines and spaces while typing, and accept external resets.
  if (draft.source !== value) setDraft({ source: value, text: format(value) });

  function update(text) {
    const next = mode === 'code' ? textToCodeLines(text, value) : textToBullets(text);
    setDraft({ source: next, text });
    onChange(next);
  }

  function insert(event, text, start, end = start) {
    event.preventDefault();
    const input = event.currentTarget;
    update(draft.text.slice(0, start) + text + draft.text.slice(end));
    requestAnimationFrame(() => input.setSelectionRange(start + text.length, start + text.length));
  }

  return <textarea {...props} className={`admin-text-editor admin-text-editor-${mode}`} rows={mode === 'code' ? 14 : 7} spellCheck={mode !== 'code'} autoCapitalize={mode === 'code' ? 'off' : undefined} autoCorrect={mode === 'code' ? 'off' : undefined}
    value={draft.text} onChange={event => update(event.target.value)}
    onBlur={() => { if (mode === 'bullets') setDraft({ source: value, text: format(value) }); }}
    onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      const { selectionStart: start, selectionEnd: end } = event.currentTarget;
      if (mode === 'code' && event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) insert(event, '  ', start, end);
      if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      const lineStart = draft.text.slice(0, start).lastIndexOf('\n') + 1;
      const before = draft.text.slice(lineStart, start);
      if (mode === 'code') insert(event, `\n${before.match(/^\s*/)[0]}`, start, end);
      else if (/^\s*(?:[•●▪\-*+]\s*)?$/.test(before)) insert(event, '\n', lineStart, end);
      else insert(event, '\n• ', start, end);
    }} />;
}
