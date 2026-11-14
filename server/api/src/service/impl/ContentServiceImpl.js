const { ContentService } = require('../ContentService');
const { ContentValidationError, validatePayload, validateCategory } = require('@portfolio/content-contract');

class ContentServiceImpl extends ContentService {
  constructor(repository) { super(); this.repository = repository; }

  read(query) { return this.repository.request(`read?${new URLSearchParams(query)}`); }
  list(resource, query) { const search = new URLSearchParams(query).toString(); return this.repository.request(`admin/${resource}${search ? `?${search}` : ''}`); }
  get(resource, id) { return this.repository.request(`admin/${resource}/${encodeURIComponent(id)}`); }
  upload(operation, body) { return this.repository.request(`admin/media/${operation}`, { method: 'POST', body }); }
  remove(resource, id) { return this.repository.request(`admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }); }

  async validateContent(body, id) {
    if (id && body.operation !== 'update') return;
    const previous = id ? (await this.get('content', id)).item : null;
    const categories = (await this.list('categories', {})).categories;
    const category = categories.find(c => c.slug === (body.category || previous?.category));
    if (!category) throw new ContentValidationError({ category: 'Category does not exist.' });
    await validatePayload(category.templateKey, { ...previous?.data, ...body.data }, {
      media: async value => {
        const mediaId = value?.id || value;
        if (!Number.isInteger(mediaId) || mediaId < 1) return null;
        return (await this.get('media', mediaId)).item;
      },
      skillGroup: async value => {
        if (typeof value !== 'string' || !/^[a-z0-9]+$/.test(value)) return false;
        const item = (await this.get('content', value)).item;
        return categories.find(c => c.slug === item.category)?.templateKey === 'skill-groups';
      },
    });
  }

  async create(resource, body, options = {}) {
    if (resource === 'content') await this.validateContent(body);
    if (resource === 'categories') validateCategory({ displayOrder: 0, visible: true, ...body });
    return this.repository.request(`admin/${resource}`, { method: 'POST', body, ...options });
  }

  async update(resource, id, body) {
    if (resource === 'content') await this.validateContent(body, id);
    else validateCategory({ ...(await this.get('categories', id)).category, ...body });
    return this.repository.request(`admin/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body });
  }
}
module.exports = { ContentServiceImpl };
