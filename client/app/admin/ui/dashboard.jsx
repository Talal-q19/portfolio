'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiGrid, FiLayers, FiFileText, FiImage, FiArrowUpRight } from 'react-icons/fi';
import { createAdminApi, fetchAdminMedia } from '@/utils/admin-api.mjs';
import ContentEditor from './content-editor';
import Categories from './categories';
import MediaLibrary from './media-library';
import './admin.css';

const title = item => item.data.name || item.data.heading || item.data.title || item.data.qualification || item.data.displayName || 'Section configuration';
const flatten = response => response.categories.flatMap(c => c.items);

export default function AdminDashboard({ preview }) {
  const [api, setApi] = useState(() => createAdminApi());
  const [model, setModel] = useState(null);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(undefined);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const heading = useRef(null);

  const load = useCallback(async (request, signal) => {
    const [categories, drafts, published, media] = await Promise.all([
      request('categories', { signal }), request('content?status=draft', { signal }), request('content?status=published', { signal }),
      fetchAdminMedia(request, { signal }),
    ]);
    return { categories: categories.categories, requirements: categories.requirements, items: flatten(drafts), published: flatten(published), media };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      let request = createAdminApi();
      if (preview) { const { createFixtureApi } = await import('@/utils/admin-fixtures.mjs'); request = createFixtureApi(); }
      try {
        const next = await load(request, controller.signal);
        if (!controller.signal.aborted) { setApi(() => request); setModel(next); setError(''); }
      } catch (e) { if (!controller.signal.aborted) { setError(e.message); setExpired(e.status === 401); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    initialize();
    return () => controller.abort();
  }, [load, preview]);
  useEffect(() => {
    if (!dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const publishedIds = useMemo(() => new Set(model?.published.map(i => i.documentId) || []), [model]);
  function navigate(next, category = '') {
    if (busy || dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setDirty(false); setView(next); setFilter(category); setEditor(undefined); setPage(1); setNotice('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  function edit(item = null, category = '') {
    if (busy || dirty && !window.confirm('Discard unsaved changes?')) return;
    setDirty(false); setEditor(item || (category ? { category, data: {}, displayOrder: 0 } : null)); setView('editor'); setNotice('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function reload(message = '') {
    const next = await load(api);
    setModel(next); setExpired(false); setError(''); setNotice(message);
  }
  function onMedia(added) { setModel(m => ({ ...m, media: [...m.media.filter(old => !added.some(a => a.id === old.id)), ...added] })); }
  async function action(item, operation) {
    const deleting = operation === 'delete';
    if (!window.confirm(`${deleting ? 'Delete' : 'Unpublish'} “${title(item)}”? ${deleting ? 'This removes both draft and published versions.' : 'It will disappear from the public portfolio.'}`)) return;
    setBusy(true);
    try { await api(`content/${item.documentId}`, { method: deleting ? 'DELETE' : 'PATCH', ...(deleting ? {} : { body: { operation } }) }); await reload(deleting ? 'Content deleted.' : 'Content unpublished.'); }
    catch (e) { setNotice(`${e.message} ${Object.values(e.fields || {}).join(' ')}`); if (e.status === 401) setExpired(true); }
    finally { setBusy(false); }
  }
  const nav = [{ key: 'overview', label: 'Overview', icon: FiGrid }, { key: 'content', label: 'Content', icon: FiFileText }, { key: 'categories', label: 'Categories', icon: FiLayers }, { key: 'media', label: 'Media library', icon: FiImage }];
  const visibleItems = model?.items.filter(i => (!filter || i.category === filter) && (status === 'all' || (status === 'published' ? publishedIds.has(i.documentId) : !publishedIds.has(i.documentId))) && `${title(i)} ${i.category}`.toLowerCase().includes(search.toLowerCase())) || [];
  const pages = Math.max(1, Math.ceil(visibleItems.length / 10));
  const current = Math.min(page, pages);
  return <div className="admin-root"><a className="admin-skip" href="#admin-main">Skip to dashboard</a><aside className="admin-sidebar"><Link className="admin-brand" href="/" onClick={e => { if (busy || dirty && !window.confirm('Discard unsaved changes and open the portfolio?')) e.preventDefault(); }}><span className="admin-brand-mark">P.</span><span>Portfolio<small>CONTENT STUDIO</small></span></Link><p className="admin-nav-label">WORKSPACE</p><nav aria-label="Admin navigation">{nav.map(({ key, label, icon: Icon }) => <button key={key} disabled={busy} className={view === key || key === 'content' && view === 'editor' ? 'active' : ''} aria-current={view === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon aria-hidden="true" />{label}</button>)}</nav>
    {model && <><p className="admin-nav-label">YOUR SECTIONS</p><nav aria-label="Category shortcuts">{model.categories.map(c => <button key={c.documentId} disabled={busy} className={view === 'content' && filter === c.slug ? 'active' : ''} onClick={() => navigate('content', c.slug)}><span className="admin-nav-dot" />{c.name}<small>{model.items.filter(i => i.category === c.slug).length}</small></button>)}</nav></>}
    <div className="admin-sidebar-footer"><span className="admin-badge">{preview ? 'Local preview' : 'Content studio'}</span><p>{preview ? 'Temporary fixtures. Changes reset on reload.' : 'Manage your portfolio content and media.'}</p></div>
  </aside><main className="admin-main" id="admin-main"><header className="admin-topbar"><span>Workspace <span className="admin-muted">/ {view === 'editor' ? 'Content editor' : nav.find(n => n.key === view)?.label}</span></span><Link href="/" onClick={e => { if (busy || dirty && !window.confirm('Discard unsaved changes and open portfolio?')) e.preventDefault(); }}>View portfolio <FiArrowUpRight aria-hidden="true" /></Link></header>
    <div className="admin-body"><div className="admin-page-heading"><div><p className="admin-eyebrow">PORTFOLIO MANAGEMENT</p><h1 ref={heading} tabIndex={-1}>{view === 'overview' ? 'Your content, at a glance.' : view === 'editor' ? 'Make it yours.' : nav.find(n => n.key === view)?.label}</h1><p className="admin-muted">{preview ? 'Explore your dashboard with isolated local data.' : 'Manage the stories, work and details behind your portfolio.'}</p></div>{model && view !== 'editor' && <button className="admin-primary" disabled={busy} onClick={() => edit()}>+ Add content</button>}</div>
    {preview && <div className="admin-preview-banner">LOCAL FIXTURE PREVIEW · No server content is changed. Reload to reset.</div>}
    {notice && <p className="admin-note" role="status">{notice}</p>}
    {loading && <section className="admin-panel admin-empty" role="status">Loading your workspace…</section>}
    {error && !model && <section className="admin-panel admin-empty" role="alert"><h2>{expired ? 'Admin connection unavailable' : 'Workspace unavailable'}</h2><p>{error}</p><button onClick={() => window.location.reload()}>Retry connection</button>{!preview && <p className="admin-muted">Local editing requires the CMS and API to be running after setup:admin. Authentication for deployed environments arrives in phase 5.</p>}</section>}
    {expired && model && <p role="alert" className="admin-note">Your session has expired. Your form is still here. <button disabled={busy} onClick={async () => { try { await reload('Session restored. You can retry your save.'); } catch (e) { setNotice(e.message); } }}>Retry session</button></p>}
    {model && <>
      {view === 'overview' && <><div className="admin-stats">{[{ label: 'Total entries', count: model.items.length, hint: 'Across your portfolio' }, { label: 'Published', count: publishedIds.size, hint: 'Visible on your portfolio' }, { label: 'Unpublished drafts', count: model.items.filter(i => !publishedIds.has(i.documentId)).length, hint: 'Complete and private' }, { label: 'Categories', count: model.categories.length, hint: 'Registered content structures' }].map(s => <article key={s.label} className="admin-stat"><p>{s.label}</p><strong>{s.count.toString().padStart(2, '0')}</strong><small>{s.hint}</small></article>)}</div><section className="admin-panel"><div className="admin-heading"><div><p className="admin-eyebrow">YOUR PORTFOLIO</p><h2>Content by category</h2></div><button onClick={() => navigate('content')}>Browse all content →</button></div><div className="admin-category-grid">{model.categories.map(c => {
        const entries = model.items.filter(i => i.category === c.slug);
        return <article key={c.documentId}><span className="admin-badge">{c.cardinality === 'singleton' ? 'Single entry' : 'Collection'}</span><h3>{c.name}</h3><p className="admin-muted">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {entries.filter(i => publishedIds.has(i.documentId)).length} published</p><button onClick={() => c.cardinality === 'singleton' && entries.length ? edit(entries[0]) : navigate('content', c.slug)}>{c.cardinality === 'singleton' && entries.length ? 'Edit content' : 'Manage entries'} →</button></article>;
      })}</div></section></>}
      {view === 'content' && <section className="admin-panel"><div className="admin-heading"><div><p className="admin-eyebrow">CONTENT COLLECTION</p><h2>{model.categories.find(c => c.slug === filter)?.name || 'All content'}</h2></div><span className="admin-badge">{visibleItems.length} entries</span></div><div className="admin-filters"><div><label htmlFor="content-search">Search</label><input id="content-search" type="search" value={search} placeholder="Find an entry…" onChange={e => { setSearch(e.target.value); setPage(1); }} /></div><div><label htmlFor="category-filter">Category</label><select id="category-filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">All categories</option>{model.categories.map(c => <option key={c.documentId} value={c.slug}>{c.name}</option>)}</select></div><div><label htmlFor="status-filter">Publication</label><select id="status-filter" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="all">All entries</option><option value="draft">Unpublished drafts</option><option value="published">Has published version</option></select></div></div>
        <div className="admin-table-wrap"><table><caption className="sr-only">Portfolio content</caption><thead><tr><th>Entry</th><th>Category</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{visibleItems.slice((current - 1) * 10, current * 10).map(i => <tr key={i.documentId}><td><strong>{title(i)}</strong><small>{i.documentId}</small></td><td>{model.categories.find(c => c.slug === i.category)?.name}</td><td><span className={`admin-badge ${publishedIds.has(i.documentId) ? 'published' : ''}`}>{publishedIds.has(i.documentId) ? 'Published + draft' : 'Draft'}</span></td><td>{i.displayOrder}</td><td><div className="admin-actions"><button disabled={busy} onClick={() => edit(i)}>Edit<span className="sr-only"> {title(i)}</span></button>{publishedIds.has(i.documentId) && <button disabled={busy} onClick={() => action(i, 'unpublish')}>Unpublish<span className="sr-only"> {title(i)}</span></button>}<button disabled={busy} onClick={() => action(i, 'delete')}>Delete<span className="sr-only"> {title(i)}</span></button></div></td></tr>)}</tbody></table></div>
        {!visibleItems.length && <div className="admin-empty"><h3>No entries found</h3><p className="admin-muted">Try another filter or add content to this category.</p></div>}
        <div className="admin-pagination"><button disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button></div></section>}
      {view === 'editor' && <ContentEditor key={editor?.documentId || 'new'} item={editor?.documentId ? editor : null} categories={model.categories} items={model.items} publishedIds={publishedIds} requirements={model.requirements} media={model.media} api={api} onMedia={onMedia} onDirty={setDirty} onBusy={setBusy} onExpired={() => setExpired(true)} onCancel={() => navigate('content')} onSaved={async (saved, message, stay) => {
        setDirty(false); setNotice(message);
        if (stay) setEditor(saved); else { setView('content'); setEditor(undefined); }
        try { await reload(message); } catch (e) { setNotice(`${message} Refresh failed: ${e.message}`); }
      }} />}
      {view === 'categories' && <Categories categories={model.categories} items={model.items} requirements={model.requirements} api={api} reload={reload} onDirty={setDirty} onBusy={setBusy} onExpired={() => setExpired(true)} />}
      {view === 'media' && <MediaLibrary media={model.media} api={api} onMedia={onMedia} onDelete={id => setModel(m => ({ ...m, media: m.media.filter(i => i.id !== id) }))} onBusy={setBusy} onExpired={() => setExpired(true)} />}
    </>}
    <footer className="admin-footer">Portfolio Content Studio <span>{preview ? 'Development preview' : 'Private workspace'}</span></footer></div>
  </main></div>;
}
