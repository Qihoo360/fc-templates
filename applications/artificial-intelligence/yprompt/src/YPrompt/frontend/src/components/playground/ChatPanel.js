
import { ref, nextTick, watch, onMounted, onUpdated, computed, onUnmounted } from 'vue';

export default {
  name: 'ChatPanel',
  props: {
    messages: { type: Array, default: () => [] },
    isStreaming: { type: Boolean, default: false }
  },
  emits: ['send'],
  template: `
    <div class="flex flex-col h-full bg-white border-r border-[#e5e7eb] relative">
      <!-- Header -->
      <div class="h-16 border-b border-[#e5e7eb] flex items-center px-6 justify-between bg-white sticky top-0 z-10 flex-shrink-0">
        <div class="flex items-center gap-2.5 text-[#1f1f1f]">
          <div class="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
             <i data-lucide="sparkles" class="w-4 h-4"></i>
          </div>
          <span class="font-semibold text-lg tracking-tight">AI Studio</span>
        </div>
        <div class="flex items-center gap-3">
           <div class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium font-mono border border-blue-100 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" v-if="isStreaming"></span>
              gemini-2.5-flash
           </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="scrollRef" class="flex-1 overflow-y-auto bg-white scroll-smooth pb-4">
        <!-- Empty State -->
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 p-8 animate-in fade-in duration-500">
           <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              <i data-lucide="message-square-dashed" class="w-8 h-8 text-gray-300"></i>
           </div>
           <h2 class="text-xl font-semibold text-gray-800 mb-2">Start Creating</h2>
           <p class="text-center text-sm text-gray-500 max-w-xs leading-relaxed">
             Use the <span class="font-bold text-gray-700 mx-1">+</span> button below to unlock specific generation capabilities like Mind Maps, Charts, or Web UIs.
           </p>
        </div>

        <!-- Message List -->
        <div class="flex flex-col gap-6 py-6">
          <div v-for="msg in messages" :key="msg.id" class="px-6 group">
            
            <!-- User Message -->
            <div v-if="msg.role === 'user'" class="flex justify-end mb-2">
               <div class="bg-[#f0f4f9] text-[#1f1f1f] px-5 py-3.5 rounded-3xl rounded-tr-md max-w-[85%] leading-relaxed text-[15px] whitespace-pre-wrap shadow-sm">{{ msg.text }}</div>
            </div>

            <!-- Model Message -->
            <div v-else class="flex gap-4 max-w-3xl pr-4">
              <div class="flex-shrink-0 mt-1">
                <div class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                  <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="AI" class="w-5 h-5" />
                </div>
              </div>
              <div class="flex-1 min-w-0 pt-1">
                <div class="flex items-center gap-2 mb-1">
                   <span class="text-sm font-medium text-gray-900">Gemini</span>
                </div>
                <template v-if="msg.isStreaming">
                  <pre class="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap font-mono text-gray-600">{{ msg.displayText || msg.text }}</pre>
                  <div class="mt-2 flex items-center gap-1">
                     <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                     <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                     <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                  </div>
                </template>
                <template v-else>
                  <pre
                    v-if="shouldDisplayAsCode(msg.text)"
                    class="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap font-mono text-gray-700"
                  >{{ msg.text }}</pre>
                  <div
                    v-else
                    class="markdown-body text-[#374151]"
                    v-html="renderMarkdown(msg.text)"
                  ></div>
                </template>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white sticky bottom-0 z-20 border-t border-gray-100">
        <div class="max-w-4xl mx-auto relative">
          
          <!-- Capability Launcher Popup -->
          <div v-if="isMenuOpen" class="absolute bottom-full left-0 mb-3 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-2 z-50 animate-in fade-in slide-in-from-bottom-2 origin-bottom-left">
              <div class="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Creative Capabilities</div>
              
              <div class="grid grid-cols-1 gap-1 max-h-[320px] overflow-y-auto">
                  <button 
                      v-for="cap in capabilities" 
                      :key="cap.id"
                      @click="selectCapability(cap)"
                      class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm', cap.color]">
                          <i :data-lucide="cap.icon" class="w-5 h-5"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900">{{ cap.label }}</div>
                          <div class="text-xs text-gray-500 truncate" :title="cap.desc">{{ cap.desc }}</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </button>
              </div>
          </div>

          <!-- Click Outside Overlay for Menu -->
          <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40" style="background: transparent;"></div>

          <!-- Input Container -->
          <div class="flex items-end gap-3 bg-[#f0f4f9] p-2 rounded-3xl border border-gray-200 shadow-sm focus-within:shadow-md focus-within:bg-white focus-within:border-blue-200 transition-all duration-300">
            
            <!-- Magic Plus Button -->
            <button 
                @click="toggleMenu"
                :class="['flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-50', 
                  isMenuOpen || activeCapability ? 'bg-blue-600 text-white rotate-45 shadow-md' : 'bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm border border-gray-200']"
                title="Add Capability"
            >
                <i :data-lucide="activeCapability ? 'x' : 'plus'" class="w-5 h-5"></i>
            </button>

            <!-- Text Area Wrapper -->
            <div class="flex-1 min-w-0 py-2 relative">
                <!-- Active Capability Pill -->
                <div v-if="activeCapability" class="flex items-center gap-2 mb-1.5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 select-none animate-in fade-in slide-in-from-left-1">
                        <i :data-lucide="activeCapability.icon" class="w-3 h-3"></i>
                        {{ activeCapability.label }}
                    </span>
                    <span class="text-[10px] text-gray-400">Mode Locked</span>
                </div>

                <textarea
                    v-model="inputVal"
                    @keydown.enter.prevent="handleEnter"
                    @input="autoResize"
                    rows="1"
                    ref="textareaRef"
                    class="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none bg-transparent max-h-[200px]"
                    :placeholder="placeholderText"
                    style="min-height: 24px;"
                ></textarea>
            </div>
            
            <!-- Send Button -->
            <button 
              @click="sendMessage"
              :disabled="!inputVal.trim() || isStreaming"
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-gray-300 transition-all flex items-center justify-center shadow-sm mb-0"
            >
              <i data-lucide="arrow-up" class="w-5 h-5"></i>
            </button>
          </div>
          
          <!-- Footer Hint -->
          <div class="text-center mt-2">
             <p class="text-[10px] text-gray-400">
                {{ activeCapability ? 'Generating ' + activeCapability.label + ' format' : 'Auto Mode: AI selects format based on context' }}
             </p>
          </div>
        </div>
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const inputVal = ref('');
    const scrollRef = ref(null);
    const textareaRef = ref(null);
    
    // --- Magic Launcher State ---
    const isMenuOpen = ref(false);
    const activeCapability = ref(null);

    // --- Capabilities Configuration ---
    const capabilities = [
        { 
            id: 'html', 
            label: 'Web App UI', 
            icon: 'layout', 
            // Explicitly listing all supported libraries including Three.js
            desc: 'HTML, Canvas, Tailwind, Three.js, ECharts, GSAP', 
            color: 'bg-indigo-500',
            prompt: 'Create a functional web application. You have access to HTML, Tailwind, Three.js, GSAP, and ECharts.' 
        },
        {
            id: 'canvas',
            label: 'Canvas / Game',
            icon: 'gamepad-2',
            desc: '2D Games, Simulations, Effects',
            color: 'bg-rose-500',
            prompt: 'Create a creative HTML5 Canvas implementation (using 2D context). Keep it self-contained in a single HTML file with internal scripts.'
        },
        {
            id: 'animation',
            label: 'Motion / GSAP',
            icon: 'zap',
            desc: 'Animation Focused (GSAP & ScrollTrigger)',
            color: 'bg-yellow-500',
            prompt: 'Create a creative animation using GSAP (GreenSock) and Tailwind CSS. Use ScrollTrigger if applicable.'
        },
        { 
            id: 'threejs', 
            label: '3D Scene', 
            icon: 'box', 
            desc: 'Interactive Three.js Worlds', 
            color: 'bg-orange-500',
            prompt: 'Create an interactive 3D scene using Three.js. Use procedural geometry.' 
        },
        { 
            id: 'doc', 
            label: 'Article / Doc', 
            icon: 'file-text', 
            desc: 'Markdown Articles & Reports', 
            color: 'bg-slate-500',
            prompt: 'Write a comprehensive article/document about the topic. Format it as a Markdown artifact.' 
        },
        { 
            id: 'echarts', 
            label: 'Data Chart', 
            icon: 'bar-chart-3', 
            desc: 'Single Chart (JSON config)', 
            color: 'bg-emerald-500',
            prompt: 'Create an ECharts data visualization based on the request. Output strictly ECharts JSON option.' 
        },
        { 
            id: 'diagram', 
            label: 'Flow / Diagram', 
            icon: 'git-graph', 
            desc: 'Flowcharts, Architecture, UML', 
            color: 'bg-cyan-500',
            prompt: 'Create a professional diagram (prefer Mermaid for simple flows, Draw.io XML for complex architecture).' 
        },
        { 
            id: 'mindmap', 
            label: 'Mind Map', 
            icon: 'brain-circuit', 
            desc: 'Brainstorming & Concepts', 
            color: 'bg-purple-500',
            prompt: 'Create a detailed Mind Map using the required JSON format.' 
        },
        { 
            id: 'svg', 
            label: 'Vector Graphic', 
            icon: 'pen-tool', 
            desc: 'Icons, Logos, Illustrations', 
            color: 'bg-pink-500',
            prompt: 'Create a high-quality, scalable SVG vector graphic.' 
        }
    ];

    const toggleMenu = () => {
        if (activeCapability.value) {
            // If a mode is active, clicking X clears it
            activeCapability.value = null;
            isMenuOpen.value = false;
        } else {
            // Otherwise toggle menu
            isMenuOpen.value = !isMenuOpen.value;
            if (isMenuOpen.value) {
                nextTick(() => {
                     if (window.lucide) window.lucide.createIcons();
                });
            }
        }
    };

    const selectCapability = (cap) => {
        activeCapability.value = cap;
        isMenuOpen.value = false;
        nextTick(() => {
            textareaRef.value?.focus();
            if (window.lucide) window.lucide.createIcons();
        });
    };

    const placeholderText = computed(() => {
       if (activeCapability.value) return `Describe the ${activeCapability.value.label}...`;
       return 'Ask anything... (Type / or click + for tools)';
    });

    const renderMarkdown = (text) => {
      if (!text) return ''
      if (window.marked) {
        try {
          return window.marked.parse(text, { breaks: true, gfm: true })
        } catch {
          return text
        }
      }
      return text
    }

    const shouldDisplayAsCode = (text) => {
      if (!text) return false
      const trimmed = text.trim()
      if (trimmed.includes('```markdown') || trimmed.includes('```md')) {
        return true
      }
      if (!trimmed.startsWith('```')) return false
      const lastFence = trimmed.lastIndexOf('```')
      if (lastFence <= 0) return false
      return lastFence === trimmed.length - 3
    }

    const scrollToBottom = () => {
      if (scrollRef.value) {
        const isNearBottom = scrollRef.value.scrollHeight - scrollRef.value.scrollTop - scrollRef.value.clientHeight < 300;
        if (isNearBottom || props.isStreaming) {
             scrollRef.value.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' });
        }
      }
    };

    const highlightCode = () => {
      if (props.messages.some((msg) => msg.isStreaming)) return;
      if (window.hljs) {
        document.querySelectorAll('.markdown-body pre code').forEach((block) => {
          if (!block.dataset.highlighted) {
            window.hljs.highlightElement(block);
            block.dataset.highlighted = 'yes';
          }
        });
      }
    };

    const autoResize = () => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto';
            textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 200) + 'px';
        }
    };

    watch(() => props.messages, () => { nextTick(() => { scrollToBottom(); highlightCode(); }); }, { deep: true });
    onUpdated(() => { highlightCode(); if (window.lucide) window.lucide.createIcons(); });
    onMounted(() => { 
        if (window.lucide) window.lucide.createIcons(); 
        nextTick(() => { 
            textareaRef.value?.focus();
            autoResize();
        }); 
    });

    const handleEnter = (e) => { 
        if (!e.shiftKey) {
            sendMessage(); 
        } else {
            // Allow new line but resize
            nextTick(autoResize);
        }
    };

    const sendMessage = () => {
      if (!inputVal.value.trim() || props.isStreaming) return;
      
      let promptPrefix = '';
      if (activeCapability.value) {
          promptPrefix = `[System: ${activeCapability.value.prompt}] `;
      }

      emit('send', promptPrefix + inputVal.value);
      inputVal.value = '';
      nextTick(() => {
          if(textareaRef.value) textareaRef.value.style.height = 'auto';
      });
    };

    return { 
      inputVal, scrollRef, sendMessage, handleEnter, textareaRef, renderMarkdown, shouldDisplayAsCode,
      isMenuOpen, toggleMenu, capabilities, activeCapability, selectCapability, placeholderText, autoResize
    };
  }
};
