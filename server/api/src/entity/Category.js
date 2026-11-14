const { v } = require('convex/values');
class Category {
  static tableName = 'categories';
  static fields = { documentId: v.string(), name: v.string(), slug: v.string(), templateKey: v.string(), cardinality: v.string(), displayOrder: v.number(), visible: v.boolean() };
  static indexes = [["documentId",["documentId"]],["slug",["slug"]]];
}
module.exports = { Category };
