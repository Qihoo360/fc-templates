namespace go coze.loop.foundation.domain.authn

struct PersonalAccessToken {
    1: required string id
    2: required string name
    3: required i64 created_at(api.js_conv="true", go.tag='json:"created_at"') // unix，秒
    4: required i64 updated_at(api.js_conv="true", go.tag='json:"updated_at"') // unix，秒
    5: required i64 last_used_at(api.js_conv="true", go.tag='json:"last_used_at"') // unix，秒，-1 表示未使用
    6: required i64 expire_at(api.js_conv="true", go.tag='json:"expire_at"') // unix，秒
}
