import * as base from './../../../base';
export { base };
export interface UploadLoopFileRequest {
  /** file type */
  "Content-Type": string,
  /** binary data */
  body: Blob,
}
export interface UploadLoopFileResponse {
  code?: number,
  msg?: string,
  data?: FileData,
}
export interface FileData {
  bytes?: string,
  file_name?: string,
}