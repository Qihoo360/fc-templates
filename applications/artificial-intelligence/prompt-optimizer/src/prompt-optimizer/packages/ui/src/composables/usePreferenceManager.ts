import type { Ref } from 'vue';
import type { AppServices } from '../types/services';

/**
 * [底层辅助函数] 获取偏好设置
 * @param services 服务引用
 * @param key 键名
 * @param defaultValue 默认值
 * @returns 设置值或默认值
 * @throws 如果preferenceService不可用，则抛出错误
 */
export async function getPreference<T>(
  services: Ref<AppServices | null>,
  key: string, 
  defaultValue: T
): Promise<T> {
  if (services.value?.preferenceService) {
    return services.value.preferenceService.get(key, defaultValue);
  }
  throw new Error(`[getPreference] preferenceService不可用，无法获取键: ${key}`);
}

/**
 * [底层辅助函数] 设置偏好设置
 * @param services 服务引用
 * @param key 键名
 * @param value 值
 * @throws 如果preferenceService不可用，则抛出错误
 */
export async function setPreference<T>(
  services: Ref<AppServices | null>,
  key: string, 
  value: T
): Promise<void> {
  if (services.value?.preferenceService) {
    return services.value.preferenceService.set(key, value);
  }
  throw new Error(`[setPreference] preferenceService不可用，无法设置键: ${key}`);
}

/**
 * [推荐] 创建一组与特定服务实例绑定的偏好设置辅助函数。
 * 这是在Vue组件和Composables中使用的首选方式。
 * 
 * @param services 来自 useAppInitializer 或 inject 的服务引用
 * @returns 返回一个包含 getPreference 和 setPreference 方法的对象，这些方法无需重复传递services参数。
 */
export function usePreferences(services: Ref<AppServices | null>) {
  /**
   * 获取一个偏好设置的值
   */
  const get = <T>(key: string, defaultValue: T): Promise<T> => {
    return getPreference(services, key, defaultValue);
  };

  /**
   * 设置一个偏好设置的值
   */
  const set = <T>(key: string, value: T): Promise<void> => {
    return setPreference(services, key, value);
  };

  return { getPreference: get, setPreference: set };
} 