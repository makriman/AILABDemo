# Job Description Quiz App

A local-first full-stack app for generating and taking 5-question MCQ quizzes from job descriptions.

## Tech Stack

- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express
- Database: NeDB (`nedb-promises`)
- Auth: JWT + bcrypt
- AI: Anthropic Claude Messages API

## Project Structure

- `client/` - React app
- `server/` - Express API

## Environment Variables

Create `server/.env`:

```env
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-latest
JWT_SECRET=your-random-secret
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

## Run Locally

```bash
cd server && npm install
cd ../client && npm install
```

In two terminals:

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend on `http://localhost:3001`.

## Scripts

Server:

- `npm run dev`
- `npm run start`
- `npm run test`

Client:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`

## Security/Validation Included

- bcrypt hashing for passwords + security answers
- JWT protected quiz routes
- Sanitization + Joi validation
- Helmet + CORS + rate limiting
- Quiz ownership checks (403 on cross-user access)

## Notes

- Quiz generation returns only question text/options initially.
- Correct answers and explanations are exposed only after submission.
- Claude output is schema-validated with one retry on malformed output/timeout.
