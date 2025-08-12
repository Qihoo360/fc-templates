export enum PlatformType {
  Cozeloop = "cozeloop",
  Prompt = "prompt",
  Evaluator = "evaluator",
  EvaluationTarget = "evaluation_target",
}
export enum SpanListType {
  RootSpan = "root_span",
  AllSpan = "all_span",
  LlmSpan = "llm_span",
}
export interface OrderBy {
  field?: string,
  is_asc?: boolean,
}