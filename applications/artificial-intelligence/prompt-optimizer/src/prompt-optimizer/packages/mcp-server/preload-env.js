// 预加载环境变量脚本
// 这个脚本会在 Node.js 启动时通过 -r 参数预加载
// 确保环境变量在任何模块导入之前就被加载到 process.env 中

// 使用 ESM 语法
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname (ESM中需要手动构建)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const paths = [
  // 1. 当前工作目录
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  
  // 2. 项目根目录（从 mcp-server 目录向上一级）
  resolve(process.cwd(), '../.env.local'),
  resolve(process.cwd(), '../.env'),
  
  // 3. 从 mcp-server 目录向上查找
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env.local'),
  resolve(__dirname, '../../.env')
];

// 静默加载环境变量
paths.forEach(path => {
  try {
    config({ path });
  } catch (error) {
    // 忽略文件不存在的错误
  }
});

console.log('Environment variables loaded for MCP server');
