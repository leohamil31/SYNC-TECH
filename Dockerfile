# syntax=docker/dockerfile:1

# ---- 1. Build the React app ----
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. API runtime (also serves the built front-end) ----
FROM node:22-alpine AS api
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/ ./
COPY --from=web /app/frontend/dist /app/frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://localhost:${PORT:-3333}/api/health" || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
