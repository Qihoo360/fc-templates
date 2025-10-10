import { request } from '@/utils/request'

export const licenseApi = {
  validate: () => request.get('/system/license'),
  version: () => request.get('/system/license/version'),
  update: (data: any) => request.post('/system/license', data),
}
