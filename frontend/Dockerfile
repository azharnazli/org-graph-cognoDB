# syntax=docker/dockerfile:1

# --- Build stage: install workspace deps, produce the static build ---
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types ./packages/shared-types
COPY frontend ./frontend

RUN pnpm install --frozen-lockfile --filter @org-graph/frontend...
RUN pnpm --filter @org-graph/frontend build

# --- Runtime stage: nginx serves the SPA and proxies /api to the backend ---
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
