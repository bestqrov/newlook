# NewLook — one container: React front-end (built) + Express API.
# Coolify: Build Pack = Dockerfile, port 4000, persistent volume on /data.

# ─── 1. Build the front-end ──────────────────────────────────────────
FROM node:20-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Empty = API on the same domain (recommended).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── 2. Runtime: API + static site ───────────────────────────────────
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production \
    PORT=4000 \
    TRUST_PROXY=1 \
    SERVE_CLIENT_DIR=/app/dist \
    UPLOAD_DIR=/data/uploads
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/src ./src
COPY server/scripts ./scripts
COPY --from=web /app/dist /app/dist
# /data holds uploaded photos and PRIVATE payment receipts → mount a volume.
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "src/index.js"]
