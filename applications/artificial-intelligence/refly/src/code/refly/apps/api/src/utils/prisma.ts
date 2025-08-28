import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { findTargetDirectory } from './runtime';

/**
 * Migrates the database schema by generating and applying a diff between
 * the current database state and the Prisma schema file.
 * Requires DATABASE_URL and AUTO_MIGRATE_DB_SCHEMA environment variables.
 */
export const migrateDbSchema = (): void => {
  // Start looking for node_modules from the directory of this script
  const nodeModulesPath =
    findTargetDirectory(__dirname, 'node_modules') ||
    findTargetDirectory(resolve(process.cwd()), 'node_modules') ||
    join(process.cwd(), 'node_modules');

  // Check if the prisma binary exists
  let prismaBin = join(nodeModulesPath, '.bin', 'prisma');

  // Fallback to using pnpm bin if the above approach fails
  if (!existsSync(prismaBin)) {
    console.warn(
      'Could not find Prisma binary using directory traversal, falling back to pnpm bin',
    );

    try {
      const binPath = execSync('pnpm bin', { encoding: 'utf-8' }).trim();
      prismaBin = join(binPath, 'prisma');
    } catch (error) {
      console.error('Failed to execute "pnpm bin" command:', error);
      throw new Error(
        'Could not locate Prisma binary. Please ensure pnpm is installed and the project dependencies are properly set up.',
      );
    }
  }

  const prismaRoot = findTargetDirectory(__dirname, 'prisma');
  if (!prismaRoot) {
    throw new Error('Could not find prisma root directory');
  }

  const prismaSchemaPath = join(prismaRoot, 'schema.prisma');

  execSync(
    `${prismaBin} migrate diff --from-url ${process.env.DATABASE_URL} --to-schema-datamodel ${prismaSchemaPath} --script | ${prismaBin} db execute --stdin`,
    { stdio: 'inherit' },
  );
};
