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
CLAUDE_MODEL=claude-sonnet-4-6
JWT_SECRET=your-random-secret
PORT=3001
HOST=127.0.0.1
CLIENT_ORIGIN=http://localhost:5173
TRUST_PROXY=true
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

## Dockerize Server (Port 3001)

Prerequisite: create `server/.env` first (same variables shown above).

### Option 1: Docker Compose (recommended)

Build frontend once before starting compose (needed for `ailab_frontend` static files):

```bash
cd client && npm install && npm run build && cd ..
```

```bash
docker compose -f docker-compose.server.yml up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.server.yml logs -f
```

Stop:

```bash
docker compose -f docker-compose.server.yml down
```

### Option 2: Plain Docker

Build image:

```bash
docker build -t jd-quiz-server ./server
```

Run container:

```bash
docker run -d \
  --name jd-quiz-server \
  --env-file ./server/.env \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  -e PORT=3001 \
  -p 3001:3001 \
  -v "$(pwd)/server/data:/app/data" \
  jd-quiz-server
```

The API will be reachable at `http://localhost:3001`.

Note: `docker-compose.server.yml` binds `3001` to `127.0.0.1` for safer server deployments behind Nginx and expects a shared proxy network named `loan-rating_default`.

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
