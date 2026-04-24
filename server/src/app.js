const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const quizRoutes = require('./routes/quiz.routes');
const { globalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

const trustProxyConfig = process.env.TRUST_PROXY;

if (typeof trustProxyConfig === 'string') {
  if (trustProxyConfig.toLowerCase() === 'true') {
    app.set('trust proxy', 1);
  } else if (trustProxyConfig.toLowerCase() === 'false') {
    app.set('trust proxy', false);
  } else {
    app.set('trust proxy', trustProxyConfig);
  }
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
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

  return res.status(500).json({
    error: 'Internal server error.',
  });
});

module.exports = app;
