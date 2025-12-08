import { computed, ref } from 'vue'
import PlaygroundChatPanel from './PlaygroundChatPanel.vue'
import PreviewPanel from './PreviewPanel.js'
import '@/style/playground.css'
import { extractArtifact } from '@/services/playground/artifactParser'
import { PlaygroundAIService } from '@/services/playground/aiPlaygroundService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'

export default {
  components: { PlaygroundChatPanel, PreviewPanel },
  props: {
    systemPrompt: {
      type: String,
      default: ''
    }
  },
  emits: ['open-system-prompt'],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        <div class="w-full xl:w-[420px] xl:max-w-[460px] flex-shrink-0 flex flex-col min-h-[300px]">
          <PlaygroundChatPanel
            :messages="messages"
            :is-streaming="isStreaming"
            :is-stream-mode="settingsStore.streamMode"
            :has-system-prompt="hasSystemPrompt"
            :current-model-name="currentModelName"
            @send="handleSend"
            @clear="handleClear"
            @toggle-stream="toggleStreamMode"
            @open-system-prompt="$emit('open-system-prompt')"
          />
        </div>
        <div class="flex-1 min-h-0 bg-[#f0f4f9] rounded-lg overflow-hidden">
          <PreviewPanel :artifact="currentArtifact" />
        </div>
      </div>
    </div>
  `,
  setup(props) {
    const settingsStore = useSettingsStore()
    const notificationStore = useNotificationStore()
    const aiService = PlaygroundAIService.getInstance()

    const messages = ref([])
    const isStreaming = ref(false)
    const currentArtifact = ref(null)

    const hasSystemPrompt = computed(() => Boolean(props.systemPrompt && props.systemPrompt.trim().length))

    const currentModelName = computed(() => {
      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()
      if (provider && model) {
        return `${provider.name} · ${model.name}`
      }
      return '未连接模型'
    })

    const ensureProvider = () => {
      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()
      if (!provider || !model || !provider.apiKey) {
        notificationStore.warning('请先在系统设置中配置可用的 AI 模型和 API Key')
        return null
      }
      return { provider, model }
    }

    const handleClear = () => {
      messages.value = []
      currentArtifact.value = null
    }

    const toggleStreamMode = () => {
      settingsStore.streamMode = !settingsStore.streamMode
      settingsStore.saveSettings()
    }

    const handleSend = async (payload) => {
      const text = payload?.text?.trim()
      if (!text) return

      const providerInfo = ensureProvider()
      if (!providerInfo) return

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        text,
        timestamp: Date.now()
      }
      messages.value.push(userMessage)

      isStreaming.value = true
      const aiMsgId = `${Date.now()}_ai`
      const aiMessageIdx =
        messages.value.push({
          id: aiMsgId,
          role: 'model',
          text: '',
          displayText: '',
          isStreaming: true,
          timestamp: Date.now()
        }) - 1

      const payloadMessages = messages.value.map((msg) => ({
        id: msg.id,
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text,
        timestamp: msg.timestamp
      }))

      const useStream = settingsStore.streamMode

      try {
        let accumulated = ''
        const onChunk = (chunkText) => {
          accumulated += chunkText
          messages.value[aiMessageIdx].text = accumulated
          messages.value[aiMessageIdx].displayText = buildDisplayText(accumulated)
          const artifact = extractArtifact(accumulated)
          if (artifact) {
            currentArtifact.value = artifact
          }
        }

        const response = await aiService.send({
          messages: payloadMessages,
          provider: providerInfo.provider,
          modelId: providerInfo.model.id,
          stream: useStream,
          onChunk: useStream ? onChunk : undefined,
          systemPrompt: props.systemPrompt
        })

        if (!useStream && typeof response === 'string') {
          messages.value[aiMessageIdx].text = response
          messages.value[aiMessageIdx].displayText = response
          const artifact = extractArtifact(response)
          if (artifact) {
            currentArtifact.value = artifact
          }
        }
      } catch (err) {
        messages.value[aiMessageIdx].text += `\n\n*Error: ${err?.message || err}*`
        messages.value[aiMessageIdx].displayText = messages.value[aiMessageIdx].text
      } finally {
        messages.value[aiMessageIdx].isStreaming = false
        messages.value[aiMessageIdx].displayText = messages.value[aiMessageIdx].text
        isStreaming.value = false
      }
    }

    return {
      messages,
      isStreaming,
      currentArtifact,
      handleSend,
      handleClear,
      toggleStreamMode,
      currentModelName,
      settingsStore,
      hasSystemPrompt
    }
  }
}

const buildDisplayText = (text) => {
  const matches = text.match(/```/g)
  if (matches && matches.length % 2 !== 0) {
    return `${text}\n\`\`\``
  }
  return text
}
