import * as view from './domain/view';
export { view };
import * as filter from './domain/filter';
export { filter };
import * as common from './domain/common';
export { common };
import * as span from './domain/span';
export { span };
import * as base from './../../../base';
export { base };
import { createAPI } from './../../config';
export interface ListSpansRequest {
  workspace_id: string,
  /** ms */
  start_time: string,
  /** ms */
  end_time: string,
  filters?: filter.FilterFields,
  page_size?: number,
  order_bys?: common.OrderBy[],
  page_token?: string,
  platform_type?: common.PlatformType,
  /** default root span */
  span_list_type?: common.SpanListType,
}
export interface ListSpansResponse {
  spans: span.OutputSpan[],
  next_page_token: string,
  has_more: boolean,
}
export interface TokenCost {
  input: string,
  output: string,
}
export interface TraceAdvanceInfo {
  trace_id: string,
  tokens: TokenCost,
}
export interface GetTraceRequest {
  workspace_id: string,
  trace_id: string,
  /** ms */
  start_time: string,
  /** ms */
  end_time: string,
  platform_type?: common.PlatformType,
}
export interface GetTraceResponse {
  spans: span.OutputSpan[],
  traces_advance_info?: TraceAdvanceInfo,
}
export interface TraceQueryParams {
  trace_id: string,
  start_time: string,
  end_time: string,
}
export interface BatchGetTracesAdvanceInfoRequest {
  workspace_id: string,
  traces: TraceQueryParams[],
  platform_type?: common.PlatformType,
}
export interface BatchGetTracesAdvanceInfoResponse {
  traces_advance_info: TraceAdvanceInfo[]
}
export interface IngestTracesRequest {
  spans?: span.InputSpan[]
}
export interface IngestTracesResponse {
  code?: number,
  msg?: string,
}
export interface FieldMeta {
  value_type: filter.FieldType,
  filter_types: filter.QueryType[],
  field_options?: filter.FieldOptions,
  support_customizable_option?: boolean,
}
export interface GetTracesMetaInfoRequest {
  platform_type?: common.PlatformType,
  span_list_type?: common.SpanListType,
  /** required */
  workspace_id?: string,
}
export interface GetTracesMetaInfoResponse {
  field_metas: {
    [key: string | number]: FieldMeta
  }
}
export interface CreateViewRequest {
  enterprise_id?: string,
  workspace_id: string,
  view_name: string,
  platform_type: common.PlatformType,
  span_list_type: common.SpanListType,
  filters: string,
}
export interface CreateViewResponse {
  id: string
}
export interface UpdateViewRequest {
  view_id: string,
  workspace_id: string,
  view_name?: string,
  platform_type?: common.PlatformType,
  span_list_type?: common.SpanListType,
  filters?: string,
}
export interface UpdateViewResponse {}
export interface DeleteViewRequest {
  view_id: string,
  workspace_id: string,
}
export interface DeleteViewResponse {}
export interface ListViewsRequest {
  enterprise_id?: string,
  workspace_id: string,
  view_name?: string,
}
export interface ListViewsResponse {
  views: view.View[]
}
export const ListSpans = /*#__PURE__*/createAPI<ListSpansRequest, ListSpansResponse>({
  "url": "/api/observability/v1/spans/list",
  "method": "POST",
  "name": "ListSpans",
  "reqType": "ListSpansRequest",
  "reqMapping": {
    "body": ["workspace_id", "start_time", "end_time", "filters", "page_size", "order_bys", "page_token", "platform_type", "span_list_type"]
  },
  "resType": "ListSpansResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const GetTrace = /*#__PURE__*/createAPI<GetTraceRequest, GetTraceResponse>({
  "url": "/api/observability/v1/traces/:trace_id",
  "method": "GET",
  "name": "GetTrace",
  "reqType": "GetTraceRequest",
  "reqMapping": {
    "query": ["workspace_id", "start_time", "end_time", "platform_type"],
    "path": ["trace_id"]
  },
  "resType": "GetTraceResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const BatchGetTracesAdvanceInfo = /*#__PURE__*/createAPI<BatchGetTracesAdvanceInfoRequest, BatchGetTracesAdvanceInfoResponse>({
  "url": "/api/observability/v1/traces/batch_get_advance_info",
  "method": "POST",
  "name": "BatchGetTracesAdvanceInfo",
  "reqType": "BatchGetTracesAdvanceInfoRequest",
  "reqMapping": {
    "body": ["workspace_id", "traces", "platform_type"]
  },
  "resType": "BatchGetTracesAdvanceInfoResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const IngestTraces = /*#__PURE__*/createAPI<IngestTracesRequest, IngestTracesResponse>({
  "url": "/v1/loop/traces/ingest",
  "method": "POST",
  "name": "IngestTraces",
  "reqType": "IngestTracesRequest",
  "reqMapping": {
    "body": ["spans"]
  },
  "resType": "IngestTracesResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const GetTracesMetaInfo = /*#__PURE__*/createAPI<GetTracesMetaInfoRequest, GetTracesMetaInfoResponse>({
  "url": "/api/observability/v1/traces/meta_info",
  "method": "GET",
  "name": "GetTracesMetaInfo",
  "reqType": "GetTracesMetaInfoRequest",
  "reqMapping": {
    "query": ["platform_type", "span_list_type", "workspace_id"]
  },
  "resType": "GetTracesMetaInfoResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const CreateView = /*#__PURE__*/createAPI<CreateViewRequest, CreateViewResponse>({
  "url": "/api/observability/v1/views",
  "method": "POST",
  "name": "CreateView",
  "reqType": "CreateViewRequest",
  "reqMapping": {
    "body": ["enterprise_id", "workspace_id", "view_name", "platform_type", "span_list_type", "filters"]
  },
  "resType": "CreateViewResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const UpdateView = /*#__PURE__*/createAPI<UpdateViewRequest, UpdateViewResponse>({
  "url": "/api/observability/v1/views/:view_id",
  "method": "PUT",
  "name": "UpdateView",
  "reqType": "UpdateViewRequest",
  "reqMapping": {
    "path": ["view_id"],
    "body": ["workspace_id", "view_name", "platform_type", "span_list_type", "filters"]
  },
  "resType": "UpdateViewResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const DeleteView = /*#__PURE__*/createAPI<DeleteViewRequest, DeleteViewResponse>({
  "url": "/api/observability/v1/views/:view_id",
  "method": "DELETE",
  "name": "DeleteView",
  "reqType": "DeleteViewRequest",
  "reqMapping": {
    "path": ["view_id"],
    "query": ["workspace_id"]
  },
  "resType": "DeleteViewResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});
export const ListViews = /*#__PURE__*/createAPI<ListViewsRequest, ListViewsResponse>({
  "url": "/api/observability/v1/views/list",
  "method": "POST",
  "name": "ListViews",
  "reqType": "ListViewsRequest",
  "reqMapping": {
    "body": ["enterprise_id", "workspace_id", "view_name"]
  },
  "resType": "ListViewsResponse",
  "schemaRoot": "api://schemas/observability_coze.loop.observability.trace",
  "service": "observabilityTrace"
});