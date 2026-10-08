# ── Build stage ────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack (matches your local setup)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what's needed for dependency resolution first (layer caching)
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# ── Runtime stage ──────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Copy installed node_modules from the build stage
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

# Copy the source code
COPY --chown=app:app package.json ./
COPY --chown=app:app src ./src

USER app

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/index.js"]