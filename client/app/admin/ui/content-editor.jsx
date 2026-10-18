'use client';

import { useEffect, useRef, useState } from 'react';
import contract from '@/utils/admin-contract.cjs';
import { emptyFields, payloadForWrite } from '@/utils/admin-api.mjs';
import Fields from './fields';

export default function ContentEditor({ item, categories, items, publishedIds, requirements, media, api, onMedia, onSaved, onCancel, onDirty, onBusy, onExpired }) {
  const [categorySlug, setCategorySlug] = useState(item?.category || '');
  const [data, setData] = useState(item?.data || {});
  const [order, setOrder] = useState(item?.displayOrder ?? 0);
  const [validation, setValidation] = useState({ checking: true, fields: {} });
  const [serverErrors, setServerErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const form = useRef(null);
  const category = categories.find(c => c.slug === categorySlug);
  const template = requirements.templates[category?.templateKey];
  const duplicate = category?.cardinality === 'singleton' && items.some(i => i.category === categorySlug && i.documentId !== item?.documentId);
  const groups = items.filter(i => categories.find(c => c.slug === i.category)?.templateKey === 'skill-groups').map(i => ({ id: i.documentId, name: i.data.name }));

  useEffect(() => {
    let active = true;
    async function check() {
      const errors = {};
      if (!category) errors.category = 'Choose a category.';
      else {
        if (duplicate) errors.category = 'This category already has an entry. Edit it from the content list.';
        try { await contract.validatePayload(category.templateKey, data, {
          media: value => media.find(m => m.id === (value?.id || value)),
          skillGroup: value => items.some(i => i.documentId === value && categories.find(c => c.slug === i.category)?.templateKey === 'skill-groups'),
        }); } catch (e) { Object.assign(errors, e.fields); }
      }
      if (!Number.isInteger(order) || order < 0) errors.displayOrder = 'Use a nonnegative integer.';
      if (active) setValidation({ checking: false, fields: errors });
    }
    check();
    return () => { active = false; };
  }, [category, data, order, media, items, categories, duplicate]);
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => { onBusy(pending); return () => onBusy(false); }, [pending, onBusy]);

  function changed() { setDirty(true); setValidation(v => ({ ...v, checking: true })); setServerErrors({}); setMessage(''); }
  function failure(e) {
    setServerErrors(e.fields || {}); setMessage(e.message);
    if (e.status === 401) onExpired();
    requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
  }
  async function upload(file, path) {
    if (file.size > 8 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)) {
      setServerErrors(e => ({ ...e, [path]: 'Choose PNG, JPEG, GIF, WebP or PDF, up to 8 MiB.' })); return null;
    }
    setPending(true); setMessage('Uploading…');
    try { const body = new FormData(); body.append('files', file); const result = await api('media', { method: 'POST', body }); onMedia(result.items); changed(); return result.items[0]; }
    catch (e) { failure(e); setServerErrors(previous => ({ ...previous, [path]: e.message })); return null; }
    finally { setPending(false); }
  }
  async function save(publish) {
    if (validation.checking || Object.keys(validation.fields).length || pending) return;
    setPending(true); setMessage('');
    let saved;
    try {
      const body = { category: categorySlug, displayOrder: order, data: payloadForWrite(template.fields, data, requirements.components) };
      saved = (await api(item ? `content/${item.documentId}` : 'content', { method: item ? 'PATCH' : 'POST', body: item ? { operation: 'update', ...body } : body })).item;
      if (publish) await api(`content/${saved.documentId}`, { method: 'PATCH', body: { operation: 'publish' } });
      setDirty(false); onDirty(false); onSaved(saved, publish ? 'Content published.' : 'Draft saved.');
    } catch (e) {
      // If creation succeeded but publish failed, retain the new ID to prevent a duplicate retry.
      if (saved && !item) { setDirty(false); onDirty(false); onSaved(saved, `Draft saved; publishing failed: ${e.message}`, true); }
      else failure(e);
    } finally { setPending(false); }
  }
  const errors = { ...validation.fields, ...serverErrors };
  const invalid = validation.checking || Object.keys(validation.fields).length > 0;
  return <section className="admin-panel"><div className="admin-heading"><div><p className="admin-eyebrow">CONTENT EDITOR</p><h2>{item ? 'Edit content' : 'Create content'}</h2></div><button type="button" disabled={pending} onClick={onCancel}>Back to content</button></div>
    <p className="admin-muted">Complete every required field (*) before saving a draft or publishing. {dirty && 'You have unsaved changes.'}</p>
    <form ref={form} onSubmit={e => { e.preventDefault(); save(false); }} aria-busy={pending}>
      <div className="admin-fields"><div className="admin-field"><label htmlFor="content-category">Category *</label><select id="content-category" required disabled={Boolean(item) || pending} value={categorySlug} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined} onChange={e => {
        changed(); setCategorySlug(e.target.value); setData(emptyFields(requirements.templates[categories.find(c => c.slug === e.target.value).templateKey].fields));
      }}><option value="" disabled>Choose a category</option>{categories.map(c => <option key={c.documentId} value={c.slug} disabled={c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId)}>{c.name}{c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId) ? ' — already exists; edit instead' : ''}</option>)}</select>{errors.category && <p id="category-error" className="admin-field-error">{errors.category}</p>}</div>
      <div className="admin-field"><label htmlFor="display-order">Display order *</label><input id="display-order" type="number" min="0" required disabled={pending} value={order} aria-invalid={Boolean(errors.displayOrder)} onChange={e => { changed(); setOrder(e.target.value === '' ? '' : Number(e.target.value)); }} />{errors.displayOrder && <p className="admin-field-error">{errors.displayOrder}</p>}</div></div>
      {category?.templateKey === 'education' && <p className="admin-note">Use a completion year or a date range. Preserve the precision of your source dates.</p>}
      {template && <Fields fields={template.fields} value={data} onChange={value => { changed(); setData(value); }} components={requirements.components} {...{ errors, media, groups, upload, pending }} templateKey={category.templateKey} />}
      {message && <p role="alert" className="admin-note">{message}</p>}
      {serverErrors.data && <p role="alert" className="admin-field-error">{serverErrors.data}</p>}
      <div className="admin-save"><p className="admin-muted" aria-live="polite">{pending ? 'Working… Please wait.' : invalid ? 'Complete the highlighted fields to save.' : 'Ready to save.'}</p><div className="admin-actions"><button disabled={pending || invalid} type="submit">Save draft</button><button disabled={pending || invalid} type="button" className="admin-primary" onClick={() => save(true)}>Save & publish</button></div></div>
      {item && publishedIds.has(item.documentId) && <p className="admin-muted">This entry has a published version. Saving a draft keeps that version public until you publish again.</p>}
    </form>
  </section>;
}
