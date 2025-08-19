import { useToast } from '../composables/useToast'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function createErrorHandler(context: string) {
  const toast = useToast()
  
  return {
    handleError(error: unknown) {
      console.error(`[${context}]错误:`, error)
      
      if (error instanceof AppError) {
        toast.error(error.message)
        return
      }
      
      if (error instanceof Error) {
        toast.error(error.message || `${context}过程中发生错误`)
        return
      }
      
      toast.error(`${context}过程中发生未知错误`)
    }
  }
}

export const errorMessages = {
  SERVICE_NOT_INITIALIZED: '服务未初始化，请稍后重试',
  TEMPLATE_NOT_SELECTED: '请先选择提示词模板',
  INCOMPLETE_TEST_INFO: '请填写完整的测试信息',
  LOAD_TEMPLATE_FAILED: '加载提示词失败',
  CLEAR_HISTORY_FAILED: '清空历史记录失败'
} as const 