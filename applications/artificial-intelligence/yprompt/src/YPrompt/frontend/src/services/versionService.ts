export interface VersionInfo {
  id: number
  prompt_id: number
  version_number: string
  version_tag: string | null
  version_type: 'manual' | 'auto' | 'rollback' | 'import'
  change_summary: string
  change_log: string | null
  change_type: 'major' | 'minor' | 'patch'
  created_by: number
  author_name: string
  author_avatar: string | null
  use_count: number
  rollback_count: number
  content_size: number
  create_time: string
  parent_version_id: number | null
  
  title?: string
  description?: string
  final_prompt?: string
  language?: string
  format?: string
  tags?: string[]
  
  // 用户提示词上下文
  system_prompt?: string
  conversation_history?: string
}

export interface VersionListResponse {
  code: number
  message?: string
  data: {
    total: number
    page: number
    limit: number
    items: VersionInfo[]
  }
}

export interface VersionDetailResponse {
  code: number
  message?: string
  data: VersionInfo
}

export interface CreateVersionRequest {
  change_type: 'major' | 'minor' | 'patch'
  change_summary: string
  change_log?: string
  version_tag?: string
}

export interface CreateVersionResponse {
  code: number
  message: string
  data: {
    version_id: number
    version_number: string
    create_time: string
  }
}

export interface RollbackRequest {
  change_summary?: string
}

export interface RollbackResponse {
  code: number
  message: string
  data: {
    new_version: string
    rollback_to_version: string
  }
}

export class VersionService {
  private static getApiBaseUrl() {
    return import.meta.env.VITE_API_BASE_URL || ''
  }

  private static getAuthHeaders() {
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      throw new Error('请先登录')
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  static async getVersionList(
    promptId: number, 
    page: number = 1, 
    limit: number = 20,
    tag?: string
  ): Promise<VersionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    if (tag) {
      params.append('tag', tag)
    }

    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}/versions?${params}`, {
      headers: this.getAuthHeaders()
    })

    return response.json()
  }

  static async getVersionDetail(
    promptId: number, 
    versionId: number
  ): Promise<VersionDetailResponse> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}/versions/${versionId}`, {
      headers: this.getAuthHeaders()
    })

    return response.json()
  }

  static async createVersion(
    promptId: number, 
    data: CreateVersionRequest
  ): Promise<CreateVersionResponse> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })

    return response.json()
  }

  static async rollbackToVersion(
    promptId: number, 
    versionId: number, 
    data?: RollbackRequest
  ): Promise<RollbackResponse> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}/versions/${versionId}/rollback`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data || {})
    })

    return response.json()
  }

  static async updateVersionTag(
    promptId: number, 
    versionId: number, 
    versionTag: string
  ): Promise<{ code: number; message: string }> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}/versions/${versionId}/tag`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ version_tag: versionTag })
    })

    return response.json()
  }

  static async deleteVersion(
    promptId: number, 
    versionId: number
  ): Promise<{ code: number; message: string }> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/versions/${promptId}/versions/${versionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  }
}
