namespace go coze.loop.foundation.file

include "../../../base.thrift"
include "coze.loop.foundation.openapi.thrift"

struct FileData {
    1: optional i64 bytes (api.js_conv='true', go.tag='json:"bytes"')
    2: optional string file_name
}

typedef string BusinessType(ts.enum="true")
const BusinessType BusinessType_Prompt = "prompt"
const BusinessType BusinessType_Evaluation = "evaluation"
const BusinessType BusinessType_Observability = "observability"


struct UploadFileRequest {
    1: required string              content_type  // file type
    2: required binary              body          // binary data
    3: optional BusinessType        business_type // binary data

    255: optional base.Base Base
}

struct UploadFileResponse {
    1: optional i32                 code
    2: optional string              msg
    3: optional FileData            data

    255: base.BaseResp BaseResp
}

struct UploadLoopFileInnerRequest {
    1: required string              content_type  // file type
    2: required binary              body          // binary data

    255: optional base.Base Base
}

struct UploadLoopFileInnerResponse {
    1: optional i32                 code
    2: optional string              msg
    3: optional FileData            data

    255: base.BaseResp BaseResp
}

struct SignUploadFileRequest {
    1: required list<string>        keys  // file key
    2: optional SignFileOption      option
    3: optional BusinessType        business_type // binary data
    4: optional i64                 workspace_id (api.js_conv='true', go.tag='json:"workspace_id"')  // workspace id

    255: optional base.Base Base
}

struct SignFileOption {
    1: optional i64                 ttl     (api.js_conv='true', go.tag='json:"ttl"') // TTL(second), default 24h
}

struct SignUploadFileResponse {
    1: optional list<string>        uris // the index corresponding to the keys of request
    2: optional list<SignHead>      sign_heads // the index corresponding to the keys of request

    255: base.BaseResp BaseResp
}

struct SignHead {
    1: optional string              current_time
    2: optional string              expired_time
    3: optional string              session_token
    4: optional string              access_key_id
    5: optional string              secret_access_key
}

struct SignDownloadFileRequest {
    1: required list<string>        keys  // file key
    2: optional SignFileOption      option
    3: optional BusinessType        business_type // binary data

    255: optional base.Base Base
}

struct SignDownloadFileResponse {
    1: optional list<string>        uris // the index corresponding to the keys of request

    255: base.BaseResp BaseResp
}

service FileService {
    UploadLoopFileInnerResponse UploadLoopFileInner(1: UploadLoopFileInnerRequest req) // for inner service, etc prompt or eval
    SignUploadFileResponse SignUploadFile(1: SignUploadFileRequest req) (api.post='/api/foundation/v1/sign_upload_files')
    SignDownloadFileResponse SignDownloadFile(1: SignDownloadFileRequest req) // for inner service, etc prompt or eval
}