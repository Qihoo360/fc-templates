import { advancedParameterDefinitions, AdvancedParameterDefinition } from './advancedParameterDefinitions';

// 危险参数黑名单
const DANGEROUS_PARAMS = [
  'eval', 'exec', 'function', 'script', 'code',
  'apiKey', 'api_key', 'secret', 'password', 'credentials',
  'authorization', 'baseURL', 'base_url', 'endpoint', 'url',
  '__proto__', 'constructor', 'prototype', 'require', 'import'
];

export interface LLMValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  parameterName: string;
  parameterValue: any;
  message: string;
  expectedType?: string;
  expectedRange?: string;
}

export interface ValidationWarning {
  parameterName: string;
  parameterValue: any;
  message: string;
}



/**
 * 检查参数是否在危险黑名单中
 */
function isDangerousParameter(paramName: string): boolean {
  return DANGEROUS_PARAMS.some(dangerous => 
    paramName.toLowerCase().includes(dangerous.toLowerCase())
  );
}

/**
 * 验证llmParams中的已知参数（增强安全版本）
 */
export function validateLLMParams(
  llmParams: Record<string, any> | undefined,
  provider: string
): LLMValidationResult {
  const result: LLMValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!llmParams) {
    return result;
  }

  // 获取该提供商支持的参数定义
  const supportedParams = advancedParameterDefinitions.filter(
    def => def.appliesToProviders.includes(provider)
  );

  // 验证每个已知参数
  for (const [paramName, paramValue] of Object.entries(llmParams)) {
    // 首先检查危险参数
    if (isDangerousParameter(paramName)) {
      result.isValid = false;
      result.errors.push({
        parameterName: paramName,
        parameterValue: paramValue,
        message: `Parameter '${paramName}' is potentially dangerous and not allowed for security reasons.`
      });
      continue;
    }

    const paramDef = supportedParams.find(def => def.name === paramName);
    
    if (!paramDef) {
      // 未知参数警告 - 统一使用黑名单机制
      // 对于个人化前端应用，未知参数不应该导致验证失败，只产生警告
      result.warnings.push({
        parameterName: paramName,
        parameterValue: paramValue,
        message: `Parameter '${paramName}' is not defined in parameter specifications for ${provider}. It will be passed to the SDK but may not be supported or could cause issues.`
      });
      continue;
    }

    // 验证参数类型和范围
    const validation = validateSingleParameter(paramValue, paramDef);
    if (!validation.isValid) {
      result.isValid = false;
      result.errors.push({
        parameterName: paramName,
        parameterValue: paramValue,
        message: validation.message!,
        expectedType: paramDef.type,
        expectedRange: getExpectedRange(paramDef)
      });
    }
  }

  return result;
}

function validateSingleParameter(
  value: any, 
  def: AdvancedParameterDefinition
): { isValid: boolean; message?: string } {
  // Special validation: stopSequences should be string array (although type is defined as string, but actually is array)
  if (def.name === 'stopSequences') {
    if (!Array.isArray(value)) {
      return {
        isValid: false,
        message: `Parameter 'stopSequences' should be a string array, but received ${typeof value}`
      };
    }
    
    if (!value.every(item => typeof item === 'string')) {
      return {
        isValid: false,
        message: `Parameter 'stopSequences' array should only contain strings`
      };
    }
    
    // Skip regular type check for stopSequences
    return { isValid: true };
  }

  // Type validation
  if (!validateType(value, def.type)) {
    return {
      isValid: false,
      message: `Parameter '${def.name}' should be of type ${def.type}, but received ${typeof value}`
    };
  }

  // Numeric range validation
  if (def.type === 'number' || def.type === 'integer') {
    if (def.minValue !== undefined && value < def.minValue) {
      return {
        isValid: false,
        message: `Parameter '${def.name}' value ${value} is less than minimum value ${def.minValue}`
      };
    }
    
    if (def.maxValue !== undefined && value > def.maxValue) {
      return {
        isValid: false,
        message: `Parameter '${def.name}' value ${value} is greater than maximum value ${def.maxValue}`
      };
    }
  }

  return { isValid: true };
}

function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}

function getExpectedRange(def: AdvancedParameterDefinition): string {
  if (def.type === 'number' || def.type === 'integer') {
    if (def.minValue !== undefined && def.maxValue !== undefined) {
      return `${def.minValue} - ${def.maxValue}`;
    } else if (def.minValue !== undefined) {
      return `>= ${def.minValue}`;
    } else if (def.maxValue !== undefined) {
      return `<= ${def.maxValue}`;
    }
  }
  return '';
}

/**
 * 获取提供商支持的参数列表
 */
export function getSupportedParameters(provider: string): AdvancedParameterDefinition[] {
  return advancedParameterDefinitions.filter(
    def => def.appliesToProviders.includes(provider)
  );
} 