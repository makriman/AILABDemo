const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  require('dotenv').config();
}

const app = require('./src/app');
const { assertQuizStateSecretConfigured } = require('./src/utils/quizStateSecret');

const PORT = Number(process.env.PORT) || 10000;
const HOST = isProduction ? '0.0.0.0' : process.env.HOST || '0.0.0.0';

function validateEnvironment() {
  if (isProduction && !process.env.CLAUDE_API_KEY) {
    throw new Error('Missing required environment variables: CLAUDE_API_KEY');
  }

  assertQuizStateSecretConfigured();
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
