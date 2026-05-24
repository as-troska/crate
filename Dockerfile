# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Empty string = same origin as backend (no hardcoded URL)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

# Persistent data directory (mount a volume here)
RUN mkdir -p /data
ENV DB_PATH=/data/user.db
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "app.js"]
