namespace go coze.loop.foundation.space

include "../../../base.thrift"
include "./domain/space.thrift"

// 查询空间信息
struct GetSpaceRequest {
    1: required i64 space_id (api.path = "space_id")

    255: optional base.Base Base
}

struct GetSpaceResponse {
    1: optional space.Space space (go.tag = "json:\"space\"")

    255: base.BaseResp  BaseResp
}

// 空间列表: 用户有权限的空间列表
struct ListUserSpaceRequest {
    1: optional string user_id

    101: optional i32 page_size (api.body='page_size', vt.gt = "0", vt.le = "100")   // 分页数量
    102: optional i32 page_number (vt.gt = "0")                                      // 当前请求页码，当有page_token字段时，会忽略该字段，默认按照page_token分页查询数据

    255: optional base.Base Base
}

struct ListUserSpaceResponse {
    1: optional list<space.Space> spaces        // 空间列表
    2: optional i32 total                       // 空间总数

    255: base.BaseResp  BaseResp
}

service SpaceService{
    // 查询空间信息
    GetSpaceResponse GetSpace(1: GetSpaceRequest request) (api.get = "/api/foundation/v1/spaces/:space_id")
    // 空间列表
    ListUserSpaceResponse ListUserSpaces(1: ListUserSpaceRequest request) (api.post = "/api/foundation/v1/spaces/list")
}