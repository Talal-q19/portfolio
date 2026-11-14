import { defineSchema, defineTable } from 'convex/server';
import AdminEntity from '../src/entity/Admin.js';
import AuthStateEntity from '../src/entity/AuthState.js';
import CategoryEntity from '../src/entity/Category.js';
import ContentEntity from '../src/entity/Content.js';
import MediaEntity from '../src/entity/Media.js';
import CounterEntity from '../src/entity/Counter.js';
import UploadTicketEntity from '../src/entity/UploadTicket.js';
const entities = [AdminEntity.Admin, AuthStateEntity.AuthState, CategoryEntity.Category, ContentEntity.Content, MediaEntity.Media, CounterEntity.Counter, UploadTicketEntity.UploadTicket];
export default defineSchema(Object.fromEntries(entities.map(entity => {
  let table = defineTable(entity.fields);
  for (const [name, fields] of entity.indexes) table = table.index(name, fields);
  return [entity.tableName, table];
})));
