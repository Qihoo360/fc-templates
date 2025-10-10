<template>
  <div class="sqlbot-table-container professional-container">
    <div class="sqlbot-tool">
      <div class="tool-left">
        <el-input
          v-model="keyword"
          class="sqlbot-search"
          placeholder="Search"
          clearable
          prefix-icon="el-icon-search"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="tool-right">
        <div class="tool-btn secondary-btn">
          <el-icon><IconOpeUpload /></el-icon>
          <span>Import Terminology</span>
        </div>
        <div class="tool-btn secondary-btn">
          <el-icon><IconOpeDownload /></el-icon>
          <span>Export Terminology</span>
        </div>
        <div class="tool-btn primary-btn" @click="openDialog">
          <el-icon><IconOpeAdd /></el-icon>
          <span>Add Terminology</span>
        </div>
      </div>
    </div>
    <div class="sqlbot-table">
      <el-table :data="state.tableData" style="width: 100%">
        <el-table-column prop="term" label="Term" width="280" />
        <el-table-column prop="definition" label="Definition" />
        <el-table-column prop="domain" label="Domain" width="180" />
        <el-table-column prop="id" label="Actions" width="120" fixed="right">
          <template #default="scope">
            <div class="table-operate">
              <div class="opt-btn" @click="editHandler(scope.row.id)">
                <el-icon><IconOpeEdit /></el-icon>
              </div>
              <div class="opt-btn" @click="deleteHandler(scope.row.id)">
                <el-icon><IconOpeDelete /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>

  <el-dialog
    v-model="dialogFormVisible"
    title="Add Terminology"
    destroy-on-close
    width="500"
    class="sqlbot-dialog"
    @close="onFormClose"
  >
    <el-form
      ref="termFormRef"
      :model="state.form"
      label-width="180px"
      label-position="top"
      class="sqlbot-form"
      size="large"
      @submit.prevent
    >
      <el-form-item label="Term name">
        <el-input v-model="state.form.term" clearable autocomplete="off" />
      </el-form-item>
      <el-form-item label="Definition">
        <el-input v-model="state.form.definition" clearable type="textarea" />
      </el-form-item>
      <el-form-item label="Domain">
        <el-select v-model="state.form.domain" placeholder="Please select a domain">
          <el-option label="domain1" value="domain1" />
          <el-option label="domain2" value="domain2" />
          <el-option label="domain3" value="domain3" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeForm">Cancel</el-button>
        <el-button type="primary" @click="saveHandler"> save </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import IconOpeUpload from '@/assets/svg/operate/ope-upload.svg'
import IconOpeDownload from '@/assets/svg/operate/ope-download.svg'
import IconOpeAdd from '@/assets/svg/operate/ope-add.svg'
import IconOpeEdit from '@/assets/svg/operate/ope-edit.svg'
import IconOpeDelete from '@/assets/svg/operate/ope-delete.svg'
import { termApi } from '@/api/setting'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const keyword = ref('')
const dialogFormVisible = ref(false)
const termFormRef = ref()
const state = reactive({
  tableData: [],
  form: {
    id: '',
    term: '',
    definition: '',
    domain: '',
  },
})
const handleSearch = (e: any) => {
  console.info('search', e)
}
const editHandler = (id: any) => {
  termApi.query(id).then((res: any) => {
    state.form = res
    dialogFormVisible.value = true
  })
}
const deleteHandler = (id: any) => {
  ElMessageBox.confirm('Are you sure to delete?', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      termApi.delete(id).then(() => {
        ElMessage({
          type: 'success',
          message: 'Delete completed',
        })
        search()
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}

const openDialog = () => {
  dialogFormVisible.value = true
}
const resetForm = () => {
  if (!termFormRef.value) return
  Object.keys(state.form).forEach((key) => {
    state.form[key as keyof typeof state.form] = ''
  })
}

const closeForm = () => {
  dialogFormVisible.value = false
}
const onFormClose = () => {
  resetForm()
  dialogFormVisible.value = false
}

const search = () => {
  termApi.pager(1, 20).then((res: any) => {
    state.tableData = res.items
  })
}
const addTerm = () => {
  termApi.add(state.form).then(() => {
    dialogFormVisible.value = false
    search()
    ElMessage({
      type: 'success',
      message: 'Add completed',
    })
  })
}
const editTerm = () => {
  termApi.edit(state.form).then((res: any) => {
    console.info('edit term', res)
    dialogFormVisible.value = false
    search()
    ElMessage({
      type: 'success',
      message: t('common.save_success'),
    })
  })
}
const saveHandler = () => {
  if (state.form.id) {
    editTerm()
  } else {
    addTerm()
  }
}
onMounted(() => {
  search()
})
</script>

<style lang="less" scoped>
.sqlbot-table-container {
  width: 100%;
  height: 100%;
  .sqlbot-tool {
    height: 42px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .tool-left {
      display: flex;
      align-items: center;
      .sqlbot-search {
        width: 300px;
        --el-input-inner-height: 40px !important;
        --el-input-border-radius: 24px;
        --el-input-bg-color: #f5f7fa;
        --el-input-border-color: #e5e8ed;
      }
    }
    .tool-right {
      display: flex;
      align-items: center;
      column-gap: 12px;
      height: 35px;
      .secondary-btn {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }
      .primary-btn {
        background: var(--el-color-primary);
        color: white;
      }
      .tool-btn {
        display: flex;
        align-items: center;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
        outline: none;
        font-weight: 500;
        transition: all 0.3s;
        font-size: 14px;
        gap: 6px;
        &:hover {
          background-color: #f1f3f4;
        }
        &.default {
          color: #2d2e31;
          font-weight: 500;
          font-size: 14px;
          i {
            width: 20px;
            height: 20px;
          }
        }
      }
    }
  }
  .sqlbot-table {
    border-radius: 6px;
    :deep(.ed-table) {
      --el-table-header-bg-color: #f5f7fa;
      --el-table-border-color: #ebeef5;
      --el-table-header-text-color: #606266;

      th {
        font-weight: 600;
        height: 48px;
      }

      td {
        height: 52px;
      }
    }
    .table-operate {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      .opt-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5f6368;
        cursor: pointer;
        transition: all 0.2s;
        background-color: #f1f3f4;
        border: none;
        font-size: 18px;
        &:hover {
          background-color: #e8f0fe;
          color: var(--el-color-primary);
        }
      }
    }
  }
}
.sqlbot-form {
  width: 100%;
  .ed-form-item {
    margin-bottom: 16px;
    text-align: left;
    label {
      font-size: 14px;
      color: #606266;
    }
    /* .ed-input {
      --el-input-border-color: #e5e8ed;
      --el-input-border-radius: 4px;
      --el-input-inner-height: 40px !important;
    }
    .ed-select {
      --el-select-bg-color: #f5f7fa;
      --el-select-border-color: #e5e8ed;
      --el-select-border-radius: 4px;
      --el-select-inner-height: 40px !important;
    } */
  }
}
.sqlbot-dialog {
  width: 500px;

  :deep(.ed-dialog__header) {
    text-align: left !important;
    font-size: 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    color: #606266;
    font-size: 16px;
  }
}
</style>
