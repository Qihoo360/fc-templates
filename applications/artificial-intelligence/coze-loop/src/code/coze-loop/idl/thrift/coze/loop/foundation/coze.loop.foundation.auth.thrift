namespace go coze.loop.foundation.auth

include "domain/auth.thrift"
include "../../../base.thrift"

// 批量鉴权函数，支持服务端和前端调用
struct MCheckPermissionRequest {
    // 鉴权三元组列表
    1: optional list<auth.SubjectActionObjects> auths
    2: optional i64 space_id (api.body="space_id", api.js_conv='true', go.tag='json:"space_id"')      // 空间ID

    255: optional base.Base Base
}

struct MCheckPermissionResponse {
    1: optional list<auth.SubjectActionObjectAuthRes> auth_res

    255: base.BaseResp  BaseResp
}

service AuthService {
    // 批量鉴权函数，支持服务端和前端调用
    MCheckPermissionResponse MCheckPermission(1: MCheckPermissionRequest request)
}