'use client';

import { useEffect, useState } from 'react';
import contract from '@/utils/admin-contract.cjs';

export default function Categories({ categories, items, requirements, api, reload, onDirty, onBusy, onExpired }) {
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => { onBusy(pending); return () => onBusy(false); }, [pending, onBusy]);
  function open(c) { setEditing(c?.documentId || null); setData(c ? { name: c.name, slug: c.slug, templateKey: c.templateKey, cardinality: c.cardinality, displayOrder: c.displayOrder, visible: c.visible } : { name: '', slug: '', templateKey: 'hero', cardinality: 'singleton', displayOrder: 0, visible: true }); setErrors({}); setMessage(''); }
  function update(patch) { setData({ ...data, ...patch }); onDirty(true); setErrors({}); }
  const used = editing && items.some(i => i.category === categories.find(c => c.documentId === editing)?.slug);
  async function save(e) {
    e.preventDefault();
    try { contract.validateCategory(data); } catch (e) { setErrors(e.fields); return; }
    setPending(true);
    try { await api(editing ? `categories/${editing}` : 'categories', { method: editing ? 'PATCH' : 'POST', body: editing ? Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'slug')) : data }); setData(null); onDirty(false); await reload('Category saved.'); }
    catch (e) { setErrors(e.fields || {}); setMessage(e.message); if (e.status === 401) onExpired(); }
    finally { setPending(false); }
  }
  async function remove(c) {
    if (!window.confirm(`Delete category “${c.name}”? This cannot be undone.`)) return;
    setPending(true);
    try { await api(`categories/${c.documentId}`, { method: 'DELETE' }); await reload('Category deleted.'); }
    catch (e) { setMessage(e.message + ' ' + Object.values(e.fields || {}).join(' ')); if (e.status === 401) onExpired(); }
    finally { setPending(false); }
  }
  return <section className="admin-panel"><div className="admin-heading"><div><p className="admin-eyebrow">STRUCTURE</p><h2>Categories</h2></div><button className="admin-primary" disabled={pending || Boolean(data)} onClick={() => open(null)}>+ Add category</button></div>
    <p className="admin-muted">Categories use registered field templates. A new layout requires a code change.</p>
    {message && <p role="alert" className="admin-note">{message}</p>}
    {data && <form onSubmit={save} className="admin-category-form" aria-busy={pending}><h3>{editing ? 'Edit category' : 'New category'}</h3><div className="admin-fields">
      {['name', 'slug', 'templateKey', 'displayOrder', 'visible'].map(key => <div className="admin-field" key={key}><label htmlFor={`category-${key}`}>{({ templateKey: 'Field template', displayOrder: 'Display order' })[key] || key.charAt(0).toUpperCase() + key.slice(1)} *</label>
        {key === 'templateKey' ? <select id={`category-${key}`} disabled={pending || used} value={data[key]} onChange={e => update({ templateKey: e.target.value, cardinality: requirements.templates[e.target.value].cardinality })}>{Object.entries(requirements.templates).map(([key, t]) => <option key={key} value={key}>{t.name} ({t.cardinality})</option>)}</select>
          : key === 'visible' ? <select id={`category-${key}`} disabled={pending} value={String(data.visible)} onChange={e => update({ visible: e.target.value === 'true' })}><option value="true">Visible</option><option value="false">Hidden</option></select>
          : <input id={`category-${key}`} required disabled={pending || key === 'slug' && Boolean(editing)} type={key === 'displayOrder' ? 'number' : 'text'} min={key === 'displayOrder' ? 0 : undefined} value={data[key]} onChange={e => update({ [key]: key === 'displayOrder' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `category-${key}-error` : undefined} />}
        {errors[key] && <p className="admin-field-error" id={`category-${key}-error`}>{errors[key]}</p>}</div>)}
      </div><p className="admin-muted">Slugs stay stable. A template cannot change after content is added.</p><div className="admin-actions"><button type="submit" className="admin-primary" disabled={pending}>Save category</button><button type="button" disabled={pending} onClick={() => { if (window.confirm('Discard category edits?')) { setData(null); onDirty(false); } }}>Cancel</button></div></form>}
    <div className="admin-table-wrap"><table><caption className="sr-only">Content categories</caption><thead><tr><th>Name</th><th>Template</th><th>Entries</th><th>Order</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{categories.map(c => <tr key={c.documentId}><td><strong>{c.name}</strong><small>{c.slug}</small></td><td>{requirements.templates[c.templateKey]?.name}<small>{c.cardinality}</small></td><td>{items.filter(i => i.category === c.slug).length}</td><td>{c.displayOrder}</td><td>{c.visible ? 'Visible' : 'Hidden'}</td><td><div className="admin-actions"><button disabled={pending || Boolean(data)} onClick={() => open(c)}>Edit<span className="sr-only"> {c.name}</span></button><button disabled={pending || Boolean(data) || items.some(i => i.category === c.slug)} onClick={() => remove(c)}>Delete<span className="sr-only"> {c.name}</span></button></div></td></tr>)}</tbody></table></div>
    {!categories.length && <p className="admin-empty">No categories yet. Add one using a registered template.</p>}
  </section>;
}
