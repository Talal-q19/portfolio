'use client';

import { FiArrowRight, FiFileText } from 'react-icons/fi';
import { sectionName } from '@/utils/admin-presentation.mjs';

export const entryTitle = item => item.data.name || item.data.heading || item.data.title || item.data.qualification || item.data.displayName || 'Section configuration';

export function PublicationBadge({ live }) {
  return <span className={`admin-badge ${live ? 'published' : ''}`}><span aria-hidden="true" className="admin-status-dot" />{live ? 'Published' : 'Draft'}</span>;
}

export default function EntryCards({ items, relatedItems = items, categories, publishedIds, busy, onEdit, onAction, emptyAction }) {
  if (!items.length) return <div className="admin-empty"><FiFileText aria-hidden="true" /><h3>Nothing here yet</h3><p className="admin-muted">Add your first entry, or try a different search or filter.</p>{emptyAction}</div>;
  return <div className="admin-entry-list">{items.map(item => {
    const category = categories.find(c => c.slug === item.category);
    const group = relatedItems.find(i => i.documentId === item.data.skillGroup);
    const summary = item.data.company || item.data.institution || group?.data.name || item.data.description || item.data.paragraph || item.data.contactEmail;
    return <article className="admin-entry-card" key={item.documentId}>
      <span className="admin-entry-monogram" aria-hidden="true">{entryTitle(item).slice(0, 1).toUpperCase()}</span>
      <div className="admin-entry-copy"><div className="admin-entry-meta"><span>{sectionName(category)}</span><PublicationBadge live={publishedIds.has(item.documentId)} /></div><button type="button" disabled={busy} className="admin-entry-title" onClick={() => onEdit(item)}>{entryTitle(item)}</button>{summary && <p>{summary}</p>}</div>
      <div className="admin-entry-controls"><button type="button" disabled={busy} onClick={() => onEdit(item)} aria-label={`Edit ${entryTitle(item)}`}>Edit <FiArrowRight aria-hidden="true" /></button>{onAction && <details className="admin-entry-menu"><summary aria-label={`More actions for ${entryTitle(item)}`}>•••</summary><div>{publishedIds.has(item.documentId) && <button type="button" disabled={busy} onClick={() => onAction(item, 'unpublish')}>Unpublish</button>}<button type="button" className="admin-danger" disabled={busy} onClick={() => onAction(item, 'delete')}>Delete entry</button></div></details>}</div>
    </article>;
  })}</div>;
}
