import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export default defineSchema({
  admins: defineTable({ id: v.string(), username: v.string(), email: v.string(), password_hash: v.string(), blocked: v.boolean(), token_version: v.number(), created_at: v.string(), updated_at: v.string() }).index('id', ['id']).index('username', ['username']).index('email', ['email']),
  authState: defineTable({ key: v.string(), value: v.any(), expiresAt: v.number() }).index('key', ['key']).index('expiry', ['expiresAt']),
  categories: defineTable({ documentId: v.string(), name: v.string(), slug: v.string(), templateKey: v.string(), cardinality: v.string(), displayOrder: v.number(), visible: v.boolean() }).index('documentId', ['documentId']).index('slug', ['slug']),
  content: defineTable({ documentId: v.string(), category: v.string(), draft: v.any(), published: v.union(v.any(), v.null()) }).index('documentId', ['documentId']).index('category', ['category']),
  media: defineTable({ id: v.number(), storageId: v.id('_storage'), name: v.string(), alternativeText: v.string(), mime: v.string(), size: v.number(), width: v.optional(v.number()), height: v.optional(v.number()), checksum: v.optional(v.string()) }).index('id', ['id']).index('storageId', ['storageId']),
  counters: defineTable({ key: v.string(), value: v.number() }).index('key', ['key']),
  uploadTickets: defineTable({ token: v.string(), expiresAt: v.number(), name: v.string(), mime: v.string(), size: v.number(), storageId: v.optional(v.id('_storage')), mediaId: v.optional(v.number()) }).index('token', ['token']).index('expiry', ['expiresAt']),
});
