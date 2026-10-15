# syntax=docker/dockerfile:1

# ---- base: runtime OS packages shared by every stage ----
FROM node:22-alpine AS base
# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: full dependency tree from the lockfile ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: used by docker-compose (source is bind-mounted, tsx watches it) ----
FROM deps AS dev
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run dev"]

# ---- build: compile TypeScript to dist/ ----
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---- production: compiled JS, production dependencies only, non-root ----
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
