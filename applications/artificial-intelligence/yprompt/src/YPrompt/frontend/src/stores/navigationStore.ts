import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ModuleType = 'generate' | 'optimize' | 'playground' | 'library'

export interface ModuleConfig {
  id: ModuleType
  name: string
  icon: string
  path: string
  color: string
}

export const useNavigationStore = defineStore('navigation', () => {
  // 状态
  const currentModule = ref<ModuleType>('generate')
  const sidebarCollapsed = ref(false)
  const isMobile = ref(false)

  // 模块配置
  const modules: ModuleConfig[] = [
    {
      id: 'generate',
      name: '生成',
      icon: '🏠',
      path: '/generate',
      color: '#3B82F6'
    },
    {
      id: 'optimize',
      name: '优化',
      icon: '⚡',
      path: '/optimize',
      color: '#F59E0B'
    },
    {
      id: 'playground',
      name: '操练场',
      icon: '🎯',
      path: '/playground',
      color: '#10B981'
    },
    {
      id: 'library',
      name: '我的',
      icon: '📚',
      path: '/library',
      color: '#8B5CF6'
    }
  ]

  // 计算属性
  const currentModuleConfig = computed(() => {
    return modules.find(m => m.id === currentModule.value) || modules[0]
  })

  const sidebarWidth = computed(() => {
    return sidebarCollapsed.value ? '60px' : '140px'
  })

  // 方法
  const setCurrentModule = (module: ModuleType) => {
    currentModule.value = module
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setMobile = (mobile: boolean) => {
    isMobile.value = mobile
    // 移动端默认折叠侧边栏
    if (mobile) {
      sidebarCollapsed.value = true
    }
  }

  const getModuleByPath = (path: string): ModuleConfig | undefined => {
    return modules.find(m => m.path === path)
  }

  return {
    // 状态
    currentModule,
    sidebarCollapsed,
    isMobile,
    modules,
    
    // 计算属性
    currentModuleConfig,
    sidebarWidth,
    
    // 方法
    setCurrentModule,
    toggleSidebar,
    setMobile,
    getModuleByPath
  }
})