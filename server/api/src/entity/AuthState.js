const { v } = require('convex/values');
class AuthState {
  static tableName = 'authState';
  static fields = { key: v.string(), value: v.any(), expiresAt: v.number() };
  static indexes = [["key",["key"]],["expiry",["expiresAt"]]];
}
module.exports = { AuthState };
