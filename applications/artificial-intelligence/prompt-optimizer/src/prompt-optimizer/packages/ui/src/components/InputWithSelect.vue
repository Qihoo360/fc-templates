<template>
  <div ref="componentRef" class="relative">
    <div class="flex">
      <input
        ref="inputRef"
        :value="modelValue"
        @input="handleInput"
        :type="type"
        :required="required"
        :placeholder="placeholder"
        class="theme-manager-input pr-10 flex-grow"
      />
      <button
        type="button"
        @click="toggleDropdown"
        class="absolute inset-y-0 right-0 flex items-center px-3 theme-manager-text-secondary hover:theme-manager-text transition-colors"
        :class="{'animate-pulse': isLoading}"
      >
      <!-- 提示文本作为悬浮提示 -->
      <transition name="fade">
        <div v-if="!isOpen && !isLoading && showHint" 
            class="absolute right-10 top-0 bottom-0 min-w-[120px] flex items-center text-xs theme-manager-text-secondary">
          {{ hintText }}
        </div>
      </transition>
        <!-- 加载中动画 -->
        <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <!-- 正常状态显示下拉箭头 -->
        <svg v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
    
    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute z-10 mt-1 w-full rounded-md theme-dropdown shadow-lg max-h-60 overflow-auto"
    >
      <div v-if="isLoading" class="p-2 text-center theme-manager-text-secondary">
        {{ loadingText }}
      </div>
      <div v-else-if="filteredOptions.length === 0" class="p-2 text-center theme-manager-text-secondary">
        {{ noOptionsText }}
      </div>
      <ul v-else class="py-1">
        <li
          v-for="option in filteredOptions"
          :key="option.value"
          @click="selectOption(option)"
          :class="[
              'theme-dropdown-item cursor-pointer px-4 py-2', 
              modelValue === option.value ? 'theme-dropdown-item-active' : 'theme-dropdown-item-inactive'
            ]"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  noOptionsText: {
    type: String,
    default: 'No options available'
  },
  fetchOptions: {
    type: Function,
    default: null
  },
  showHint: {
    type: Boolean,
    default: true
  },
  hintText: {
    type: String,
    default: 'Click to fetch options'
  }
});

const emit = defineEmits(['update:modelValue', 'select', 'fetchOptions']);

const isOpen = ref(false);
const inputRef = ref(null);
const searchText = ref('');

// 根据输入内容筛选选项
const filteredOptions = computed(() => {
  if (!searchText.value) return props.options;
  return props.options.filter(option => 
    option.label.toLowerCase().includes(searchText.value.toLowerCase()) ||
    option.value.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 处理输入事件
const handleInput = (event) => {
  const value = event.target.value;
  emit('update:modelValue', value);
  searchText.value = value;
};

// Toggle dropdown visibility
const toggleDropdown = async () => {
  isOpen.value = !isOpen.value;
  
  // 如果打开下拉菜单，聚焦到输入框
  if (isOpen.value) {
    emit('fetchOptions');
    // 等待DOM更新后聚焦
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    }, 10);
  }
};

// Handle option selection
const selectOption = (option) => {
  emit('update:modelValue', option.value);
  emit('select', option);
  isOpen.value = false;
  searchText.value = '';
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  console.log('Click detected', {
    isOpen: isOpen.value,
    isComponent: componentRef.value && componentRef.value.contains(event.target),
    target: event.target
  });
  
  // 只有在下拉菜单打开且点击的是组件外部时才关闭下拉菜单
  if (isOpen.value && componentRef.value && !componentRef.value.contains(event.target)) {
    console.log('Closing dropdown');
    isOpen.value = false;
    searchText.value = '';
  }
};

// 组件引用
const componentRef = ref(null);

// Add and remove event listener
onMounted(() => {
  if (typeof document !== 'undefined') {
    // 使用捕获阶段以确保事件能够被正确捕获
    document.addEventListener('mousedown', handleClickOutside, true);
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', handleClickOutside, true);
  }
});
</script>

<style scoped>
/* 提示文本的淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 下拉菜单的过渡效果 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>