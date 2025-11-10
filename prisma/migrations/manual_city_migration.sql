-- Миграция для добавления таблицы городов и связи с пользователями
-- Выполните этот SQL в вашей базе данных

-- Создаем таблицу городов
CREATE TABLE IF NOT EXISTS "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- Создаем уникальный индекс для названия города
CREATE UNIQUE INDEX IF NOT EXISTS "cities_name_key" ON "cities"("name");

-- Создаем индекс для поиска по названию
CREATE INDEX IF NOT EXISTS "cities_name_idx" ON "cities"("name");

-- Добавляем поле cityId в таблицу users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cityId" TEXT;

-- Создаем внешний ключ для связи users -> cities
ALTER TABLE "users" 
ADD CONSTRAINT IF NOT EXISTS "users_cityId_fkey" 
FOREIGN KEY ("cityId") REFERENCES "cities"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Создаем индекс для cityId
CREATE INDEX IF NOT EXISTS "users_cityId_idx" ON "users"("cityId");

-- Вставляем города
INSERT INTO "cities" ("id", "name", "region", "isActive", "createdAt", "updatedAt")
VALUES 
    ('city_1', 'Санкт-Петербург', 'Ленинградская область', true, NOW(), NOW()),
    ('city_2', 'Астрахань', 'Астраханская область', true, NOW(), NOW()),
    ('city_3', 'Архангельск', 'Архангельская область', true, NOW(), NOW()),
    ('city_4', 'Белгород', 'Белгородская область', true, NOW(), NOW()),
    ('city_5', 'Барнаул', 'Алтайский край', true, NOW(), NOW()),
    ('city_6', 'Брянск', 'Брянская область', true, NOW(), NOW()),
    ('city_7', 'Воронеж', 'Воронежская область', true, NOW(), NOW()),
    ('city_8', 'Владимир', 'Владимирская область', true, NOW(), NOW()),
    ('city_9', 'Волгоград', 'Волгоградская область', true, NOW(), NOW()),
    ('city_10', 'Екатеринбург', 'Свердловская область', true, NOW(), NOW()),
    ('city_11', 'Иваново', 'Ивановская область', true, NOW(), NOW()),
    ('city_12', 'Казань', 'Республика Татарстан', true, NOW(), NOW()),
    ('city_13', 'Калуга', 'Калужская область', true, NOW(), NOW()),
    ('city_14', 'Краснодар', 'Краснодарский край', true, NOW(), NOW()),
    ('city_15', 'Москва', 'Московская область', true, NOW(), NOW()),
    ('city_16', 'Нижний Новгород', 'Нижегородская область', true, NOW(), NOW()),
    ('city_17', 'Новосибирск', 'Новосибирская область', true, NOW(), NOW()),
    ('city_18', 'Омск', 'Омская область', true, NOW(), NOW()),
    ('city_19', 'Пермь', 'Пермский край', true, NOW(), NOW()),
    ('city_20', 'Ростов-на-Дону', 'Ростовская область', true, NOW(), NOW()),
    ('city_21', 'Самара', 'Самарская область', true, NOW(), NOW()),
    ('city_22', 'Тольятти', 'Самарская область', true, NOW(), NOW()),
    ('city_23', 'Уфа', 'Республика Башкортостан', true, NOW(), NOW()),
    ('city_24', 'Челябинск', 'Челябинская область', true, NOW(), NOW()),
    ('city_25', 'Ярославль', 'Ярославская область', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;



