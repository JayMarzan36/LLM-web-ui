FROM node:18-alpine as build

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Copy built site to nginx under `/static` so URLs like `/static/...` resolve
RUN mkdir -p /usr/share/nginx/html/static
COPY --from=build /_server/core/static/ /usr/share/nginx/html/static/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
