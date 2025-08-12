namespace go coze.loop.prompt

include "coze.loop.llm.manage.thrift"
include "coze.loop.llm.runtime.thrift"

service LLMManageService extends coze.loop.llm.manage.LLMManageService {}
service LLMRuntimeService extends coze.loop.llm.runtime.LLMRuntimeService {}