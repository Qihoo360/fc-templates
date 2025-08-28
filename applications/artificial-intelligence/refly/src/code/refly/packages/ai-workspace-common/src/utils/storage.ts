import { storage } from 'wxt/storage';

// unify management
export type StorageName = 'isCopilotOpen';

// sync storage
export const getSyncStorage = async <T>(name: StorageName) => {
  const res = await storage.getItem(`sync:${name}`);
  return res as T;
};
export const setSyncStorage = async <T>(name: StorageName, value: T) => {
  await storage.setItem(`sync:${name}`, value);
};

export const removeSyncStorage = async (name: StorageName) => {
  await storage.removeItem(`sync:${name}`);
};

// local storage
export const getLocalStorage = async <T>(name: StorageName) => {
  const res = await storage.getItem(`local:${name}`);
  return res as T;
};
export const setLocalStorage = async (name: StorageName, value: any) => {
  await storage.setItem(`local:${name}`, value);
};
export const removeLocalStorage = async (name: StorageName) => {
  await storage.removeItem(`local:${name}`);
};

export { storage };
