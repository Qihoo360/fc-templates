import { LLMModelConfig } from '@refly/openapi-schema';

export const checkIsSupportedModel = (modelInfo: LLMModelConfig) => {
  return !!modelInfo?.capabilities?.functionCall;
};

export const checkModelContextLenSupport = (modelInfo: LLMModelConfig) => {
  return modelInfo?.contextLimit > 8 * 1024;
};
