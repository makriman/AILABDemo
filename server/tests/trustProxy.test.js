const { resolveTrustProxy } = require('../src/utils/trustProxy');

describe('resolveTrustProxy', () => {
  test('maps true to one hop instead of trusting every proxy', () => {
    expect(resolveTrustProxy('true', 'production')).toBe(1);
    expect(resolveTrustProxy('TRUE', 'production')).toBe(1);
    expect(resolveTrustProxy('1', 'development')).toBe(1);
  });

  test('uses one hop in production when unset and none otherwise', () => {
    expect(resolveTrustProxy(undefined, 'production')).toBe(1);
    expect(resolveTrustProxy('', 'production')).toBe(1);
    expect(resolveTrustProxy(undefined, 'test')).toBe(false);
  });

  test('rejects trust-all and oversized hop counts', () => {
    expect(resolveTrustProxy('*', 'production')).toBe(1);
    expect(resolveTrustProxy('loopback, linklocal, uniquelocal', 'production')).toBe(1);
    expect(resolveTrustProxy('99', 'test')).toBe(false);
    expect(resolveTrustProxy('2', 'test')).toBe(2);
    expect(resolveTrustProxy('false', 'production')).toBe(false);
  });
});
