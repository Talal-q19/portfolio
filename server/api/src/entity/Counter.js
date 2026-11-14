const { v } = require('convex/values');
class Counter {
  static tableName = 'counters';
  static fields = { key: v.string(), value: v.number() };
  static indexes = [["key",["key"]]];
}
module.exports = { Counter };
