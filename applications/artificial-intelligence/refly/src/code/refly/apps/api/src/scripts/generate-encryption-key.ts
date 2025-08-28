import crypto from 'node:crypto';

/**
 * Generates a secure random encryption key for AES-256-GCM
 * @returns The encryption key as a hex string
 */
export function generateEncryptionKey(): string {
  // Generate a 32-byte (256-bit) random key
  const key = crypto.randomBytes(32);
  return key.toString('hex');
}

/**
 * Helper script to generate a new encryption key
 * Can be run directly with: npx ts-node -r tsconfig-paths/register apps/api/src/utils/crypto.ts
 */
if (require.main === module) {
  const key = generateEncryptionKey();
  console.log('Generated encryption key (add to .env as ENCRYPTION_KEY):');
  console.log(key);
}
