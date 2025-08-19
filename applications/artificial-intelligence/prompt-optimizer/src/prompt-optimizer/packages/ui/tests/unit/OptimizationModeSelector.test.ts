import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import OptimizationModeSelector from '../../src/components/OptimizationModeSelector.vue'
import { createI18n } from 'vue-i18n'

describe('OptimizationModeSelector', () => {
  let wrapper: VueWrapper<any>
  const i18n = createI18n({
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
      'zh-CN': {
        promptOptimizer: {
          systemPrompt: 'System Prompt',
          userPrompt: 'User Prompt',
          systemPromptHelp: 'Optimize system prompts to define AI assistant role',
          userPromptHelp: 'Optimize user prompts to improve AI interaction'
        }
      }
    }
  })

  beforeEach(() => {
    // 每个测试前清理
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders correctly with default props', () => {
    wrapper = mount(OptimizationModeSelector, {
      global: {
        plugins: [i18n]
      }
    })

    // Should show buttons but no label prefix or help text (simplified design)
    expect(wrapper.text()).toContain('System Prompt')
    expect(wrapper.text()).toContain('User Prompt')
    // Should not contain label prefix or help text (simplified design)
    expect(wrapper.text()).not.toContain('Optimization Mode')
    expect(wrapper.text()).not.toContain('Optimize system prompts to define AI assistant role')
  })

  it('emits update:modelValue when user prompt button is clicked', async () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const userButton = buttons[1]

    await userButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['user'])
  })

  it('emits change event when optimization mode changes', async () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const userButton = buttons[1]

    await userButton.trigger('click')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0]).toEqual(['user'])
  })

  it('applies correct styles for active system prompt', () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const systemButton = buttons[0]
    const userButton = buttons[1]

    // System button should have active styles
    expect(systemButton.classes()).toContain('theme-button-toggle-active')
    expect(systemButton.attributes('aria-pressed')).toBe('true')

    // User button should not have active styles
    expect(userButton.classes()).toContain('theme-button-toggle-inactive')
    expect(userButton.attributes('aria-pressed')).toBe('false')
  })

  it('applies correct styles for active user prompt', () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'user'
      },
      global: {
        plugins: [i18n]
      }
    })

    // Should show compact design without label prefix or help text
    expect(wrapper.text()).toContain('System Prompt')
    expect(wrapper.text()).toContain('User Prompt')
    // Should not contain label prefix or help text (simplified design)
    expect(wrapper.text()).not.toContain('Optimization Mode')
    expect(wrapper.text()).not.toContain('Optimize user prompts to improve AI interaction')

    const buttons = wrapper.findAll('button')
    const systemButton = buttons[0]
    const userButton = buttons[1]

    // User button should have active styles
    expect(userButton.classes()).toContain('theme-button-toggle-active')
    expect(userButton.attributes('aria-pressed')).toBe('true')

    // System button should not have active styles
    expect(systemButton.classes()).toContain('theme-button-toggle-inactive')
    expect(systemButton.attributes('aria-pressed')).toBe('false')
  })

  it('does not emit when clicking the already selected button', async () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const systemButton = buttons[0]

    await systemButton.trigger('click')

    // Should not emit when clicking already selected button
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('has proper accessibility attributes', () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')

    buttons.forEach(button => {
      expect(button.attributes('aria-pressed')).toBeDefined()
      expect(button.attributes('title')).toBeDefined()
    })
  })

  it('handles rapid clicks correctly', async () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const userButton = buttons[1]

    // First click - should emit
    await userButton.trigger('click')
    
    // Update props to simulate the modelValue change
    await wrapper.setProps({ modelValue: 'user' })
    
    // Subsequent clicks on the same button (now active) - should not emit
    await userButton.trigger('click')
    await userButton.trigger('click')

    // Should only emit once for the first click (subsequent clicks on same button should be ignored)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('switches between modes correctly', async () => {
    wrapper = mount(OptimizationModeSelector, {
      props: {
        modelValue: 'system'
      },
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('button')
    const systemButton = buttons[0]
    const userButton = buttons[1]

    // Switch to user
    await userButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['user'])

    // Switch back to system (simulate prop update)
    await wrapper.setProps({ modelValue: 'user' })
    await systemButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')![1]).toEqual(['system'])
  })
}) 