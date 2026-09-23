const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseAllowedOrigins(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return [];
  }

  const origins = [];

  for (const part of rawValue.split(',')) {
    const candidate = part.trim();
    if (!candidate || candidate === '*') {
      continue;
    }

    try {
      const url = new URL(candidate);
      if (url.username || url.password) {
        continue;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        continue;
      }
      origins.push(url.origin);
    } catch (error) {
      continue;
    }
  }

  return origins;
}

function normalizeOrigin(origin) {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.origin;
  } catch (error) {
    return '';
  }
}

function isLoopbackOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }

  return LOOPBACK_HOSTS.has(new URL(normalized).hostname);
}

function comparableHost(protocol, host) {
  const lower = host.toLowerCase();
  if (protocol === 'https:' && lower.endsWith(':443')) {
    return lower.slice(0, -4);
  }
  if (protocol === 'http:' && lower.endsWith(':80')) {
    return lower.slice(0, -3);
  }
  return lower;
}

function isSameOrigin(req, origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }

  const hostHeader = req.get('host');
  if (!hostHeader) {
    return false;
  }

  const url = new URL(normalized);
  const protocol = `${req.protocol}:`;
  return url.protocol === protocol && url.host.toLowerCase() === comparableHost(protocol, hostHeader);
}

function decideOrigin(req) {
  const originHeader = req.get('origin');
  if (!originHeader) {
    return { allow: true, reflect: false };
  }

  if (isSameOrigin(req, originHeader)) {
    return { allow: true, reflect: false };
  }

  if (process.env.NODE_ENV !== 'production' && isLoopbackOrigin(originHeader)) {
    return { allow: true, reflect: false };
  }

  const normalized = normalizeOrigin(originHeader);
  if (normalized && parseAllowedOrigins(process.env.ALLOWED_ORIGINS).includes(normalized)) {
    return { allow: true, reflect: true, origin: normalized };
  }

  return { allow: false };
}

function applyAllowlistedCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.removeHeader('Access-Control-Allow-Credentials');
}

function originPolicy(req, res, next) {
  const decision = decideOrigin(req);

  if (!decision.allow) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (decision.reflect) {
    applyAllowlistedCors(res, decision.origin);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
}

module.exports = originPolicy;
module.exports.parseAllowedOrigins = parseAllowedOrigins;
