# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ 
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

# better-sqlite3 needs the native module from the build stage
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings 2>/dev/null || true
COPY --from=builder /app/node_modules/prebuild-install ./node_modules/prebuild-install 2>/dev/null || true
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path 2>/dev/null || true

# SQLite data directory — mount a Railway volume here
RUN mkdir -p /data
ENV SQLITE_DATA_DIR=/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
