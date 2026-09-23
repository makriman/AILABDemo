const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const quizRoutes = require('./routes/quiz.routes');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const originPolicy = require('./middleware/originPolicy.middleware');
const { redactSecrets } = require('./utils/redactSecrets');
const { decideTrustProxy } = require('./utils/trustProxy');

const app = express();

const trustProxyDecision = decideTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV);
const trustProxy = trustProxyDecision.value;

if (trustProxyDecision.ignored) {
  // eslint-disable-next-line no-console
  console.warn('Ignoring unsupported TRUST_PROXY value; using the safe default.');
}

if (trustProxy !== false) {
  app.set('trust proxy', trustProxy);
}

app.use(helmet());
app.use(originPolicy);
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const contentType = (req.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return res.status(415).json({ error: 'Content-Type must be application/json.' });
  }

  return next();
});
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/quiz', quizRoutes);

const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../../../dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist'),
];

const resolvedClientDist = clientDistCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'index.html'))
);

if (resolvedClientDist) {
  const indexFile = path.join(resolvedClientDist, 'index.html');
  // eslint-disable-next-line no-console
  console.log(`Serving frontend from: ${resolvedClientDist}`);

  app.use(express.static(resolvedClientDist));
  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(indexFile);
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(`Frontend dist not found. Checked: ${clientDistCandidates.join(', ')}`);
}

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', redactSecrets(error && error.message ? error.message : 'unknown'));

  return res.status(500).json({
    error: 'Internal server error.',
  });
});

module.exports = app;
