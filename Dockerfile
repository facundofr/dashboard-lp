FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate

FROM node:20-alpine
RUN apk add --no-cache tzdata openssl
ENV TZ=America/Argentina/Buenos_Aires
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=server-build --chown=app:app /app/server ./server
COPY --from=client-build --chown=app:app /app/client/dist ./client/dist
COPY --chown=app:app .env.example .env
RUN chown -R app:app /app
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1
ENTRYPOINT ["sh", "-c", "cd server && npx prisma db push && node src/index.js"]