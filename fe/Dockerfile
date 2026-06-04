FROM node:25.6.1-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

EXPOSE 8001

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8001"]
