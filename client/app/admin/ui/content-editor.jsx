'use client';

import { useEffect, useRef, useState } from 'react';
import contract from '@/utils/admin-contract.cjs';
import { emptyFields, payloadForWrite } from '@/utils/admin-api.mjs';
import Fields from './fields';
import { editorGroups, sectionName, entryName } from '@/utils/admin-presentation.mjs';
import { uploadMedia } from '@/utils/upload-media.mjs';
import EntryCards from './entry-cards';
import AssignSkill from './assign-skill';
import { FiArrowLeft, FiCheck, FiPlus } from 'react-icons/fi';

export default function ContentEditor({ item, initialCategory, initialData, initialOrder, categories, items, publishedIds, requirements, media, api, onMedia, onSaved, onCancel, onDirty, onBusy, onExpired, onRelatedEdit, onGroupCreated }) {
  const [categorySlug, setCategorySlug] = useState(item?.category || initialCategory || '');
  const [data, setData] = useState(() => item?.data || { ...emptyFields(requirements.templates[categories.find(c => c.slug === initialCategory)?.templateKey]?.fields || {}), ...initialData });
  const [order, setOrder] = useState(item?.displayOrder ?? initialOrder ?? 0);
  const [validation, setValidation] = useState({ checking: true, fields: {} });
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(Boolean(item?.prefilled));
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
  async function createGroup(groupData) {
    const groupCategory = categories.find(c => c.templateKey === 'skill-groups');
    if (!groupCategory) throw new Error('Add a skill group content type in Advanced settings first.');
    await contract.validatePayload('skill-groups', groupData);
    setPending(true);
    try {
      const result = await api('content', { method: 'POST', body: { category: groupCategory.slug, displayOrder: items.filter(i => i.category === groupCategory.slug).reduce((max, i) => Math.max(max, i.displayOrder + 1), 0), data: groupData } });
      onGroupCreated(result.item);
      return result.item;
    } catch (e) { if (e.status === 401) onExpired(); throw e; }
    finally { setPending(false); }
  }
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
  return <div className="admin-editor-layout"><section className="admin-panel admin-editor-main"><div className="admin-heading"><div><p className="admin-eyebrow">{item ? 'REFINE YOUR CONTENT' : 'SOMETHING NEW'}</p><h2>{category ? `${item ? 'Edit' : 'New'} ${entryName(category)}` : 'What would you like to add?'}</h2></div><button type="button" disabled={pending} onClick={onCancel}><FiArrowLeft aria-hidden="true" /> Back</button></div>
    <p className="admin-muted">Fields marked * are required. {dirty ? 'You have unsaved changes.' : 'Your work goes live only when you publish.'}</p>
    <form ref={form} noValidate onSubmit={e => { e.preventDefault(); save(false); }} aria-busy={pending}>
      {!category && <div className="admin-content-choices">{categories.filter(c => c.cardinality !== 'singleton' || !items.some(i => i.category === c.slug)).map(c => <button key={c.documentId} type="button" disabled={pending} onClick={() => { changed(); setCategorySlug(c.slug); setData(emptyFields(requirements.templates[c.templateKey].fields)); }}><span className="admin-choice-icon"><FiPlus aria-hidden="true" /></span><span><strong>{sectionName(c)}</strong><small>{c.templateKey === 'skills' ? 'Add a skill and choose its group' : c.templateKey === 'skill-groups' ? 'Create a home for related skills' : c.cardinality === 'singleton' ? 'Set up this part of your website' : `Add a new ${entryName(c)}`}</small></span></button>)}</div>}
      <div className="admin-fields"><div className={`admin-field ${item ? 'admin-editor-category-fixed' : ''}`}><label htmlFor="content-category">Portfolio section *</label><select id="content-category" required disabled={Boolean(item) || pending} value={categorySlug} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined} onChange={e => {
        changed(); setCategorySlug(e.target.value); setData(emptyFields(requirements.templates[categories.find(c => c.slug === e.target.value).templateKey].fields));
      }}><option value="" disabled>Choose a category</option>{categories.map(c => <option key={c.documentId} value={c.slug} disabled={c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId)}>{sectionName(c)}{c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== item?.documentId) ? ' — already exists; edit instead' : ''}</option>)}</select>{errors.category && <p id="category-error" className="admin-field-error">{errors.category}</p>}</div>
      {category?.cardinality !== 'singleton' && <details className="admin-order-options" open={Boolean(errors.displayOrder) || undefined}><summary>Ordering options</summary><div className="admin-field"><label htmlFor="display-order">Position in this list</label><p className="admin-muted">Lower numbers appear first.</p><input id="display-order" type="number" min="0" required disabled={pending} value={order} aria-invalid={Boolean(errors.displayOrder)} onChange={e => { changed(); setOrder(e.target.value === '' ? '' : Number(e.target.value)); }} />{errors.displayOrder && <p className="admin-field-error">{errors.displayOrder}</p>}</div></details>}</div>
      {category?.templateKey === 'education' && <p className="admin-note">Use a completion year or a date range. Preserve the precision of your source dates.</p>}
      {item?.prefilled && <p className="admin-note">The new group is selected below. Save a draft to keep the move private, or Save & publish to update your portfolio.</p>}
      {template && editorGroups(category.templateKey, template.fields).map(group => {
        const body = <><p className="admin-muted admin-section-intro">{group.description}</p><Fields fields={group.fields} value={data} onChange={value => {
          changed();
          const slug = name => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (!item && category.templateKey === 'projects' && value.name !== data.name && (!data.slug || data.slug === slug(data.name))) value = { ...value, slug: slug(value.name) };
          setData(value);
        }} components={requirements.components} {...{ errors, media, groups, upload, pending }} templateKey={category.templateKey} onCreateGroup={createGroup} onDirty={() => setDirty(true)} /></>;
        const hasError = Object.keys(errors).some(path => Object.keys(group.fields).some(key => path === `data.${key}` || path.startsWith(`data.${key}.`)));
        return group.advanced ? <details className="admin-editor-group" key={`${group.title}-${hasError}`} open={hasError || undefined}><summary>{group.title}</summary>{body}</details> : <section className="admin-editor-group" key={group.title}><h3>{group.title}</h3>{body}</section>;
      })}
      {message && <p role="alert" className="admin-note">{message}</p>}
      {serverErrors.data && <p role="alert" className="admin-field-error">{serverErrors.data}</p>}
      {category?.templateKey === 'skill-groups' && <section className="admin-editor-group"><div className="admin-heading"><div><h3>Skills in this group</h3><p className="admin-muted">Add a new skill here, or edit a skill to move it into this group.</p></div>{item && <button type="button" disabled={pending || !categories.some(c => c.templateKey === 'skills')} onClick={() => onRelatedEdit(null, categories.find(c => c.templateKey === 'skills').slug, { skillGroup: item.documentId })}><FiPlus aria-hidden="true" /> Add skill</button>}</div>{item && <AssignSkill group={item} skills={items.filter(i => categories.find(c => c.slug === i.category)?.templateKey === 'skills')} groups={items.filter(i => categories.find(c => c.slug === i.category)?.templateKey === 'skill-groups')} busy={pending} onEdit={onRelatedEdit} />}{item ? <EntryCards items={items.filter(i => i.data.skillGroup === item.documentId)} categories={categories} publishedIds={publishedIds} busy={pending} onEdit={onRelatedEdit} /> : <p className="admin-note">Save this group first. Then you can add skills directly inside it.</p>}</section>}
      <div className="admin-save"><p className="admin-muted" aria-live="polite">{pending ? 'Working… Please wait.' : invalid ? 'Complete the required fields to save.' : 'Ready to save.'}</p><div className="admin-actions"><button disabled={pending || validation.checking} type="submit">Save draft</button><button disabled={pending || validation.checking} type="button" className="admin-primary" onClick={() => save(true)}>Save & publish</button></div></div>
      {item && publishedIds.has(item.documentId) && <p className="admin-muted">This entry has a published version. Saving a draft keeps that version public until you publish again.</p>}
    </form>
  </section><aside className="admin-editor-guide"><div className="admin-panel"><p className="admin-eyebrow">BEFORE YOU PUBLISH</p><h3>You&apos;re in control.</h3><div className="admin-editor-state"><span className={`admin-badge ${item && publishedIds.has(item.documentId) ? 'published' : ''}`}>{item && publishedIds.has(item.documentId) ? 'Has a published version' : 'Not published yet'}</span><p className="admin-muted">{dirty ? 'There are changes waiting to be saved.' : 'Make your changes in the editor.'}</p></div><ul><li><FiCheck aria-hidden="true" /><span><strong>Save draft</strong><small>Keep your changes private. Your website stays as it is.</small></span></li><li><FiCheck aria-hidden="true" /><span><strong>Save & publish</strong><small>Save your changes and show them on the portfolio.</small></span></li></ul>{category?.templateKey === 'skills' && <p className="admin-note">A skill needs a name, an icon, and a group. You can create a group right here.</p>}{category?.templateKey === 'skill-groups' && <p className="admin-note">Publish this group and each of its skills to make the complete group visible.</p>}</div></aside></div>;
}
