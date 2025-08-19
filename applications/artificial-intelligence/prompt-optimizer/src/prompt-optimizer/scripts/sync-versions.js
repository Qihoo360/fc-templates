const fs = require('fs');
const path = require('path');

const rootPackage = require('../package.json');
const targetVersion = rootPackage.version;

console.log(`🔄 开始同步版本号至 ${targetVersion}`);

// 需要同步版本的文件列表
const versionFiles = [
  {
    path: 'packages/extension/public/manifest.json',
    field: 'version',
    description: '浏览器扩展清单文件'
  },
  {
    path: 'packages/desktop/package.json',
    field: 'version',
    description: 'Desktop应用包文件'
  }
  // 未来可以添加更多需要同步的文件
];

let syncCount = 0;
let errorCount = 0;

versionFiles.forEach(file => {
  try {
    const filePath = path.resolve(__dirname, '..', file.path);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${file.path}`);
      errorCount++;
      return;
    }
    
    // 读取并更新文件
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const oldVersion = content[file.field];
    
    if (oldVersion === targetVersion) {
      console.log(`✅ ${file.description}: ${file.path} 版本已是最新 (${targetVersion})`);
    } else {
      content[file.field] = targetVersion;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      console.log(`✅ ${file.description}: ${file.path} 版本已更新 ${oldVersion} → ${targetVersion}`);
      syncCount++;
    }
  } catch (error) {
    console.error(`❌ 更新 ${file.path} 时出错:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 同步完成: ${syncCount} 个文件已更新, ${errorCount} 个错误`);

if (errorCount > 0) {
  process.exit(1);
} 