const test = require('node:test');
const assert = require('node:assert/strict');
const { createToken, hashPassword, comparePassword } = require('../src/services/authService');

test('createToken returns a signed JWT for a user', () => {
  const token = createToken({ id: 1, email: 'test@example.com', role: 'customer' });
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 20);
});

test('hashPassword and comparePassword work together', async () => {
  const plain = 'SecurePassword123';
  const hash = await hashPassword(plain);
  const matches = await comparePassword(plain, hash);
  assert.equal(matches, true);
});
