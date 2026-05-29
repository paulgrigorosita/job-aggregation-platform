FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN pnpm turbo run build --filter=@jap/api

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
