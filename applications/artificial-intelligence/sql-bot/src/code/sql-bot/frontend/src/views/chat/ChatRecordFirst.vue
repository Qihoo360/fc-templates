<script setup lang="ts">
import { ChatInfo, type ChatMessage } from '@/api/chat.ts'
import { computed } from 'vue'

const props = defineProps<{
  msg: ChatMessage
  currentChat: ChatInfo
}>()

const show = computed(() => {
  return props.msg.first_chat
})
</script>

<template>
  <span v-if="show">
    <slot name="footer"></slot>
  </span>
  <!--  <ChatBlock v-if="show">
    <div class="welcome-content">
      <div class="ds-select-row">
        <div>{{ t('qa.selected_datasource') }}:</div>
      </div>
      <div>
        {{ currentChat.datasource_name }}
      </div>
    </div>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </ChatBlock>-->
</template>

<style scoped lang="less">
.welcome-content {
  padding: 12px;
  display: flex;
}

.sub {
  color: grey;
  font-size: 0.8em;
}

.ds-select-row {
  margin-right: 8px;
}
</style>
