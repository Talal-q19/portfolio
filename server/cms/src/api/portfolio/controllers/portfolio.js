const { CATEGORY, CONTENT, contentPopulate } = require('../../../portfolio/guard');
const { validatePayload, validateCategory, getFormMetadata, ContentValidationError } = require('@portfolio/content-contract');
const { queryOptions, contentBody, categoryBody, invalid, entryView, categoryView, mediaView } = require('@portfolio/content-contract/api');
const fs = require('node:fs/promises');
module.exports = ({ strapi }) => {
  const docs = uid => strapi.documents(uid);
  const base = () => (process.env.CMS_MEDIA_PUBLIC_URL || strapi.config.get('server.url') || 'http://localhost:1337').replace(/\/$/, '');
  const category = async slug => {
    const c = await docs(CATEGORY).findFirst({ filters: { slug } });
    if (!c) invalid('category', 'Category does not exist.');
    return c;
  };
  const readEntry = async id => {
    const entry = await docs(CONTENT).findOne({ documentId: id, status: 'draft', populate: contentPopulate(strapi) });
    if (!entry) { const error = new Error('Content not found.'); error.status = 404; throw error; }
    return entry;
  };
  const resolvers = {
    media: value => strapi.db.query('plugin::upload.file').findOne({ where: { id: Number(value?.id || value) || -1 } }),
    skillGroup: async value => {
      const e = await docs(CONTENT).findOne({ documentId: value?.documentId || value, populate: { category: true } });
      return e?.category?.templateKey === 'skill-groups';
    },
  };
  async function groups(ctx, admin = false) {
    const q = queryOptions(ctx.query, admin);
    if (q.category) await category(q.category);
    const categories = await docs(CATEGORY).findMany({ filters: { ...(q.category ? { slug: q.category } : {}), ...(!admin ? { visible: true } : {}) }, sort: ['displayOrder:asc', 'documentId:asc'] });
    const groups = [];
    for (const c of categories) {
      const filters = { category: { documentId: c.documentId }, ...(q.slug ? { slug: q.slug } : {}) };
      const status = admin ? q.status || 'draft' : 'published';
      const total = await docs(CONTENT).count({ filters, status });
      // Unpaged homepage reads explicitly walk every page; no silent REST limit truncation.
      const size = q.paged ? q.pageSize : 100;
      const entries = [];
      for (let start = q.paged ? (q.page - 1) * size : 0; start < total; start += size) {
        entries.push(...await docs(CONTENT).findMany({ filters, status, start, limit: size, sort: ['displayOrder:asc', 'documentId:asc'], populate: contentPopulate(strapi) }));
        if (q.paged) break;
      }
      const items = [];
      for (const entry of entries) {
        // Re-resolve populated content relations as published documents; a draft version must never leak.
        if (!admin && entry.category.templateKey === 'skills') {
          const ref = entry.payload[0].skillGroup?.documentId;
          const group = ref && await docs(CONTENT).findOne({ documentId: ref, status: 'published', populate: { category: true } });
          if (!group || !group.category?.visible) continue;
          entry.payload[0].skillGroup = { documentId: group.documentId };
        }
        items.push(entryView(entry, base()));
      }
      groups.push({ ...categoryView(c), items, pagination: { page: q.paged ? q.page : 1, pageSize: q.paged ? size : total, total, pageCount: q.paged ? Math.ceil(total / size) : total ? 1 : 0 } });
    }
    return { categories: groups };
  }
  const handlers = {
    read: ctx => groups(ctx),
    categoriesList: async () => ({ categories: (await docs(CATEGORY).findMany({ sort: ['displayOrder:asc', 'documentId:asc'] })).map(categoryView), requirements: getFormMetadata() }),
    categoriesRead: async ctx => ({ category: categoryView(await docs(CATEGORY).findOne({ documentId: ctx.params.id }) || invalid('category', 'Category does not exist.')) }),
    categoriesCreate: async ctx => {
      const body = ctx.request.body; categoryBody(body);
      const data = { displayOrder: 0, visible: true, ...body }; validateCategory(data);
      return { category: categoryView(await docs(CATEGORY).create({ data })) };
    },
    categoriesUpdate: async ctx => {
      const body = ctx.request.body; categoryBody(body);
      const previous = await docs(CATEGORY).findOne({ documentId: ctx.params.id });
      if (!previous) invalid('category', 'Category does not exist.');
      validateCategory({ ...previous, ...body });
      return { category: categoryView(await docs(CATEGORY).update({ documentId: ctx.params.id, data: body })) };
    },
    categoriesDelete: async ctx => {
      if (!await docs(CATEGORY).findOne({ documentId: ctx.params.id })) invalid('category', 'Category does not exist.');
      await docs(CATEGORY).delete({ documentId: ctx.params.id }); return { success: true };
    },
    contentList: ctx => groups(ctx, true),
    contentRead: async ctx => ({ item: entryView(await readEntry(ctx.params.id), base()) }),
    contentCreate: async ctx => {
      const body = ctx.request.body; contentBody(body);
      const c = await category(body.category);
      await validatePayload(c.templateKey, body.data, resolvers);
      const entry = await docs(CONTENT).create({ status: 'draft', data: { category: c.documentId, displayOrder: body.displayOrder || 0, payload: [{ ...body.data, __component: `payloads.${c.templateKey}` }] } });
      return { item: entryView(await readEntry(entry.documentId), base()) };
    },
    contentUpdate: async ctx => {
      const body = ctx.request.body; contentBody(body, true);
      const previous = await readEntry(ctx.params.id);
      if (body.operation === 'update') {
        const c = body.category ? await category(body.category) : previous.category;
        const data = { ...entryView(previous).data, ...body.data };
        await validatePayload(c.templateKey, data, resolvers);
        await docs(CONTENT).update({ documentId: ctx.params.id, status: 'draft', data: { category: c.documentId, displayOrder: body.displayOrder ?? previous.displayOrder, payload: [{ ...data, __component: `payloads.${c.templateKey}` }] } });
      } else await docs(CONTENT)[body.operation]({ documentId: ctx.params.id });
      return { item: entryView(await readEntry(ctx.params.id), base()) };
    },
    contentDelete: async ctx => { await readEntry(ctx.params.id); await docs(CONTENT).delete({ documentId: ctx.params.id }); return { success: true }; },
    mediaList: async ctx => {
      const { page, pageSize } = queryOptions({ category: 'media', ...ctx.query });
      const files = strapi.db.query('plugin::upload.file');
      return { items: (await files.findMany({ offset: (page - 1) * pageSize, limit: pageSize, orderBy: { id: 'asc' } })).map(f => mediaView(f, base())), pagination: { page, pageSize, total: await files.count() } };
    },
    mediaRead: async ctx => ({ item: mediaView(await resolvers.media(ctx.params.id), base()) }),
    mediaCreate: async ctx => {
      const file = ctx.request.files?.files;
      if (!file || Array.isArray(file) || file.size > 8 * 1024 * 1024 || Object.keys(ctx.request.body || {}).length) invalid('media', 'Upload one file, up to 8 MiB, without extra fields.');
      const bytes = await fs.readFile(file.filepath);
      const mime = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
        : ['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()) ? 'image/gif'
        : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP' ? 'image/webp'
        : bytes.subarray(0,5).toString() === '%PDF-' ? 'application/pdf' : null;
      const extensions = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'], 'image/webp': ['.webp'], 'application/pdf': ['.pdf'] };
      const extension = require('node:path').extname(file.originalFilename || '').toLowerCase();
      if (!mime || mime !== file.mimetype || !extensions[mime].includes(extension)) invalid('media', 'Use a valid PNG, JPEG, GIF, WebP or PDF with a matching file extension.');
      let uploaded;
      try { uploaded = await strapi.plugin('upload').service('upload').upload({ data: {}, files: file }); }
      catch (error) { if (['ApplicationError', 'ValidationError'].includes(error.name)) invalid('media', 'File is invalid or could not be processed.'); throw error; }
      return { items: uploaded.map(f => mediaView(f, base())) };
    },
    mediaDelete: async ctx => {
      const file = await resolvers.media(ctx.params.id);
      if (!file) invalid('media', 'File does not exist.');
      await strapi.plugin('upload').service('upload').remove(file); return { success: true };
    },
  };
  return Object.fromEntries(Object.entries(handlers).map(([name, handler]) => [name, async ctx => {
    ctx.set('Cache-Control', 'no-store');
    try { ctx.body = await handler(ctx); }
    catch (error) {
      const fields = error.fields || error.details?.fields;
      if (error instanceof ContentValidationError || fields || error.name === 'ValidationError') { ctx.status = 422; ctx.body = { message: 'Content is incomplete or invalid.', fields: fields || { data: error.message } }; }
      else if (error.status === 404) { ctx.status = 404; ctx.body = { message: error.message }; }
      else throw error;
    }
  }]));
};
