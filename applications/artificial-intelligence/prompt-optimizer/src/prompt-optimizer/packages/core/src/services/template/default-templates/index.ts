/**
 * 默认模板统一导入
 * 
 * 🎯 极简设计：模板自身包含完整信息，无需额外配置
 */

// 导入所有模板
import { template as general_optimize } from './optimize/general-optimize';
import { template as general_optimize_en } from './optimize/general-optimize_en';
import { template as output_format_optimize } from './optimize/output-format-optimize';
import { template as output_format_optimize_en } from './optimize/output-format-optimize_en';
import { template as analytical_optimize } from './optimize/analytical-optimize';
import { template as analytical_optimize_en } from './optimize/analytical-optimize_en';

import { template as iterate } from './iterate/iterate';
import { template as iterate_en } from './iterate/iterate_en';

import { user_prompt_professional } from './user-optimize/user-prompt-professional';
import { user_prompt_professional_en } from './user-optimize/user-prompt-professional_en';
import { user_prompt_basic } from './user-optimize/user-prompt-basic';
import { user_prompt_basic_en } from './user-optimize/user-prompt-basic_en';
import { user_prompt_planning } from './user-optimize/user-prompt-planning';
import { user_prompt_planning_en } from './user-optimize/user-prompt-planning_en';

// 简单的模板集合 - 模板自身已包含完整信息（id、name、language、type等）
export const ALL_TEMPLATES = {
  general_optimize,
  general_optimize_en,
  output_format_optimize,
  output_format_optimize_en,
  analytical_optimize,
  analytical_optimize_en,
  user_prompt_professional,
  user_prompt_professional_en,
  iterate,
  iterate_en,
  user_prompt_basic,
  user_prompt_basic_en,
  user_prompt_planning,
  user_prompt_planning_en,
};
