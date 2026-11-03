'use client';

import { useEffect, useState } from 'react';
import { mediaUrl } from '@/utils/media-url.mjs';
import { uploadMedia } from '@/utils/upload-media.mjs';

export default function MediaLibrary({ media, api, onMedia, onDelete, onBusy, onExpired }) {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { onBusy(pending); return () => onBusy(false); }, [pending, onBusy]);
  const pages = Math.max(1, Math.ceil(media.length / 12));
  const current = Math.min(page, pages);
  async function upload(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)) { setMessage('Choose PNG, JPEG, GIF, WebP or PDF, up to 8 MiB.'); return; }
    setPending(true); setMessage('Uploading…');
    try { onMedia((await uploadMedia(api, file)).items); setMessage('Upload complete. This asset is available to content forms.'); }
    catch (e) { setMessage(e.message); if (e.status === 401) onExpired(); }
    finally { setPending(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.name}”? Referenced media cannot be deleted.`)) return;
    setPending(true);
    try { await api(`media/${item.id}`, { method: 'DELETE' }); onDelete(item.id); setMessage('Media deleted.'); }
    catch (e) { setMessage(`${e.message} ${Object.values(e.fields || {}).join(' ')}`); if (e.status === 401) onExpired(); }
    finally { setPending(false); }
  }
  return <section className="admin-panel" aria-busy={pending}><div className="admin-heading"><div><p className="admin-eyebrow">ASSETS</p><h2>Media library</h2></div><span className="admin-badge">{media.length} assets</span></div>
    <div className="admin-upload-box"><label htmlFor="library-upload">Upload an image or PDF</label><p className="admin-muted">PNG, JPEG, GIF, WebP or PDF · Maximum 8 MiB. Uploads remain available if a content save fails.</p><input id="library-upload" type="file" disabled={pending} accept="image/png,image/jpeg,image/gif,image/webp,application/pdf" onChange={e => { const file = e.target.files[0]; e.target.value = ''; upload(file); }} /></div>
    {message && <p role="status" className="admin-note">{message}</p>}
    <div className="admin-media-grid">{media.slice((current - 1) * 12, current * 12).map(item => <article className="admin-media-card" key={item.id}>
      {item.mime?.startsWith('image/') ? /* Dynamic CMS and local blob image previews. */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(item.url)} alt={item.alternativeText || item.name} /> : <div className="admin-file-icon">PDF</div>}
      <div><h3>{item.name}</h3><p className="admin-muted">{item.mime}{item.size ? ` · ${Math.round(item.size)} KB` : ''}</p><button disabled={pending} onClick={() => remove(item)}>Delete<span className="sr-only"> {item.name}</span></button></div>
    </article>)}</div>
    {!media.length && <p className="admin-empty">Your library is empty. Upload an asset to get started.</p>}
    <div className="admin-pagination"><button disabled={pending || current === 1} onClick={() => setPage(current - 1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={pending || current === pages} onClick={() => setPage(current + 1)}>Next</button></div>
  </section>;
}
