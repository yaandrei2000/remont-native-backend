-- Миграция: Объединение User и Master в одну таблицу
-- ВНИМАНИЕ: Выполняйте в транзакции!

BEGIN;

-- 1. Добавляем новые поля в таблицу users
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'CLIENT',
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- 2. Создаем enum для ролей (если еще не существует)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'MASTER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Изменяем тип колонки role на enum
ALTER TABLE "users" 
ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

-- 4. Обновляем данные: переносим мастеров из таблицы masters в users
-- Если мастер с таким телефоном уже существует в users, обновляем его
INSERT INTO "users" (id, phone, "firstName", "lastName", email, role, rating, "reviewsCount", "isActive", "createdAt", "updatedAt", points)
SELECT 
    m.id,
    m.phone,
    m."firstName",
    m."lastName",
    m.email,
    'MASTER'::"UserRole",
    m.rating,
    m."reviewsCount",
    m."isActive",
    m."createdAt",
    m."updatedAt",
    0
FROM "masters" m
ON CONFLICT (phone) DO UPDATE SET
    role = 'MASTER'::"UserRole",
    rating = EXCLUDED.rating,
    "reviewsCount" = EXCLUDED."reviewsCount",
    "isActive" = EXCLUDED."isActive";

-- 5. Обновляем внешние ключи в таблице orders
-- Переименовываем userId в clientId
ALTER TABLE "orders" 
RENAME COLUMN "userId" TO "clientId";

-- Обновляем foreign key для clientId
ALTER TABLE "orders"
DROP CONSTRAINT IF EXISTS "orders_userId_fkey";

ALTER TABLE "orders"
ADD CONSTRAINT "orders_clientId_fkey" 
FOREIGN KEY ("clientId") REFERENCES "users"(id) ON DELETE SET NULL;

-- Обновляем foreign key для masterId (теперь ссылается на users)
ALTER TABLE "orders"
DROP CONSTRAINT IF EXISTS "orders_masterId_fkey";

ALTER TABLE "orders"
ADD CONSTRAINT "orders_masterId_fkey" 
FOREIGN KEY ("masterId") REFERENCES "users"(id) ON DELETE SET NULL;

-- 6. Обновляем индексы
DROP INDEX IF EXISTS "orders_userId_idx";
CREATE INDEX IF NOT EXISTS "orders_clientId_idx" ON "orders"("clientId");

-- 7. Удаляем таблицу masters (ОСТОРОЖНО: только если данные перенесены!)
-- Раскомментируйте следующую строку только после проверки данных:
-- DROP TABLE IF EXISTS "masters";

COMMIT;

