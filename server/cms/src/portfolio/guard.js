const { errors } = require('@strapi/utils');
const { validatePayload, validateCategory, ContentValidationError } = require('@portfolio/content-contract');
const CATEGORY = 'api::category.category';
const CONTENT = 'api::content.content';
const LOCKS = 'portfolio_write_locks';
const mutationActions = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft', 'clone']);

function fail(field, message) { throw new ContentValidationError({ [field]: message }); }

// Strapi transaction context propagates to Document Service / Query Engine.
// A single database row serializes portfolio mutations across processes as well
// as SQLite connections. Counts and writes happen inside the same transaction.
async function withWriteLock(strapi, callback) {
  return strapi.db.transaction(async ({ trx }) => {
    await trx(LOCKS).where({ id: 1 }).increment('version', 1);
    return callback();
  });
}

function reference(value, previous) {
  if (value === undefined) return previous;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length === 1 ? reference(value[0]) : null;
  if (Object.hasOwn(value, 'set')) return reference(value.set);
  if (value.connect?.length) return reference(value.connect);
  if (value.disconnect?.length) return null;
  return value.documentId || value.id || previous;
}
async function categoryFor(strapi, value, previous) {
  const ref = reference(value, previous);
  if (!ref) fail('category', 'A category is required.');
  const category = await strapi.db.query(CATEGORY).findOne({ where: typeof ref === 'number' ? { id: ref } : { documentId: ref } });
  if (!category) fail('category', 'Category does not exist.');
  return category;
}
function population(strapi, uid, seen = new Set()) {
  if (seen.has(uid)) return {};
  const model = strapi.components[uid];
  if (!model) return {};
  const result = {};
  for (const [name, attribute] of Object.entries(model.attributes)) {
    if (attribute.type === 'media') result[name] = true;
    if (attribute.type === 'relation') result[name] = { populate: { category: true } };
    if (attribute.type === 'component') result[name] = { populate: population(strapi, attribute.component, new Set([...seen, uid])) };
  }
  return result;
}
function contentPopulate(strapi) {
  const on = {};
  for (const uid of strapi.contentTypes[CONTENT].attributes.payload.components) on[uid] = { populate: population(strapi, uid) };
  return { category: true, payload: { on } };
}
function resolvers(strapi, publishing = false) {
  return {
    media: async value => {
      const ref = value && typeof value === 'object' && Number.isInteger(value.id) ? value.id : reference(value);
      if (typeof ref !== 'number') return null;
      return strapi.db.query('plugin::upload.file').findOne({ where: { id: ref } });
    },
    skillGroup: async value => {
      const ref = reference(value);
      if (!ref) return false;
      const group = await strapi.db.query(CONTENT).findOne({
        where: { ...(typeof ref === 'number' ? { id: ref } : { documentId: ref }), publishedAt: null },
        populate: { category: true },
      });
      if (group?.category?.templateKey !== 'skill-groups') return false;
      if (!publishing) return true;
      return Boolean(await strapi.db.query(CONTENT).findOne({ where: { documentId: group.documentId, publishedAt: { $notNull: true } } }));
    },
  };
}
async function validateEntry(strapi, data, previous, documentId, publishing = false) {
  const category = await categoryFor(strapi, data.category, previous?.category?.documentId);
  const payload = data.payload === undefined ? previous?.payload : data.payload;
  if (!Array.isArray(payload) || payload.length !== 1) fail('data', 'Exactly one typed payload component is required.');
  const component = payload[0];
  if (component?.__component !== `payloads.${category.templateKey}`) fail('data', 'Payload does not match the category template.');
  // Component updates may omit unchanged fields; validate the final merged component.
  const candidate = component.id && previous?.payload?.[0]?.id === component.id
    ? { ...previous.payload[0], ...component } : component;
  if (category.templateKey === 'skills' && candidate.skillGroup && typeof candidate.skillGroup === 'object') {
    candidate.skillGroup = reference(candidate.skillGroup, previous?.payload?.[0]?.skillGroup?.documentId);
  }
  await validatePayload(category.templateKey, candidate, resolvers(strapi, publishing));
  const order = data.displayOrder ?? previous?.displayOrder ?? 0;
  if (!Number.isInteger(order) || order < 0) fail('displayOrder', 'Display order must be a nonnegative integer.');
  const entries = await strapi.db.query(CONTENT).findMany({ where: { category: { id: category.id } }, select: ['documentId'] });
  if (category.cardinality === 'singleton' && entries.some(entry => entry.documentId !== documentId)) fail('category', 'This singleton category already has an entry.');
  if (category.templateKey === 'projects') {
    const slug = candidate.slug;
    const duplicates = await strapi.db.query(CONTENT).findMany({ where: { slug }, select: ['documentId'] });
    if (duplicates.some(entry => entry.documentId !== documentId)) fail('data.slug', 'Project slug already exists.');
    data.slug = slug;
  } else {
    if (data.slug) fail('slug', 'Only projects have a slug.');
    data.slug = null;
  }
  return category;
}
async function assertUnreferencedGroup(strapi, documentId) {
  const skills = await strapi.db.query('payloads.skills').findMany({ where: { skillGroup: { documentId } }, select: ['id'] });
  if (skills.length) fail('category', 'This Skill Groups entry is referenced by skills.');
}
function asStrapiError(error) {
  if (error instanceof ContentValidationError) return new errors.ValidationError(error.message, { fields: error.fields });
  return error;
}
function createGuard(strapi) {
  return async (context, next) => {
    if (![CATEGORY, CONTENT].includes(context.uid) || !mutationActions.has(context.action)) return next();
    try {
      return await withWriteLock(strapi, async () => {
        const { params, action, uid } = context;
        if (action === 'clone') fail('data', 'Create a validated entry instead of cloning.');
        const previous = params.documentId ? await strapi.db.query(uid).findOne({
          where: { documentId: params.documentId, ...(uid === CONTENT ? { publishedAt: null } : {}) },
          ...(uid === CONTENT ? { populate: contentPopulate(strapi) } : {}),
        }) : null;
        if (uid === CATEGORY) {
          if (params.data?.content !== undefined) {
            const relation = params.data.content;
            const noChange = relation && !Array.isArray(relation) && typeof relation === 'object'
              && Object.keys(relation).every(key => ['connect', 'disconnect'].includes(key))
              && Object.values(relation).every(value => Array.isArray(value) && value.length === 0);
            if (!noChange) fail('content', 'Reassign entries through Content so their destination is fully validated.');
          }
          const used = previous && await strapi.db.query(CONTENT).count({ where: { category: { id: previous.id } } });
          if (action === 'delete' && used) fail('category', 'Cannot delete a category containing content.');
          if (['create', 'update'].includes(action)) {
            const final = { displayOrder: 0, visible: true, ...previous, ...params.data };
            validateCategory(final);
            if (previous && final.slug !== previous.slug) fail('slug', 'Category slugs are stable and cannot change.');
            if (used && (final.templateKey !== previous.templateKey || final.cardinality !== previous.cardinality)) fail('templateKey', 'Template and cardinality cannot change while content exists.');
          }
        } else {
          const categoryChanged = params.data?.category !== undefined
            && reference(params.data.category, previous?.category?.documentId) !== previous?.category?.documentId;
          if (action === 'delete' || categoryChanged) {
            if (previous?.category?.templateKey === 'skill-groups') await assertUnreferencedGroup(strapi, params.documentId);
          }
          if (action === 'unpublish' && previous?.category?.templateKey === 'skill-groups') {
            const published = await strapi.db.query(CONTENT).findMany({ where: { publishedAt: { $notNull: true } }, populate: contentPopulate(strapi) });
            if (published.some(entry => entry.payload?.[0]?.__component === 'payloads.skills' && entry.payload[0].skillGroup?.documentId === params.documentId)) {
              fail('category', 'Unpublish referencing skills before unpublishing their group.');
            }
          }
          if (['create', 'update', 'publish'].includes(action)) {
            if (action !== 'create' && !previous) fail('documentId', 'Content draft does not exist.');
            params.data ||= {};
            await validateEntry(strapi, params.data, previous, params.documentId, action === 'publish' || params.status === 'published');
          }
          if (action === 'discardDraft') {
            const published = await strapi.db.query(CONTENT).findOne({ where: { documentId: params.documentId, publishedAt: { $notNull: true } }, populate: contentPopulate(strapi) });
            if (!published) fail('documentId', 'No published entry exists.');
            await validateEntry(strapi, {}, published, params.documentId);
          }
        }
        return next();
      });
    } catch (error) { throw asStrapiError(error); }
  };
}
async function initializeLock(strapi) {
  const knex = strapi.db.connection;
  if (!await knex.schema.hasTable(LOCKS)) {
    await knex.schema.createTable(LOCKS, table => { table.integer('id').primary(); table.bigInteger('version').notNullable().defaultTo(0); });
  }
  await knex(LOCKS).insert({ id: 1, version: 0 }).onConflict('id').ignore();
}
function guardMediaDeletion(strapi) {
  const upload = strapi.plugin('upload').service('upload');
  const check = async fileId => {
    const entries = await strapi.db.query(CONTENT).findMany({ populate: contentPopulate(strapi) });
    function contains(value) {
      if (!value || typeof value !== 'object') return false;
      if (value.id === Number(fileId) && typeof value.mime === 'string') return true;
      return Object.values(value).some(contains);
    }
    if (entries.some(contains)) fail('media', 'This file is referenced by content. Upload a new file and update the entry first.');
  };
  const wrap = (method, getId) => {
    const original = upload[method].bind(upload);
    upload[method] = async (...args) => {
    try {
      return await withWriteLock(strapi, async () => {
        await check(getId(args[0]));
        return original(...args);
      });
    } catch (error) { throw asStrapiError(error); }
    };
  };
  wrap('remove', file => file.id);
  wrap('replace', id => id);
}
module.exports = { createGuard, initializeLock, guardMediaDeletion, withWriteLock, contentPopulate, CATEGORY, CONTENT };
