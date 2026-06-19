# syntax=docker/dockerfile:1

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM node:26-alpine AS build
WORKDIR /app
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json tsconfig.app.json ./
COPY src ./src
RUN npm run build

# Seed runner: migrations + SQL (profile seed/tools). Keeps devDependencies for Prisma CLI.
FROM build AS seed
RUN apk add --no-cache postgresql-client
COPY docker/seed ./docker/seed
COPY docker/seed-entrypoint.sh ./docker/seed-entrypoint.sh
RUN sed -i 's/\r$//' ./docker/seed-entrypoint.sh && chmod +x ./docker/seed-entrypoint.sh
ENTRYPOINT ["sh", "/app/docker/seed-entrypoint.sh"]

FROM build AS build-pruned
RUN npm prune --omit=dev

FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_cache=/tmp/npm-cache
RUN apk add --no-cache libc6-compat openssl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./
RUN mkdir -p /tmp/npm-cache && chown nodejs:nodejs /tmp/npm-cache
USER nodejs
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/index.js"]
