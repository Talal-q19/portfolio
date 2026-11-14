const { v } = require('convex/values');
class Media {
  static tableName = 'media';
  static fields = { id: v.number(), storageId: v.id('_storage'), name: v.string(), alternativeText: v.string(), mime: v.string(), size: v.number(), width: v.optional(v.number()), height: v.optional(v.number()), checksum: v.optional(v.string()) };
  static indexes = [["id",["id"]],["storageId",["storageId"]]];
}
module.exports = { Media };
