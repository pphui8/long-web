# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing and change port to 9000
RUN echo "server { \
    listen 9001; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 9001
CMD ["nginx", "-g", "daemon off;"]
