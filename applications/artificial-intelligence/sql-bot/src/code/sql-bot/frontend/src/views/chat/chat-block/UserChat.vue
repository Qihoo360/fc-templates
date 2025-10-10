<script setup lang="ts">
import type { ChatMessage } from '@/api/chat.ts'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  message?: ChatMessage
}>()
const { t } = useI18n()

function clickAnalysis() {
  console.info('analysis_record_id: ' + props.message?.record?.analysis_record_id)
}
function clickPredict() {
  console.info('predict_record_id: ' + props.message?.record?.predict_record_id)
}
</script>

<template>
  <div class="question">
    <span v-if="message?.record?.analysis_record_id" class="prefix-title" @click="clickAnalysis">
      {{ t('qa.data_analysis') }}
    </span>
    <span v-else-if="message?.record?.predict_record_id" class="prefix-title" @click="clickPredict">
      {{ t('qa.data_predict') }}
    </span>
    <span style="width: 100%">{{ message?.content }}</span>
  </div>
</template>

<style scoped lang="less">
.question {
  display: flex;
  flex-direction: row;
  gap: 8px;
  border-radius: 16px;
  min-height: 48px;
  line-height: 24px;
  font-size: 16px;
  padding: 12px 16px;
  color: rgba(31, 35, 41, 1);
  background: rgba(245, 246, 247, 1);

  word-wrap: break-word;
  white-space: pre-wrap;

  .prefix-title {
    color: var(--ed-color-primary, rgba(28, 186, 144, 1));
    white-space: nowrap;
  }
}
</style>
