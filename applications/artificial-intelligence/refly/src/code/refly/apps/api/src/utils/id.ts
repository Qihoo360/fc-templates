import crypto from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';

export function sha256Hash(str: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

const RESOURCE_NAMESPACE = '45c341a9-8061-415e-ab09-a890f6934eda';

export function genResourceUuid(name: string): string {
  return uuidv5(name, RESOURCE_NAMESPACE);
}
