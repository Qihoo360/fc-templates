<script lang="ts" setup>
import { ref } from 'vue'
import IframeVue from './iframe.vue'
import PageVue from './Page.vue'
const btnSelect = ref('d')

const btnSelectChange = (val: any) => {
  btnSelect.value = val
}
</script>

<template>
  <PageVue
    v-if="btnSelect === 'q'"
    :btn-select="btnSelect"
    @btn-select-change="btnSelectChange"
  ></PageVue>
  <IframeVue
    v-if="btnSelect === 'd'"
    :btn-select="btnSelect"
    @btn-select-change="btnSelectChange"
  ></IframeVue>
</template>

<style lang="less" scoped></style>
