<script setup lang="ts">
import { datetimeFormat } from '@/utils/utils.ts'
import type { ChatMessage } from '@/api/chat.ts'

defineProps<{
  message: ChatMessage
}>()
</script>

<template>
  <div class="tool-container">
    <div class="tool-btns">
      <slot></slot>
    </div>
    <div class="tool-times">
      <div></div>
      <div class="time">
        {{ datetimeFormat(message?.record?.create_time) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.tool-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;

  row-gap: 8px;

  min-height: 22px;

  margin-top: 12px;
  margin-bottom: 12px;

  .tool-times {
    flex: 1;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: rgba(100, 106, 115, 1);

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    .time {
      white-space: nowrap;
    }
  }
}
</style>
