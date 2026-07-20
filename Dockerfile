# Stage 1 — build TypeScript + generate Prisma client
FROM node:22-slim AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate && pnpm build

# Stage 2 — production dependencies only
FROM node:22-slim AS prod-deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3 — Lambda image
FROM public.ecr.aws/lambda/nodejs:22
COPY --from=builder   /app/dist                ${LAMBDA_TASK_ROOT}/dist
COPY --from=prod-deps /app/node_modules        ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=builder   /app/node_modules/.prisma ${LAMBDA_TASK_ROOT}/node_modules/.prisma
CMD ["dist/lambda.handler"]
