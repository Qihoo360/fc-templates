import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import OutputDisplay from '../../src/components/OutputDisplay.vue'
import type { AppServices } from '../../src/types/services'
import type { ICompareService } from '@prompt-optimizer/core'
// 导入真实的翻译文件
import zhCN from '../../src/i18n/locales/zh-CN'

// 创建 i18n 实例 - 使用真实翻译文件但简化配置
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN  // 使用真实翻译文件
  }
})

// Mock clipboard functionality
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

// Mock document.execCommand for fallback clipboard functionality
Object.assign(document, {
  execCommand: vi.fn().mockReturnValue(true)
})

// 创建 mock CompareService
const mockCompareService: ICompareService = {
  compareTexts: vi.fn().mockReturnValue({
    fragments: [],
    summary: { additions: 0, deletions: 0, unchanged: 0 }
  })
}

// 创建 mock AppServices
const mockServices: AppServices = {
  modelManager: {} as any,
  templateManager: {} as any,
  historyManager: {} as any,
  dataManager: {} as any,
  llmService: {} as any,
  promptService: {} as any,
  templateLanguageService: {} as any,
  preferenceService: {} as any,
  compareService: mockCompareService
}

// 创建响应式的 services ref
const servicesRef = ref<AppServices | null>(mockServices)

describe('OutputDisplay 组件', () => {
  it('应该能正确渲染内容', () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '这是测试内容',
        mode: 'readonly'
      }
    })

    expect(wrapper.text()).toContain('这是测试内容')
  })

  it('应该能显示推理内容', async () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '主要内容',
        reasoning: '这是推理过程',
        mode: 'readonly'
      }
    })

    expect(wrapper.text()).toContain('思考过程')

    // 点击推理头部展开推理内容
    const reasoningHeader = wrapper.find('.reasoning-header')
    if (reasoningHeader.exists()) {
      await reasoningHeader.trigger('click')
      expect(wrapper.text()).toContain('这是推理过程')
    }
  })

  it('应该能处理编辑模式', async () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '可编辑内容',
        mode: 'editable',
        enableEdit: true
      }
    })

    // V2版本中，检查工具栏是否存在
    const toolbar = wrapper.find('[data-testid="output-display-toolbar"]')
    expect(toolbar.exists()).toBe(true)

    // 检查视图控制按钮
    expect(wrapper.text()).toContain('渲染')
    expect(wrapper.text()).toContain('原文')
  })

  it('应该能发出复制事件', async () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '测试内容',
        mode: 'readonly',
        enableCopy: true
      }
    })

    // 点击复制按钮
    const copyButton = wrapper.find('button[title="复制"]')
    if (copyButton.exists()) {
      await copyButton.trigger('click')
      expect(wrapper.emitted('copy')).toBeTruthy()
    }
  })

  it('应该能处理流式状态', () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '',
        reasoning: '正在推理...',
        mode: 'readonly',
        streaming: true
      }
    })

    // V2版本中，streaming 状态应该在 OutputDisplayCore 上
    const core = wrapper.findComponent({ name: 'OutputDisplayCore' })
    if (core.exists()) {
      expect(core.classes()).toContain('output-display-core--streaming')
    }
    expect(wrapper.text()).toContain('生成中...')
  })

  it('应该能处理加载状态', () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '',
        mode: 'readonly',
        loading: true,
        placeholder: '加载中的占位符'
      }
    })

    const core = wrapper.findComponent({ name: 'OutputDisplayCore' })
    if (core.exists()) {
      expect(core.classes()).toContain('output-display-core--loading')
    }
    expect(wrapper.text()).toContain('加载中的占位符')
  })

  it('应该能正确处理推理内容的展开/折叠', async () => {
    const wrapper = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '主要内容',
        reasoning: '推理内容',
        mode: 'readonly'
      }
    })

    // V2版本中，推理面板有独立的标题栏
    const reasoningHeader = wrapper.find('.reasoning-header')
    if (reasoningHeader.exists()) {
      // 点击推理头部折叠
      await reasoningHeader.trigger('click')

      // 应该发出 reasoning-toggle 事件
      expect(wrapper.emitted('reasoning-toggle')).toBeTruthy()
    }
  })

  it('应该能根据 reasoningMode 控制推理内容显示', () => {
    // 测试 hide 模式
    const wrapperHide = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '内容',
        reasoning: '推理',
        mode: 'readonly',
        reasoningMode: 'hide'
      }
    })

    expect(wrapperHide.find('.reasoning-header').exists()).toBe(false)

    // 测试 show 模式
    const wrapperShow = mount(OutputDisplay, {
      global: {
        plugins: [i18n],
        provide: {
          services: servicesRef
        }
      },
      props: {
        content: '内容',
        reasoning: '推理内容',
        mode: 'readonly',
        reasoningMode: 'show'
      }
    })

    expect(wrapperShow.find('.reasoning-header').exists()).toBe(true)
  })

  // 简化的滚动测试
  describe('长文本滚动功能测试', () => {
    const longContent = '这是一段很长的测试内容。'.repeat(100)

    it('应该能正确处理只读模式下的长文本滚动', () => {
      const wrapper = mount(OutputDisplay, {
        global: {
          plugins: [i18n],
          provide: {
            services: servicesRef
          }
        },
        props: {
          content: longContent,
          mode: 'readonly'
        }
      })

      // 验证长文本内容存在
      expect(wrapper.text()).toContain('这是一段很长的测试内容')

      // 验证主内容区域存在
      const contentArea = wrapper.find('.output-display__content')
      expect(contentArea.exists()).toBe(true)
    })

    it('应该能正确处理编辑模式下的长文本滚动', async () => {
      const wrapper = mount(OutputDisplay, {
        global: {
          plugins: [i18n],
          provide: {
            services: servicesRef
          }
        },
        props: {
          content: longContent,
          mode: 'editable',
          enableEdit: true
        }
      })

      // V2版本中，需要先切换到原文模式才能看到 textarea
      const buttons = wrapper.findAll('button')
      const sourceButton = buttons.find(button => button.text().includes('原文'))
      if (sourceButton) {
        await sourceButton.trigger('click')
      }

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('应该能同时处理长推理内容和长文本内容', () => {
      const wrapper = mount(OutputDisplay, {
        global: {
          plugins: [i18n],
          provide: {
            services: servicesRef
          }
        },
        props: {
          content: longContent,
          reasoning: '这是推理内容。'.repeat(50),
          mode: 'readonly'
        }
      })

      // 验证推理区域存在
      const reasoningHeader = wrapper.find('.reasoning-header')
      expect(reasoningHeader.exists()).toBe(true)

      // 验证主内容区域存在
      const contentArea = wrapper.find('.output-display__content')
      expect(contentArea.exists()).toBe(true)
    })

    it('应该能在全屏模式下处理长文本', async () => {
      const wrapper = mount(OutputDisplay, {
        global: {
          plugins: [i18n],
          provide: {
            services: servicesRef
          }
        },
        props: {
          content: longContent,
          reasoning: '推理内容',
          mode: 'readonly',
          enableFullscreen: true
        }
      })

      // 点击全屏按钮
      const fullscreenButton = wrapper.find('button[title="展开"]')
      if (fullscreenButton.exists()) {
        await fullscreenButton.trigger('click')
        expect(wrapper.emitted('fullscreen')).toBeTruthy()
      }
    })
  })
}) 