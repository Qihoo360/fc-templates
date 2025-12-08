import type { MessageAttachment } from '@/stores/promptStore'

// 支持的文件类型配置
export const FILE_CONFIG = {
  // 图片类型
  image: {
    types: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 
      'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif',
      'image/x-icon'
    ],
    extensions: [
      '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', 
      '.svg', '.heic', '.heif', '.ico'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: '🖼️'
  },
  // 文档类型
  document: {
    types: [
      'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/rtf', 'application/json', 'application/xml', 'text/xml',
      'text/html', 'text/css', 'text/javascript', 'text/typescript', 'application/javascript',
      'text/x-python', 'text/x-java', 'text/x-c', 'text/x-cpp',
      'application/x-yaml', 'text/yaml'
    ],
    extensions: [
      '.pdf', '.txt', '.md', '.csv', '.doc', '.docx', '.xls', '.xlsx', 
      '.ppt', '.pptx', '.rtf', '.json', '.xml', '.html', '.htm', '.css', 
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', 
      '.yaml', '.yml', '.log', '.ini', '.cfg', '.conf', '.sh', '.bat', '.ps1',
      '.sql', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.r'
    ],
    maxSize: 25 * 1024 * 1024, // 25MB
    icon: '📄'
  },
  // 音频类型
  audio: {
    types: [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 
      'audio/flac', 'audio/m4a', 'audio/x-ms-wma', 'audio/webm'
    ],
    extensions: [
      '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.webm'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: '🎵'
  },
  // 视频类型
  video: {
    types: [
      'video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime', 
      'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska'
    ],
    extensions: [
      '.mp4', '.webm', '.ogv', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.qt'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: '🎬'
  }
}

// 获取所有支持的MIME类型
export const getAllSupportedTypes = (): string[] => {
  return Object.values(FILE_CONFIG).flatMap(config => config.types)
}

// 获取所有支持的文件扩展名
export const getAllSupportedExtensions = (): string[] => {
  return Object.values(FILE_CONFIG).flatMap(config => config.extensions)
}

// 根据文件扩展名获取文件类型分类
export const getFileTypeCategoryByExtension = (fileName: string): 'image' | 'document' | 'audio' | 'video' | null => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase()
  
  for (const [category, config] of Object.entries(FILE_CONFIG)) {
    if (config.extensions.includes(extension)) {
      return category as 'image' | 'document' | 'audio' | 'video'
    }
  }
  return null
}

// 根据文件扩展名获取MIME类型
export const getMimeTypeByExtension = (fileName: string): string => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase()
  
  // 完整的文件扩展名到MIME类型映射
  const extensionToMimeType: Record<string, string> = {
    // 图片类型
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.ico': 'image/x-icon',
    
    // 文档类型
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rtf': 'application/rtf',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.c': 'text/x-c',
    '.cpp': 'text/x-cpp',
    '.h': 'text/x-c',
    '.hpp': 'text/x-cpp',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.log': 'text/plain',
    '.ini': 'text/plain',
    '.cfg': 'text/plain',
    '.conf': 'text/plain',
    
    // 音频类型
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.m4a': 'audio/m4a',
    '.wma': 'audio/x-ms-wma',
    
    // 视频类型
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.qt': 'video/quicktime'
  }
  
  return extensionToMimeType[extension] || 'application/octet-stream'
}
export const getFileTypeCategory = (mimeType: string, fileName?: string): 'image' | 'document' | 'audio' | 'video' | null => {
  // 首先尝试通过MIME类型判断
  for (const [category, config] of Object.entries(FILE_CONFIG)) {
    if (config.types.includes(mimeType)) {
      return category as 'image' | 'document' | 'audio' | 'video'
    }
  }
  
  // 如果MIME类型判断失败，尝试通过文件扩展名判断
  if (fileName) {
    return getFileTypeCategoryByExtension(fileName)
  }
  
  // 对于一些常见的通用MIME类型，尝试通过扩展名判断
  if (mimeType === 'application/octet-stream' || mimeType === '' || !mimeType) {
    if (fileName) {
      return getFileTypeCategoryByExtension(fileName)
    }
  }
  
  return null
}

// 根据文件类型获取图标
export const getFileIcon = (type: 'image' | 'document' | 'audio' | 'video'): string => {
  const config = FILE_CONFIG[type as keyof typeof FILE_CONFIG]
  return config?.icon || '📎'
}

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 验证文件类型
export const validateFileType = (file: File): { valid: boolean; error?: string } => {
  const category = getFileTypeCategory(file.type, file.name)
  
  if (!category) {
    const supportedExtensions = getAllSupportedExtensions().join(', ')
    return {
      valid: false,
      error: `不支持的文件类型。支持的格式：${supportedExtensions}`
    }
  }
  
  return { valid: true }
}

// 验证文件大小
export const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  const category = getFileTypeCategory(file.type, file.name)
  if (!category) {
    return { valid: false, error: '未知的文件类型' }
  }
  
  const config = FILE_CONFIG[category as keyof typeof FILE_CONFIG]
  if (!config) {
    return { valid: false, error: '未知的文件类型配置' }
  }
  
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `文件过大。最大支持 ${formatFileSize(config.maxSize)}`
    }
  }
  
  return { valid: true }
}

// 将文件转换为Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除data:image/jpeg;base64,前缀，只保留Base64数据
      const base64Data = result.split(',')[1]
      
      
      resolve(base64Data)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// 创建MessageAttachment对象
export const createMessageAttachment = async (file: File): Promise<MessageAttachment> => {
  
  // 优先通过文件扩展名确定MIME类型，这样更准确
  const inferredMimeType = getMimeTypeByExtension(file.name)
  const finalMimeType = inferredMimeType !== 'application/octet-stream' ? inferredMimeType : file.type
  
  
  // 验证文件（使用推断的MIME类型）
  const mockFileForValidation = {
    ...file,
    type: finalMimeType
  } as File
  
  const typeValidation = validateFileType(mockFileForValidation)
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error)
  }
  
  const sizeValidation = validateFileSize(mockFileForValidation)
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error)
  }
  
  // 转换为Base64
  const data = await fileToBase64(file)
  
  // 获取文件类型分类（使用最终确定的MIME类型）
  const type = getFileTypeCategory(finalMimeType, file.name)!
  
  
  return {
    id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    type,
    mimeType: finalMimeType, // 使用推断的MIME类型
    size: file.size,
    data,
    url: URL.createObjectURL(file) // 用于预览（如果需要）
  }
}

// 批量处理文件
export const processFiles = async (files: File[]): Promise<{
  attachments: MessageAttachment[]
  errors: string[]
}> => {
  const attachments: MessageAttachment[] = []
  const errors: string[] = []
  
  for (const file of files) {
    try {
      const attachment = await createMessageAttachment(file)
      attachments.push(attachment)
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : '处理失败'}`)
    }
  }
  
  return { attachments, errors }
}

// 清理临时URL
export const cleanupAttachmentUrls = (attachments: MessageAttachment[]) => {
  attachments.forEach(attachment => {
    if (attachment.url) {
      URL.revokeObjectURL(attachment.url)
    }
  })
}

// 检查模型是否支持多模态
export const isMultimodalSupported = (modelId: string): boolean => {
  const modelName = modelId.toLowerCase()
  
  // OpenAI模型
  if (modelName.includes('gpt-4') && (modelName.includes('vision') || modelName.includes('4o'))) {
    return true
  }
  
  // Gemini模型
  if (modelName.includes('gemini') && (modelName.includes('1.5') || modelName.includes('2.'))) {
    return true
  }
  
  // Claude模型
  if (modelName.includes('claude') && modelName.includes('3')) {
    return true
  }
  
  return false
}
