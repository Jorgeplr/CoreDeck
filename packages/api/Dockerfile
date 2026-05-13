# ---- deps ----
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- builder ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

# ---- runner ----
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/uploads

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_DIR=/app/uploads

CMD node node_modules/prisma/build/index.js migrate deploy && node server.js
