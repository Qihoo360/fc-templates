<template>
  <div
    v-if="show"
    class="fixed inset-0 theme-mask z-[60] flex items-center justify-center overflow-y-auto"
    @click="onBackdropClick"
  >
    <div
      class="relative theme-manager-container w-full max-w-4xl m-4"
    >
      <div class="p-6 space-y-6">
        <!-- 标题和关闭按钮 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h2 class="text-xl font-semibold theme-manager-text">{{ t('templateManager.title') }}</h2>
            <button
              @click="showSyntaxGuide = true"
              class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
              :title="t('templateManager.syntaxGuide')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              <span class="hidden md:inline">{{ t('templateManager.syntaxGuide') }}</span>
            </button>
            <!-- Built-in Template Language Switch -->
            <BuiltinTemplateLanguageSwitch 
              @language-changed="handleLanguageChanged" 
            />
          </div>
          <div class="flex items-center space-x-4">
            <span v-if="selectedTemplate" class="text-sm theme-manager-text-secondary">
              {{ t('common.currentTemplate') }}: {{ selectedTemplate.name }}
            </span>
            <button
              @click="close"
              class="theme-manager-text-secondary hover:theme-manager-text transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <!-- 新增类型切换标签 -->
        <div class="flex space-x-2 mb-6 p-1 theme-manager-card">
          <button
            @click="currentCategory = 'system-optimize'"
            :class="[
              'flex-1 font-medium transition-all duration-200 text-sm',
              currentCategory === 'system-optimize'
                ? 'theme-manager-button-primary'
                : 'theme-manager-button-secondary'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <span class="text-lg">🎯</span>
              <span>{{ t('templateManager.optimizeTemplates') }}</span>
            </div>
          </button>
          <button
            @click="currentCategory = 'user-optimize'"
            :class="[
              'flex-1 font-medium transition-all duration-200 text-sm',
              currentCategory === 'user-optimize'
                ? 'theme-manager-button-primary'
                : 'theme-manager-button-secondary'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <span class="text-lg">👤</span>
              <span>{{ t('templateManager.userOptimizeTemplates') }}</span>
            </div>
          </button>
          <button
            @click="currentCategory = 'iterate'"
            :class="[
              'flex-1 font-medium transition-all duration-200 text-sm',
              currentCategory === 'iterate'
                ? 'theme-manager-button-primary'
                : 'theme-manager-button-secondary'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <span class="text-lg">🔄</span>
              <span>{{ t('templateManager.iterateTemplates') }}</span>
            </div>
          </button>
        </div>

        <!-- 提示词列表 -->
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold flex items-center gap-2 min-w-0 overflow-hidden">
              <span class="theme-manager-text truncate">
                {{ getCurrentCategoryLabel() }}
              </span>
              <span class="theme-manager-tag whitespace-nowrap flex-shrink-0 mr-2">
                {{ t('templateManager.templateCount', { count: filteredTemplates.length }) }}
              </span>
            </h3>
            <button
              @click="showAddForm = true"
              class="flex text-sm items-center gap-1 flex-shrink-0 theme-manager-button-secondary"
            >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M6 12v6"/></svg>
              {{ t('templateManager.addTemplate') }}
            </button>
          </div>
          
          <!-- 提示词列表按类型过滤 -->
          <div class="space-y-4 max-h-[60vh] overflow-y-auto p-2">
            <div 
              v-for="template in filteredTemplates"
              :key="template.id"
              class="theme-manager-card p-4 group relative transition-all duration-300 ease-in-out"
              :class="[
                getSelectedTemplateId() === template.id
                  ? 'opacity-70 shadow-none hover:shadow-none scale-[0.99] transform'
                  : 'theme-manager-card'
              ]"
              @click="getSelectedTemplateId() !== template.id && selectTemplate(template)"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-medium theme-manager-text">{{ template.name }}</h4>
                  <p class="text-sm theme-manager-text-secondary mt-1">
                    {{ template.metadata.description || t('common.noDescription') }}
                  </p>
                  <p class="text-xs theme-manager-text-disabled mt-2">
                    {{ t('common.lastModified') }}: {{ formatDate(template.metadata.lastModified) }}
                  </p>
                </div>
                <div class="flex items-center space-x-2" @click.stop>
                  <button
                    @click="selectTemplate(template)"
                    :class="[
                      'rounded-lg hidden text-sm',
                      getSelectedTemplateId() === template.id
                        ? 'theme-manager-button-primary'
                        : 'theme-manager-button-secondary'
                    ]"
                  >
                    {{ getSelectedTemplateId() === template.id
                      ? t('template.selected')
                      : t('template.select') }}
                  </button>
                  <button
                    v-if="!template.isBuiltin"
                    @click="editTemplate(template)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  <span class="hidden md:inline">{{ t('common.edit') }}</span>
                  </button>
                  <button
                    v-if="template.isBuiltin"
                    @click="viewTemplate(template)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary "
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span class="hidden md:inline">{{ t('template.view') }}</span>
                  </button>
                  <button
                    v-if="template.isBuiltin"
                    @click="copyTemplate(template)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                  </svg>
                  <span class="hidden md:inline">{{ t('templateManager.copyTemplate') }}</span>
                  </button>
                  <button
                    v-if="!template.isBuiltin && isStringTemplate(template)"
                    @click="showMigrationDialog(template)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
                    :title="t('templateManager.convertToAdvanced')"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span class="hidden md:inline">{{ t('templateManager.migrate') }}</span>
                  </button>
                  <button
                    @click="exportTemplate(template.id)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary hidden"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span class="hidden md:inline">{{ t('templateManager.exportTemplate') }}</span>
                  </button>
                  <button
                    v-if="!template.isBuiltin"
                    @click="confirmDelete(template.id)"
                    class="text-sm inline-flex items-center gap-1 theme-manager-button-danger"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  <span class="hidden md:inline">{{ t('common.delete') }}</span>
                  </button>
                </div>
              </div>
              <div 
                class="absolute top-0 left-0 w-2 h-full rounded-l-xl"
                :class="template.metadata.templateType === 'optimize' ? 'theme-manager-card-optimize' : 'theme-manager-card-iterate'"
              ></div>
              <div class="mt-2">
                <span 
                  class="theme-manager-tag ml-1 min-w-[48px]"
                >
                  {{ template.isBuiltin ? t('common.builtin') : t('common.custom') }}
                </span>
                <!-- 模板类型标签 -->
                <span 
                  class="theme-manager-tag ml-2"
                  :class="TemplateProcessor.isSimpleTemplate(template) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'"
                >
                  {{ TemplateProcessor.isSimpleTemplate(template) ? '📝 ' + t('templateManager.simpleTemplate') : '⚡ ' + t('templateManager.advancedTemplate') }}
                </span>
                <transition name="fade">
                    <span
                    v-if="getSelectedTemplateId() === template.id"
                    class="capitalize ml-2 theme-manager-tag transition-opacity duration-300 ease-in-out"
                  >{{ t('template.selected') }}</span>
                </transition>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用 Teleport 将模态框传送到 body -->
        <Teleport to="body">
          <!-- 查看/编辑模态框 -->
          <div v-if="showAddForm || editingTemplate || viewingTemplate" 
               class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-4"
               @click="onEditModalBackdropClick">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div class="relative theme-manager-container w-full max-w-4xl mx-4 my-4 max-h-[calc(100vh-2rem)] overflow-y-auto z-10">
              <div class="p-6 space-y-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <h3 class="text-xl font-semibold theme-manager-text">
                      {{ viewingTemplate
                        ? t('template.view')
                        : (editingTemplate ? t('template.edit') : t('template.add')) }}
                    </h3>
                    <!-- 在查看或编辑时显示模板类型 -->
                    <span 
                      v-if="viewingTemplate || editingTemplate"
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="(viewingTemplate || editingTemplate) && TemplateProcessor.isSimpleTemplate((viewingTemplate || editingTemplate)!) 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-purple-100 text-purple-700 border border-purple-200'"
                    >
                      {{ (viewingTemplate || editingTemplate) && TemplateProcessor.isSimpleTemplate((viewingTemplate || editingTemplate)!) 
                        ? '📝 ' + t('templateManager.simpleTemplate') 
                        : '⚡ ' + t('templateManager.advancedTemplate') }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <!-- Template Syntax Guide Toggle -->
                    <button
                      @click="showSyntaxGuide = !showSyntaxGuide"
                      class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
                      :title="t('templateManager.syntaxGuide')"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                      </svg>
                      <span class="hidden md:inline">{{ t('templateManager.help') }}</span>
                    </button>
                    <button
                      @click="cancelEdit"
                      class="theme-manager-text-secondary hover:theme-manager-text transition-colors text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium theme-manager-text mb-1.5">{{ t('template.name') }}</label>
                    <input
                      v-model="form.name"
                      type="text"
                      required
                      :readonly="!!viewingTemplate"
                      class="theme-manager-input"
                      :class="{ 'opacity-75 cursor-not-allowed': viewingTemplate }"
                      :placeholder="t('template.namePlaceholder')"
                    />
                  </div>

                  <!-- Template Format Selector -->
                  <div v-if="!viewingTemplate">
                    <label class="block text-sm font-medium theme-manager-text mb-2">{{ t('templateManager.templateFormat') }}</label>
                    <div class="flex space-x-3 mb-4">
                      <button
                        type="button"
                        @click="form.isAdvanced = false"
                        :class="[
                          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          !form.isAdvanced
                            ? 'theme-manager-button-primary'
                            : 'theme-manager-button-secondary'
                        ]"
                      >
                        <div class="flex items-center justify-center space-x-2">
                          <span>📝</span>
                          <span>{{ t('templateManager.simpleTemplate') }}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        @click="form.isAdvanced = true"
                        :class="[
                          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          form.isAdvanced
                            ? 'theme-manager-button-primary'
                            : 'theme-manager-button-secondary'
                        ]"
                      >
                        <div class="flex items-center justify-center space-x-2">
                          <span>⚡</span>
                          <span>{{ t('templateManager.advancedTemplate') }}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Simple Template Editor -->
                  <div v-if="!form.isAdvanced">
                    <label class="block text-sm font-medium theme-manager-text mb-1.5">
                      {{ t('template.content') }}
                      <span class="text-xs theme-manager-text-secondary ml-2">
                        {{ t('templateManager.simpleTemplateHint') }}
                      </span>
                    </label>
                    <textarea
                      v-model="form.content"
                      required
                      :readonly="!!viewingTemplate"
                      rows="15"
                      class="theme-manager-input resize-y font-mono text-sm min-h-[200px] max-h-[400px]"
                      :class="{ 'opacity-75 cursor-not-allowed': viewingTemplate }"
                      :placeholder="t('template.contentPlaceholder')"
                    ></textarea>
                  </div>

                  <!-- Advanced Template Editor -->
                  <div v-else>
                    <div class="flex items-center justify-between mb-3">
                      <label class="block text-sm font-medium theme-manager-text">
                        {{ t('templateManager.messageTemplates') }}
                        <span class="text-xs theme-manager-text-secondary ml-2">
                          {{ t('templateManager.advancedTemplateHint') }}
                        </span>
                      </label>
                      <button
                        type="button"
                        @click="addMessage"
                        :disabled="!!viewingTemplate"
                        class="text-sm inline-flex items-center gap-1 theme-manager-button-secondary"
                        :class="{ 'opacity-50 cursor-not-allowed': viewingTemplate }"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {{ t('templateManager.addMessage') }}
                      </button>
                    </div>

                    <!-- Message List -->
                    <div class="space-y-3 max-h-[500px] overflow-y-auto">
                      <div
                        v-for="(message, index) in form.messages"
                        :key="index"
                        class="theme-manager-card p-4 relative"
                      >
                        <div class="flex items-start space-x-3">
                          <!-- Role Selector -->
                          <div class="flex-shrink-0">
                            <select
                              v-model="message.role"
                              :disabled="!!viewingTemplate"
                              class="theme-manager-input text-sm w-24"
                              :class="{ 'opacity-75 cursor-not-allowed': viewingTemplate }"
                            >
                              <option value="system">{{ t('templateManager.roleSystem') }}</option>
                              <option value="user">{{ t('templateManager.roleUser') }}</option>
                              <option value="assistant">{{ t('templateManager.roleAssistant') }}</option>
                            </select>
                          </div>

                          <!-- Message Content -->
                          <div class="flex-1">
                            <textarea
                              v-model="message.content"
                              :readonly="!!viewingTemplate"
                              class="theme-manager-input font-mono text-sm w-full resize-y message-content-textarea"
                              :style="{ 
                                minHeight: '80px',
                                height: '120px'
                              }"
                              :class="{ 'opacity-75 cursor-not-allowed': viewingTemplate }"
                              :placeholder="t('templateManager.messageContentPlaceholder')"
                            ></textarea>
                          </div>

                          <!-- Message Controls -->
                          <div v-if="!viewingTemplate" class="flex-shrink-0 flex flex-col space-y-1">
                            <button
                              type="button"
                              @click="moveMessage(index, -1)"
                              :disabled="index === 0"
                              class="p-1 rounded theme-manager-button-secondary text-xs"
                              :class="{ 'opacity-50 cursor-not-allowed': index === 0 }"
                              :title="t('templateManager.moveUp')"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              @click="moveMessage(index, 1)"
                              :disabled="index === form.messages.length - 1"
                              class="p-1 rounded theme-manager-button-secondary text-xs"
                              :class="{ 'opacity-50 cursor-not-allowed': index === form.messages.length - 1 }"
                              :title="t('templateManager.moveDown')"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              @click="removeMessage(index)"
                              class="p-1 rounded theme-manager-button-danger text-xs"
                              :title="t('templateManager.removeMessage')"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Template Preview -->
                  <div v-if="form.isAdvanced && form.messages.length > 0">
                    <label class="block text-sm font-medium theme-manager-text mb-2">{{ t('templateManager.preview') }}</label>
                    <div class="theme-manager-card p-4 max-h-64 overflow-y-auto">
                      <div class="space-y-2">
                        <div
                          v-for="(message, index) in processedPreview"
                          :key="index"
                          class="flex items-start space-x-2 text-sm"
                        >
                          <span
                            class="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                            :class="{
                              'bg-blue-100 text-blue-800': message.role === 'system',
                              'bg-green-100 text-green-800': message.role === 'user',
                              'bg-purple-100 text-purple-800': message.role === 'assistant'
                            }"
                          >
                            {{ message.role }}
                          </span>
                          <span class="theme-manager-text-secondary font-mono text-xs flex-1">
                            {{ message.content }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium theme-manager-text mb-1.5">{{ t('common.description') }}</label>
                    <textarea
                      v-model="form.description"
                      :readonly="!!viewingTemplate"
                      rows="2"
                      class="theme-manager-input resize-y min-h-[60px] max-h-[120px]"
                      :class="{ 'opacity-75 cursor-not-allowed': viewingTemplate }"
                      :placeholder="t('template.descriptionPlaceholder')"
                    ></textarea>
                  </div>

                  <div class="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      @click="cancelEdit"
                      class="theme-manager-button-secondary"
                    >
                      {{ viewingTemplate ? t('common.close') : t('common.cancel') }}
                    </button>
                    <button
                      v-if="!viewingTemplate"
                      type="submit"
                      class="theme-manager-button-primary"
                    >
                      {{ editingTemplate ? t('template.save') : t('template.add') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Syntax Guide Panel -->
          <div v-if="showSyntaxGuide"
               class="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto py-4"
               @click="onSyntaxGuideBackdropClick">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div class="relative theme-manager-container w-full max-w-4xl mx-4 my-4 max-h-[calc(100vh-2rem)] overflow-y-auto z-10">
              <div class="p-6 space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold theme-manager-text">{{ t('templateManager.syntaxGuide') }}</h3>
                  <button
                    @click="showSyntaxGuide = false"
                    class="theme-manager-text-secondary hover:theme-manager-text transition-colors text-xl"
                  >
                    ×
                  </button>
                </div>

                <!-- Markdown Content -->
                <div class="syntax-guide-content">
                  <MarkdownRenderer :content="syntaxGuideMarkdown" />
                </div>

                <div class="flex justify-end">
                  <button
                    @click="showSyntaxGuide = false"
                    class="theme-manager-button-primary"
                  >
                    {{ t('common.close') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Migration Dialog -->
          <div v-if="migrationDialog.show"
               class="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto"
               @click="onMigrationDialogBackdropClick">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div class="relative theme-manager-container w-full max-w-2xl m-4 z-10">
              <div class="p-6 space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold theme-manager-text">{{ t('templateManager.convertToAdvanced') }}</h3>
                  <button
                    @click="migrationDialog.show = false"
                    class="theme-manager-text-secondary hover:theme-manager-text transition-colors text-xl"
                  >
                    ×
                  </button>
                </div>

                <div class="space-y-4">
                  <p class="theme-manager-text-secondary">{{ t('templateManager.migrationDescription') }}</p>

                  <!-- Original Template -->
                  <div>
                    <h4 class="font-medium theme-manager-text mb-2">{{ t('templateManager.originalTemplate') }}</h4>
                    <pre class="theme-manager-code-block max-h-32 overflow-y-auto">{{ migrationDialog.original }}</pre>
                  </div>

                  <!-- Converted Template -->
                  <div>
                    <h4 class="font-medium theme-manager-text mb-2">{{ t('templateManager.convertedTemplate') }}</h4>
                    <pre class="theme-manager-code-block max-h-32 overflow-y-auto">{{ JSON.stringify(migrationDialog.converted, null, 2) }}</pre>
                  </div>
                </div>

                <div class="flex justify-end space-x-3">
                  <button
                    @click="migrationDialog.show = false"
                    class="theme-manager-button-secondary"
                  >
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    @click="applyMigration"
                    class="theme-manager-button-primary"
                  >
                    {{ t('templateManager.applyMigration') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- 导入提示词 -->
        <div class="theme-manager-divider pt-2 hidden">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold theme-manager-text">{{ t('template.import.title') }}</h3>
          </div>
          <div class="flex items-center space-x-3">
            <input
              type="file"
              ref="fileInput"
              accept=".json"
              class="hidden"
              @change="handleFileImport"
            />
            <button
              @click="fileInput?.click()"
              class="text-sm inline-flex gap-1 theme-manager-button-secondary"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 my-[2px]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25-2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
            </svg>
              {{ t('common.selectFile') }}
            </button>
            <span class="text-sm theme-manager-text-secondary">{{ t('template.import.supportFormat') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { TemplateProcessor, type Template, type MessageTemplate } from '@prompt-optimizer/core'
import { useToast } from '../composables/useToast'
import MarkdownRenderer from './MarkdownRenderer.vue'
import BuiltinTemplateLanguageSwitch from './BuiltinTemplateLanguageSwitch.vue'
import { syntaxGuideContent } from '../docs/syntax-guide'
import type { ITemplateManager, TemplateLanguageService } from '@prompt-optimizer/core'
import { i18n } from '../plugins/i18n'

const { t } = useI18n()

interface Services {
  templateManager: ITemplateManager;
  templateLanguageService: TemplateLanguageService;
}

// 通过依赖注入获取服务
const services = inject<{ value: Services | null }>('services')
if (!services?.value) {
  throw new Error('TemplateManager Error: The required "services" were not provided by a parent component. Make sure this component is a child of a component that uses "provide(\'services\', ...)"')
}

const getTemplateManager = computed(() => services.value!.templateManager)
const getTemplateLanguageService = computed(() => services.value!.templateLanguageService)

const props = defineProps<{
  selectedSystemOptimizeTemplate?: Template,
  selectedUserOptimizeTemplate?: Template,
  selectedIterateTemplate?: Template,
  templateType: 'optimize' | 'userOptimize' | 'iterate',
  show: boolean
}>()

const emit = defineEmits(['close', 'select', 'update:show', 'languageChanged'])
const toast = useToast()

const templates = ref<Template[]>([])
const currentCategory = ref(getCategoryFromProps())
const currentType = computed(() => getCurrentTemplateType())
const showAddForm = ref(false)
const editingTemplate = ref<Template | null>(null)
const viewingTemplate = ref<Template | null>(null)
const showSyntaxGuide = ref(false)

const form = ref<{
  name: string
  content: string
  description: string
  isAdvanced: boolean
  messages: MessageTemplate[]
}>({
  name: '',
  content: '',
  description: '',
  isAdvanced: false,
  messages: []
})

const migrationDialog = ref<{
  show: boolean
  template: Template | null
  original: string
  converted: MessageTemplate[]
}>({
  show: false,
  template: null,
  original: '',
  converted: []
})

// 添加计算属性
const selectedTemplate = computed(() => {
  switch (props.templateType) {
    case 'optimize':
      return props.selectedSystemOptimizeTemplate
    case 'userOptimize':
      return props.selectedUserOptimizeTemplate
    case 'iterate':
      return props.selectedIterateTemplate
    default:
      return null
  }
})

// 根据props确定初始分类
function getCategoryFromProps() {
  switch (props.templateType) {
    case 'optimize':
      return 'system-optimize'
    case 'userOptimize':
      return 'user-optimize'
    case 'iterate':
      return 'iterate'
    default:
      return 'system-optimize'
  }
}

// 获取当前模板类型 - 根据当前分类而不是props
function getCurrentTemplateType(): 'optimize' | 'userOptimize' | 'iterate' {
  switch (currentCategory.value) {
    case 'system-optimize':
      return 'optimize'
    case 'user-optimize':
      return 'userOptimize'
    case 'iterate':
      return 'iterate'
    default:
      return 'optimize'
  }
}

// 获取当前选中的模板ID
function getSelectedTemplateId() {
  return selectedTemplate.value?.id
}

// 获取当前分类标签
function getCurrentCategoryLabel() {
  switch (currentCategory.value) {
    case 'system-optimize':
      return t('templateManager.optimizeTemplateList')
    case 'user-optimize':
      return t('templateManager.userOptimizeTemplateList')
    case 'iterate':
      return t('templateManager.iterateTemplateList')
    default:
      return ''
  }
}

// 检查是否为字符串模板
const isStringTemplate = (template: Template) => {
  return typeof template.content === 'string'
}

// 处理预览数据
const processedPreview = computed(() => {
  if (!form.value.isAdvanced || !form.value.messages.length) return []

  const sampleContext = {
    prompt: 'Write a creative story about space exploration',
    originalPrompt: 'Write a story',
    iterateInput: 'Make it more creative and add space exploration theme'
  }

  try {
    const tempTemplate: Template = {
      id: 'preview',
      name: 'Preview',
      content: JSON.parse(JSON.stringify(form.value.messages)),
      metadata: { version: '1.0', lastModified: Date.now(), templateType: currentType.value }
    }
    return TemplateProcessor.processTemplate(tempTemplate, sampleContext)
  } catch (error) {
    console.error('Preview processing error:', error)
    return form.value.messages.map(msg => ({
      role: msg.role,
      content: msg.content || '[Empty content]'
    }))
  }
})

// 加载提示词列表
const loadTemplates = async () => {
  try {
    // 统一使用异步方法
    const allTemplates = await getTemplateManager.value.listTemplates()
    templates.value = allTemplates
    console.log('加载到的提示词:', templates.value)
  } catch (error) {
    console.error('加载提示词失败:', error)
    toast.error('加载提示词失败')
  }
}

// 格式化日期
const formatDate = (timestamp: number) => {
  if (!timestamp) return t('template.unknownTime')
  return new Date(timestamp).toLocaleString()
}

// 编辑提示词
const editTemplate = (template: Template) => {
  editingTemplate.value = template
  const isAdvanced = Array.isArray(template.content)

  form.value = {
    name: template.name,
    content: isAdvanced ? '' : template.content as string,
    description: template.metadata.description || '',
    isAdvanced,
    messages: isAdvanced ? [...template.content] as MessageTemplate[] : []
  }

  // 等待DOM更新后初始化textarea高度
  nextTick(() => {
    initializeAllTextareas()
  })
}

// 查看提示词
const viewTemplate = (template: Template) => {
  viewingTemplate.value = template
  const isAdvanced = Array.isArray(template.content)

  form.value = {
    name: template.name,
    content: isAdvanced ? '' : template.content as string,
    description: template.metadata.description || '',
    isAdvanced,
    messages: isAdvanced ? [...template.content] as MessageTemplate[] : []
  }

  // 等待DOM更新后初始化textarea高度
  nextTick(() => {
    initializeAllTextareas()
  })
}

// 取消编辑
const cancelEdit = () => {
  showAddForm.value = false
  editingTemplate.value = null
  viewingTemplate.value = null
  showSyntaxGuide.value = false
  form.value = {
    name: '',
    content: '',
    description: '',
    isAdvanced: false,
    messages: []
  }
}

// 生成唯一的模板ID
const generateUniqueTemplateId = (baseName = 'template') => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  let candidateId = `${baseName}-${timestamp}-${random}`
  
  // 确保ID不与现有模板冲突
  const existingIds = templates.value.map(t => t.id)
  let counter = 1
  while (existingIds.includes(candidateId)) {
    candidateId = `${baseName}-${timestamp}-${random}-${counter}`
    counter++
  }
  
  return candidateId
}

// 添加消息
const addMessage = () => {
  form.value.messages.push({
    role: 'user',
    content: ''
  })
}

// 移除消息
const removeMessage = (index: number) => {
  form.value.messages.splice(index, 1)
}

// 移动消息
const moveMessage = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < form.value.messages.length) {
    const messages = [...form.value.messages]
    const temp = messages[index]
    messages[index] = messages[newIndex]
    messages[newIndex] = temp
    form.value.messages = messages
  }
}

// 初始化textarea高度 - 只在打开时调用一次
const initializeTextareaHeight = (textarea: HTMLTextAreaElement) => {
  if (!textarea || (textarea as any)._initialized) return
  
  try {
    const minHeight = 80
    const maxHeight = 280
    
    // 临时设置为auto获取内容高度
    const originalHeight = textarea.style.height
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    
    let initialHeight
    if (scrollHeight <= minHeight) {
      initialHeight = minHeight
    } else if (scrollHeight >= maxHeight) {
      initialHeight = maxHeight
    } else {
      initialHeight = scrollHeight
    }
    
    textarea.style.height = initialHeight + 'px'
    ;(textarea as any)._initialized = true
  } catch (error) {
    console.warn('Textarea initialization error:', error)
  }
}

// 显示迁移对话框
const showMigrationDialog = (template: Template) => {
  if (!isStringTemplate(template) || typeof template.content !== 'string') return

  const converted: MessageTemplate[] = [
    {
      role: 'system',
      content: template.content
    },
    {
      role: 'user',
      content: '{{originalPrompt}}'
    }
  ]

  migrationDialog.value = {
    show: true,
    template,
    original: template.content,
    converted
  }
}

// 应用迁移
const applyMigration = async () => {
  try {
    const template = migrationDialog.value.template
    if (!template) return

    const updatedTemplate: Template = {
      ...template,
      content: migrationDialog.value.converted,
      metadata: {
        ...template.metadata,
        lastModified: Date.now()
      }
    }

    // ElectronProxy会自动处理序列化，这里不需要手动处理
    await getTemplateManager.value.saveTemplate(updatedTemplate)
    await loadTemplates()

    // 如果当前选中的模板被更新，重新选择
    const isCurrentSelected = getSelectedTemplateId() === template.id

    if (isCurrentSelected) {
      try {
        const updated = getTemplateManager.value.getTemplate(template.id)
        if (updated) {
          const templateType = currentCategory.value === 'iterate' ? 'iterate' : 'optimize'
          emit('select', updated, templateType)
        }
      } catch (error) {
        console.error('Failed to get updated template:', error)
      }
    }

    migrationDialog.value.show = false
    toast.success(t('templateManager.migrationSuccess'))
  } catch (error) {
    console.error('Migration failed:', error)
    toast.error(t('templateManager.migrationFailed'))
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    if (form.value.isAdvanced) {
      if (!form.value.messages.length) {
        toast.error(t('templateManager.noMessagesError'))
        return
      }

      const hasEmptyContent = form.value.messages.some(msg => !msg.content.trim())
      if (hasEmptyContent) {
        toast.error(t('templateManager.emptyMessageError'))
        return
      }
    } else {
      if (!form.value.content.trim()) {
        toast.error(t('templateManager.emptyContentError'))
        return
      }
    }

    const metadata = {
      version: '1.0.0',
      lastModified: Date.now(),
      description: form.value.description,
      author: 'User',
      templateType: getCurrentTemplateType()
    }

    const templateData: Template = {
      id: editingTemplate.value?.id || generateUniqueTemplateId('user-template'),
      name: form.value.name,
      content: form.value.isAdvanced ? JSON.parse(JSON.stringify(form.value.messages)) : form.value.content,
      metadata
    }

    // IPC层会自动处理序列化，这里不需要手动处理
    await getTemplateManager.value.saveTemplate(templateData)
    await loadTemplates()

    const isCurrentSelected = getSelectedTemplateId() === templateData.id

    if (editingTemplate.value && isCurrentSelected) {
      try {
        // 统一使用异步方法
        const updatedTemplate = await getTemplateManager.value.getTemplate(templateData.id)
        if (updatedTemplate) {
          emit('select', updatedTemplate, getCurrentTemplateType());
        }
      } catch (error) {
        console.error('Failed to get updated template after save:', error)
      }
    }

    toast.success(editingTemplate.value ? t('template.success.updated') : t('template.success.added'))
    cancelEdit()
  } catch (error) {
    console.error('保存提示词失败:', error)
    toast.error(t('template.error.saveFailed'))
  }
}

// 确认删除
const confirmDelete = async (templateId: string) => {
  if (confirm(t('template.deleteConfirm'))) {
    try {
      await getTemplateManager.value.deleteTemplate(templateId)
      await loadTemplates()

      // 获取当前分类的剩余模板
      const remainingTemplates = filteredTemplates.value

      if (getSelectedTemplateId() === templateId) {
        emit('select', remainingTemplates[0] || null, getCurrentTemplateType())
      }
      
      toast.success(t('template.success.deleted'))
    } catch (error) {
      console.error('删除提示词失败:', error)
      toast.error(t('template.error.deleteFailed'))
    }
  }
}

// 导出提示词
const exportTemplate = async (templateId: string) => {
  try {
    const templateJson = await getTemplateManager.value.exportTemplate(templateId);
    const blob = new Blob([templateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${templateId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('template.success.exported'));
  } catch (error) {
    console.error('导出提示词失败:', error);
    toast.error(t('template.error.exportFailed'));
  }
}

// 导入提示词
const fileInput = ref<HTMLInputElement | null>(null)
const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        if (e.target?.result && typeof e.target.result === 'string') {
          await getTemplateManager.value.importTemplate(e.target.result)
        } else {
          // 让失败不再静默，明确地抛出错误
          throw new Error('Failed to read file content as string.')
        }
        await loadTemplates()
        toast.success(t('template.success.imported'))
        if (target) {
          target.value = ''
        }
      } catch (error) {
        console.error('导入提示词失败:', error)
        toast.error(t('template.error.importFailed'))
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('读取文件失败:', error)
    toast.error(t('template.error.readFailed'))
  }
}

// 复制内置提示词
const copyTemplate = (template: Template) => {
  showAddForm.value = true
  const isAdvanced = Array.isArray(template.content)

  form.value = {
    name: `${template.name} - 副本`,
    content: isAdvanced ? '' : template.content as string,
    description: template.metadata.description || '',
    isAdvanced,
    messages: isAdvanced ? [...template.content] as MessageTemplate[] : []
  }
}

// 选择提示词
const selectTemplate = (template: Template) => {
  emit('select', template, getCurrentTemplateType());
}

// 按分类过滤提示词
const filteredTemplates = computed(() => {
  return templates.value.filter(t => {
    const templateType = t.metadata.templateType

    switch (currentCategory.value) {
      case 'system-optimize':
        // 系统提示词优化模板：optimize类型
        return templateType === 'optimize'

      case 'user-optimize':
        // 用户提示词优化模板：userOptimize类型
        return templateType === 'userOptimize'

      case 'iterate':
        // 迭代优化模板：iterate类型
        return templateType === 'iterate'

      default:
        return false
    }
  })
})

// 获取当前语言的语法指南内容
const syntaxGuideMarkdown = computed(() => {
  const lang = i18n.global.locale.value as keyof typeof syntaxGuideContent
  return syntaxGuideContent[lang] || syntaxGuideContent['zh-CN']
})

  // 处理内置模板语言变化
  const handleLanguageChanged = async (newLanguage: string) => {
    // 重新加载模板列表以反映新的语言
    await loadTemplates()

    // 如果当前选中的模板是内置模板，需要重新选择以获取新语言版本
    const currentSelected = selectedTemplate.value

    if (currentSelected && currentSelected.isBuiltin) {
      try {
        // 获取新语言版本的同一模板
        const updatedTemplate = await getTemplateManager.value.getTemplate(currentSelected.id)
        if (updatedTemplate) {
          emit('select', updatedTemplate, getCurrentTemplateType());
        }
      } catch (error) {
        console.error('Failed to update selected template after language change:', error)
        // 如果获取失败，选择第一个可用的模板
        try {
          const availableTemplates = filteredTemplates.value
          if (availableTemplates.length > 0) {
            emit('select', availableTemplates[0], getCurrentTemplateType());
          }
        } catch (listError) {
          console.error('Failed to list templates after language change:', listError)
        }
      }
    }

    // 发出语言变化事件，通知父组件
    emit('languageChanged', newLanguage)
  }

// 监听 props.templateType 变化，更新当前分类
watch(() => props.templateType, (newTemplateType) => {
  currentCategory.value = getCategoryFromProps()
}, { immediate: true })

// 生命周期钩子
onMounted(async () => {
  console.log('[TemplateManager.vue] Component is mounted.');
  console.log('[TemplateManager.vue] Injected services:', services);
  if (services?.value) {
    console.log('[TemplateManager.vue] TemplateManager instance from services:', getTemplateManager.value);
  } else {
    console.error('[TemplateManager.vue] Services not available on mount.');
  }
  await loadTemplates();
})

// 监听表单消息数量变化，只在新增消息时初始化新textarea
watch(() => form.value.messages.length, () => {
  // 只在消息数量变化时初始化新的textarea
  initializeAllTextareas()
})

// 监听模态框状态变化，确保打开时初始化textarea高度
watch([() => showAddForm.value, () => editingTemplate.value, () => viewingTemplate.value], (newValues) => {
  // 只在打开模态框时初始化
  if (newValues.some(val => val)) {
    initializeAllTextareas()
  }
})

// 统一初始化所有textarea高度 - 只在打开时调用一次
const initializeAllTextareas = () => {
  // 延迟执行，确保DOM已更新
  nextTick(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea.message-content-textarea')
    
    textareas.forEach(textarea => {
      // 确保textarea可见且未初始化过
      if (textarea.offsetHeight > 0 || textarea.offsetWidth > 0) {
        initializeTextareaHeight(textarea)
      }
    })
  })
}

// 关闭模板管理器
const close = () => {
  emit('update:show', false)
  emit('close')
}

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const onEditModalBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    if (viewingTemplate.value) {
      cancelEdit()
    }
  }
}

const onSyntaxGuideBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    showSyntaxGuide.value = false
  }
}

const onMigrationDialogBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    migrationDialog.value.show = false
  }
}
</script>

<style scoped>
/* 添加过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 保持原有的滚动条样式 */
.scroll-container {
  max-height: 60vh;
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(139, 92, 246, 0.5);
}
/* 添加标签淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>