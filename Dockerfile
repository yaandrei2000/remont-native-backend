FROM node:20.17.0 AS base

RUN apt-get update && \
    apt-get install -y \
    make \
    gcc \
    g++ \
    python3 \
    python3-pip \
    pkg-config \
    libpixman-1-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev

RUN npm install -g node-gyp

RUN npm install -g npm@latest

RUN npm install -g @nestjs/cli

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

FROM base AS build

COPY . .

RUN npx prisma generate

RUN npm run build

FROM base AS production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./

RUN npm ci --only=production

COPY --from=build /app/dist ./dist

CMD ["node", "dist/main"]
EXPOSE 4000