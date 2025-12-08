<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo和标题 -->
      <div class="login-header">
        <h1 class="login-title">YPrompt</h1>
        <p class="login-subtitle">提示词管理系统</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <!-- 登录表单 -->
      <div v-else class="login-content">
        <!-- Linux.do OAuth 登录 -->
        <div v-if="authConfig.linux_do_enabled" class="login-section">
          <button @click="loginWithLinuxDo" class="btn btn-primary btn-linux-do">
            使用 Linux.do 登录
          </button>
        </div>

        <!-- 分隔线（当两种认证方式都存在时显示） -->
        <div v-if="authConfig.linux_do_enabled && authConfig.local_auth_enabled" class="divider">
          <span>或</span>
        </div>

        <!-- 本地账号密码登录 -->
        <div v-if="authConfig.local_auth_enabled" class="login-section">
          <form @submit.prevent="handleLocalLogin" class="login-form">
            <!-- 用户名 -->
            <div class="form-group">
              <label for="username">用户名</label>
              <input
                id="username"
                v-model="loginForm.username"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
                autocomplete="username"
                :disabled="isSubmitting"
                required
              />
            </div>

            <!-- 密码 -->
            <div class="form-group">
              <label for="password">密码</label>
              <input
                id="password"
                v-model="loginForm.password"
                type="password"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
                :disabled="isSubmitting"
                required
              />
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- 登录按钮 -->
            <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
              <span v-if="isSubmitting">登录中...</span>
              <span v-else>登录</span>
            </button>

            <!-- 注册链接 -->
            <div v-if="authConfig.registration_enabled" class="register-link">
              还没有账号？
              <a @click.prevent="showRegister = true" href="#">立即注册</a>
            </div>
          </form>
        </div>

        <!-- 注册表单（弹窗） -->
        <div v-if="showRegister" class="modal-overlay" @click="showRegister = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>注册新账号</h2>
              <button @click="showRegister = false" class="modal-close">&times;</button>
            </div>
            
            <form @submit.prevent="handleRegister" class="register-form">
              <div class="form-group">
                <label for="reg-username">用户名</label>
                <input
                  id="reg-username"
                  v-model="registerForm.username"
                  type="text"
                  class="form-input"
                  placeholder="3-20个字符，字母开头"
                  autocomplete="username"
                  :disabled="isSubmitting"
                  required
                />
              </div>

              <div class="form-group">
                <label for="reg-password">密码</label>
                <input
                  id="reg-password"
                  v-model="registerForm.password"
                  type="password"
                  class="form-input"
                  placeholder="至少8个字符，包含字母和数字"
                  autocomplete="new-password"
                  :disabled="isSubmitting"
                  required
                />
              </div>

              <div class="form-group">
                <label for="reg-name">显示名称（可选）</label>
                <input
                  id="reg-name"
                  v-model="registerForm.name"
                  type="text"
                  class="form-input"
                  placeholder="留空则使用用户名"
                  :disabled="isSubmitting"
                />
              </div>

              <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
              </div>

              <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
                <span v-if="isSubmitting">注册中...</span>
                <span v-else>注册</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// 认证配置
const authConfig = ref({
  linux_do_enabled: false,
  linux_do_client_id: '',
  linux_do_redirect_uri: '',
  local_auth_enabled: true,
  registration_enabled: true
})

// 表单数据
const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  name: ''
})

// 状态
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showRegister = ref(false)

// 获取认证配置
const fetchAuthConfig = async () => {
  try {
    const config = await authStore.getAuthConfig()
    if (config) {
      authConfig.value = config
    }
  } catch (error) {
    console.error('获取认证配置失败:', error)
  } finally {
    isLoading.value = false
  }
}

// Linux.do OAuth 登录
const loginWithLinuxDo = () => {
  if (!authConfig.value.linux_do_enabled) {
    errorMessage.value = 'Linux.do OAuth 未配置'
    return
  }

  // 使用后端返回的配置构建授权URL
  const authUrl = `https://connect.linux.do/oauth2/authorize?client_id=${authConfig.value.linux_do_client_id}&redirect_uri=${authConfig.value.linux_do_redirect_uri}&response_type=code&scope=user`
  
  window.location.href = authUrl
}

// 本地账号密码登录
const handleLocalLogin = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const success = await authStore.loginWithPassword(
      loginForm.value.username,
      loginForm.value.password
    )

    if (success) {
      // 登录成功，跳转到主页
      router.push('/')
    } else {
      errorMessage.value = '用户名或密码错误'
    }
  } catch (error) {
    errorMessage.value = '登录失败，请稍后重试'
    console.error('登录失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 注册新账号
const handleRegister = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await authStore.register(
      registerForm.value.username,
      registerForm.value.password,
      registerForm.value.name
    )

    if (result.success) {
      // 注册成功，自动登录
      showRegister.value = false
      await handleLocalLogin()
    } else {
      errorMessage.value = result.error || '注册失败，请检查输入信息'
    }
  } catch (error) {
    errorMessage.value = '注册失败，请检查输入信息'
    console.error('注册失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // 如果已登录，直接跳转
  if (authStore.isLoggedIn) {
    router.push('/')
    return
  }

  // 获取认证配置
  fetchAuthConfig()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-section {
  margin-bottom: 20px;
}

.divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 12px;
  color: #a0aec0;
  font-size: 14px;
}

.login-form,
.register-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-linux-do {
  width: 100%;
}

.btn-block {
  width: 100%;
}

.icon {
  flex-shrink: 0;
}

.error-message {
  padding: 10px 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #718096;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1a202c;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f7fafc;
  color: #4a5568;
}
</style>
