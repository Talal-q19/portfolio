const { v } = require('convex/values');
class Admin {
  static tableName = 'admins';
  static fields = { id: v.string(), username: v.string(), email: v.string(), password_hash: v.string(), blocked: v.boolean(), token_version: v.number(), created_at: v.string(), updated_at: v.string() };
  static indexes = [["id",["id"]],["username",["username"]],["email",["email"]]];
}
module.exports = { Admin };
