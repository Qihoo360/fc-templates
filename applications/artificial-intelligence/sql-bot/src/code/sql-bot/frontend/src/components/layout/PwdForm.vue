<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { userApi } from '@/api/auth'
const { t } = useI18n()
const pwdRef = ref()
const pwdForm = reactive({
  pwd: '',
  new_pwd: '',
  confirm_pwd: '',
})
const PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+\-={}|:"<>?`\[\];',./])[A-Za-z\d~!@#$%^&*()_+\-={}|:"<>?`\[\];',./]{8,20}$/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error(t('common.please_input', { msg: t('user.upgrade_pwd.new_pwd') })))
  } else {
    if (!PWD_REGEX.test(value)) {
      callback(new Error(t('user.upgrade_pwd.pwd_format_error')))
      return
    }
    if (pwdForm.confirm_pwd !== '') {
      if (!pwdRef.value) return
      pwdRef.value.validateField('confirm_pwd')
    }
    callback()
  }
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error(t('common.please_input', { msg: t('user.upgrade_pwd.confirm_pwd') })))
  } else if (!PWD_REGEX.test(value)) {
    callback(new Error(t('user.upgrade_pwd.pwd_format_error')))
  } else if (value !== pwdForm.new_pwd) {
    callback(new Error(t('user.upgrade_pwd.two_pwd_not_match')))
  } else {
    callback()
  }
}
const rules = {
  pwd: [
    {
      required: true,
      message: t('common.please_input', { msg: t('user.upgrade_pwd.old_pwd') }),
      trigger: 'blur',
    },
  ],
  new_pwd: [{ validator: validatePass, trigger: 'blur' }],
  confirm_pwd: [{ validator: validatePass2, trigger: 'blur' }],
}

const emits = defineEmits(['pwdSaved'])

const submit = () => {
  pwdRef.value.validate((res: any) => {
    if (res) {
      const param = {
        pwd: pwdForm.pwd,
        new_pwd: pwdForm.new_pwd,
      }
      userApi.pwd(param).then(() => {
        ElMessage({
          type: 'success',
          message: t('common.save_success'),
        })
        emits('pwdSaved')
      })
    }
  })
}
defineExpose({
  submit,
})
</script>

<template>
  <div class="params-form">
    <el-form
      ref="pwdRef"
      :rules="rules"
      label-position="top"
      :model="pwdForm"
      style="width: 100%"
      @submit.prevent
    >
      <el-form-item prop="pwd" :label="t('user.upgrade_pwd.old_pwd')">
        <el-input
          v-model="pwdForm.pwd"
          :placeholder="t('common.please_input', { msg: t('user.upgrade_pwd.old_pwd') })"
          type="password"
          clearable
          show-password
        />
      </el-form-item>
      <el-form-item prop="new_pwd" :label="t('user.upgrade_pwd.new_pwd')">
        <el-input
          v-model="pwdForm.new_pwd"
          :placeholder="t('common.please_input', { msg: t('user.upgrade_pwd.new_pwd') })"
          type="password"
          show-password
          clearable
        />
      </el-form-item>
      <el-form-item prop="confirm_pwd" :label="t('user.upgrade_pwd.confirm_pwd')">
        <el-input
          v-model="pwdForm.confirm_pwd"
          :placeholder="t('common.please_input', { msg: t('user.upgrade_pwd.confirm_pwd') })"
          type="password"
          show-password
          clearable
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.params-form {
  .ed-form-item--default {
    margin-bottom: 16px;

    &.is-error {
      margin-bottom: 40px;
    }
  }

  .ed-input-number {
    width: 100%;
  }
}
</style>
