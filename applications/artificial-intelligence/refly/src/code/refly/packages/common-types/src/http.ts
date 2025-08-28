/** 状态码 */
export enum StatusCode {
  /** 成功 */
  SUCCESS = 200,
  /** 参数错误 */
  PARAMS_ERROR = 400,
  /** 未登录 */
  NOT_LOGIN = 401,
  /** 无权限*/
  NOT_AUTH = 403,
  /** 未找到 */
  NOT_FOUND = 404,
  /** 方法不允许 */
  METHOD_NOT_ALLOWED = 405,
  /** 服务器错误 */
  SERVER_ERROR = 500,
  /** 数据库连接失败 */
  DB_CONNECT_ERROR = 1001,
  /** 数据库查询失败 */
  DB_QUERY_ERROR = 1002,
  /** 数据库插入失败 */
  DB_INSERT_ERROR = 1003,
  /** 数据库更新失败 */
  DB_UPDATE_ERROR = 1004,
  /** 数据库删除失败 */
  DB_DELETE_ERROR = 1005,
  /** 未实现 */
  NOT_IMPLEMENTED = 1006,
}
/** 函数结果返回通用错误格式 */
export type ErrorHandle = {
  message?: string;
  status?: StatusCode;
};

/** 函数结果返回通用格式 */
export type ResultHandle<T, U = ErrorHandle | null> = [U, T | null];

/** 接口返回通用格式 */
export interface ResponseType<T> {
  status: StatusCode;
  message: string;
  data: T;
}

export type IPagination = {
  page: number;
  pageSize: number;
  total?: number;
};

export interface ImageXMeta {
  /** 上传图片返回的tos uri */
  uri: string;
  /** 图片处理模板[参数]，需要获取info信息的url则为"info"即可 */
  tpl: string;
  /** 需要图片的格式，不传则默认为jpeg */
  format?: string;
  /** 业务自己需要的query string，不能使用x-expires、x-signature、x-orig-expires、x-orig-authkey */
  /** x-orig-sign、 policy字段，建议带上traceid */
  query?: { [key: string]: string };
}

export interface PaginationType<T> {
  // 前端处理 status、code 之内的 ts 类型，这里仅处理 data 级别
  page: number;
  pageSize: number;
  totalPages: number;
  count: number;
  data: T[];
}
