import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bulletsToText, textToBullets, codeLinesToText, textToCodeLines, editorError } from '../utils/admin-text-editors.mjs';
import { createFixtureApi } from '../utils/admin-fixtures.mjs';

test('pasted bullet lists accept common markers and preserve literal content', () => {
  const points = ['Delivered APIs', 'Reduced latency by 30%', '<script>alert("text")</script>', '-10 degrees'];
  assert.deepEqual(textToBullets('• Delivered APIs\r\n- Reduced latency by 30%\n\n3. <script>alert("text")</script>\n-10 degrees'), points.map(text => ({ text })));
  assert.deepEqual(textToBullets(bulletsToText(points.map(text => ({ text })))), points.map(text => ({ text })));
  assert.deepEqual(textToBullets('• \n \n'), []);
});

test('code edits preserve indentation, blank lines, trailing newline, and unchanged token colors', () => {
  const first = { tokens: [{ text: 'const ', tone: 'purple' }, { text: 'name = "Talal";', tone: 'cyan' }] };
  const previous = [first, { tokens: [{ text: '  return name;', tone: 'green' }] }];
  const text = '\nconst name = "Talal";\n  return "<hello>";\n';
  const next = textToCodeLines(text.replaceAll('\n', '\r\n'), previous);
  assert.equal(next[1], first);
  assert.equal(codeLinesToText(next), text);
  assert.equal(codeLinesToText(textToCodeLines('')), '');
  assert.ok(next.every(line => line.tokens.length > 0));
});

test('nested validation errors are associated with the combined editor', () => {
  assert.equal(editorError({ 'data.highlights.0.text': 'Too long', 'data.highlights.1.text': 'Too long', 'data.title': 'Required' }, 'data.highlights'), 'Too long');
  assert.equal(editorError({ 'data.panels.0.lines.0.tokens.0.text': 'Too long' }, 'data.panels.0.lines'), 'Too long');
  assert.equal(editorError({}, 'data.highlights'), '');
});

test('single editors save, publish, and reload through the existing content API', async () => {
  const api = createFixtureApi();
  const hero = (await api('content/hero1')).item;
  const code = 'const profile = {\n  name: "Talal",\n\n  available: true,\n};\n';
  hero.data.panels = [{ title: 'profile.js', lines: textToCodeLines(code) }];
  await api('content/hero1', { method: 'PATCH', body: { operation: 'update', data: hero.data } });
  await api('content/hero1', { method: 'PATCH', body: { operation: 'publish' } });
  assert.equal(codeLinesToText((await api('content/hero1')).item.data.panels[0].lines), code);
  const experience = (await api('content/experience1')).item;
  experience.data.highlights = textToBullets('• Built a platform.\n• Shipped a dashboard.');
  await api('content/experience1', { method: 'PATCH', body: { operation: 'update', data: experience.data } });
  await api('content/experience1', { method: 'PATCH', body: { operation: 'publish' } });
  assert.deepEqual((await api('content/experience1')).item.data.highlights, [{ text: 'Built a platform.' }, { text: 'Shipped a dashboard.' }]);
});
