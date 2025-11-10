# Backend API для ФастСервис

Backend приложение на NestJS с использованием Prisma ORM и PostgreSQL.

## Технологии

- **NestJS** - прогрессивный Node.js фреймворк
- **Prisma** - современный ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных
- **JWT** - аутентификация и авторизация
- **TypeScript** - типизированный JavaScript

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Настройте базу данных:
   - Создайте PostgreSQL базу данных
   - Обновите `DATABASE_URL` в файле `.env`

3. Запустите миграции:
```bash
npm run prisma:migrate
```

4. Сгенерируйте Prisma Client:
```bash
npm run prisma:generate
```

5. Заполните базу тестовыми данными (опционально):
```bash
npm run prisma:seed
```

## Запуск

### Разработка
```bash
npm run start:dev
```

### Продакшен
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Аутентификация

- `POST /auth/send-code` - Отправка кода подтверждения на телефон
- `POST /auth/verify-code` - Проверка кода и получение токенов
- `POST /auth/refresh` - Обновление access token

### Пользователи

- `GET /users/me` - Получение профиля текущего пользователя (требует авторизации)

### Услуги

- `GET /services/categories` - Получение всех категорий услуг
- `GET /services/categories/:slug` - Получение услуг по категории
- `GET /services/search?q=query` - Поиск услуг
- `GET /services/:slug` - Получение конкретной услуги

### Заказы

- `POST /orders` - Создание нового заказа (требует авторизации)
- `GET /orders` - Получение списка заказов пользователя (требует авторизации)
- `GET /orders/:id` - Получение детальной информации о заказе (требует авторизации)

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/remont_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
```

## Структура базы данных

Основные модели:
- **User** - пользователи
- **AuthCode** - коды подтверждения для входа
- **ServiceCategory** - категории услуг
- **Service** - услуги
- **Order** - заказы
- **OrderItem** - позиции заказа
- **OrderStep** - этапы выполнения заказа
- **Master** - мастера
- **PromoCode** - промокоды
- **Referral** - реферальная программа

## Разработка

### Prisma Studio

Для просмотра и редактирования данных в базе:
```bash
npm run prisma:studio
```

### Миграции

Создание новой миграции:
```bash
npm run prisma:migrate
```

## Тестирование

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
