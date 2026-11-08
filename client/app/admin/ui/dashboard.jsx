'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiGrid, FiLayers, FiFileText, FiImage, FiArrowUpRight, FiArrowRight, FiBriefcase, FiCode, FiBookOpen, FiSettings, FiUser, FiCheckCircle, FiEdit3, FiPlus, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { createAdminApi, fetchAdminMedia } from '@/utils/admin-api.mjs';
import { mediaUrl } from '@/utils/media-url.mjs';
import ContentEditor from './content-editor';
import { sectionName, entryName } from '@/utils/admin-presentation.mjs';
import Categories from './categories';
import MediaLibrary from './media-library';
import EntryCards, { entryTitle } from './entry-cards';
import SkillsWorkspace from './skills-workspace';
import './admin.css';
import { AdminLogin } from './login';

const flatten = response => response.categories.flatMap(c => c.items);
const sectionDetails = {
  hero: { icon: FiUser, description: 'Introduce yourself, update your portrait card, and upload your CV.', action: 'Edit introduction' },
  experience: { icon: FiBriefcase, description: 'Share your roles, companies, and career highlights.', action: 'Manage experience' },
  projects: { icon: FiCode, description: 'Showcase your work with images, outcomes, and links.', action: 'Manage projects' },
  skills: { icon: FiLayers, description: 'Organize your toolkit into groups. Add and edit skills in one place.', action: 'Manage skills & groups' },
  'skill-groups': { icon: FiLayers, description: 'Organize the skills that belong together.', action: 'Manage skills & groups' },
  education: { icon: FiBookOpen, description: 'Add qualifications, courses, and credentials.', action: 'Manage education' },
  'site-settings': { icon: FiSettings, description: 'Your name, photo, contact information, and search appearance.', action: 'Edit profile & contact' },
  'section-settings': { icon: FiFileText, description: 'Choose your headings, section order, and what visitors see.', action: 'Arrange your website' },
};
const nav = [{ key: 'overview', label: 'Overview', icon: FiGrid }, { key: 'content', label: 'All content', icon: FiFileText }, { key: 'skills', label: 'Skills & groups', icon: FiLayers }, { key: 'media', label: 'Media library', icon: FiImage }];
const isSkills = c => ['skills', 'skill-groups'].includes(c?.templateKey);
const isSettings = c => ['site-settings', 'section-settings'].includes(c?.templateKey);

function StudioAvatar({ profile }) {
  // CMS portraits have dynamic dimensions; the frame reserves their size.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="admin-avatar" aria-hidden="true"><img src={mediaUrl(profile?.profileImage?.url || '/profilePic.jpeg')} alt="" width="40" height="40" /></span>;
}

export default function AdminDashboard({ preview, onLogout }) {
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [skillGroup, setSkillGroup] = useState('');
  const heading = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = event => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  const load = useCallback(async (request, signal) => {
    const [categories, drafts, published, media] = await Promise.all([
      request('categories', { signal }), request('content?status=draft', { signal }), request('content?status=published', { signal }), fetchAdminMedia(request, { signal }),
    ]);
    return { categories: categories.categories, requirements: categories.requirements, items: flatten(drafts), published: flatten(published), media };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      let request = createAdminApi();
      if (preview) { const { createFixtureApi } = await import('@/utils/admin-fixtures.mjs'); request = createFixtureApi(); }
      try { const next = await load(request, controller.signal); if (!controller.signal.aborted) { setApi(() => request); setModel(next); setError(''); } }
      catch (e) { if (!controller.signal.aborted) { setError(e.message); setExpired(e.status === 401); } }
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
  function canLeave() { return !busy && (!dirty || window.confirm('You have unsaved changes. Discard them?')); }
  function focusHeading() { setMenuOpen(false); requestAnimationFrame(() => heading.current?.focus()); }
  function navigate(next, category = '', group = '') {
    if (!canLeave()) return;
    setDirty(false); setSearch(''); setStatus('all'); setView(next); setFilter(category); setEditor(undefined); setPage(1); setNotice(''); setSkillGroup(group); focusHeading();
  }
  function edit(item = null, category = '', initialData = {}) {
    if (!canLeave()) return;
    setDirty(false); setEditor(item ? { ...item, data: { ...item.data, ...initialData }, prefilled: Object.keys(initialData).length > 0 } : (category ? { category, data: initialData, displayOrder: model?.items.filter(i => i.category === category).reduce((max, i) => Math.max(max, i.displayOrder + 1), 0) } : null)); setView('editor'); setNotice(''); focusHeading();
  }
  async function reload(message = '') {
    const next = await load(api); setModel(next); setExpired(false); setError(''); setNotice(message);
  }
  function onMedia(added) { setModel(m => ({ ...m, media: [...m.media.filter(old => !added.some(a => a.id === old.id)), ...added] })); }
  async function action(item, operation) {
    if (busy) return;
    const deleting = operation === 'delete';
    const linked = [...model.items, ...model.published].filter(i => i.data.skillGroup === item.documentId);
    if (deleting && linked.length) { setNotice(`This group is still used by skills. Move those skills to another group and publish the moves before deleting “${entryTitle(item)}”.`); return; }
    if (!window.confirm(`${deleting ? 'Delete' : 'Unpublish'} “${entryTitle(item)}”? ${deleting ? 'This removes both draft and published versions.' : 'It will disappear from the public portfolio.'}`)) return;
    setBusy(true);
    try { await api(`content/${item.documentId}`, { method: deleting ? 'DELETE' : 'PATCH', ...(deleting ? {} : { body: { operation } }) }); await reload(deleting ? 'Entry deleted.' : 'Entry unpublished.'); }
    catch (e) { setNotice(`${e.message} ${Object.values(e.fields || {}).join(' ')}`); if (e.status === 401) setExpired(true); }
    finally { setBusy(false); }
  }
  function openSection(category) {
    if (isSkills(category)) { navigate('skills'); return; }
    if (category.cardinality === 'singleton') edit(model.items.find(i => i.category === category.slug) || null, category.slug);
    else navigate('content', category.slug);
  }
  const selectedCategory = model?.categories.find(c => c.slug === (view === 'editor' ? editor?.category : filter));
  const visibleItems = model?.items.filter(i => (!filter || i.category === filter) && (status === 'all' || (status === 'published' ? publishedIds.has(i.documentId) : !publishedIds.has(i.documentId))) && `${entryTitle(i)} ${i.category} ${i.data.company || ''} ${i.data.institution || ''}`.toLowerCase().includes(search.toLowerCase())) || [];
  const pages = Math.max(1, Math.ceil(visibleItems.length / 10));
  const current = Math.min(page, pages);
  const profile = model?.items.find(i => model.categories.find(c => c.slug === i.category)?.templateKey === 'site-settings')?.data;
  const profileName = profile?.displayName || 'Talal Qasim';
  const pageTitle = view === 'overview' ? 'Your portfolio, at a glance.' : view === 'editor' ? `${editor?.documentId ? 'Edit' : 'Add'} ${editor?.documentId ? entryTitle(editor) : selectedCategory ? entryName(selectedCategory) : 'content'}` : view === 'categories' ? 'Content structure' : view === 'content' && filter ? sectionName(selectedCategory) : nav.find(n => n.key === view)?.label;
  const descriptions = { overview: 'A little upkeep goes a long way. What would you like to work on today?', content: 'Find an entry, make your changes, then choose when to publish.', skills: 'Build your toolkit. Keep related skills together and easy to find.', media: 'One home for the images, logos, and documents used across your portfolio.', categories: 'Advanced controls for the types of content in your workspace.', editor: 'Work at your own pace. Changes go live only when you publish.' };
  const sidebarCategories = model?.categories.filter(c => !isSkills(c)) || [];
  function sectionCards(categories) {
    return <div className="admin-category-grid">{categories.map(c => {
      const entries = model.items.filter(i => i.category === c.slug);
      const detail = sectionDetails[c.templateKey] || { icon: FiFileText, description: 'Manage this part of your portfolio.', action: 'Manage entries' };
      const Icon = detail.icon;
      return <article key={c.documentId}><div className="admin-category-top"><span className="admin-category-icon"><Icon aria-hidden="true" /></span><span className="admin-muted">{c.cardinality === 'singleton' ? 'Website details' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}</span></div><h3>{isSkills(c) ? 'Skills & groups' : sectionName(c)}</h3><p className="admin-category-description">{detail.description}</p><button disabled={busy} onClick={() => openSection(c)}>{detail.action}<FiArrowRight aria-hidden="true" /></button></article>;
    })}</div>;
  }
  return <div className={`admin-root admin-studio ${menuOpen ? 'admin-menu-open' : ''}`}><a className="admin-skip" href="#admin-main">Skip to dashboard</a>
    <aside className="admin-sidebar" id="studio-navigation"><Link className="admin-brand" href="/" onClick={e => { if (!canLeave()) e.preventDefault(); }}><span className="admin-brand-mark" aria-hidden="true">tq<span>.</span></span><span>Portfolio<small>THE CONTENT STUDIO</small></span></Link><p className="admin-nav-label">WORKSPACE</p><nav aria-label="Admin navigation">{nav.map(({ key, label, icon: Icon }) => {
      const active = key === view && (key !== 'content' || !filter) || key === 'skills' && view === 'editor' && isSkills(selectedCategory);
      return <button key={key} disabled={busy} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(key)}><Icon aria-hidden="true" />{label}{key === 'skills' && <span className="admin-nav-tag">NEW</span>}</button>;
    })}</nav>
      {model && <><p className="admin-nav-label">YOUR WEBSITE</p><nav aria-label="Category shortcuts">{sidebarCategories.map(c => { const Icon = sectionDetails[c.templateKey]?.icon || FiFileText; const active = (view === 'content' || view === 'editor') && selectedCategory?.slug === c.slug; return <button key={c.documentId} disabled={busy} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => openSection(c)}><Icon aria-hidden="true" />{sectionName(c)}{c.cardinality !== 'singleton' && <small>{model.items.filter(i => i.category === c.slug).length}</small>}</button>; })}</nav></>}
      <details className="admin-advanced-nav"><summary>Advanced settings</summary><button disabled={busy} onClick={() => navigate('categories')}>Content structure</button></details>
      <div className="admin-sidebar-footer"><div className="admin-profile"><StudioAvatar profile={profile} /><div><strong>{profileName}</strong><small>Portfolio owner</small></div></div>{!preview && <button disabled={busy} onClick={async () => { if (!canLeave()) return; try { await api('auth/logout', { method: 'POST', body: {} }); onLogout(); } catch (e) { setNotice(e.message); } }}><FiLogOut aria-hidden="true" /> Sign out</button>}</div>
    </aside><main className="admin-main" id="admin-main"><header className="admin-topbar"><div className="admin-topbar-start"><button className="admin-mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="studio-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <FiX /> : <FiMenu />}</button><div className="admin-topbar-title"><span className="admin-muted">Workspace <span aria-hidden="true">/</span> <strong>{view === 'editor' ? 'Editor' : view === 'content' && filter ? sectionName(selectedCategory) : nav.find(n => n.key === view)?.label || 'Settings'}</strong></span></div></div><Link href="/" onClick={e => { if (!canLeave()) e.preventDefault(); }}>View portfolio <FiArrowUpRight aria-hidden="true" /></Link></header>
      <div className="admin-body"><div className="admin-page-heading"><div><p className="admin-eyebrow">{view === 'overview' ? `WELCOME BACK, ${profileName.split(' ')[0].toUpperCase()}` : 'PORTFOLIO STUDIO'}</p><h1 ref={heading} tabIndex={-1}>{pageTitle}</h1><p className="admin-muted">{descriptions[view]}</p></div>{model && (view === 'overview' || view === 'content') && (!filter || selectedCategory?.cardinality !== 'singleton') && <button className="admin-primary" disabled={busy} onClick={() => edit(null, filter)}><FiPlus aria-hidden="true" />{filter ? `Add ${selectedCategory?.templateKey === 'projects' ? 'project' : selectedCategory?.templateKey === 'experience' ? 'experience' : 'entry'}` : 'Add content'}</button>}</div>
      {preview && <div className="admin-preview-banner">Preview workspace · Try any change. Your live portfolio is unaffected and this data resets on reload.</div>}
      {notice && <p className="admin-note" role="status">{notice}</p>}
      {loading && <section className="admin-panel admin-empty" role="status">Loading your workspace…</section>}
      {error && !model && !expired && <section className="admin-panel admin-empty" role="alert"><h2>Workspace unavailable</h2><p>{error}</p><button onClick={() => window.location.reload()}>Retry connection</button></section>}
      {expired && <><p role="alert" className="admin-note">Your session has expired. Sign in to continue. Your open form has been preserved.</p><AdminLogin onSuccess={async () => { try { await reload('Session restored. You can retry your save.'); } catch (e) { setNotice(e.message); } }} /></>}
      {model && <>
        {view === 'overview' && <><div className="admin-stats">{[{ label: 'Published entries', count: publishedIds.size, hint: 'Already on your website', icon: FiCheckCircle, status: 'published' }, { label: 'Unpublished entries', count: model.items.filter(i => !publishedIds.has(i.documentId)).length, hint: 'Saved privately in your studio', icon: FiEdit3, status: 'draft' }, { label: 'Media library', count: model.media.length, hint: 'Images and documents', icon: FiImage, view: 'media' }].map(s => <button key={s.label} className="admin-stat" disabled={busy} onClick={() => { navigate(s.view || 'content'); if (s.status) setStatus(s.status); }}><div className="admin-stat-heading"><p>{s.label}</p><s.icon aria-hidden="true" /></div><strong>{s.count.toString().padStart(2, '0')}</strong><small>{s.hint}<FiArrowUpRight aria-hidden="true" /></small></button>)}</div>
          <div className="admin-overview-layout"><div><section className="admin-overview-section"><div className="admin-heading"><div><p className="admin-eyebrow">MAKE IT YOURS</p><h2>Your content</h2></div><button className="admin-text-button" onClick={() => navigate('content')}>See all <FiArrowRight aria-hidden="true" /></button></div>{sectionCards(model.categories.filter(c => !isSettings(c) && (c.templateKey !== 'skill-groups' || !model.categories.some(c => c.templateKey === 'skills'))))}</section><section className="admin-overview-section"><div className="admin-heading"><h2>Website settings</h2></div>{sectionCards(model.categories.filter(isSettings))}</section></div>
          <aside className="admin-guide"><span className="admin-guide-icon"><FiEdit3 aria-hidden="true" /></span><p className="admin-eyebrow">A SIMPLE WORKFLOW</p><h2>From idea<br />to portfolio.</h2><ol><li><strong>Choose a section</strong><p>Start with what you want visitors to see.</p></li><li><strong>Make it yours</strong><p>Add your details, images, and links.</p></li><li><strong>Publish when ready</strong><p>Save a draft to keep it private. Save & publish to put it live.</p></li></ol><div className="admin-guide-tip"><FiLayers aria-hidden="true" /><strong>Building your toolkit?</strong><p>Create a group, then add skills directly inside it.</p><button onClick={() => navigate('skills')}>Open skills & groups <FiArrowRight aria-hidden="true" /></button></div></aside></div></>}
        {view === 'skills' && <SkillsWorkspace key={skillGroup} model={model} publishedIds={publishedIds} busy={busy} onEdit={edit} onAction={action} initialGroup={skillGroup} />}
        {view === 'content' && <section className="admin-panel"><div className="admin-heading"><div><h2>{filter ? sectionName(selectedCategory) : 'Content library'}</h2><p className="admin-muted">{visibleItems.length} {visibleItems.length === 1 ? 'entry' : 'entries'} in this view</p></div></div><div className="admin-filters"><div><label htmlFor="content-search">Find content</label><input id="content-search" type="search" value={search} placeholder="Search by title, company, or section…" onChange={e => { setSearch(e.target.value); setPage(1); }} /></div><div><label htmlFor="category-filter">Section</label><select id="category-filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">All sections</option>{model.categories.map(c => <option key={c.documentId} value={c.slug}>{sectionName(c)}</option>)}</select></div><div><label htmlFor="status-filter">Visibility</label><select id="status-filter" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="all">All entries</option><option value="draft">Unpublished</option><option value="published">Published</option></select></div></div>
          <EntryCards items={visibleItems.slice((current - 1) * 10, current * 10)} relatedItems={model.items} categories={model.categories} publishedIds={publishedIds} busy={busy} onEdit={edit} onAction={action} />
          {pages > 1 && <div className="admin-pagination"><button disabled={busy || current === 1} onClick={() => setPage(current - 1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={busy || current === pages} onClick={() => setPage(current + 1)}>Next</button></div>}</section>}
        {view === 'editor' && <ContentEditor key={editor?.documentId || `${editor?.category || 'new'}-${editor?.data?.skillGroup || ''}`} initialCategory={editor?.category} initialData={editor?.data} initialOrder={editor?.displayOrder} item={editor?.documentId ? editor : null} categories={model.categories} items={model.items} publishedIds={publishedIds} requirements={model.requirements} media={model.media} api={api} onMedia={onMedia} onRelatedEdit={edit} onGroupCreated={group => setModel(m => ({ ...m, items: [...m.items, group] }))} onDirty={setDirty} onBusy={setBusy} onExpired={() => setExpired(true)} onCancel={() => navigate(isSkills(selectedCategory) ? 'skills' : selectedCategory?.cardinality === 'singleton' ? 'overview' : 'content', isSkills(selectedCategory) ? '' : editor?.category || '', editor?.data?.skillGroup || (selectedCategory?.templateKey === 'skill-groups' ? editor?.documentId : ''))} onSaved={async (saved, message, stay) => {
          setDirty(false); setNotice(message);
          const category = model.categories.find(c => c.slug === saved.category);
          if (stay || category?.cardinality === 'singleton') setEditor(saved);
          else if (isSkills(category)) { setView('skills'); setSkillGroup(category.templateKey === 'skills' ? saved.data.skillGroup : saved.documentId); setEditor(undefined); }
          else { setView('content'); setFilter(saved.category); setEditor(undefined); }
          try { await reload(message); } catch (e) { setNotice(`${message} Refresh failed: ${e.message}`); }
        }} />}
        {view === 'categories' && <Categories categories={model.categories} items={model.items} requirements={model.requirements} api={api} reload={reload} onDirty={setDirty} onBusy={setBusy} onExpired={() => setExpired(true)} />}
        {view === 'media' && <MediaLibrary media={model.media} api={api} onMedia={onMedia} onDelete={id => setModel(m => ({ ...m, media: m.media.filter(i => i.id !== id) }))} onBusy={setBusy} onExpired={() => setExpired(true)} />}
      </>}
      <footer className="admin-footer"><span>Portfolio Studio <span className="admin-footer-dot" aria-hidden="true">·</span> A home for your next update.</span><span>{preview ? 'Preview workspace' : 'Private workspace'}</span></footer></div>
    </main></div>;
}
