import * as eval_set from './eval_set';
export { eval_set };
import * as evaluator from './evaluator';
export { evaluator };
import * as eval_target from './eval_target';
export { eval_target };
import * as common from './common';
export { common };
export enum ExptStatus {
  Unknown = 0,
  /** Awaiting execution */
  Pending = 2,
  /** In progress */
  Processing = 3,
  /** Execution succeeded */
  Success = 11,
  /** Execution failed */
  Failed = 12,
  /** User terminated */
  Terminated = 13,
  /** System terminated */
  SystemTerminated = 14,
  /** online expt draining */
  Draining = 21,
}
export enum ExptType {
  Offline = 1,
  Online = 2,
}
export enum SourceType {
  Evaluation = 1,
  AutoTask = 2,
}
export interface Experiment {
  id?: string,
  name?: string,
  desc?: string,
  creator_by?: string,
  status?: ExptStatus,
  status_message?: string,
  start_time?: string,
  end_time?: string,
  eval_set_version_id?: string,
  target_version_id?: string,
  evaluator_version_ids?: string[],
  eval_set?: eval_set.EvaluationSet,
  eval_target?: eval_target.EvalTarget,
  evaluators?: evaluator.Evaluator[],
  eval_set_id?: string,
  target_id?: string,
  base_info?: common.BaseInfo,
  expt_stats?: ExptStatistics,
  target_field_mapping?: TargetFieldMapping,
  evaluator_field_mapping?: EvaluatorFieldMapping[],
  expt_type?: ExptType,
  max_alive_time?: number,
  source_type?: SourceType,
  source_id?: string,
}
export interface TokenUsage {
  input_tokens?: string,
  output_tokens?: string,
}
export interface ExptStatistics {
  evaluator_aggregate_results?: EvaluatorAggregateResult[],
  token_usage?: TokenUsage,
  credit_cost?: number,
  pending_turn_cnt?: number,
  success_turn_cnt?: number,
  fail_turn_cnt?: number,
  terminated_turn_cnt?: number,
  processing_turn_cnt?: number,
}
export interface EvaluatorFmtResult {
  name?: string,
  score?: number,
}
export interface TargetFieldMapping {
  from_eval_set?: FieldMapping[]
}
export interface EvaluatorFieldMapping {
  evaluator_version_id: string,
  from_eval_set?: FieldMapping[],
  from_target?: FieldMapping[],
}
export interface FieldMapping {
  field_name?: string,
  const_value?: string,
  from_field_name?: string,
}
export interface ExptFilterOption {
  fuzzy_name?: string,
  filters?: Filters,
}
export enum ExptRetryMode {
  Unknown = 0,
  RetryAll = 1,
  RetryFailure = 2,
  RetryTargetItems = 3,
}
export enum ItemRunState {
  Unknown = -1,
  /** Queuing */
  Queueing = 0,
  /** Processing */
  Processing = 1,
  /** Success */
  Success = 2,
  /** Failure */
  Fail = 3,
  /** Terminated */
  Terminal = 5,
}
export enum TurnRunState {
  /** Not started */
  Queueing = 0,
  /** Execution succeeded */
  Success = 1,
  /** Execution failed */
  Fail = 2,
  /** In progress */
  Processing = 3,
  /** Terminated */
  Terminal = 4,
}
export interface ItemSystemInfo {
  run_state?: ItemRunState,
  log_id?: string,
  error?: RunError,
}
export interface ColumnEvaluator {
  evaluator_version_id: string,
  evaluator_id: string,
  evaluator_type: evaluator.EvaluatorType,
  name?: string,
  version?: string,
  description?: string,
}
export interface ColumnEvalSetField {
  key?: string,
  name?: string,
  description?: string,
  /** 5: optional datasetv3.FieldDisplayFormat DefaultDisplayFormat */
  content_type?: common.ContentType,
}
export interface ItemResult {
  item_id: string,
  /** row粒度实验结果详情 */
  turn_results?: TurnResult[],
  system_info?: ItemSystemInfo,
  item_index?: string,
}
/** 行级结果 可能包含多个实验 */
export interface TurnResult {
  turn_id: string,
  /** 参与对比的实验序列，对于单报告序列长度为1 */
  experiment_results?: ExperimentResult[],
  turn_index?: string,
}
export interface ExperimentResult {
  experiment_id: string,
  payload?: ExperimentTurnPayload,
}
export interface TurnSystemInfo {
  turn_run_state?: TurnRunState,
  log_id?: string,
  error?: RunError,
}
export interface RunError {
  code: string,
  message?: string,
  detail?: string,
}
export interface TurnEvalSet {
  turn: eval_set.Turn
}
export interface TurnTargetOutput {
  eval_target_record?: eval_target.EvalTargetRecord
}
export interface TurnEvaluatorOutput {
  evaluator_records: {
    [key: string | number]: evaluator.EvaluatorRecord
  }
}
/** 实际行级payload */
export interface ExperimentTurnPayload {
  turn_id: string,
  /** 评测数据集数据 */
  eval_set?: TurnEvalSet,
  /** 评测对象结果 */
  target_output?: TurnTargetOutput,
  /** 评测规则执行结果 */
  evaluator_output?: TurnEvaluatorOutput,
  /** 评测系统相关数据日志、error */
  system_info?: TurnSystemInfo,
}
export interface ExperimentFilter {
  filters?: Filters
}
export interface Filters {
  filter_conditions?: FilterCondition[],
  logic_op?: FilterLogicOp,
}
export enum FilterLogicOp {
  Unknown = 0,
  And = 1,
  Or = 2,
}
export interface FilterField {
  field_type: FieldType,
  field_key?: string,
}
export enum FieldType {
  Unknown = 0,
  /** 评估器得分, FieldKey为evaluatorVersionID,value为score */
  EvaluatorScore = 1,
  CreatorBy = 2,
  ExptStatus = 3,
  TurnRunState = 4,
  TargetID = 5,
  EvalSetID = 6,
  EvaluatorID = 7,
  TargetType = 8,
  SourceTarget = 9,
  EvaluatorVersionID = 20,
  TargetVersionID = 21,
  EvalSetVersionID = 22,
  ExptType = 30,
  SourceType = 31,
  SourceID = 32,
}
/** 字段过滤器 */
export interface FilterCondition {
  /** 过滤字段，比如评估器ID */
  field: FilterField,
  /** 操作符，比如等于、包含、大于、小于等 */
  operator: FilterOperatorType,
  /** 操作值;支持多种类型的操作值； */
  value: string,
  source_target?: SourceTarget,
}
export interface SourceTarget {
  eval_target_type?: eval_target.EvalTargetType,
  source_target_ids?: string[],
}
export enum FilterOperatorType {
  Unknown = 0,
  /** 等于 */
  Equal = 1,
  /** 不等于 */
  NotEqual = 2,
  /** 大于 */
  Greater = 3,
  /** 大于等于 */
  GreaterOrEqual = 4,
  /** 小于 */
  Less = 5,
  /** 小于等于 */
  LessOrEqual = 6,
  /** 包含 */
  In = 7,
  /** 不包含 */
  NotIn = 8,
}
export enum ExptAggregateCalculateStatus {
  Unknown = 0,
  Idle = 1,
  Calculating = 2,
}
/** 实验粒度聚合结果 */
export interface ExptAggregateResult {
  experiment_id: string,
  evaluator_results?: {
    [key: string | number]: EvaluatorAggregateResult
  },
  status?: ExptAggregateCalculateStatus,
}
/** 评估器版本粒度聚合结果 */
export interface EvaluatorAggregateResult {
  evaluator_version_id: string,
  aggregator_results?: AggregatorResult[],
  name?: string,
  version?: string,
}
/** 一种聚合器类型的聚合结果 */
export interface AggregatorResult {
  aggregator_type: AggregatorType,
  data?: AggregateData,
}
/** 聚合器类型 */
export enum AggregatorType {
  Average = 1,
  Sum = 2,
  Max = 3,
  Min = 4,
  /** 得分的分布情况 */
  Distribution = 5,
}
export enum DataType {
  /** 默认，有小数的浮点数值类型 */
  Double = 0,
  /** 得分分布 */
  ScoreDistribution = 1,
}
export interface ScoreDistribution {
  score_distribution_items?: ScoreDistributionItem[]
}
export interface ScoreDistributionItem {
  score: string,
  count: string,
  percentage: number,
}
export interface AggregateData {
  data_type: DataType,
  value?: number,
  score_distribution?: ScoreDistribution,
}
export interface ExptStatsInfo {
  expt_id?: number,
  source_id?: string,
  expt_stats?: ExptStatistics,
}