import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 模拟 window 对象
const windowMock = {
  localStorage: {
    store: new Map(),
    getItem: vi.fn((key) => {
      return windowMock.localStorage.store.get(key) || null;
    }),
    setItem: vi.fn((key, value) => {
      windowMock.localStorage.store.set(key, value);
    }),
    removeItem: vi.fn((key) => {
      windowMock.localStorage.store.delete(key);
    }),
    clear: vi.fn(() => {
      windowMock.localStorage.store.clear();
    })
  }
};

// 全局注入 window mock
Object.defineProperty(global, 'window', {
  value: windowMock,
  writable: true,
  configurable: true
});

// 全局注入 localStorage
Object.defineProperty(global, 'localStorage', {
  value: windowMock.localStorage,
  writable: true,
  configurable: true
});

// 模拟 Teleport 组件
config.global.stubs = {
  Teleport: {
    template: '<div><slot /></div>'
  }
}

// 在每个测试之前重置 mock 状态
beforeEach(() => {
  windowMock.localStorage.store.clear();
  vi.clearAllMocks();
}); 