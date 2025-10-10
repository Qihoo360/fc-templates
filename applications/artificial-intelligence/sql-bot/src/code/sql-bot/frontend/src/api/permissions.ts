import { request } from '@/utils/request'

export const getList = () => request.post('/ds_permission/list')
export const savePermissions = (data: any) => request.post('/ds_permission/save', data)
export const delPermissions = (id: any) => request.post(`/ds_permission/delete/${id}`)
