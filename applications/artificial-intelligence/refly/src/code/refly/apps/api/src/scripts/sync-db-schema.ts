import { migrateDbSchema } from '../utils/prisma';

if (require.main === module) {
  console.log('Migrating DB schema...');

  migrateDbSchema();
  console.log('DB schema migrated!');
}
