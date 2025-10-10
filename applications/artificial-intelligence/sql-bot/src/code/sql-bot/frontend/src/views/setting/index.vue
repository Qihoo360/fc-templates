<template>
  <div class="setting-container">
    <el-tabs v-model="activeName" class="setting-tabs" @tab-click="handleClick">
      <el-tab-pane label="User" name="0">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><IconProfessional /></el-icon>
            <span>Terminology</span>
          </span>
        </template>
        <Professional v-if="activeName == '0'" />
      </el-tab-pane>
      <el-tab-pane label="Config" name="1">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon><IconTrain /></el-icon>
            <span>Data training</span>
          </span>
        </template>
        Data training
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import IconProfessional from '@/assets/svg/professional.svg'
import IconTrain from '@/assets/svg/train.svg'
import Professional from './Professional.vue'
const activeName = ref('0')

const handleClick = (tab: any, event: MouseEvent) => {
  console.info(tab, event)
}
</script>

<style lang="less" scoped>
.setting-container {
  height: calc(100% - 48px);
  background-color: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  padding: 24px;
  :deep(.ed-tabs) {
    --el-tabs-header-height: 55px;
    .ed-tabs__header {
      margin: 0 0 24px !important;
    }
  }
  .setting-tabs {
    height: 100%;
    :deep(.custom-tabs-label) {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
      column-gap: 4px;
      i {
        font-size: 20px;
        width: 28px;
        height: 28px;
      }
    }
    :deep(.ed-tabs__item) {
      padding: 0 16px !important;
      &:hover {
        // color: var(--primary-color);
        background-color: rgba(0, 0, 0, 0.02);
      }
    }
  }
}
</style>
