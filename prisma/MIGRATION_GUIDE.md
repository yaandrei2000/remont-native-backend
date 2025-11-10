# Руководство по миграции: Объединение User и Master

## Проблема
При работе с удаленной базой данных могут возникнуть проблемы с правами:
- Нет прав на изменение таблиц
- Нет прав на создание shadow database

## Решение 1: Ручная SQL миграция (Рекомендуется)

### Шаг 1: Создайте резервную копию базы данных
```bash
pg_dump -h 37.252.17.3 -U your_user -d remont > backup.sql
```

### Шаг 2: Выполните SQL миграцию
Подключитесь к базе данных и выполните SQL из файла `migrations/manual_migration.sql`:

```bash
psql -h 37.252.17.3 -U your_user -d remont -f prisma/migrations/manual_migration.sql
```

Или через pgAdmin / DBeaver выполните SQL вручную.

### Шаг 3: После успешной миграции
```bash
# Перегенерируйте Prisma Client
npm run prisma:generate

# Проверьте, что все работает
npm run start:dev
```

## Решение 2: Использование prisma db push (если есть права)

Если у вас есть права на изменение таблиц, но нет прав на создание shadow database:

```bash
# Отключите shadow database в schema.prisma (временно)
# Или используйте флаг --skip-generate
npx prisma db push --skip-generate

# Затем перегенерируйте клиент
npm run prisma:generate
```

## Решение 3: Отключение shadow database

Добавьте в `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Опционально
}
```

Или используйте флаг при миграции:
```bash
npx prisma migrate dev --skip-seed --create-only
```

## Решение 4: Использование migrate deploy (для продакшена)

Если вы работаете с продакшен базой:

```bash
# Создайте миграцию локально (с локальной БД)
npx prisma migrate dev --name unify_user_master --create-only

# Примените миграцию на продакшене
npx prisma migrate deploy
```

## Проверка после миграции

1. Проверьте, что все мастера перенесены:
```sql
SELECT * FROM users WHERE role = 'MASTER';
```

2. Проверьте, что заказы связаны правильно:
```sql
SELECT o.id, o."orderNumber", c.phone as client_phone, m.phone as master_phone
FROM orders o
LEFT JOIN users c ON o."clientId" = c.id
LEFT JOIN users m ON o."masterId" = m.id
LIMIT 10;
```

3. Убедитесь, что нет заказов со старыми связями:
```sql
SELECT COUNT(*) FROM orders WHERE "userId" IS NOT NULL; -- Должно быть 0
```

## Откат миграции (если что-то пошло не так)

Если нужно откатить изменения:

```sql
BEGIN;

-- Восстановите старую структуру
ALTER TABLE "orders" RENAME COLUMN "clientId" TO "userId";

-- Восстановите foreign keys
ALTER TABLE "orders"
DROP CONSTRAINT IF EXISTS "orders_clientId_fkey";

ALTER TABLE "orders"
ADD CONSTRAINT "orders_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE SET NULL;

-- Удалите новые поля (опционально)
ALTER TABLE "users" 
DROP COLUMN IF EXISTS "role",
DROP COLUMN IF EXISTS "rating",
DROP COLUMN IF EXISTS "reviewsCount",
DROP COLUMN IF EXISTS "isActive";

COMMIT;
```

