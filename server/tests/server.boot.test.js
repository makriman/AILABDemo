const { spawnSync } = require('child_process');
const path = require('path');

function bootServer(env) {
  return spawnSync(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      ...env,
    },
    encoding: 'utf8',
    timeout: 10000,
  });
}

describe('server boot secret check', () => {
  test('exits when QUIZ_STATE_SECRET is missing, short, or the documented placeholder', () => {
    const missing = bootServer({ QUIZ_STATE_SECRET: '' });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('Missing required environment variables: QUIZ_STATE_SECRET');

    const shortSecret = 'short-secret';
    const short = bootServer({ QUIZ_STATE_SECRET: shortSecret });
    expect(short.status).toBe(1);
    expect(short.stderr).toContain('QUIZ_STATE_SECRET must be at least 32 characters.');
    expect(short.stderr).not.toContain(shortSecret);

    const placeholder = bootServer({
      QUIZ_STATE_SECRET: 'replace-with-a-long-random-secret',
    });
    expect(placeholder.status).toBe(1);
    expect(placeholder.stderr).toMatch(/placeholder/i);
    expect(placeholder.stderr).not.toContain('replace-with-a-long-random-secret');
  });
});
