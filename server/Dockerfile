FROM node:20-alpine

WORKDIR /app

# Container runtime defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package*.json ./

# Install only production dependencies.
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

COPY . .

# NeDB data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
