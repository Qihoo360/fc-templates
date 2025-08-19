# Electron IPC 最佳实践

## 问题背景

在Electron应用中，Vue的响应式对象不能直接通过IPC（进程间通信）传递，会导致"An object could not be cloned"错误。这是因为Vue的响应式对象包含了不可序列化的代理包装器。

## 核心原则

### 1. ElectronProxy层自动处理序列化

✅ **现在的做法**：
```javascript
// 可以直接传递Vue响应式对象，ElectronProxy会自动序列化
await modelManager.addModel(newModel.value.key, {
  name: newModel.value.name,
  llmParams: newModel.value.llmParams // ElectronProxy会自动清理响应式包装
})
```

**架构优势**：
- Vue组件无需关心序列化细节
- 所有序列化逻辑集中在ElectronProxy层
- 自动保护，不易遗漏
- 代码更简洁，开发体验更好

### 2. 自动序列化处理

**ElectronProxy层自动处理序列化**：
- 所有ElectronProxy类已经内置了序列化处理
- Vue组件无需手动调用序列化函数
- 直接传递Vue响应式对象即可，代理层会自动清理

**技术实现**：
- 使用 `packages/core/src/utils/ipc-serialization.ts` 中的 `safeSerializeForIPC` 函数
- 在每个需要的ElectronProxy方法中自动调用序列化
- 确保100%的IPC兼容性

### 3. 识别问题的方法

当你看到以下错误时，说明存在IPC序列化问题：
- `An object could not be cloned`
- `DataCloneError`
- `Failed to execute 'postMessage'`

## 常见问题场景

### 1. 模型管理
```javascript
// ✅ 现在可以直接传递Vue响应式对象
await modelManager.addModel(key, {
  llmParams: formData.value.llmParams // ElectronProxy会自动序列化
})
```

### 2. 历史记录
```javascript
// ✅ 现在可以直接传递Vue响应式对象
await historyManager.createNewChain({
  metadata: { mode: optimizationMode.value } // ElectronProxy会自动序列化
})
```

### 3. 模板管理
```javascript
// ✅ 现在可以直接传递Vue响应式对象
await templateManager.saveTemplate({
  content: form.value.messages // ElectronProxy会自动序列化
})
```

## 开发检查清单

现在开发更简单了，只需要检查：

- [ ] 在desktop环境下是否测试过？
- [ ] 是否有直接的IPC调用绕过了ElectronProxy？
- [ ] 新增的ElectronProxy方法是否包含了序列化处理？

## 调试技巧

### 1. 检查对象类型
```javascript
console.log('Object type:', Object.prototype.toString.call(obj))
console.log('Is reactive:', obj.__v_isReactive)
console.log('Is ref:', obj.__v_isRef)
```

### 2. 测试序列化
```javascript
try {
  JSON.stringify(obj)
  console.log('Object is serializable')
} catch (error) {
  console.error('Object is not serializable:', error)
}
```

### 3. 使用开发工具
在Chrome DevTools中，响应式对象会显示为 `Proxy` 类型。

## 架构建议

### 1. ElectronProxy层统一处理
序列化处理已经移到ElectronProxy层，Vue组件可以直接调用：

```javascript
// 在组件方法中 - 现在更简单了
const handleSave = async () => {
  await service.save(formData.value) // 直接传递，无需手动序列化
}
```

### 2. 新增ElectronProxy方法的规范
当添加新的ElectronProxy方法时，对复杂对象参数进行序列化：

```typescript
async newMethod(complexObject: SomeType): Promise<ResultType> {
  // 对复杂对象参数进行序列化
  const safeObject = safeSerializeForIPC(complexObject);
  return this.electronAPI.someService.newMethod(safeObject);
}
```

### 3. 类型安全
ElectronProxy的接口应该接受Vue响应式对象，内部自动处理：

```typescript
interface IModelManager {
  addModel(key: string, config: ModelConfig | Ref<ModelConfig>): Promise<void>
  // 接口层面支持响应式对象，实现层面自动序列化
}
```

## 性能考虑

- ElectronProxy层使用 `JSON.parse(JSON.stringify())` 确保100%兼容性
- 序列化只在IPC边界发生，不影响Vue组件性能
- 避免在渲染循环中进行频繁的服务调用
- 对于大型对象，考虑分批处理或使用更细粒度的数据传递

## 测试策略

1. **单元测试**：确保序列化函数正确处理各种数据类型
2. **集成测试**：在desktop环境下测试所有IPC调用
3. **回归测试**：每次修改涉及IPC的代码后，都要在desktop环境下测试

## 总结

现在的架构已经大大简化了Electron IPC的使用：

1. **Vue组件层**：直接传递响应式对象，无需关心序列化
2. **ElectronProxy层**：自动处理序列化，确保IPC兼容性
3. **Main进程层**：双重保护，处理边缘情况
4. **开发体验**：更简洁的代码，更少的出错机会

记住：**现在可以放心地传递Vue响应式对象，架构会自动处理！**

## 📚 相关文档

- [112-Desktop IPC修复](../archives/112-desktop-ipc-fixes/) - IPC架构分析和语言切换修复
- [115-IPC序列化修复](../archives/115-ipc-serialization-fixes/) - Vue响应式对象序列化解决方案
- [ElectronProxy层序列化](../archives/115-ipc-serialization-fixes/proxy-layer-serialization.md) - 技术实现细节
- [架构演进记录](../archives/115-ipc-serialization-fixes/architecture-evolution.md) - 从手动到自动的演进过程
