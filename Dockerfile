# Stage 1: Install dependencies and build application
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime environment
FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite-libs

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 3032

# Start server using the port fallback script
CMD ["npm", "run", "start"]
