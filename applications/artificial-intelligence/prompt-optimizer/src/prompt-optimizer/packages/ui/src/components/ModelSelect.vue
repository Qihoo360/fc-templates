<template>
  <div class="relative">
    <button
      @click.stop="toggleDropdown"
      class="theme-template-select-button"
      :disabled="disabled"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span v-if="modelValue && getSelectedModel && getSelectedModel.enabled" class="theme-text text-sm">
            {{ getSelectedModel.name }}
          </span>
          <span v-else class="theme-placeholder">
            {{ !enabledModels.length ? t('model.select.noModels') : t('model.select.placeholder') }}
          </span>
        </div>
        <span class="theme-text text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </span>
      </div>
    </button>

    <div v-if="isOpen" 
         class="theme-dropdown"
         :style="dropdownStyle"
         @click.stop
         v-click-outside="() => isOpen = false"
    >
      <div class="p-2 max-h-64 overflow-y-auto">
        <div v-if="!enabledModels.length" class="theme-dropdown-empty">
          {{ t('model.select.noAvailableModels') }}
        </div>
        <div v-else v-for="model in enabledModels" 
             :key="model.key"
             @click="selectModel(model)"
             class="theme-dropdown-item"
             :class="[
               modelValue === model.key
                 ? 'theme-dropdown-item-active'
                 : 'theme-dropdown-item-inactive'
             ]"
        >
          <div class="flex items-center justify-between">
            <span class="theme-text text-sm">{{ model.name }}</span>
          </div>
        </div>
      </div>
      <div class="theme-dropdown-section">
        <button
          @click="$emit('config')"
          class="theme-dropdown-config-button"
        >
          <span>⚙️</span>
          <span>{{ t('model.select.configure') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, inject, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { clickOutside } from '../directives/clickOutside'
import type { AppServices } from '../types/services'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
  // modelManager现在通过inject获取，不再需要props
})

const emit = defineEmits(['update:modelValue', 'config'])

const isOpen = ref(false)
const refreshTrigger = ref(0)
const vClickOutside = clickOutside

// 统一使用inject获取services
const services = inject<Ref<AppServices | null>>('services')
if (!services) {
  throw new Error('[ModelSelect] services未正确注入，请确保在App组件中正确provide了services')
}

const getModelManager = computed(() => {
  const servicesValue = services.value
  if (!servicesValue) {
    throw new Error('[ModelSelect] services未初始化，请确保应用已正确启动')
  }

  const manager = servicesValue.modelManager
  if (!manager) {
    throw new Error('[ModelSelect] modelManager未初始化，请确保服务已正确配置')
  }

  return manager
})

// 响应式数据存储
const allModels = ref([])
const enabledModels = ref([])

// 加载模型数据
const loadModels = async () => {
  try {
    const manager = getModelManager.value
    if (!manager) {
      throw new Error('ModelManager not available')
    }
    
    allModels.value = await manager.getAllModels()
    enabledModels.value = await manager.getEnabledModels()
  } catch (error) {
    console.error('Failed to load models:', error)
    allModels.value = []
    enabledModels.value = []
  }
}

// 获取选中的模型
const getSelectedModel = computed(() => {
  refreshTrigger.value // 触发响应式更新
  return allModels.value.find(m => m.key === props.modelValue)
})

// 判断是否为默认模型
const isDefaultModel = (key) => {
  const model = allModels.value.find(m => m.key === key)
  return model?.isDefault ?? false
}

// 切换下拉框
const toggleDropdown = async () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await loadModels()
    refreshTrigger.value++
  }
}

// 选择模型
const selectModel = (model) => {
  emit('update:modelValue', model.key)
  isOpen.value = false
  refreshTrigger.value++
}

// 添加刷新方法
const refresh = async () => {
  await loadModels()
  refreshTrigger.value++
}

// 暴露方法给父组件
defineExpose({
  refresh
})

// 监听模型数据变化，确保选中的模型仍然可用
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && !enabledModels.value.find(m => m.key === newValue)) {
      await loadModels()
      if (!enabledModels.value.find(m => m.key === newValue)) {
        emit('update:modelValue', enabledModels.value[0]?.key || '')
      }
    }
  }
)

// 初始化时加载模型
onMounted(async () => {
  await loadModels()
})

// 计算下拉框样式
const dropdownStyle = computed(() => ({
  minWidth: '100%'
}))
</script>

<style scoped>
.theme-template-select-button {
  position: relative;
}
</style> 