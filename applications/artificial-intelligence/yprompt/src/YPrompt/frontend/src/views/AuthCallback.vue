<template>
  <div class="callback-container">
    <div class="callback-card">
      <div v-if="isProcessing" class="processing-state">
        <div class="loading-spinner"></div>
        <p class="status-text">正在处理登录...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="error-message">{{ error }}</p>
        <button @click="goToLogin" class="btn btn-primary">返回登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isProcessing = ref(true)
const error = ref('')

const processCallback = async () => {
  try {
    const code = route.query.code as string

    if (!code) {
      error.value = '未获取到授权码，请重新登录'
      isProcessing.value = false
      return
    }

    // 使用 Linux.do OAuth 登录
    const success = await authStore.loginWithLinuxDo(code)

    if (success) {
      // 登录成功，跳转到主页
      router.push('/')
    } else {
      error.value = '登录失败，请重试'
      isProcessing.value = false
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = '登录过程中发生错误，请重试'
    isProcessing.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  processCallback()
})
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 60px 40px;
  text-align: center;
  min-width: 320px;
}

.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-size: 16px;
  color: #4a5568;
  margin: 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error-icon {
  color: #f56565;
}

.error-message {
  font-size: 16px;
  color: #c53030;
  margin: 0;
  max-width: 300px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}
</style>
