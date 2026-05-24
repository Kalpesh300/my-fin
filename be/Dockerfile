FROM node:25.6.1-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
