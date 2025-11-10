# Используем официальный Node.js образ
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Продакшен образ
FROM node:18-alpine AS production

WORKDIR /app

# Копируем package.json и устанавливаем только production зависимости
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Запускаем приложение
CMD ["node", "dist/src/main"]

EXPOSE 3000

