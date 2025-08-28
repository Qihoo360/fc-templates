export interface ReturnType<T> {
  success: boolean;
  data?: T;
  errMsg?: string;
}
