import { request } from '@/utils/request'

export const userApi = {
  pager: (pageNumber: number, pageSize: number) =>
    request.get(`/user/pager/${pageNumber}/${pageSize}`),
  add: (data: any) => request.post('/settings/terminology', data),
  edit: (data: any) => request.put('/settings/terminology', data),
  delete: (id: number) => request.delete(`/settings/terminology/${id}`),
  query: (id: number) => request.get(`/settings/terminology/${id}`),
  language: (data: any) => request.put('/user/language', data),
  pwd: (data: any) => request.put('/user/pwd', data),
  ws_options: () => request.get('/user/ws'),
  ws_change: (oid: number) => request.put(`/user/ws/${oid}`),
}
