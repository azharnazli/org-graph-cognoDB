# syntax=docker/dockerfile:1

# --- Build stage: install workspace deps, compile TypeScript -> dist ---
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types ./packages/shared-types
COPY backend ./backend

RUN pnpm install --frozen-lockfile --filter @org-graph/backend...
RUN pnpm --filter @org-graph/backend build

# --- Runtime stage: production node_modules + compiled backend only ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types ./packages/shared-types
COPY backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist

# Production install drops devDependencies (tsx, typescript, @types/*).
# @org-graph/shared-types is type-only, so it's never loaded at runtime.
RUN pnpm install --frozen-lockfile --filter @org-graph/backend... --prod

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
