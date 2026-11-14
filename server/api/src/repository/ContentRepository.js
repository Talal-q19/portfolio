class ContentRepository {
  constructor(call) { this.call = call; }
  request(path, options = {}) {
    const url = new URL(path, 'https://internal/');
    return this.call('content', { path: url.pathname.slice(1), query: Object.fromEntries(url.searchParams), method: options.method || 'GET', body: options.body || null });
  }
}
module.exports = { ContentRepository };
