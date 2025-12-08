<template>
  <SettingsButton @open="settingsStore.showSettings = true" />

  <div
    v-if="settingsStore.showSettings"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b flex-shrink-0">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-semibold">设置</h2>
          <div class="flex space-x-1">
            <button
              @click="activeTab = 'providers'"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                activeTab === 'providers' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              AI模型
            </button>
            <button
              @click="activeTab = 'params'"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                activeTab === 'params' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              模型参数
            </button>
            <button
              @click="activeTab = 'prompts'"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                activeTab === 'prompts' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              提示词规则
            </button>
          </div>
        </div>
        <button
          @click="settingsStore.showSettings = false"
          class="p-1 hover:bg-gray-100 rounded"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <ProvidersTab
          v-if="activeTab === 'providers'"
          :providers="settingsStore.providers"
          :batch-testing-states="modelTesting.batchTestingStates.value"
          :testing-provider="modelTesting.testingProvider.value"
          @show-add-provider-type="providerMgmt.showAddProviderTypeDialog.value = true"
          @edit-provider="providerMgmt.editProvider"
          @delete-provider="providerMgmt.deleteProvider"
          @batch-test="modelTesting.batchTestModels"
          @show-add-model="modelMgmt.showAddModel"
          @edit-model="modelMgmt.editModel"
          @delete-model="modelMgmt.deleteModel"
          @test-model="modelTesting.handleModelTestClick"
          @save="settingsStore.saveSettings"
          :get-default-base-url="providerMgmt.getDefaultBaseUrl"
          :get-test-button-title="modelTesting.getTestButtonTitle"
          :get-batch-test-button-title="modelTesting.getBatchTestButtonTitle"
          :get-api-type-color="modelMgmt.getApiTypeColor"
          :get-api-type-label="modelMgmt.getApiTypeLabel"
        />

        <ModelParamsTab v-if="activeTab === 'params'" />

        <PromptsTab
          v-if="activeTab === 'prompts'"
          @reset-system="promptRules.resetSystemPromptRules"
          @reset-user="promptRules.resetUserPromptRules"
          @reset-requirement="promptRules.resetRequirementReportRules"
          @reset-quality-analysis-system="promptRules.resetQualityAnalysisSystemPrompt"
          @reset-thinking="promptRules.resetThinkingPointsExtractionPrompt"
          @reset-generation="promptRules.resetSystemPromptGenerationPrompt"
          @reset-advice="promptRules.resetOptimizationAdvicePrompt"
          @reset-application="promptRules.resetOptimizationApplicationPrompt"
          @toggle-slim-rules="promptRules.handleSlimRulesToggle"
          @reset-user-prompt-quality-analysis="promptRules.resetUserPromptQualityAnalysis"
          @reset-user-prompt-quick-optimization="promptRules.resetUserPromptQuickOptimization"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
        <button
          @click="settingsStore.showSettings = false"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="promptRules.saveAndClose"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          保存设置
        </button>
      </div>
    </div>
  </div>

  <ProviderTypeDialog
    v-if="providerMgmt.showAddProviderTypeDialog.value"
    @select="providerMgmt.selectProviderType"
    @close="providerMgmt.showAddProviderTypeDialog.value = false"
  />

  <ProviderDialog
    v-if="providerMgmt.showAddProvider.value"
    :editing="!!providerMgmt.editingProvider.value"
    :provider-type="providerMgmt.selectedProviderType.value"
    v-model:name="providerMgmt.newProvider.value.name"
    v-model:base-url="providerMgmt.newProvider.value.baseUrl"
    v-model:api-key="providerMgmt.newProvider.value.apiKey"
    :get-default-base-url="providerMgmt.getDefaultBaseUrl"
    :get-provider-template="providerMgmt.getProviderTemplate"
    @save="providerMgmt.saveProvider"
    @close="providerMgmt.closeProviderDialog"
  />

  <ModelDialog
    v-if="modelMgmt.showAddModelDialog.value"
    :editing="!!modelMgmt.editingModel.value"
    :provider="modelMgmt.getProviderForModel(modelMgmt.addingModelToProvider.value)"
    v-model:name="modelMgmt.newModel.value.name"
    v-model:id="modelMgmt.newModel.value.id"
    v-model:api-type="modelMgmt.newModel.value.apiType"
    v-model:search-keyword="modelMgmt.modelSearchKeyword.value"
    :available-models="modelMgmt.getCurrentProviderModels.value"
    :loading="modelMgmt.loadingModels.value"
    :error="modelMgmt.modelFetchError.value"
    @fetch-models="modelMgmt.fetchAvailableModels"
    @select-model="modelMgmt.selectModel"
    @save="modelMgmt.addCustomModel"
    @close="modelMgmt.closeAddModelDialog"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useModelTesting } from '@/components/settings/composables/useModelTesting'
import { useModelManagement } from '@/components/settings/composables/useModelManagement'
import { useProviderManagement } from '@/components/settings/composables/useProviderManagement'
import { usePromptRules } from '@/components/settings/composables/usePromptRules'

import SettingsButton from '@/components/settings/components/SettingsButton.vue'
import ProvidersTab from '@/components/settings/components/tabs/ProvidersTab.vue'
import ModelParamsTab from '@/components/settings/components/tabs/ModelParamsTab.vue'
import PromptsTab from '@/components/settings/components/tabs/PromptsTab.vue'
import ProviderTypeDialog from '@/components/settings/components/dialogs/ProviderTypeDialog.vue'
import ProviderDialog from '@/components/settings/components/dialogs/ProviderDialog.vue'
import ModelDialog from '@/components/settings/components/dialogs/ModelDialog.vue'

const settingsStore = useSettingsStore()
const activeTab = ref<'providers' | 'params' | 'prompts'>('providers')

// Composables
const modelTesting = useModelTesting()
const modelMgmt = useModelManagement()
const providerMgmt = useProviderManagement()
const promptRules = usePromptRules()
</script>