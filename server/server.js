require('dotenv').config();

const app = require('./src/app');

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 10000;
const HOST = isProduction ? '0.0.0.0' : process.env.HOST || '0.0.0.0';

function validateEnvironment() {
  const required = [];

  if (isProduction) {
    required.push('CLAUDE_API_KEY');
  }

  required.push('QUIZ_STATE_SECRET');

  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function startServer() {
  validateEnvironment();

  app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

try {
  startServer();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error.message);
  process.exit(1);
}
