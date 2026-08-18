import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Ищем .env в нескольких возможных местах
const candidates = [
  path.resolve(__dirname, '../.env'),   // backend/.env
  path.resolve(__dirname, '../../.env'), // icq_full/.env
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log('📄 Загружен .env из:', p);
    break;
  }
}

// require ПОСЛЕ dotenv, чтобы env успел загрузиться
const sequelize = require('../src/config/database').default;

(async () => {
  await sequelize.query('DROP TABLE IF EXISTS "Messages" CASCADE');
  await sequelize.query('DROP TABLE IF EXISTS "ConversationMembers" CASCADE');
  await sequelize.query('DROP TABLE IF EXISTS "Conversations" CASCADE');
  console.log('✅ Старые таблицы чатов удалены');
  process.exit(0);
})().catch((e: any) => { console.error(e); process.exit(1); });
