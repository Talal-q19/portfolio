const { queryOptions, contentBody, categoryBody, shape } = require('@portfolio/content-contract/api');
class ContentRequest {
  static query(query, admin = false) { queryOptions(query, admin); return query; }
  static body(body, updating = false) { contentBody(body, updating); return body; }
  static category(body) { categoryBody(body); return body; }
  static resourceQuery(resource, query) {
    if (resource === 'content') queryOptions(query, true);
    else if (resource === 'categories') shape(query, []);
    else { shape(query, ['page', 'pageSize']); queryOptions({ category: 'media', ...query }); }
    return query;
  }
}
module.exports = { ContentRequest };
