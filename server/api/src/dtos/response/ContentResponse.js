class ContentResponse {
  static entry(row, data, published = false) {
    const value = published ? row.published : row.draft;
    return { documentId: row.documentId, category: row.category, displayOrder: value.displayOrder, slug: value.data.slug || null, publishedAt: row.published?.publishedAt || null, data };
  }
}
module.exports = { ContentResponse };
