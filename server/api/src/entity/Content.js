const { v } = require('convex/values');
class Content {
  static tableName = 'content';
  static fields = { documentId: v.string(), category: v.string(), draft: v.any(), published: v.union(v.any(), v.null()) };
  static indexes = [["documentId",["documentId"]],["category",["category"]]];
}
module.exports = { Content };
