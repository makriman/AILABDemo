const MAX_TRUSTED_HOPS = 2;

function decideTrustProxy(rawValue, nodeEnv) {
  const fallback = nodeEnv === 'production' ? 1 : false;

  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return { value: fallback, ignored: false };
  }

  const value = rawValue.trim().toLowerCase();

  if (value === 'false' || value === '0') {
    return { value: false, ignored: false };
  }

  // Express treats boolean true as trust-every-proxy. One hop matches a single Render proxy.
  if (value === 'true' || value === '1') {
    return { value: 1, ignored: false };
  }

  if (/^[1-9]\d*$/.test(value)) {
    const hops = Number(value);
    if (hops <= MAX_TRUSTED_HOPS) {
      return { value: hops, ignored: false };
    }
  }

  return { value: fallback, ignored: true };
}

function resolveTrustProxy(rawValue, nodeEnv) {
  return decideTrustProxy(rawValue, nodeEnv).value;
}

module.exports = {
  MAX_TRUSTED_HOPS,
  decideTrustProxy,
  resolveTrustProxy,
};
