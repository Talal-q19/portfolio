import contract from './admin-contract.cjs';
import { AdminApiError } from './admin-api.mjs';

// Isolated, ephemeral development data. Never calls the server or stores credentials.
export function createFixtureApi() {
  const requirements = contract.getFormMetadata();
  let sequence = 50;
  let categories = Object.entries(requirements.templates).map(([slug, t], displayOrder) => ({ documentId: `category${displayOrder}`, name: t.name, slug, templateKey: slug, cardinality: t.cardinality, displayOrder, visible: true }));
  const image = { id: 1, name: 'Portfolio image', mime: 'image/jpeg', alternativeText: 'Portfolio portrait', url: '/profilePic.jpeg' };
  const cv = { id: 2, name: 'talal-qasim-cv-2026.pdf', mime: 'application/pdf', url: '/talal-qasim-cv-2026.pdf' };
  let media = [image, cv];
  let items = [
    { documentId: 'hero1', category: 'hero', displayOrder: 0, data: { heading: 'Building thoughtful software.', paragraph: 'A local preview of your portfolio editor. Changes here are temporary.', cv } },
    { documentId: 'settings1', category: 'site-settings', displayOrder: 0, data: { displayName: 'Talal Qasim', profileImage: image, contactEmail: 'hello@example.com', seoTitle: 'Talal Qasim | Portfolio', seoDescription: 'Selected work and experience.' } },
    { documentId: 'experience1', category: 'experience', displayOrder: 0, data: { title: 'Software Engineer', company: 'Example Studio', image, description: 'Designing and building web applications.', startDate: '2024-01', current: true, highlights: [{ text: 'Built a shared content platform.' }] } },
    { documentId: 'group1', category: 'skill-groups', displayOrder: 0, data: { name: 'Backend', eyebrow: 'Reliable foundations', description: 'APIs and services.' } },
  ].map(item => ({ ...item, publishedAt: null }));
  const published = new Map([['hero1', structuredClone(items[0])]]);
  const invalid = fields => { throw new AdminApiError('Content is incomplete or invalid.', 422, fields); };
  async function validate(category, data) {
    try { await contract.validatePayload(category.templateKey, data, { media: id => media.find(m => m.id === (id?.id || id)), skillGroup: id => items.some(i => i.documentId === id && categories.find(c => c.slug === i.category)?.templateKey === 'skill-groups') }); }
    catch (e) { invalid(e.fields); }
  }
  return async (path, { method = 'GET', body } = {}) => {
    const [pathname, search] = path.split('?');
    const [resource, id] = pathname.split('/');
    const query = new URLSearchParams(search);
    if (resource === 'categories') {
      if (method === 'GET') return structuredClone({ categories, requirements });
      const previous = categories.find(c => c.documentId === id);
      const used = previous && items.some(i => i.category === previous.slug);
      if (method === 'DELETE') { if (used) invalid({ category: 'This category still has content.' }); categories = categories.filter(c => c.documentId !== id); return { success: true }; }
      const next = { displayOrder: 0, visible: true, ...previous, ...body };
      try { contract.validateCategory(next); } catch (e) { invalid(e.fields); }
      if (used && (next.templateKey !== previous.templateKey || next.cardinality !== previous.cardinality)) invalid({ templateKey: 'A used template cannot change.' });
      if (categories.some(c => c.slug === next.slug && c.documentId !== id)) invalid({ slug: 'Slug is already in use.' });
      if (id) categories = categories.map(c => c.documentId === id ? next : c);
      else { next.documentId = `category${++sequence}`; categories.push(next); }
      return structuredClone({ category: next });
    }
    if (resource === 'media') {
      if (method === 'GET') { const page = Number(query.get('page') || 1); const pageSize = Number(query.get('pageSize') || 24); return { items: structuredClone(media.slice((page - 1) * pageSize, page * pageSize)), pagination: { page, pageCount: Math.ceil(media.length / pageSize), total: media.length } }; }
      if (method === 'POST') {
        const file = body.get('files');
        const item = { id: ++sequence, name: file.name, mime: file.type, url: URL.createObjectURL(file), alternativeText: '' };
        media.push(item); return { items: [item] };
      }
      // References are schema-aware; never delete a referenced draft or published asset.
      const uses = (fields, data) => Object.entries(fields).some(([key, spec]) => spec.type === 'media' ? Number(data[key]?.id || data[key]) === Number(id) : spec.type === 'list' && (data[key] || []).some(row => uses(requirements.components[spec.component], row)));
      if ([...items, ...published.values()].some(i => uses(requirements.templates[categories.find(c => c.slug === i.category).templateKey].fields, i.data))) invalid({ media: 'This asset is referenced by content.' });
      const removed = media.find(m => m.id === Number(id));
      if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
      media = media.filter(m => m.id !== Number(id)); return { success: true };
    }
    if (resource === 'content') {
      if (method === 'GET' && !id) {
        const source = query.get('status') === 'published' ? [...published.values()] : items;
        return { categories: categories.filter(c => !query.get('category') || c.slug === query.get('category')).map(c => {
          const entries = source.filter(i => i.category === c.slug).sort((a, b) => a.displayOrder - b.displayOrder || a.documentId.localeCompare(b.documentId));
          return { ...c, items: structuredClone(entries), pagination: { total: entries.length, page: 1, pageCount: entries.length ? 1 : 0 } };
        }) };
      }
      let item = items.find(i => i.documentId === id);
      if (method === 'GET') return { item: structuredClone(item) };
      if (method === 'DELETE') { items = items.filter(i => i.documentId !== id); published.delete(id); return { success: true }; }
      if (body.operation === 'unpublish') { published.delete(id); return { item: structuredClone(item) }; }
      if (body.operation === 'publish') {
        await validate(categories.find(c => c.slug === item.category), item.data);
        published.set(id, { ...structuredClone(item), publishedAt: new Date().toISOString() });
        return { item: structuredClone(item) };
      }
      const c = categories.find(c => c.slug === (body.category || item?.category));
      if (!c) invalid({ category: 'Select an existing category.' });
      if (c.cardinality === 'singleton' && items.some(i => i.category === c.slug && i.documentId !== id)) invalid({ category: 'This singleton already has an entry. Edit it instead.' });
      const data = { ...item?.data, ...body.data };
      await validate(c, data);
      const next = { ...item, documentId: id || `entry${++sequence}`, category: c.slug, data, displayOrder: body.displayOrder ?? item?.displayOrder ?? 0, publishedAt: null };
      if (item) items = items.map(i => i.documentId === id ? next : i); else items.push(next);
      return { item: structuredClone(next) };
    }
    throw new AdminApiError('Unknown fixture route.', 404);
  };
}
