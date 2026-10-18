const { templates, components, ContentValidationError } = require('./index');
const invalid = (field, message) => { throw new ContentValidationError({ [field]: message }); };
function shape(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('body', 'Expected an object.');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) invalid(key, 'Field is not allowed.');
}
function queryOptions(query = {}, admin = false) {
  shape(query, ['category', 'slug', 'page', 'pageSize', ...(admin ? ['status'] : [])]);
  for (const key of ['category', 'slug']) if (query[key] !== undefined && (typeof query[key] !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query[key]) || query[key].length > 200)) invalid(key, 'Use a valid slug.');
  const number = (key, fallback, max) => {
    const v = query[key] ?? fallback;
    if (!/^\d+$/.test(String(v)) || Number(v) < 1 || Number(v) > max) invalid(key, `Use an integer from 1 to ${max}.`);
    return Number(v);
  };
  if ((query.page !== undefined || query.pageSize !== undefined) && !query.category) invalid('category', 'Select a category when paginating.');
  if (query.status && !['draft', 'published'].includes(query.status)) invalid('status', 'Choose draft or published.');
  return { ...query, page: number('page', 1, 100000), pageSize: number('pageSize', 25, 100), paged: query.page !== undefined || query.pageSize !== undefined };
}
function contentBody(body, updating = false) {
  shape(body, updating ? ['operation', 'category', 'data', 'displayOrder'] : ['category', 'data', 'displayOrder']);
  if (updating && !['update', 'publish', 'unpublish'].includes(body.operation)) invalid('operation', 'Choose update, publish or unpublish.');
  if (updating && body.operation !== 'update') { shape(body, ['operation']); return; }
  if (!updating && (typeof body.category !== 'string' || !body.category)) invalid('category', 'A category slug is required.');
  if (body.category !== undefined && (typeof body.category !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.category))) invalid('category', 'Use a category slug.');
  if (!updating || body.data !== undefined) shape(body.data, Object.keys(body.data || {}));
  if (body.data && ['id', '__component'].some(key => Object.hasOwn(body.data, key))) invalid('data', 'Component identifiers are managed by the server.');
  if (body.displayOrder !== undefined && (!Number.isInteger(body.displayOrder) || body.displayOrder < 0)) invalid('displayOrder', 'Use a nonnegative integer.');
}
function categoryBody(body) { shape(body, ['name', 'slug', 'templateKey', 'cardinality', 'displayOrder', 'visible']); }
function mediaView(file, base = '') {
  if (!file) return null;
  return { id: file.id, name: file.name, alternativeText: file.alternativeText || '', mime: file.mime, width: file.width, height: file.height, size: file.size, url: file.url?.startsWith('/') ? `${base}${file.url}` : file.url };
}
function payloadView(templateKey, value, base = '') {
  function project(fields, input) {
    const result = {};
    for (const [key, spec] of Object.entries(fields)) {
      const v = input?.[key];
      if (v === undefined) continue;
      if (spec.type === 'media') result[key] = mediaView(v, base);
      else if (spec.type === 'skillGroup') result[key] = v?.documentId || null;
      else if (spec.type === 'list') result[key] = (v || []).map(item => project(components[spec.component], item));
      else result[key] = v;
    }
    return result;
  }
  return project(templates[templateKey].fields, value);
}
function categoryView(c) { return Object.fromEntries(['documentId', 'name', 'slug', 'templateKey', 'cardinality', 'displayOrder', 'visible'].map(key => [key, c[key]])); }
function entryView(entry, base = '') {
  return { documentId: entry.documentId, category: entry.category.slug, displayOrder: entry.displayOrder, slug: entry.slug || null, publishedAt: entry.publishedAt || null, data: payloadView(entry.category.templateKey, entry.payload[0], base) };
}
module.exports = { invalid, shape, queryOptions, contentBody, categoryBody, mediaView, payloadView, categoryView, entryView };
