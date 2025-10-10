<script lang="ts" setup>
import delIcon from '@/assets/svg/icon_delete.svg'
import icon_key_outlined from '@/assets/svg/icon-key_outlined.svg'
import icon_member_outlined from '@/assets/svg/icon_member_outlined.svg'
import Lock from '@/assets/permission/icon_custom-tools_colorful.svg'
withDefaults(
  defineProps<{
    name: string
    type: string
    num: string
    id?: string
  }>(),
  {
    name: '-',
    type: '-',
    id: '-',
    num: '-',
  }
)

const emits = defineEmits(['edit', 'del', 'setUser', 'setRule'])

const handleEdit = () => {
  emits('edit')
}

const handleDel = () => {
  emits('del')
}

const setUser = () => {
  emits('setUser')
}

// const setRule = () => {
//   emits('setRule')
// }
</script>

<template>
  <div class="card">
    <div class="name-icon">
      <el-icon class="icon-primary" size="32">
        <Lock></Lock>
      </el-icon>
      <span class="name ellipsis" :title="name">{{ name }}</span>
    </div>
    <div class="type-value">
      <span class="type">{{ $t('permission.permission_rule') }}</span>
      <span class="value"> {{ $t('permission.2', { msg: num }) }}</span>
    </div>
    <div class="type-value">
      <span class="type">{{ $t('permission.restricted_user') }}</span>
      <span class="value"> {{ $t('permission.238_people', { msg: type }) }}</span>
    </div>
    <div class="methods">
      <el-button secondary @click="handleEdit">
        <template #icon>
          <icon_key_outlined></icon_key_outlined>
        </template>
        {{ $t('permission.set_rule') }}
      </el-button>
      <el-button secondary @click="setUser">
        <template #icon>
          <icon_member_outlined></icon_member_outlined>
        </template>
        {{ $t('permission.set_user') }}
      </el-button>
      <el-button secondary @click="handleDel">
        <template #icon>
          <delIcon></delIcon>
        </template>
        {{ $t('dashboard.delete') }}
      </el-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.card {
  width: 100%;
  height: 176px;
  border: 1px solid #dee0e3;
  padding: 16px;
  border-radius: 12px;
  &:hover {
    box-shadow: 0px 6px 24px 0px #1f232914;
    .methods {
      display: block;
    }
  }

  .name-icon {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .name {
      margin-left: 12px;
      font-weight: 500;
      font-size: 16px;
      line-height: 24px;
      max-width: 250px;
    }
  }

  .type-value {
    margin-top: 8px;
    display: flex;
    align-items: center;
    font-weight: 400;
    font-size: 14px;
    line-height: 22px;
    .type {
      color: #646a73;
    }

    .value {
      margin-left: 16px;
    }
  }

  .methods {
    margin-top: 16px;
    display: none;
  }
}
</style>
