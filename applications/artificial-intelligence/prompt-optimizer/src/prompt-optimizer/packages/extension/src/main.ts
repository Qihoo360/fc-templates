import { createApp } from 'vue'
import { installI18nOnly } from '@prompt-optimizer/ui'
import App from './App.vue'

import './style.css'
import '@prompt-optimizer/ui/dist/style.css'

const app = createApp(App)
// 只安装i18n插件，语言初始化将在App.vue中服务准备好后进行
installI18nOnly(app)
app.mount('#app')