const test = require('node:test');
const assert = require('node:assert/strict');

const { slugify, centsToDollars } = require('../src/utils/slug');

test('slugify reduces text into a clean URL-safe slug', () => {
  const slug = slugify('Modern Wooden Table & Chair');
  assert.equal(slug, 'modern-wooden-table-chair');
});

test('centsToDollars converts integer cents into a decimal dollar string', () => {
  const formatted = centsToDollars(2500);
  assert.equal(formatted, '25.00');
});
