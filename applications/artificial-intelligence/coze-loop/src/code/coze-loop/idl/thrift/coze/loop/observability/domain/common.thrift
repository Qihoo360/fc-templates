namespace go coze.loop.observability.domain.common

typedef string PlatformType (ts.enum="true")
const PlatformType PlatformType_Cozeloop = "cozeloop"
const PlatformType PlatformType_Prompt = "prompt"
const PlatformType PlatformType_Evaluator = "evaluator"
const PlatformType PlatformType_EvaluationTarget =  "evaluation_target"

typedef string SpanListType (ts.enum="true")
const SpanListType SpanListType_RootSpan = "root_span"
const SpanListType SpanListType_AllSpan = "all_span"
const SpanListType SpanListType_LlmSpan = "llm_span"

struct OrderBy {
    1: optional string field,
    2: optional bool is_asc,
}
