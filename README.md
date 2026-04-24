# JD Quiz App (Stateless Render MVP)

A temporary job-description quiz tool built for a single Render Web Service.

## Product Behavior

- No accounts
- No database
- No saved quiz history
- No persistent storage
- Generate quiz -> answer 5 questions -> submit -> see feedback
- Refresh/restart clears the in-memory session

## Architecture

- `client/`: React + Vite
- `server/`: Express API + Claude integration
- Production: one Node service
  - Express serves `/api/*`
  - Express serves built Vite app from `client/dist`
  - Same-origin frontend + backend

## Environment Variables

Set these in Render (and optionally local `.env`):

```env
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
QUIZ_STATE_SECRET=your-long-random-secret
PORT=10000
NODE_ENV=production
TRUST_PROXY=true
```

Notes:
- `QUIZ_STATE_SECRET` is required for encrypted attempt tokens.
- `PORT` is provided automatically by Render.

## Local Development

From repo root:

```bash
npm install
npm run dev
```

This runs:
- Express on `http://localhost:3001`
- Vite on `http://localhost:5173` (proxying `/api` to Express)

## Production Run (Local Smoke)

From repo root:

```bash
npm run build
npm start
```

Then verify:
- `GET /health` -> `200`
- `GET /` -> frontend app
- quiz generate + submit flow works

## API Contract

### `POST /api/quiz/generate`

Request:

```json
{
  "jobDescription": "..."
}
```

Response:

```json
{
  "quiz": {
    "jobTitle": "...",
    "questions": [
      {
        "questionId": "q1",
        "questionText": "...",
        "options": [
          { "label": "A", "text": "..." },
          { "label": "B", "text": "..." },
          { "label": "C", "text": "..." },
          { "label": "D", "text": "..." }
        ]
      }
    ]
  },
  "attemptToken": "opaque-encrypted-token",
  "expiresAt": "2026-04-23T12:00:00.000Z"
}
```

### `POST /api/quiz/submit`

Request:

```json
{
  "attemptToken": "opaque-encrypted-token",
  "answers": [
    { "questionId": "q1", "selectedAnswer": "A" },
    { "questionId": "q2", "selectedAnswer": "B" },
    { "questionId": "q3", "selectedAnswer": "C" },
    { "questionId": "q4", "selectedAnswer": "D" },
    { "questionId": "q5", "selectedAnswer": "A" }
  ]
}
```

Response:

```json
{
  "jobTitle": "...",
  "score": 3,
  "totalQuestions": 5,
  "results": [
    {
      "questionId": "q1",
      "questionText": "...",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ],
      "selectedAnswer": "A",
      "correctAnswer": "B",
      "isCorrect": false,
      "explanation": "...",
      "wrongExplanation": "..."
    }
  ],
  "learningSummary": "..."
}
```

## Render Deployment

This repo includes `render.yaml` for a single Web Service blueprint.

Dashboard equivalent settings:
- Service type: Web Service
- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

No DB, Redis, or persistent disk required.
