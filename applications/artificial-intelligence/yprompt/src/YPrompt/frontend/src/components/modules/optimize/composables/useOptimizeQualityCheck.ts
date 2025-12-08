// src/components/modules/optimize/composables/useOptimizeQualityCheck.ts

/**
 * 质量检测 composable，防止过度优化
 * 
 * 核心功能：
 * 1. 检测结构化标记（防止用户提示词变成系统提示词风格）
 * 2. 相对长度控制（基于原始长度动态判断）
 * 3. 意图保留检测
 */

export interface QualityCheckResult {
  length: number
  lengthRatio: number
  lengthStatus: 'good' | 'warning' | 'error'
  hasStructureMarkers: boolean
  intentPreserved: boolean
  warnings: string[]
}

export function useOptimizeQualityCheck() {
  // 结构化标记列表（这些标记表示过度结构化）
  const STRUCTURE_MARKERS = [
    '【', '】',     // 中文方括号
    '《', '》',     // 中文书名号
    '##', '###',    // Markdown标题
    '1.', '2.', '3.', // 数字列表
    '- [ ]', '- [x]' // Markdown任务列表
  ]
  
  /**
   * 检测文本是否包含结构化标记
   */
  const hasStructureMarkers = (text: string): boolean => {
    return STRUCTURE_MARKERS.some(marker => text.includes(marker))
  }
  
  /**
   * 获取长度状态（相对控制）
   * 
   * 策略：
   * - 短草稿 (1-20字): 扩展到20-100字 (x3-10倍合理)
   * - 中草稿 (20-100字): 扩展到30-150字 (x1.5-3倍)
   * - 长草稿 (100-300字): 保持100-350字 (x0.8-1.5倍)
   * - 超长草稿 (>300字): 精简到200-400字 (x0.5-1倍)
   */
  const getLengthStatus = (originalLength: number, optimizedLength: number): 'good' | 'warning' | 'error' => {
    const ratio = originalLength > 0 ? optimizedLength / originalLength : 0
    
    // 短草稿场景 (1-20字)
    if (originalLength <= 20) {
      if (optimizedLength <= 100) return 'good'      // ✅ 扩展到≤100字
      if (optimizedLength <= 200) return 'warning'   // ⚠️ 扩展到100-200字
      return 'error'                                 // ❌ 过度扩展
    }
    
    // 中草稿场景 (20-100字)
    if (originalLength <= 100) {
      if (ratio <= 3) return 'good'        // ✅ x1.5-3倍合理
      if (ratio <= 5) return 'warning'     // ⚠️ x3-5倍警告
      return 'error'                       // ❌ >x5倍过度
    }
    
    // 长草稿场景 (100-300字)
    if (originalLength <= 300) {
      if (ratio <= 1.5) return 'good'      // ✅ 保持或微增
      if (ratio <= 2) return 'warning'     // ⚠️ 增长过多
      return 'error'                       // ❌ 过度扩展
    }
    
    // 超长草稿场景 (>300字)
    if (ratio <= 1) return 'good'          // ✅ 保持或精简
    if (ratio <= 1.5) return 'warning'     // ⚠️ 应该精简但增加了
    return 'error'                         // ❌ 严重过度
  }
  
  /**
   * 生成长度状态的详细描述
   */
  const getLengthStatusMessage = (originalLength: number, optimizedLength: number, status: string): string => {
    const ratio = originalLength > 0 ? optimizedLength / originalLength : 0
    const ratioText = ratio.toFixed(1)
    
    if (originalLength <= 20) {
      if (status === 'good') return `短草稿扩展合理 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)`
      if (status === 'warning') return `扩展偏多 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，建议精简`
      return `过度扩展 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，应控制在100字以内`
    }
    
    if (originalLength <= 100) {
      if (status === 'good') return `中等草稿优化合理 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)`
      if (status === 'warning') return `扩展较多 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，建议控制在x3倍以内`
      return `过度扩展 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，远超合理范围`
    }
    
    if (originalLength <= 300) {
      if (status === 'good') return `长草稿处理得当 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)`
      if (status === 'warning') return `略微增长 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，长草稿应保持或微调`
      return `不应扩展 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，长草稿需要精简而非扩展`
    }
    
    // 超长草稿
    if (status === 'good') return `超长草稿处理合理 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)`
    if (status === 'warning') return `应该精简 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，超长草稿需要缩短`
    return `严重问题 (${originalLength}字 → ${optimizedLength}字, x${ratioText}倍)，超长草稿应精简到300字以内`
  }
  
  /**
   * 完整质量检测
   */
  const check = (original: string, optimized: string): QualityCheckResult => {
    const originalLength = original.length
    const optimizedLength = optimized.length
    const lengthRatio = originalLength > 0 ? optimizedLength / originalLength : 0
    const lengthStatus = getLengthStatus(originalLength, optimizedLength)
    const hasMarkers = hasStructureMarkers(optimized)
    
    // 收集警告信息
    const warnings: string[] = []
    
    // 长度警告
    if (lengthStatus === 'warning') {
      warnings.push(getLengthStatusMessage(originalLength, optimizedLength, lengthStatus))
    } else if (lengthStatus === 'error') {
      warnings.push(getLengthStatusMessage(originalLength, optimizedLength, lengthStatus))
    }
    
    // 结构化标记警告
    if (hasMarkers) {
      const foundMarkers = STRUCTURE_MARKERS.filter(marker => optimized.includes(marker))
      warnings.push(`检测到结构化标记: ${foundMarkers.join(', ')} - 用户提示词应保持自然对话风格`)
    }
    
    // 过度扩展警告
    if (lengthRatio > 20) {
      warnings.push(`扩展比例过大 (x${lengthRatio.toFixed(1)}倍)，可能存在过度优化`)
    }
    
    return {
      length: optimizedLength,
      lengthRatio,
      lengthStatus,
      hasStructureMarkers: hasMarkers,
      intentPreserved: true,  // 需要AI判断，这里默认true
      warnings
    }
  }
  
  /**
   * 获取长度状态的图标
   */
  const getLengthStatusIcon = (status: string): string => {
    switch (status) {
      case 'good': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  }
  
  /**
   * 获取长度状态的颜色类
   */
  const getLengthStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  return {
    check,
    hasStructureMarkers,
    getLengthStatus,
    getLengthStatusMessage,
    getLengthStatusIcon,
    getLengthStatusColor,
    STRUCTURE_MARKERS
  }
}
