import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaUrl } from '../utils/media-url.mjs';
test('Convex storage URLs and repository assets retain their original address', () => {
  for (const url of ['https://rugged-reindeer-131.eu-west-1.convex.cloud/api/storage/id', '/profilePic.jpeg']) assert.equal(mediaUrl(url), url);
  assert.equal(mediaUrl(null), '');
});
