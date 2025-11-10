/**
 * Скрипт для применения миграции вручную
 * Используйте этот скрипт, если у вас нет прав на создание shadow database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Чтение SQL миграции...');
  
  const sqlPath = path.join(__dirname, '../prisma/migrations/manual_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  console.log('🚀 Применение миграции...');
  console.log('⚠️  ВНИМАНИЕ: Убедитесь, что у вас есть резервная копия базы данных!');
  
  // Разбиваем SQL на отдельные команды (упрощенная версия)
  // В реальности лучше использовать pg или другой PostgreSQL клиент
  console.log('\nSQL миграция готова к выполнению.');
  console.log('Выполните SQL вручную через psql или другой клиент:');
  console.log(`\npsql -h YOUR_HOST -U YOUR_USER -d remont -f ${sqlPath}\n`);
  
  console.log('Или скопируйте содержимое файла и выполните в вашем SQL клиенте.');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

