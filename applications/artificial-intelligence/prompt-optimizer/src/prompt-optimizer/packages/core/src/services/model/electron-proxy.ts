import { IModelManager, ModelConfig } from './types';
import { safeSerializeForIPC } from '../../utils/ipc-serialization';

/**
 * Electron环境下的ModelManager代理
 * 通过IPC调用主进程中的真实ModelManager实例
 */
export class ElectronModelManagerProxy implements IModelManager {
  private electronAPI: any;

  constructor() {
    // 验证Electron环境
    if (typeof window === 'undefined' || !(window as any).electronAPI) {
      throw new Error('ElectronModelManagerProxy can only be used in Electron renderer process');
    }
    this.electronAPI = (window as any).electronAPI;
  }

  async ensureInitialized(): Promise<void> {
    // 在代理模式下，初始化由主进程负责，这里只是一个空实现
    // 但我们可以添加一个IPC调用来触发主进程的ensureInitialized
    await this.electronAPI.model.ensureInitialized();
  }

  async isInitialized(): Promise<boolean> {
    return this.electronAPI.model.isInitialized();
  }



  async getAllModels(): Promise<Array<ModelConfig & { key: string }>> {
    return this.electronAPI.model.getAllModels();
  }

  async getModel(key: string): Promise<ModelConfig | undefined> {
    const models = await this.getAllModels();
    return models.find(m => m.key === key);
  }

  async addModel(key: string, config: ModelConfig): Promise<void> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeConfig = safeSerializeForIPC({ ...config, key });
    await this.electronAPI.model.addModel(safeConfig);
  }

  async updateModel(key: string, config: Partial<ModelConfig>): Promise<void> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeConfig = safeSerializeForIPC(config);
    await this.electronAPI.model.updateModel(key, safeConfig);
  }

  async deleteModel(key: string): Promise<void> {
    await this.electronAPI.model.deleteModel(key);
  }

  async enableModel(key: string): Promise<void> {
    await this.updateModel(key, { enabled: true });
  }

  async disableModel(key: string): Promise<void> {
    await this.updateModel(key, { enabled: false });
  }

  async getEnabledModels(): Promise<Array<ModelConfig & { key: string }>> {
    return this.electronAPI.model.getEnabledModels();
  }

  // 实现 IImportExportable 接口

  /**
   * 导出所有模型配置
   */
  async exportData(): Promise<ModelConfig[]> {
    return (this.electronAPI as any).model.exportData();
  }

  /**
   * 导入模型配置
   */
  async importData(data: any): Promise<void> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeData = safeSerializeForIPC(data);
    return (this.electronAPI as any).model.importData(safeData);
  }

  /**
   * 获取数据类型标识
   */
  async getDataType(): Promise<string> {
    return (this.electronAPI as any).model.getDataType();
  }

  /**
   * 验证模型数据格式
   */
  async validateData(data: any): Promise<boolean> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeData = safeSerializeForIPC(data);
    return (this.electronAPI as any).model.validateData(safeData);
  }
}