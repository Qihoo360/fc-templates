# 📚 归档文档综合索引

本索引按功能特性对所有归档文档进行分类，帮助快速定位相关内容。

## 🏗️ 架构重构系列

### 核心架构演进
- **[101-singleton-refactor](./101-singleton-refactor/)** - 单例模式重构
  - 移除项目中的单例模式，改为依赖注入架构
  - 提高代码的可测试性和可维护性
  - 为后续架构重构奠定基础

- **[102-web-architecture-refactor](./102-web-architecture-refactor/)** - Web架构重构
  - 基于单例重构的基础，对Web应用和浏览器插件架构进行全面重构
  - 采用统一的Composable架构
  - 修复应用启动失败问题

- **[103-desktop-architecture](./103-desktop-architecture/)** - 桌面端架构
  - 桌面端（Electron）架构的设计和重构
  - 确保与Web端架构的一致性
  - 进程间通信优化

### 架构修复与优化
- **[111-electron-preference-architecture](./111-electron-preference-architecture/)** - Electron偏好架构
  - Electron PreferenceService架构重构
  - 竞态条件修复
  - 跨进程状态管理优化

## 🚀 功能开发系列

### 核心功能模块
- **[106-template-management](./106-template-management/)** - 模板管理功能
  - 模板的增删改查功能
  - 异步操作优化
  - 用户体验改进

- **[107-component-standardization](./107-component-standardization/)** - 组件标准化重构
  - 统一所有模态框/弹窗类组件的行为和API
  - 建立统一的组件API规范
  - 提高代码一致性和可维护性

### 界面功能优化
- **[104-test-panel-refactor](./104-test-panel-refactor/)** - 测试面板重构 📋
  - 测试面板功能重构和优化
  - 用户体验改进

- **[105-output-display-v2](./105-output-display-v2/)** - 输出显示v2 📋
  - 输出显示功能的第二版设计
  - 性能和用户体验优化

## 🎨 系统优化系列

### UI/UX系统
- **[108-layout-system](./108-layout-system/)** - 布局系统经验
  - 动态Flex布局实现经验
  - 响应式设计最佳实践
  - 布局系统架构总结

- **[109-theme-system](./109-theme-system/)** - 主题系统开发
  - 主题系统的设计和实现
  - 动态主题切换功能
  - 样式管理最佳实践

## 🔧 问题修复系列

### 存储与数据
- **[110-desktop-indexeddb-fix](./110-desktop-indexeddb-fix/)** - 桌面端IndexedDB修复
  - 桌面端IndexedDB兼容性问题修复
  - 数据存储稳定性改进
  - 跨平台存储方案优化

### 进程间通信
- **[112-desktop-ipc-fixes](./112-desktop-ipc-fixes/)** - 桌面端IPC修复合集
  - 语言切换按钮显示"Object Promise"问题修复
  - Vue响应式对象IPC序列化问题修复
  - IPC架构分析与修复
  - 跨环境异步接口统一
  - preload.js架构规范化

- **[115-ipc-serialization-fixes](./115-ipc-serialization-fixes/)** - IPC序列化修复与数据一致性 🔄
  - Vue响应式对象IPC序列化统一处理
  - safeSerialize函数实现
  - 业务逻辑层数据一致性修复
  - 模型数据丢失问题解决
  - 双重保护机制建立

## ⚙️ 服务重构系列

### 全面重构
- **[113-full-service-refactoring](./113-full-service-refactoring/)** - 全面服务重构
  - 服务层架构全面重构
  - 依赖注入优化
  - 服务接口标准化

- **[114-desktop-file-storage](./114-desktop-file-storage/)** - 桌面版文件存储实现 💾
  - 实现FileStorageProvider替代内存存储
  - 完整的数据持久化解决方案
  - 高性能文件I/O和错误恢复机制
  - 数据安全性增强：智能恢复机制、备份保护、原子性操作

- **[116-desktop-packaging-optimization](./116-desktop-packaging-optimization/)** - 桌面应用打包优化 📦
  - 从portable模式改为ZIP压缩包模式
  - 解决存储路径检测问题
  - 简化代码架构，提升用户体验

- **[119-csp-safe-template-processing](./119-csp-safe-template-processing/)** - CSP安全模板处理 🔒
  - 解决浏览器扩展CSP限制导致的模板编译失败
  - 实现环境自适应的模板处理机制
  - 保持跨平台功能完整性和向后兼容

## 🔍 快速查找指南

### 按问题类型查找
- **启动问题** → 102-web-architecture-refactor
- **显示异常** → 112-desktop-ipc-fixes
- **存储问题** → 110-desktop-indexeddb-fix, 114-desktop-file-storage, 116-desktop-packaging-optimization
- **数据一致性问题** → 114-desktop-file-storage, 115-ipc-serialization-fixes
- **序列化错误** → 112-desktop-ipc-fixes, 115-ipc-serialization-fixes
- **应用退出问题** → 114-desktop-file-storage
- **语言设置问题** → 112-desktop-ipc-fixes
- **布局问题** → 108-layout-system
- **主题问题** → 109-theme-system
- **模板问题** → 106-template-management, 119-csp-safe-template-processing
- **组件问题** → 107-component-standardization
- **CSP安全问题** → 119-csp-safe-template-processing
- **浏览器扩展问题** → 119-csp-safe-template-processing

### 按技术栈查找
- **Electron相关** → 103, 110, 111, 112, 114
- **Vue/前端相关** → 102, 104, 105, 107, 108, 109
- **浏览器扩展相关** → 119
- **架构设计相关** → 101, 102, 103, 111, 113
- **服务层相关** → 101, 106, 113, 119
- **IPC通信相关** → 103, 111, 112
- **模板系统相关** → 106, 119

### 按开发阶段查找
- **项目初期架构** → 101, 102, 103
- **功能开发阶段** → 104, 105, 106, 107
- **优化改进阶段** → 108, 109
- **问题修复阶段** → 110, 111, 112, 114, 119
- **重构完善阶段** → 113

### 按经验类型查找
- **架构设计经验** → 101, 102, 103, 111
- **功能开发经验** → 106, 107
- **UI/UX设计经验** → 108, 109
- **问题排查经验** → 110, 112, 114, 119
- **重构实践经验** → 101, 113

## 📖 使用建议

### 新手入门路径
1. **了解架构** → 101 → 102 → 103
2. **学习功能开发** → 106 → 107
3. **掌握系统优化** → 108 → 109
4. **学习问题排查** → 110 → 112 → 114

### 问题解决路径
1. **确定问题类型** → 查看"按问题类型查找"
2. **找到相关文档** → 阅读README了解概况
3. **深入技术细节** → 查看experience.md和troubleshooting.md
4. **应用解决方案** → 参考implementation.md

### 经验学习路径
1. **选择感兴趣的领域** → 查看"按技术栈查找"
2. **按时间顺序阅读** → 了解演进过程
3. **提取关键经验** → 重点关注experience.md
4. **建立知识体系** → 整合相关经验

---

**💡 提示**: 每个文档都包含完整的背景、实现和经验总结，建议根据实际需求选择性阅读。
