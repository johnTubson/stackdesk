FROM node:24.18.0-bookworm-slim

# Shared by: docker compose (local/VPS) and Render (Git → docker build).

RUN apt-get update \
  && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/local.db
ENV HOST=0.0.0.0
ENV PORT=3000

RUN mkdir -p data && pnpm build

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed && pnpm preview --host 0.0.0.0 --port ${PORT:-3000}"]
