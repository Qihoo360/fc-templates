namespace go coze.loop.llm.runtime

include "../../../base.thrift"
include "./domain/runtime.thrift"

struct ChatRequest {
    // 模型配置
    1: optional runtime.ModelConfig model_config
    // 消息
    2: optional list<runtime.Message> messages
    // 工具
    3: optional list<runtime.Tool> tools
    // 业务参数
    4: optional runtime.BizParam biz_param

    255: optional base.Base Base
}
struct ChatResponse {
    1: optional runtime.Message message

    255: base.BaseResp BaseResp
}

service LLMRuntimeService {
    // 非流式接口
    ChatResponse Chat(1: ChatRequest req)
    // 流式接口
    ChatResponse ChatStream(1: ChatRequest req) (streaming.mode="server")
}