// 提示词规则统一导出
// 从各个独立文件中导入并导出所有提示词规则

import { SYSTEM_PROMPT_RULES } from './systemPromptRules'
import { SYSTEM_PROMPT_SLIM_RULES } from './systemPromptSlimRules'
import { USER_GUIDED_PROMPT_RULES } from './userGuidedRules'
import { REQUIREMENT_REPORT_RULES } from './requirementReportRules'
import { FINAL_PROMPT_GENERATION_RULES, FINAL_PROMPT_SYSTEM_MESSAGES } from './finalPromptGenerationRules'
import { PROMPT_OPTIMIZATION_CONFIG } from './promptOptimization'

// 导出所有提示词规则
export {
  SYSTEM_PROMPT_RULES,
  SYSTEM_PROMPT_SLIM_RULES,
  USER_GUIDED_PROMPT_RULES,
  REQUIREMENT_REPORT_RULES,
  FINAL_PROMPT_GENERATION_RULES,
  FINAL_PROMPT_SYSTEM_MESSAGES,
  PROMPT_OPTIMIZATION_CONFIG
}