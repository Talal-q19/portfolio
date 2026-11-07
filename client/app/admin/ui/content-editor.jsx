'use client';

import { useEffect, useRef, useState } from 'react';
import contract from '@/utils/admin-contract.cjs';
import { emptyFields, payloadForWrite } from '@/utils/admin-api.mjs';
import Fields from './fields';
import { editorGroups, sectionName } from '@/utils/admin-presentation.mjs';
import { uploadMedia } from '@/utils/upload-media.mjs';

export default function ContentEditor({ item, initialCategory, categories, items, publishedIds, requirements, media, api, onMedia, onSaved, onCancel, onDirty, onBusy, onExpired }) {
  const [categorySlug, setCategorySlug] = useState(item?.category || initialCategory || '');
  const [data, setData] = useState(() => item?.data || emptyFields(requirements.templates[categories.find(c => c.slug === initialCategory)?.templateKey]?.fields || {}));
  const [order, setOrder] = useState(item?.displayOrder ?? 0);
  const [validation, setValidation] = useState({ checking: true, fields: {} });
  const [showErrors, setShowErrors] = useState(false);
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
  async function upload(file, path, acceptedMime) {
    if (acceptedMime && file.type !== acceptedMime) { setServerErrors(e => ({ ...e, [path]: 'Choose a PDF for your CV.' })); return null; }
    if (file.size > 8 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)) {
      setServerErrors(e => ({ ...e, [path]: 'Choose PNG, JPEG, GIF, WebP or PDF, up to 8 MiB.' })); return null;
    }
    setPending(true); setMessage('Uploading…');
    try { const result = await uploadMedia(api, file); onMedia(result.items); changed(); return result.items[0]; }
    catch (e) { failure(e); setServerErrors(previous => ({ ...previous, [path]: e.message })); return null; }
    finally { setPending(false); }
  }
  async function save(publish) {
    if (validation.checking || pending) return;
    if (Object.keys(validation.fields).length) { setShowErrors(true); setMessage('Please complete the required fields below.'); requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    setPending(true); setMessage('');
    let saved;
    let stage = 'saving the section';
    let published = false;
    try {
      const body = { category: categorySlug, displayOrder: order, data: payloadForWrite(template.fields, data, requirements.components) };
      saved = (await api(item ? `content/${item.documentId}` : 'content', { method: item ? 'PATCH' : 'POST', body: item ? { operation: 'update', ...body } : body })).item;
      if (publish) {
        stage = 'publishing the section';
        await api(`content/${saved.documentId}`, { method: 'PATCH', body: { operation: 'publish' } });
        published = true;
      }
      setDirty(false); onDirty(false); onSaved(saved, publish ? 'Content published.' : 'Draft saved.');
    } catch (e) {
      if (saved) e.message = `${published ? 'Section published' : 'Section draft saved'}, but ${stage} failed: ${e.message} Retry to finish saving.`;
      // If creation succeeded but publish failed, retain the new ID to prevent a duplicate retry.
      if (saved && !item) { setDirty(false); onDirty(false); onSaved(saved, e.message, true); }
      else failure(e);
    } finally { setPending(false); }
  }
  const errors = { ...(showErrors ? validation.fields : {}), ...serverErrors };
  const invalid = validation.checking || Object.keys(validation.fields).length > 0;
  return <section className="admin-panel"><div className="admin-heading"><div><p className="admin-eyebrow">CONTENT EDITOR</p><h2>{category ? `Edit ${sectionName(category)}` : 'Choose what to add'}</h2></div><button type="button" disabled={pending} onClick={onCancel}>{category?.cardinality === 'singleton' ? 'Back to overview' : 'Back to entries'}</button></div>
    <p className="admin-muted">Complete every required field (*) before saving a draft or publishing. {dirty && 'You have unsaved changes.'}</p>
    <form ref={form} noValidate onSubmit={e => { e.preventDefault(); save(false); }} aria-busy={pending}>
      <div className="admin-fields"><div className={`admin-field ${item ? 'admin-editor-category-fixed' : ''}`}><label htmlFor="content-category">Portfolio section *</label><select id="content-category" required disabled={Boolean(item) || pending} value={categorySlug} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined} onChange={e => {
        changed(); setCategorySlug(e.target.value); setData(emptyFields(requirements.templates[categories.find(c => c.slug === e.target.value).templateKey].fields));
      }}><option value="" disabled>Choose a category</option>{categories.map(c => <option key={c.documentId} value={c.slug} disabled={c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId)}>{sectionName(c)}{c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId) ? ' — already exists; edit instead' : ''}</option>)}</select>{errors.category && <p id="category-error" className="admin-field-error">{errors.category}</p>}</div>
      {category?.cardinality !== 'singleton' && <details className="admin-order-options" open={Boolean(errors.displayOrder) || undefined}><summary>Ordering options</summary><div className="admin-field"><label htmlFor="display-order">Position in this list</label><p className="admin-muted">Lower numbers appear first.</p><input id="display-order" type="number" min="0" required disabled={pending} value={order} aria-invalid={Boolean(errors.displayOrder)} onChange={e => { changed(); setOrder(e.target.value === '' ? '' : Number(e.target.value)); }} />{errors.displayOrder && <p className="admin-field-error">{errors.displayOrder}</p>}</div></details>}</div>
      {category?.templateKey === 'education' && <p className="admin-note">Use a completion year or a date range. Preserve the precision of your source dates.</p>}
      {template && editorGroups(category.templateKey, template.fields).map(group => {
        const body = <><p className="admin-muted admin-section-intro">{group.description}</p><Fields fields={group.fields} value={data} onChange={value => {
          changed();
          const slug = name => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (!item && category.templateKey === 'projects' && value.name !== data.name && (!data.slug || data.slug === slug(data.name))) value = { ...value, slug: slug(value.name) };
          setData(value);
        }} components={requirements.components} {...{ errors, media, groups, upload, pending }} templateKey={category.templateKey} /></>;
        const hasError = Object.keys(errors).some(path => Object.keys(group.fields).some(key => path === `data.${key}` || path.startsWith(`data.${key}.`)));
        return group.advanced ? <details className="admin-editor-group" key={`${group.title}-${hasError}`} open={hasError || undefined}><summary>{group.title}</summary>{body}</details> : <section className="admin-editor-group" key={group.title}><h3>{group.title}</h3>{body}</section>;
      })}
      {message && <p role="alert" className="admin-note">{message}</p>}
      {serverErrors.data && <p role="alert" className="admin-field-error">{serverErrors.data}</p>}
      <div className="admin-save"><p className="admin-muted" aria-live="polite">{pending ? 'Working… Please wait.' : invalid ? 'Complete the required fields to save.' : 'Ready to save.'}</p><div className="admin-actions"><button disabled={pending || validation.checking} type="submit">Save draft</button><button disabled={pending || validation.checking} type="button" className="admin-primary" onClick={() => save(true)}>Save & publish</button></div></div>
      {item && publishedIds.has(item.documentId) && <p className="admin-muted">This entry has a published version. Saving a draft keeps that version public until you publish again.</p>}
    </form>
  </section>;
}
