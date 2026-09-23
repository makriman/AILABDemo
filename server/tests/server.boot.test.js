jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('server boot', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.restoreAllMocks();
  });

  function bootWith(env) {
    jest.resetModules();
    process.env = { ...originalEnv, ...env };
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      jest.isolateModules(() => {
        require('../server');
      });
    }).toThrow('process.exit');

    return {
      exitSpy,
      logged: errorSpy.mock.calls.map((call) => call.map(String).join(' ')).join('\n'),
    };
  }

  test('fails closed when QUIZ_STATE_SECRET is missing and does not print a value', () => {
    const { exitSpy, logged } = bootWith({
      NODE_ENV: 'test',
      QUIZ_STATE_SECRET: '',
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(logged).toMatch(/QUIZ_STATE_SECRET/);
    expect(logged).not.toMatch(/sk-ant|api[_-]?key/i);
  });

  test('fails closed for a short or placeholder secret without echoing it', () => {
    const secret = 'short-secret-value';
    const { logged } = bootWith({
      NODE_ENV: 'production',
      QUIZ_STATE_SECRET: secret,
      CLAUDE_API_KEY: 'present-but-not-a-real-key',
    });

    expect(logged).toMatch(/at least 32 characters/);
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain('present-but-not-a-real-key');
  });

  test('does not load a dotenv file in production', () => {
    const dotenv = require('dotenv');
    dotenv.config.mockClear();

    bootWith({
      NODE_ENV: 'production',
      QUIZ_STATE_SECRET: 'replace-with-a-long-random-secret',
      CLAUDE_API_KEY: 'present-but-not-a-real-key',
    });

    expect(dotenv.config).not.toHaveBeenCalled();
  });
});
