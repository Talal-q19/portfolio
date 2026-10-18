// Run after versioned contract changes; generated schemas are checked in.
const fs = require('node:fs');
const path = require('node:path');
const { templates, components } = require('../../content-contract');
const root = path.resolve(__dirname, '..');
function write(file, data) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
}
function attributes(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, spec]) => {
    let attr;
    switch (spec.type) {
      case 'text': attr = { type: spec.max > 500 ? 'text' : 'string', maxLength: spec.max }; break;
      case 'date': case 'url': case 'slug': attr = { type: 'string' }; break;
      case 'email': attr = { type: 'email' }; break;
      case 'boolean': attr = { type: 'boolean' }; break;
      case 'integer': attr = { type: 'integer', min: spec.min, max: spec.max }; break;
      case 'enum': attr = { type: 'enumeration', enum: spec.values }; break;
      case 'list': attr = { type: 'component', repeatable: true, component: `fields.${spec.component}`, min: spec.min }; break;
      case 'media': attr = { type: 'media', multiple: false, allowedTypes: spec.kind === 'image' ? ['images'] : ['files'] }; break;
      case 'skillGroup': attr = { type: 'relation', relation: 'manyToOne', target: 'api::content.content' }; break;
      default: throw new Error(`Unsupported field ${spec.type}`);
    }
    if (spec.required) attr.required = true;
    return [key, attr];
  }));
}
for (const [name, fields] of Object.entries(components)) {
  write(`src/components/fields/${name}.json`, { collectionName: `pf_fields_${name.replaceAll('-', '_')}`, info: { displayName: name }, attributes: attributes(fields) });
}
for (const [name, template] of Object.entries(templates)) {
  write(`src/components/payloads/${name}.json`, { collectionName: `pf_payload_${name.replaceAll('-', '_')}`, info: { displayName: template.name }, attributes: attributes(template.fields) });
}
write('src/api/category/content-types/category/schema.json', {
  kind: 'collectionType', collectionName: 'portfolio_categories',
  info: { singularName: 'category', pluralName: 'categories', displayName: 'Category' },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: 'string', required: true }, slug: { type: 'string', unique: true, required: true },
    templateKey: { type: 'enumeration', enum: Object.keys(templates), required: true },
    cardinality: { type: 'enumeration', enum: ['singleton', 'multiple'], required: true },
    displayOrder: { type: 'integer', default: 0, required: true }, visible: { type: 'boolean', default: true, required: true },
    content: { type: 'relation', relation: 'oneToMany', target: 'api::content.content', mappedBy: 'category', pluginOptions: { 'content-manager': { visible: false } } },
  },
});
write('src/api/content/content-types/content/schema.json', {
  kind: 'collectionType', collectionName: 'portfolio_contents',
  info: { singularName: 'content', pluralName: 'contents', displayName: 'Content' },
  options: { draftAndPublish: true },
  attributes: {
    category: { type: 'relation', relation: 'manyToOne', target: 'api::category.category', inversedBy: 'content', required: true },
    slug: { type: 'string' }, displayOrder: { type: 'integer', required: true, default: 0 },
    migrationKey: { type: 'string', private: true },
    payload: { type: 'dynamiczone', required: true, min: 1, max: 1, components: Object.keys(templates).map(key => `payloads.${key}`) },
  },
});
for (const name of ['category', 'content']) {
  const uid = `api::${name}.${name}`;
  for (const [folder, factory] of [['controllers', 'createCoreController'], ['services', 'createCoreService'], ['routes', 'createCoreRouter']]) {
    const target = path.join(root, `src/api/${name}/${folder}/${name}.js`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Content API permissions remain deny-by-default; built-in CMS admin uses its own RBAC.
    fs.writeFileSync(target, `const { ${factory} } = require('@strapi/strapi').factories;\nmodule.exports = ${factory}('${uid}');\n`);
  }
}
console.log('Generated typed portfolio schemas.');
