<script lang="ts" setup>
import { type PropType } from 'vue'
import nothingInput from '@/assets/img/nothing-input.png'
import nothingSelect from '@/assets/img/nothing-select.png'
import nothingTable from '@/assets/img/nothing-table.png'
import nothingSelectDashboard from '@/assets/img/none-dashboard.png'
import addComponent from '@/assets/img/add_component.png'
import none from '@/assets/img/none.png'
import error from '@/assets/img/error.png'
import nothingTree from '@/assets/img/nothing-tree.png'
import nothingNone from '@/assets/img/nothing-none.png'
defineProps({
  imgType: {
    type: String as PropType<
      | 'input'
      | 'select'
      | 'table'
      | 'none'
      | 'noneWhite'
      | 'tree'
      | 'error'
      | 'selectDashboard'
      | 'addComponent'
    >,
    default: 'table',
  },
  imageSize: {
    type: Number,
    default: 125,
  },
  description: {
    type: String,
    default: '',
  },
})
const getAssetsFile = {
  input: nothingInput,
  select: nothingSelect,
  table: nothingTable,
  noneWhite: nothingNone,
  tree: nothingTree,
  selectDashboard: nothingSelectDashboard,
  error,
  none,
  addComponent,
}
</script>

<template>
  <el-empty
    class="empty-info"
    :image-size="imageSize"
    :description="description"
    :image="getAssetsFile[imgType]"
  >
    <slot></slot>
  </el-empty>
</template>

<style lang="less" scoped>
.empty-info {
  height: 90%;
  padding-top: 0;
}
:deep(.ed-empty__description) {
  margin-top: 8px;

  color: var(--N600, #646a73);
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
}
</style>
