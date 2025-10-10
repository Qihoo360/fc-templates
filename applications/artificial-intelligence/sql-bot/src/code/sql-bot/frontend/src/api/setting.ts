import { request } from '@/utils/request'

export const termApi = {
  pager: (pageNumber: number, pageSize: number) =>
    request.get(`/settings/terminology/pager/${pageNumber}/${pageSize}`),
  add: (data: any) => request.post('/settings/terminology', data),
  edit: (data: any) => request.put('/settings/terminology', data),
  delete: (id: number) => request.delete(`/settings/terminology/${id}`),
  query: (id: number) => request.get(`/settings/terminology/${id}`),
}
