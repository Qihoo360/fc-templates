<template>
  <div class="rich-text-editor">
    <editor v-model="content" :init="initOptions" @on-init="handleInit" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Editor from '@tinymce/tinymce-vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const content = ref('这个是个测试')
const editorRef = ref(null)

const initOptions = {
  base_url: '/tinymce', // 指向 public/tinymce 目录
  suffix: '.min',
  height: 500,
  menubar: false,
  language: 'zh_CN', // 中文语言
  skin: 'oxide', // 皮肤
  plugins: [
    'advlist',
    'autolink',
    'lists',
    'link',
    'image',
    'preview',
    'anchor',
    'searchreplace',
    'visualblocks',
    'code',
    'fullscreen',
    'insertdatetime',
    'media',
    'table',
  ],
  inline: true,
  font_formats:
    '微软雅黑=Microsoft YaHei;宋体=SimSun;黑体=SimHei;仿宋=FangSong;华文黑体=STHeiti;华文楷体=STKaiti;华文宋体=STSong;华文仿宋=STFangsong;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings',
  fontsize_formats:
    '12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 42px 48px 56px 72px 80px 90px 100px 110px 120px 140px 150px 170px 190px 210px',
  toolbar:
    'undo redo | fontselect fontsizeselect | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
}
const handleInit = (editor: any) => {
  editorRef.value = editor
  console.info('TinyMCE 初始化完成', editor)
}
</script>

<style scoped>
.rich-text-editor {
  margin: 20px 0;
}
</style>
