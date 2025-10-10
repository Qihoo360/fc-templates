<script lang="ts" setup>
defineProps({
  name: {
    type: String,
    default: '-',
  },
  panelNum: {
    type: Number,
    default: 0,
  },
  smartNum: {
    type: Number,
    default: 0,
  },
  t: {
    type: Function,
    default: () => {},
  },
})
</script>

<template>
  <div class="del-box_message">
    <div class="del-title">
      {{ t('datasource.data_source', { msg: name }) }}
    </div>
    <div class="use-panel">
      {{ t('workspace.confirm_to_delete') }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.del-box_message {
  .del-title {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
  }

  .use-panel {
    font-weight: 400;
    font-size: 14px;
    line-height: 22px;
    margin-top: 24px;

    span {
      text-decoration: underline;
      text-decoration-style: solid;
      cursor: pointer;
      color: var(--ed-color-primary);
    }
  }
}
</style>
