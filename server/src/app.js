const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const quizRoutes = require('./routes/quiz.routes');
const authMiddleware = require('./middleware/auth.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAnyOrigin = allowedOrigins.includes('*');
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
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', authMiddleware, quizRoutes);

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
