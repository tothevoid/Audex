FROM node:22.14-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

#env
ARG SERVER_API_URL

ENV VITE_SERVER_API_URL=$SERVER_API_URL

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/nginx/conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]