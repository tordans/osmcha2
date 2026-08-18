FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app
RUN apk add --no-cache jq

# Do not copy bunfig.toml before install (globalStore breaks image installs).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine

RUN apk add --no-cache jq

COPY --from=builder /app/build /srv/www
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/90-write-env-to-json.sh /docker-entrypoint.d

EXPOSE 80
