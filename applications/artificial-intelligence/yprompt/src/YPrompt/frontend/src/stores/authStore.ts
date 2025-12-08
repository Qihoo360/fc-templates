/**
 * 认证状态管理
 * 管理用户登录、token、用户信息
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export interface User {
  id: number
  username: string
  name: string
  avatar: string
  email?: string
  auth_type: 'linux_do' | 'local'
  is_admin: number
  last_login_time?: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // 状态
  const token = ref<string | null>(localStorage.getItem('yprompt_token'))
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  /**
   * 设置token
   */
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('yprompt_token', newToken)
    } else {
      localStorage.removeItem('yprompt_token')
    }
  }
  
  /**
   * 设置用户信息
   */
  const setUser = (newUser: User | null) => {
    user.value = newUser
    if (newUser) {
      localStorage.setItem('yprompt_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('yprompt_user')
    }
  }
  
  /**
   * 从localStorage恢复用户信息
   */
  const restoreUser = () => {
    const savedUser = localStorage.getItem('yprompt_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        // 解析失败，清除无效数据
        localStorage.removeItem('yprompt_user')
      }
    }
  }
  
  /**
   * 通过Linux.do OAuth code登录
   */
  const loginWithLinuxDo = async (code: string): Promise<boolean> => {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/linux-do/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        setToken(result.data.token)
        setUser(result.data.user)
        
        // 登录成功后，强制重新加载云端配置
        try {
          // 1. 重新加载提示词规则
          const { promptConfigManager } = await import('@/config/prompts')
          await promptConfigManager.forceReloadFromCloud()
          
          // 2. 重新加载AI配置
          const { useSettingsStore } = await import('@/stores/settingsStore')
          const settingsStore = useSettingsStore()
          await settingsStore.forceReloadFromCloud()
        } catch (error) {
          console.error('登录后加载云端配置失败:', error)
        }
        
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 本地用户名密码登录
   */
  const loginWithPassword = async (username: string, password: string): Promise<boolean> => {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/local/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        setToken(result.data.token)
        setUser(result.data.user)
        
        // 登录成功后，强制重新加载云端配置
        try {
          // 1. 重新加载提示词规则
          const { promptConfigManager } = await import('@/config/prompts')
          await promptConfigManager.forceReloadFromCloud()
          
          // 2. 重新加载AI配置
          const { useSettingsStore } = await import('@/stores/settingsStore')
          const settingsStore = useSettingsStore()
          await settingsStore.forceReloadFromCloud()
        } catch (error) {
          console.error('登录后加载云端配置失败:', error)
        }
        
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 本地用户注册
   */
  const register = async (username: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      })
      
      const result = await response.json()
      
      if (result.code === 200) {
        return { success: true }
      } else {
        return { success: false, error: result.message || '注册失败' }
      }
    } catch (error) {
      return { success: false, error: '网络错误，请稍后重试' }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 获取认证配置
   */
  const getAuthConfig = async (): Promise<{
    linux_do_enabled: boolean
    linux_do_client_id: string
    linux_do_redirect_uri: string
    local_auth_enabled: boolean
    registration_enabled: boolean
  } | null> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/config`)
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        return result.data
      }
      return null
    } catch (error) {
      return null
    }
  }
  
  /**
   * 刷新token
   */
  const refreshToken = async (): Promise<boolean> => {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        setToken(result.data.token)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
  
  /**
   * 获取用户信息
   */
  const fetchUserInfo = async (): Promise<boolean> => {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/userinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        setUser(result.data)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
  
  /**
   * 登出
   */
  const logout = async () => {
    if (token.value) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
          },
        })
      } catch (error) {
        // 忽略登出错误，继续清除本地状态
      }
    }
    
    // 清除本地状态
    setToken(null)
    setUser(null)
    
    // 清除sessionStorage中的会话标记，确保下次登录重新加载云端配置
    sessionStorage.removeItem('yprompt_config_session_loaded')
    
    // 清除所有应用相关的 localStorage 数据
    const keysToRemove = [
      // 优化模块相关
      'user_prompt_optimize_data',
      'yprompt_optimize_active_mode',
      'yprompt_optimize_cache',
      'yprompt_user_optimize_active_tab',
      'yprompt_optimize_loaded_user_prompt',
      'yprompt_optimize_result',
      // 生成模块相关
      'yprompt_generate_messages',
      'yprompt_generate_prompt_data',
      // 其他可能的缓存
      'yprompt_settings_cache',
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 也可以清除所有以 yprompt_ 或 user_prompt_ 开头的 key
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (key.startsWith('yprompt_') || key.startsWith('user_prompt_')) {
        // 排除 token 和 user (已经在上面清除了)
        if (key !== 'yprompt_token' && key !== 'yprompt_user') {
          localStorage.removeItem(key)
        }
      }
    })
    
    // 跳转到登录页
    router.push('/login')
  }
  
  /**
   * 初始化认证状态
   */
  const initialize = async () => {
    // 恢复用户信息
    restoreUser()
    
    // 如果有token但没有用户信息，尝试获取
    if (token.value && !user.value) {
      await fetchUserInfo()
    }
  }
  
  return {
    // 状态
    token,
    user,
    isLoading,
    isLoggedIn,
    
    // 方法
    setToken,
    setUser,
    loginWithLinuxDo,
    loginWithPassword,
    register,
    getAuthConfig,
    refreshToken,
    fetchUserInfo,
    logout,
    initialize,
  }
})

