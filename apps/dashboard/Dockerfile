FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/dashboard/package.json ./apps/dashboard/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/dashboard ./apps/dashboard
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/dashboard && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/dashboard/server.js"]
