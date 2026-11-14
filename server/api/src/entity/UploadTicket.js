const { v } = require('convex/values');
class UploadTicket {
  static tableName = 'uploadTickets';
  static fields = { token: v.string(), expiresAt: v.number(), name: v.string(), mime: v.string(), size: v.number(), storageId: v.optional(v.id('_storage')), mediaId: v.optional(v.number()) };
  static indexes = [["token",["token"]],["expiry",["expiresAt"]]];
}
module.exports = { UploadTicket };
