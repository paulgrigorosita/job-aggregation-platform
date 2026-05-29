FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/scrapers/package.json ./packages/scrapers/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile
# Install Playwright browsers
RUN npx playwright install --with-deps chromium
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/scrapers ./packages/scrapers
COPY apps/worker ./apps/worker
RUN pnpm turbo run build --filter=@jap/worker

FROM node:20-alpine AS runner
WORKDIR /app
# Install Playwright system deps
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
RUN npm install -g pnpm
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/scrapers/dist ./packages/scrapers/dist
COPY --from=builder /app/packages/scrapers/package.json ./packages/scrapers/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
