<template>
  <div class="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <router-view />
    </div>
    
    <!-- 底部导航 -->
    <MobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import MobileBottomNav from './MobileBottomNav.vue'
</script>