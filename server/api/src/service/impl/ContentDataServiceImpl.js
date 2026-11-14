const { ContentDataService } = require('../ContentDataService');
const { ConvexError } = require('convex/values');
const contract = require('../../../../content-contract');
const apiContract = require('../../../../content-contract/api');
const { find } = require('../../repository/ConvexDatabaseRepository');
const { plain } = require('../../dtos/response/RecordResponse');
const { ContentResponse } = require('../../dtos/response/ContentResponse');
const { MediaResponse } = require('../../dtos/response/MediaResponse');

const { validatePayload, validateCategory, getFormMetadata, templates, components, pruneUnusedFields } = contract;
const { queryOptions, contentBody, categoryBody } = apiContract;
const fail = (field, message, status = 422) => { throw new ConvexError({ status, message, fields: { [field]: message } }); };
const order = (a, b) => a.displayOrder - b.displayOrder || a.documentId.localeCompare(b.documentId);
const allowedMime = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
async function nextId(repositories, key) {
  const row = await find(repositories, 'counters', 'key', key);
  const value = (row?.value || 0) + 1;
  if (row) await repositories.database.patch(row._id, { value }); else await repositories.database.insert('counters', { key, value });
  return value;
}
async function mediaView(repositories, row) {
  return MediaResponse.from(row, repositories.storage);
}
async function payloadView(repositories, fields, data) {
  const out = {};
  for (const [key, spec] of Object.entries(fields)) {
    const value = data?.[key];
    if (value === undefined) continue;
    if (spec.type === 'media') out[key] = value ? await mediaView(repositories, await find(repositories, 'media', 'id', value?.id || value)) : null;
    else if (spec.type === 'list') out[key] = await Promise.all((value || []).map(row => payloadView(repositories, components[spec.component], row)));
    else out[key] = value;
  }
  return out;
}
// Resolve legacy values within the same snapshot; draft edits must never leak publicly.
function entryData(row, category, all, categories, published = false) {
  const snapshot = entry => published ? entry?.published : entry?.draft;
  const data = { ...snapshot(row)?.data };
  const templateKey = category.templateKey;
  if (templateKey === 'site-settings') {
    for (const key of ['location', 'designation', 'aboutHeading', 'aboutText']) delete data[key];
  }
  if (templateKey === 'hero') {
    const byTemplate = key => all.filter(entry => categories.find(c => c.slug === entry.category)?.templateKey === key).sort(order).map(entry => snapshot(entry)?.data).filter(Boolean);
    const settings = byTemplate('site-settings')[0];
    // An explicit null removes the CV; only missing fields inherit the old settings file.
    if (!Object.hasOwn(data, 'cv') && settings?.cv != null) data.cv = settings.cv;
    const current = byTemplate('experience').filter(entry => entry.current).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    // Explicit empty strings clear a field; only absent fields receive legacy defaults.
    if (data.location == null && settings?.location != null) data.location = settings.location;
    const designation = current ? `${current.title} at ${current.company}` : settings?.designation;
    if (data.designation == null && designation != null) data.designation = designation;
  }
  return pruneUnusedFields(templateKey, data);
}
async function entryView(repositories, row, category, published = false, all = [], categories = []) {
  return ContentResponse.entry(row, await payloadView(repositories, templates[category.templateKey].fields, entryData(row, category, all, categories, published)), published);
}
function references(fields, data, kind, value) {
  return Object.entries(fields).some(([key, spec]) => spec.type === kind && (data?.[key]?.id || data?.[key]) === value || spec.type === 'list' && (data?.[key] || []).some(row => references(components[spec.component], row, kind, value)));
}
async function validateEntry(repositories, row, category, all, categories, publishing = false) {
  if (!category) fail('category', 'Category does not exist.');
  if (!Number.isInteger(row.draft.displayOrder) || row.draft.displayOrder < 0) fail('displayOrder', 'Use a nonnegative integer.');
  if (category.cardinality === 'singleton' && all.some(r => r.category === category.slug && r.documentId !== row.documentId)) fail('category', 'This singleton category already has an entry.');
  if (category.templateKey === 'projects' && all.some(r => r.documentId !== row.documentId && [r.draft?.data.slug, r.published?.data.slug].includes(row.draft.data.slug))) fail('data.slug', 'Project slug already exists.');
  await validatePayload(category.templateKey, entryData(row, category, all, categories), {
    media: async value => mediaView(repositories, await find(repositories, 'media', 'id', value?.id || value)),
    skillGroup: async value => {
      const group = all.find(r => r.documentId === value);
      return !!group && categories.find(c => c.slug === group.category)?.templateKey === 'skill-groups' && (!publishing || !!group.published);
    },
  });
}
async function executeContent(repositories, { path, method = 'GET', query = {}, body, verifiedMime }) {
  const parts = path.split('/');
  const admin = parts[0] === 'admin';
  const [resource, id] = admin ? parts.slice(1) : parts;
  const categories = await repositories.database.all('categories');
  const all = await repositories.database.all('content');
  const categoryFor = slug => categories.find(c => c.slug === slug);
  if (method === 'GET' && (resource === 'read' && !admin || resource === 'content' && admin && !id)) {
    const q = queryOptions(query, admin);
    if (q.category && !categoryFor(q.category)) fail('category', 'Category does not exist.');
    const groups = [];
    for (const c of categories.filter(c => (!q.category || c.slug === q.category) && (admin || c.visible)).sort(order)) {
      const published = !admin || q.status === 'published';
      let rows = all.filter(r => r.category === c.slug && (!published || r.published) && (!q.slug || (published ? r.published : r.draft).data.slug === q.slug));
      if (!admin && c.templateKey === 'skills') rows = rows.filter(r => {
        const group = all.find(g => g.documentId === r.published.data.skillGroup);
        return group?.published && categoryFor(group.category)?.visible;
      });
      rows.sort((a, b) => order({ ...a, displayOrder: (published ? a.published : a.draft).displayOrder }, { ...b, displayOrder: (published ? b.published : b.draft).displayOrder }));
      const total = rows.length;
      if (q.paged) rows = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize);
      groups.push({ ...plain(c), items: await Promise.all(rows.map(r => entryView(repositories, r, c, published, all, categories))), pagination: { page: q.paged ? q.page : 1, pageSize: q.paged ? q.pageSize : total, total, pageCount: q.paged ? Math.ceil(total / q.pageSize) : total ? 1 : 0 } });
    }
    return { categories: groups };
  }
  if (!admin) fail('path', 'Not found.', 404);
  if (resource === 'categories') {
    const row = categories.find(c => c.documentId === id);
    if (method === 'GET') return id ? { category: plain(row) || fail('category', 'Category not found.', 404) } : { categories: categories.sort(order).map(plain), requirements: getFormMetadata() };
    if (method === 'DELETE') {
      if (!row) fail('category', 'Category not found.', 404);
      if (all.some(r => r.category === row.slug)) fail('category', 'Cannot delete a category containing content.');
      await repositories.database.delete(row._id); return { success: true };
    }
    if (!['POST', 'PATCH'].includes(method)) fail('method', 'Not found.', 404);
    categoryBody(body);
    if (method === 'PATCH' && !row) fail('category', 'Category not found.', 404);
    const data = { displayOrder: 0, visible: true, ...(row ? plain(row) : { documentId: `c${await nextId(repositories, 'category')}` }), ...body };
    validateCategory(data);
    if (row && row.slug !== data.slug) fail('slug', 'Category slugs cannot change.');
    if (categories.some(c => c.slug === data.slug && c.documentId !== data.documentId)) fail('slug', 'Category slug already exists.');
    if (row && all.some(r => r.category === row.slug) && (row.templateKey !== data.templateKey || row.cardinality !== data.cardinality)) fail('templateKey', 'Template and cardinality cannot change while content exists.');
    if (row) await repositories.database.replace(row._id, data); else await repositories.database.insert('categories', data);
    return { category: data };
  }
  if (resource === 'content') {
    const row = all.find(r => r.documentId === id);
    if (method === 'GET') return { item: row ? await entryView(repositories, row, categoryFor(row.category), false, all, categories) : fail('content', 'Content not found.', 404) };
    if (id && !row) fail('content', 'Content not found.', 404);
    const isGroup = row && categoryFor(row.category)?.templateKey === 'skill-groups';
    const referring = publishedOnly => all.some(r => r.documentId !== id && categoryFor(r.category)?.templateKey === 'skills' && (publishedOnly ? r.published?.data.skillGroup === id : r.draft.data.skillGroup === id || r.published?.data.skillGroup === id));
    if (method === 'DELETE') {
      if (!row) fail('content', 'Content not found.', 404);
      if (isGroup && referring(false)) fail('category', 'This group is referenced by skills.');
      await repositories.database.delete(row._id); return { success: true };
    }
    if (!['POST', 'PATCH'].includes(method)) fail('method', 'Not found.', 404);
    contentBody(body, method === 'PATCH');
    let candidate;
    if (body.operation === 'unpublish') {
      if (isGroup && referring(true)) fail('category', 'Unpublish referencing skills first.');
      candidate = { ...plain(row), published: null };
    } else {
      candidate = row ? plain(row) : { documentId: `e${await nextId(repositories, 'content')}`, published: null };
      candidate.category = body.category || row?.category;
      candidate.draft = { data: pruneUnusedFields(categoryFor(candidate.category)?.templateKey, { ...(row ? entryData(row, categoryFor(row.category), all, categories) : {}), ...body.data }), displayOrder: body.displayOrder ?? row?.draft.displayOrder ?? 0 };
      // Retain hidden legacy source values for heroes not yet saved in the new editor.
      if (categoryFor(candidate.category)?.templateKey === 'site-settings') {
        for (const key of ['location', 'designation', 'aboutHeading', 'aboutText']) {
          if (row?.draft.data[key] !== undefined) candidate.draft.data[key] = row.draft.data[key];
        }
      }
      if (row?.published && candidate.category !== row.category) fail('category', 'Unpublish before changing category.');
      if (isGroup && candidate.category !== row.category && referring(false)) fail('category', 'This group is referenced by skills.');
      await validateEntry(repositories, candidate, categoryFor(candidate.category), all, categories, body.operation === 'publish');
      if (body.operation === 'publish') candidate.published = { ...candidate.draft, publishedAt: new Date().toISOString() };
    }
    if (row) await repositories.database.replace(row._id, candidate); else await repositories.database.insert('content', candidate);
    return { item: await entryView(repositories, candidate, categoryFor(candidate.category), false, all, categories) };
  }
  if (resource === 'media') {
    if (id === 'upload-ticket' && method === 'POST') {
      if (!body || typeof body.name !== 'string' || body.name.length > 255 || !allowedMime.includes(body.mime) || !Number.isInteger(body.size) || body.size < 1 || body.size > 8 * 1024 * 1024) fail('media', 'Choose an allowed file up to 8 MiB.');
      const token = `u${await nextId(repositories, 'upload')}`;
      await repositories.database.insert('uploadTickets', { token, name: body.name, mime: body.mime, size: body.size, expiresAt: Date.now() + 3600000 });
      return { token, uploadUrl: await repositories.storage.generateUploadUrl() };
    }
    if (id === 'complete-upload' && method === 'POST') {
      const ticket = await find(repositories, 'uploadTickets', 'token', body.token);
      if (!ticket || ticket.expiresAt <= Date.now()) fail('media', 'Upload ticket expired.');
      if (ticket.mediaId) {
        if (ticket.storageId !== body.storageId) fail('media', 'Upload already completed.');
        return { items: [await mediaView(repositories, await find(repositories, 'media', 'id', ticket.mediaId))] };
      }
      const file = await repositories.database.fileMetadata(body.storageId);
      const extensions = { 'image/png': ['png'], 'image/jpeg': ['jpg', 'jpeg'], 'image/gif': ['gif'], 'image/webp': ['webp'], 'application/pdf': ['pdf'] };
      if (!file || verifiedMime !== ticket.mime || !extensions[ticket.mime]?.includes(ticket.name.split('.').at(-1).toLowerCase()) || file.size !== ticket.size || file.contentType !== ticket.mime || file._creationTime < ticket._creationTime || await find(repositories, 'media', 'storageId', body.storageId)) fail('media', 'Uploaded file does not match ticket.');
      const mediaId = await nextId(repositories, 'media');
      const data = { id: mediaId, storageId: body.storageId, name: ticket.name, alternativeText: '', mime: ticket.mime, size: file.size / 1024, checksum: file.sha256 };
      await repositories.database.insert('media', data);
      await repositories.database.patch(ticket._id, { mediaId, storageId: body.storageId });
      return { items: [await mediaView(repositories, data)] };
    }
    const row = id ? await find(repositories, 'media', 'id', Number(id)) : null;
    if (method === 'GET') {
      if (id) return { item: await mediaView(repositories, row) || fail('media', 'Media not found.', 404) };
      const q = queryOptions({ category: 'media', ...query });
      const rows = (await repositories.database.all('media')).sort((a, b) => a.id - b.id);
      return { items: await Promise.all(rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map(r => mediaView(repositories, r))), pagination: { page: q.page, pageSize: q.pageSize, total: rows.length } };
    }
    if (method === 'DELETE' && row) {
      if (all.some(r => [r.draft, r.published].some(v => v && references(templates[categoryFor(r.category).templateKey].fields, v.data, 'media', row.id)))) fail('media', 'This file is referenced by content.');
      await repositories.storage.delete(row.storageId); await repositories.database.delete(row._id); return { success: true };
    }
  }
  fail('path', 'Not found.', 404);
}
async function contentOperation(repositories, args) {
  try { return await executeContent(repositories, args); }
  catch (error) {
    if (error.fields) throw new ConvexError({ status: 422, message: error.message, fields: error.fields });
    throw error;
  }
}

class ContentDataServiceImpl extends ContentDataService {
  constructor(repositories) { super(); this.repositories = repositories; }
  execute(args) { return contentOperation(this.repositories, args); }
}
module.exports = { ContentDataServiceImpl, allowedMime };
