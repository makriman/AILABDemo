# JD Quiz App

A stateless AI quiz generator that turns a job description into a five-question assessment flow.

Live: [https://ailab-demo.vercel.app](https://ailab-demo.vercel.app)

## Mission

Hiring and learning tools should make requirements easier to understand. This app converts a job description into a short quiz so candidates, learners, or reviewers can test comprehension without setting up accounts or databases.

## What This Repository Contains

A Render-friendly full-stack MVP with a React/Vite client and Express API. The server calls Claude, returns a five-question quiz, signs encrypted attempt tokens, and evaluates submitted answers without persistent storage.

## Highlights

- Paste a job description and generate a five-question quiz.
- Answer questions client-side and submit with an encrypted attempt token.
- Receive score and feedback with no accounts or database.
- Same-origin production setup where Express serves both API and built client.

## Tech Stack

- React 18 and Vite
- Express
- Claude API
- Vitest and integration tests
- Render single-service deployment

## Getting Started

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm test
npm run build
```

## Repository Notes

- Set CLAUDE_API_KEY and QUIZ_STATE_SECRET before running production-like flows.
- The app is intentionally stateless; refreshes clear active quiz state.

## Contributing

Contributions are welcome. The best contributions are specific, tested, and grounded in the product mission. Good places to help include documentation, accessibility, tests, bug reports, UI polish, data validation, and safer AI behavior.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Please do not open public issues for secrets, auth bypasses, data exposure, provider key leaks, or abuse vectors. Follow [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Be direct, kind, and useful.

## License

MIT. See [LICENSE](LICENSE).
