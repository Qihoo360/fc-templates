// @ts-nocheck
import { ref, computed } from 'vue'
import { useOptimizeStore } from '@/stores/optimizeStore'
import type { Version } from '@/stores/optimizeStore'

export function useVersionControl() {
  const optimizeStore = useOptimizeStore()
  
  const {
    versions,
    currentVersion,
    systemPrompt,
    userPrompt,
    optimizedPrompts,
    switchVersion: storeSwitchVersion
  } = optimizeStore

  // 创建新版本
  const createVersion = async (
    systemPromptContent: string,
    userPromptContent: string,
    changeType: 'major' | 'minor' | 'patch',
    changeSummary: string,
    appliedSuggestions: string[] = []
  ): Promise<Version> => {
    // 生成新版本号
    const newVersionNumber = generateVersionNumber(currentVersion.value, changeType)
    
    const newVersion: Version = {
      id: `version_${Date.now()}_${Math.random()}`,
      version: newVersionNumber,
      systemPrompt: systemPromptContent,
      userPrompt: userPromptContent,
      changes: generateChanges(
        systemPrompt.value,
        systemPromptContent,
        userPrompt.value,
        userPromptContent
      ),
      appliedSuggestions,
      createdAt: new Date(),
      note: changeSummary,
      tag: 'draft'
    }

    versions.value.push(newVersion)
    storeSwitchVersion(newVersionNumber)
    
    return newVersion
  }

  // 生成版本号
  const generateVersionNumber = (
    currentVersionStr: string,
    changeType: 'major' | 'minor' | 'patch'
  ): string => {
    // 如果是原始版本，从V1.0.0开始
    if (currentVersionStr === 'original') {
      return 'V1.0.0'
    }

    // 解析当前版本号
    const versionMatch = currentVersionStr.match(/V(\d+)\.(\d+)\.(\d+)/)
    if (!versionMatch) {
      return 'V1.0.0'
    }

    let [_, major, minor, patch] = versionMatch.map(Number)

    switch (changeType) {
      case 'major':
        return `V${major + 1}.0.0`
      case 'minor':
        return `V${major}.${minor + 1}.0`
      case 'patch':
        return `V${major}.${minor}.${patch + 1}`
      default:
        return currentVersionStr
    }
  }

  // 生成变更记录
  const generateChanges = (
    oldSystem: string,
    newSystem: string,
    oldUser: string,
    newUser: string
  ) => {
    const changes = []

    // 简单的变化检测
    if (oldSystem !== newSystem) {
      changes.push({
        type: 'modify' as const,
        field: 'system' as const,
        content: newSystem
      })
    }

    if (oldUser !== newUser) {
      changes.push({
        type: 'modify' as const,
        field: 'user' as const,
        content: newUser
      })
    }

    return changes
  }

  // 切换版本
  const switchVersion = (version: string) => {
    storeSwitchVersion(version)
  }

  // 获取版本历史
  const getVersionHistory = computed(() => {
    const history = [
      {
        version: 'original',
        systemPrompt: systemPrompt.value,
        userPrompt: userPrompt.value,
        createdAt: new Date(),
        tag: 'initial' as const,
        changes: [],
        appliedSuggestions: []
      },
      ...versions.value
    ]
    
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  })

  // 获取版本对比
  const getVersionDiff = (version1: string, version2: string) => {
    const v1 = getVersionData(version1)
    const v2 = getVersionData(version2)
    
    if (!v1 || !v2) return null

    return {
      system: {
        old: v1.systemPrompt,
        new: v2.systemPrompt
      },
      user: {
        old: v1.userPrompt,
        new: v2.userPrompt
      }
    }
  }

  // 获取版本数据
  const getVersionData = (version: string) => {
    if (version === 'original') {
      return {
        systemPrompt: systemPrompt.value,
        userPrompt: userPrompt.value,
        createdAt: new Date()
      }
    }
    
    return versions.value.find(v => v.version === version)
  }

  // 回滚到指定版本
  const rollbackToVersion = async (version: string): Promise<Version> => {
    const versionData = getVersionData(version)
    if (!versionData) {
      throw new Error('版本不存在')
    }

    // 创建回滚版本
    return await createVersion(
      versionData.systemPrompt,
      versionData.userPrompt,
      'patch',
      `回滚到版本 ${version}`,
      []
    )
  }

  // 删除版本
  const deleteVersion = (version: string) => {
    const index = versions.value.findIndex(v => v.version === version)
    if (index > -1) {
      versions.value.splice(index, 1)
      
      // 如果删除的是当前版本，切换到原始版本
      if (currentVersion.value === version) {
        storeSwitchVersion('original')
      }
    }
  }

  // 设置版本标签
  const setVersionTag = (version: string, tag: Version['tag']) => {
    const versionData = versions.value.find(v => v.version === version)
    if (versionData) {
      versionData.tag = tag
    }
  }

  // 获取版本统计
  const getVersionStats = computed(() => {
    const stats = {
      total: versions.value.length,
      byTag: {} as Record<string, number>,
      latest: versions.value.length > 0 ? versions.value[versions.value.length - 1] : null
    }

    versions.value.forEach(version => {
      const tag = version.tag || 'untagged'
      stats.byTag[tag] = (stats.byTag[tag] || 0) + 1
    })

    return stats
  })

  return {
    // 版本操作
    createVersion,
    switchVersion,
    rollbackToVersion,
    deleteVersion,
    setVersionTag,
    
    // 版本信息
    getVersionHistory,
    getVersionDiff,
    getVersionData,
    getVersionStats,
    
    // 当前状态
    currentVersion,
    versions
  }
}