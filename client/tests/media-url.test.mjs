import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaUrl } from '../utils/media-url.mjs';
test('local CMS media uses the website origin, including IPv4 loopback and encoded filenames', () => {
  for (const host of ['localhost','127.0.0.1','[::1]']) assert.equal(mediaUrl(`http://${host}:1337/uploads/icon%20one.svg`), '/cms-media/icon%20one.svg');
  assert.equal(mediaUrl('http://localhost:1337/uploads/file.png?v=1'), '/cms-media/file.png?v=1');
});
test('the proxy mapping does not rewrite external providers, other ports, or non-upload paths', () => {
  for (const url of ['https://res.cloudinary.com/demo/image.png','http://localhost:1338/uploads/a.png','http://localhost:1337/api/content','http://localhost.evil.test:1337/uploads/a.png','/profilePic.jpeg']) assert.equal(mediaUrl(url),url);
  assert.equal(mediaUrl('http://localhost:1337/uploads/a.png', 'https://cms.example.com'), 'http://localhost:1337/uploads/a.png');
  assert.equal(mediaUrl(null), '');
});
