const fs = require('node:fs');
const path = require('node:path');
const { templates, components } = require('@portfolio/content-contract');
function fieldsSchema(fields) {
  const property = spec => {
    if (spec.type === 'list') return { type: 'array', minItems: spec.min, maxItems: 200, items: fieldsSchema(components[spec.component]) };
    if (spec.type === 'media') return { description: `Existing upload ID (${spec.kind}). Pending/missing uploads are rejected.`, oneOf: [{ type: 'integer', minimum: 1 }, { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } }] };
    if (spec.type === 'boolean') return { type: 'boolean' };
    if (spec.type === 'integer') return { type: 'integer', minimum: spec.min, maximum: spec.max };
    if (spec.type === 'enum') return { type: 'string', enum: spec.values };
    return { type: 'string', ...(spec.max ? { maxLength: spec.max } : {}), ...(spec.required ? { minLength: 1 } : {}), ...(spec.type === 'email' ? { format: 'email' } : {}), ...(spec.type === 'date' ? { pattern: '^\\d{4}-\\d{2}(-\\d{2})?$' } : {}), ...(spec.type === 'skillGroup' ? { description: 'Stable documentId of a Skill Groups entry.' } : {}) };
  };
  return { type: 'object', additionalProperties: false, properties: Object.fromEntries(Object.entries(fields).map(([name, spec]) => [name, property(spec)])), required: Object.entries(fields).filter(([, spec]) => spec.required || spec.type === 'list' && spec.min > 0).map(([name]) => name) };
}
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const json = schema => ({ 'application/json': { schema } });
const errors = { '401': { description: 'Administrator session required (all custom-admin access is denied until phase 5).' }, '422': { description: 'Invalid final document; no content write occurred.', content: json(ref('ValidationError')) }, '503': { description: 'CMS unavailable or read credential not configured.' } };
const operation = (summary, schema, { body, admin = true, parameters = [] } = {}) => ({ summary, security: admin ? [{ adminSession: [] }] : [], parameters, ...(body ? { requestBody: { required: true, content: json(body) } } : {}), responses: { '200': { description: 'Successful response', content: json(schema) }, ...errors } });
const query = (name, type = 'string', extra = {}) => ({ name, in: 'query', schema: { type, ...extra } });
const paging = [query('page', 'integer', { minimum: 1 }), query('pageSize', 'integer', { minimum: 1, maximum: 100 })];
const filter = [query('category'), query('slug'), ...paging];
const id = name => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const object = (properties, required = []) => ({ type: 'object', additionalProperties: false, properties, required });
const schemas = {
  ...Object.fromEntries(Object.entries(templates).map(([key, template]) => [key, { ...fieldsSchema(template.fields), description: `${template.name}, ${template.cardinality}. Required text is trimmed/non-empty. ${key === 'experience' ? 'current=true requires an empty endDate; current=false requires endDate >= startDate.' : key === 'education' ? 'Provide completionYear OR a complete ordered date range.' : ''}` }])),
  Category: object({ documentId: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' }, templateKey: { type: 'string', enum: Object.keys(templates) }, cardinality: { enum: ['singleton','multiple'] }, displayOrder: { type: 'integer', minimum: 0 }, visible: { type: 'boolean' } }),
  CategoryInput: object({ name: { type: 'string' }, slug: { type: 'string' }, templateKey: { enum: Object.keys(templates) }, cardinality: { enum: ['singleton','multiple'] }, displayOrder: { type: 'integer', minimum: 0 }, visible: { type: 'boolean' } }, ['name','slug','templateKey','cardinality']),
  Payload: { oneOf: Object.keys(templates).map(ref), description: 'Shape is selected by resolved category.templateKey; media and skill-group references must exist.' },
  Entry: object({ documentId: { type: 'string' }, category: { type: 'string' }, displayOrder: { type: 'integer' }, slug: { type: ['string','null'] }, publishedAt: { type: ['string','null'] }, data: { type: 'object', description: 'Approved template fields; media normalized to id/name/alternativeText/mime/width/height/size/url; skillGroup is a stable documentId.' } }),
  Pagination: object({ page: { type: 'integer' }, pageSize: { type: 'integer' }, total: { type: 'integer' }, pageCount: { type: 'integer' } }),
  Envelope: object({ categories: { type: 'array', items: { allOf: [ref('Category'), { type: 'object', properties: { items: { type: 'array', items: ref('Entry') }, pagination: ref('Pagination') } }] } } }),
  ValidationError: { type: 'object', properties: { success: { const: false }, message: { type: 'string' }, fields: { type: 'object', additionalProperties: { type: 'string' }, examples: [{ 'data.image': 'An existing image is required.' }] } } },
  CreateContent: object({ category: { type: 'string' }, data: ref('Payload'), displayOrder: { type: 'integer', minimum: 0 } }, ['category','data']),
  ContentOperation: { oneOf: [object({ operation: { const: 'update' }, category: { type: 'string' }, data: { type: 'object', description: 'Partial template fields. The merged persisted document is validated.' }, displayOrder: { type: 'integer', minimum: 0 } }, ['operation']), object({ operation: { enum: ['publish','unpublish'] } }, ['operation'])] },
};
schemas.Envelope.properties.categories.items = { ...schemas.Category, properties: { ...schemas.Category.properties, items: { type: 'array', items: ref('Entry') }, pagination: ref('Pagination') } };
const categoryResult = object({ category: ref('Category') });
const entryResult = object({ item: ref('Entry') });
const paths = {
  '/api/content': { get: operation('Published, visible groups. Without explicit pagination, all entries are returned. Unknown category: 422; known empty category: items=[]. Singleton groups contain at most one item.', ref('Envelope'), { admin: false, parameters: filter }) },
  '/api/admin/categories': { get: operation('Categories and browser-safe requirements/templates/components metadata', { type: 'object' }), post: operation('Create a category using a registered template', categoryResult, { body: ref('CategoryInput') }) },
  '/api/admin/categories/{categoryId}': { patch: operation('Update category metadata; slug stable; template/cardinality immutable while used', categoryResult, { parameters: [id('categoryId')], body: { type: 'object', description: 'Partial CategoryInput fields only.' } }), delete: operation('Delete an unused category', { type: 'object' }, { parameters: [id('categoryId')] }) },
  '/api/admin/content': { get: operation('List draft content by default; status=published supported', ref('Envelope'), { parameters: [...filter, query('status', 'string', { enum: ['draft','published'] })] }), post: { ...operation('Create a complete private draft', entryResult, { body: ref('CreateContent') }), responses: { '201': { description: 'Created draft; body {item: Entry}.' }, ...errors } } },
  '/api/admin/content/{documentId}': { get: operation('Read draft entry; body {item: Entry}', entryResult, { parameters: [id('documentId')] }), patch: operation('Update a validated draft, publish via Document Service, or unpublish', entryResult, { body: ref('ContentOperation'), parameters: [id('documentId')] }), delete: operation('Delete draft and published versions; referenced skill groups are protected', { type: 'object' }, { parameters: [id('documentId')] }) },
  '/api/admin/media': { get: operation('List safe media metadata; items and pagination envelope', { type: 'object' }, { parameters: paging }), post: { summary: 'Upload one files field: PNG/JPEG/GIF/WebP/PDF, maximum 8 MiB, verified signature/type. No extra fields or replacement.', security: [{ adminSession: [] }], requestBody: { required: true, content: { 'multipart/form-data': { schema: object({ files: { type: 'string', format: 'binary' } }, ['files']) } } }, responses: { '201': { description: 'Uploaded items with safe metadata and absolute URLs.' }, ...errors } } },
  '/api/admin/media/{id}': { delete: operation('Delete media only after checking all draft and published content references', { type: 'object' }, { parameters: [id('id')] }) },
};
const spec = { openapi: '3.1.0', info: { title: 'Portfolio API', version: '0.3.0', description: 'All browser routes live in Express. Admin cookie authentication ships in phase 5; no public editor bypass. All content responses use Cache-Control: no-store. See phase-3-api.md for setup, response wrappers, request examples and freshness.' }, servers: [{ url: 'http://localhost:4000' }], paths, components: { securitySchemes: { adminSession: { type: 'apiKey', in: 'cookie', name: 'portfolio_session', description: 'Reserved phase-5 session scheme; currently every production admin request is denied.' } }, schemas } };
fs.writeFileSync(path.resolve(__dirname, '../../../docs/openapi.json'), JSON.stringify(spec, null, 2) + '\n');
console.log('Generated docs/openapi.json');
