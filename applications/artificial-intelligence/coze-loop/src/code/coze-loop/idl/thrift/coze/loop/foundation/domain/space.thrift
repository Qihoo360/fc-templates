namespace go coze.loop.foundation.domain.space

// 空间类型
enum SpaceType {
    Undefined = 0
    Personal = 1        // 个人空间
    Team = 2            // 团队空间
    Official = 3        // 官方空间
}

// 空间
struct Space {
    1: i64 id (api.js_conv='true', go.tag='json:"id"')                           // 空间ID
    2: string name                      // 空间名称
    3: string description               // 空间描述
    4: SpaceType space_type             // 空间类型
    5: string owner_user_id             // 空间所有者
    6: optional i64 create_at (api.js_conv='true', go.tag='json:"create_at"')           // 创建时间
    7: optional i64 update_at (api.js_conv='true', go.tag='json:"update_at"')           // 更新时间
    /* 8-10 保留位 */
    15: optional string enterprise_id   // 企业ID
    16: optional string organization_id // 组织ID
}