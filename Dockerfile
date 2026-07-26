# Stage 1 — build TypeScript + generate Prisma client
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN DATABASE_URL=${DATABASE_URL} pnpm exec prisma generate && pnpm build
RUN pnpm prune --prod

# Stage 2 — Lambda image
FROM public.ecr.aws/lambda/nodejs:22
COPY --from=builder /app/dist         ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
CMD ["dist/lambda.handler"]
