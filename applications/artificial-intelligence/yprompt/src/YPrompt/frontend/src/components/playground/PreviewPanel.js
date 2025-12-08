


import { h, ref, onMounted, onUpdated, watch, nextTick, computed, onUnmounted } from 'vue';
import MindMap from './MindMap.js';
import mermaid from 'mermaid';
import * as echarts from 'echarts';
import * as d3 from 'd3';

export default {
  name: 'PreviewPanel',
  components: { MindMap },
  props: {
    artifact: { type: Object, default: null }
  },
  template: `
    <div ref="mainContainer" class="flex flex-col h-full bg-[#f8f9fa] select-none outline-none" tabindex="0" @keydown="handleKeydown">
      <!-- Header with Tabs & Actions -->
      <div class="h-14 border-b border-[#e5e7eb] flex items-center justify-between px-4 bg-white sticky top-0 z-10 flex-shrink-0">
        
        <!-- Left: Tabs -->
        <div class="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
           <button 
             @click="activeTab = 'preview'"
             :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2', 
               activeTab === 'preview' ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50']"
           >
             <i data-lucide="eye" class="w-3.5 h-3.5"></i>
             Preview
           </button>
           <button 
             @click="activeTab = 'code'"
             :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2', 
               activeTab === 'code' ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50']"
           >
             <i data-lucide="code-2" class="w-3.5 h-3.5"></i>
             Code
           </button>
        </div>

        <!-- Center: Context Aware Actions -->
        <div class="flex items-center gap-4">
            <!-- Device Toggles (HTML) -->
            <div v-if="activeTab === 'preview' && artifact && artifact.type === 'html'" class="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button @click="deviceMode = 'desktop'" :class="['p-1.5 rounded transition-colors', deviceMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600']" title="Desktop (100%)">
                    <i data-lucide="monitor" class="w-4 h-4"></i>
                </button>
                <button @click="deviceMode = 'tablet'" :class="['p-1.5 rounded transition-colors', deviceMode === 'tablet' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600']" title="Tablet (768px)">
                    <i data-lucide="tablet" class="w-4 h-4"></i>
                </button>
                <button @click="deviceMode = 'mobile'" :class="['p-1.5 rounded transition-colors', deviceMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600']" title="Mobile (375px)">
                    <i data-lucide="smartphone" class="w-4 h-4"></i>
                </button>
            </div>

            <!-- Mermaid Theme Toggle -->
            <div v-if="activeTab === 'preview' && artifact && artifact.type === 'mermaid'" class="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
               <button 
                 @click="toggleMermaidLook('default')" 
                 :class="['px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5', mermaidLook === 'default' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:bg-gray-200']"
               >
                 <i data-lucide="layout" class="w-3.5 h-3.5"></i>
                 Standard
               </button>
               <button 
                 @click="toggleMermaidLook('handDrawn')" 
                 :class="['px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5', mermaidLook === 'handDrawn' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:bg-gray-200']"
               >
                 <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                 Hand-Drawn
               </button>
            </div>

            <!-- SVG Editor Actions -->
            <div v-if="artifact && artifact.type === 'svg' && activeTab === 'preview'" class="flex items-center gap-1.5">
                <div class="flex items-center border-r border-gray-200 pr-2 mr-1 gap-1">
                   <button @click="undo" :disabled="historyIndex <= 0" class="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" title="Undo">
                      <i data-lucide="undo-2" class="w-4 h-4"></i>
                   </button>
                   <button @click="redo" :disabled="historyIndex >= history.length - 1" class="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" title="Redo">
                      <i data-lucide="redo-2" class="w-4 h-4"></i>
                   </button>
                </div>
                <button @click="addText" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Text"><i data-lucide="type" class="w-4 h-4"></i></button>
                <button @click="addRect" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Rectangle"><i data-lucide="square" class="w-4 h-4"></i></button>
                <button @click="addCircle" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Circle"><i data-lucide="circle" class="w-4 h-4"></i></button>
                <div class="h-4 w-px bg-gray-200 mx-0.5"></div>
                <button @click="addLine" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Line"><i data-lucide="minus" class="w-4 h-4" style="transform: rotate(-45deg)"></i></button>
                <button @click="addArrow" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Arrow"><i data-lucide="arrow-right" class="w-4 h-4"></i></button>
                
                <div class="h-4 w-px bg-gray-200 mx-1"></div>
                
                <button 
                  @click="toggleEditMode"
                  :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border', 
                     isEditing ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']"
                >
                   <i :data-lucide="isEditing ? 'edit-3' : 'mouse-pointer'" class="w-3.5 h-3.5"></i>
                   {{ isEditing ? 'Edit' : 'Select' }}
                </button>
            </div>
        </div>

        <!-- Right: Global Actions -->
        <div v-if="artifact" class="flex items-center gap-2 ml-4">
            
            <!-- Toggle Console -->
            <button 
               @click="isConsoleOpen = !isConsoleOpen"
               :class="['p-2 rounded-md transition-colors relative border', isConsoleOpen ? 'bg-gray-100 text-gray-900 border-gray-300' : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100']"
               title="Toggle Debug Console"
            >
               <i data-lucide="terminal-square" class="w-4 h-4"></i>
               <!-- Error Indicator Dot -->
               <span v-if="consoleErrorCount > 0" class="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">{{ consoleErrorCount > 9 ? '!' : consoleErrorCount }}</span>
            </button>

            <div class="w-px h-4 bg-gray-300 mx-1"></div>

            <!-- Reload Button -->
            <button 
               v-if="activeTab === 'preview'"
               @click="reloadPreview" 
               class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
               title="Reload / Reset Preview"
            >
               <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            </button>

            <button @click="toggleFullscreen" class="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors" title="Toggle Fullscreen">
               <i :data-lucide="isFullscreen ? 'minimize' : 'maximize'" class="w-4 h-4"></i>
            </button>
            
            <button @click="downloadArtifact" class="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors" title="Download Artifact">
               <i data-lucide="download" class="w-4 h-4"></i>
            </button>

            <button 
              @click="copyCode"
              class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Copy Code"
            >
               <i :data-lucide="copied ? 'check' : 'copy'" class="w-4 h-4"></i>
            </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden relative flex flex-col bg-[#e2e8f0]">
         
        <!-- Empty State -->
        <div v-if="!artifact" class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-[#f8f9fa] z-20 px-6 text-center">
          <div class="w-20 h-20 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-4">
            <i data-lucide="sparkles" class="w-8 h-8 text-blue-400"></i>
          </div>
          <p class="text-base font-semibold text-gray-800 mb-3">欢迎使用提示词操练场</p>
          <p class="text-sm text-gray-600 max-w-2xl mb-4">
            左侧对话区会实时返回 AI 输出，这里会渲染各种 Artifact。尝试这些玩法：
          </p>
          <ul class="text-sm text-gray-600 space-y-1 max-w-xl text-left">
            <li>• 生成 <span class="font-medium text-gray-800">HTML（支持Tailwind / Three.js / GSAP / ECharts）</span> </li>
            <li>• 输出 <span class="font-medium text-gray-800">Markdown、SVG、MindMap、Mermaid、Draw.io</span> 等可视化</li>
          </ul>
        </div>

        <!-- Preview Tab -->
        <div v-show="activeTab === 'preview'" class="flex-1 min-h-0 overflow-auto relative flex flex-col items-center pt-4 pb-4" id="preview-canvas-area">
            
            <div class="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
                style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;">
            </div>

            <!-- Device Container Wrapper -->
            <div
              v-if="artifact"
              :class="['relative bg-white shadow-xl transition-all duration-300 ease-in-out z-10 border border-gray-300 overflow-hidden flex-shrink-0', 
                 deviceMode === 'desktop' ? 'w-full h-full max-w-[98%] rounded-lg' : 
                 deviceMode === 'tablet' ? 'w-[768px] h-[1024px] max-h-[95%] rounded-xl my-auto' : 
                 'w-[375px] h-[812px] max-h-[95%] rounded-2xl border-8 border-gray-800 my-auto']">
              
                <!-- HTML (Enhanced with Import Maps for ThreeJS & ECharts) -->
                <!-- Added :key to force re-render on reload -->
                <iframe 
                  v-if="artifact && artifact.type === 'html'"
                  :key="'html-preview-' + reloadKey"
                  class="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  :srcdoc="enrichedHtmlContent"
                ></iframe>
                
                <!-- Draw.io Embed -->
                <div v-else-if="artifact && artifact.type === 'drawio'" class="w-full h-full bg-white">
                   <iframe 
                     ref="drawioRef"
                     class="w-full h-full border-none"
                     src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&modified=0&proto=json"
                   ></iframe>
                </div>

                <!-- Mermaid Diagram (Canvas Mode) -->
                <div 
                  v-else-if="artifact && artifact.type === 'mermaid'"
                  class="w-full h-full relative overflow-hidden bg-white cursor-grab active:cursor-grabbing"
                  ref="mermaidContainerRef"
                >
                   <div class="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-500 text-xs px-2.5 py-1.5 rounded-md z-10 border border-slate-200 shadow-sm font-medium flex items-center gap-2">
                      <i data-lucide="move" class="w-3 h-3"></i> Pan & Zoom
                   </div>
                   <div ref="mermaidRef" class="origin-center p-10"></div>
                </div>

                <!-- ECharts -->
                <div 
                  v-else-if="artifact && artifact.type === 'echarts'"
                  class="w-full h-full bg-white overflow-hidden"
                >
                   <div ref="echartsRef" class="w-full h-full"></div>
                </div>

                <!-- SVG Container -->
                <div 
                  v-else-if="artifact && artifact.type === 'svg'"
                  class="w-full h-full relative bg-white overflow-auto hide-scrollbar"
                  @mousedown.self="handleSvgMouseDown"
                  @mousemove="handleGlobalMouseMove"
                  @mouseup="handleGlobalMouseUp"
                >
                   <!-- Selection Box Visual -->
                   <div v-if="selectionBox" 
                       class="fixed border border-blue-500 bg-blue-500/10 pointer-events-none z-[60]"
                       :style="{ left: selectionBox.visualX + 'px', top: selectionBox.visualY + 'px', width: selectionBox.w + 'px', height: selectionBox.h + 'px' }">
                   </div>

                   <div
                      ref="svgWrapper"
                      class="svg-content-wrapper w-full h-full flex items-center justify-center min-w-[100%] min-h-[100%] relative"
                      style="overflow: visible;" 
                      v-html="localContent"
                      @mousedown="handleSvgMouseDown"
                      @dblclick="handleSvgDoubleClick"
                   ></div>

                   <textarea
                      v-if="inlineEdit.active"
                      ref="inlineInputRef"
                      v-model="inlineEdit.value"
                      @blur="commitInlineEdit"
                      @keydown="handleInlineInputKeydown"
                      @mousedown.stop
                      class="absolute z-[100] bg-white/90 border border-blue-500 outline-none resize-none m-0 overflow-hidden"
                      :style="inlineEdit.style"
                      placeholder="Type text..."
                   ></textarea>
                </div>

                <!-- Markdown -->
                <div 
                  v-else-if="artifact && artifact.type === 'markdown'"
                  class="w-full h-full bg-white p-8 overflow-y-auto markdown-body preview-markdown"
                  v-html="renderMarkdown(localContent)"
                ></div>
                
                <!-- Generic JSON Viewer -->
                <div
                    v-else-if="artifact && artifact.type === 'json'"
                    class="w-full h-full bg-white overflow-y-auto p-0"
                >
                   <div class="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JSON Data Viewer
                   </div>
                   <div class="markdown-body p-4">
                       <pre class="!m-0 !border-0 !bg-gray-50"><code class="language-json !bg-transparent !p-0">{{ localContent }}</code></pre>
                   </div>
                </div>

                <!-- MindMap -->
                <MindMap 
                  v-else-if="artifact && artifact.type === 'mindmap'" 
                  :content="localContent" 
                  @error="handleComponentError"
                />
            </div>
        </div>

        <!-- Code Tab (Editable) -->
        <div v-show="activeTab === 'code'" class="flex-1 h-full bg-[#f9fafb] overflow-hidden flex flex-col relative z-20">
           <textarea 
             v-model="localContent" 
             class="w-full h-full p-6 font-mono text-sm resize-none outline-none border-none bg-transparent text-slate-800 leading-relaxed" 
             spellcheck="false"
             placeholder="Edit code here..."
           ></textarea>
        </div>

        <!-- Console Panel (Collapsible) - Chrome DevTools Style -->
        <div 
          v-if="isConsoleOpen" 
          class="h-48 bg-white border-t border-gray-300 flex flex-col z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex-shrink-0 transition-all duration-200"
        >
            <!-- Console Toolbar -->
            <div class="h-7 bg-[#f1f3f4] border-b border-[#e0e0e0] flex items-center px-2 justify-between select-none">
                <div class="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                    <i data-lucide="terminal" class="w-3 h-3 text-gray-500"></i>
                    Console Output
                    <span v-if="consoleLogs.length > 0" class="text-gray-400 font-normal ml-1">{{ consoleLogs.length }} messages</span>
                </div>
                <div class="flex items-center gap-1">
                    <button @click="consoleLogs = []" class="p-1 hover:bg-gray-300/50 rounded text-gray-500 hover:text-gray-800 transition-colors" title="Clear Console">
                        <i data-lucide="ban" class="w-3 h-3"></i>
                    </button>
                    <button @click="isConsoleOpen = false" class="p-1 hover:bg-gray-300/50 rounded text-gray-500 hover:text-gray-800 transition-colors" title="Close">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
            
            <!-- Logs Area -->
            <div ref="consoleScrollRef" class="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed bg-white">
                <div v-if="consoleLogs.length === 0" class="text-gray-400 italic p-3 text-center mt-4">
                    No logs to display
                </div>
                <div 
                  v-for="(log, idx) in consoleLogs" 
                  :key="idx" 
                  :class="['px-2 py-1 border-b border-[#f0f0f0] flex gap-2 group font-medium select-text', 
                      log.level === 'error' ? 'bg-[#fff0f0] text-[#d32f2f] border-[#ffcdd2]' : 
                      log.level === 'warn' ? 'bg-[#fff8e1] text-[#f57c00] border-[#ffecb3]' : 
                      'text-[#202124] hover:bg-[#f8f9fa]']"
               >
                    <div class="flex-shrink-0 text-gray-400 w-[65px] text-[10px] select-none pt-0.5">{{ new Date(log.timestamp).toLocaleTimeString([], {hour12:false}) }}</div>
                    <div class="flex-1 break-words whitespace-pre-wrap relative">
                        <span v-if="log.count > 1" class="bg-gray-200 text-gray-600 px-1.5 rounded-[10px] text-[9px] font-bold mr-1.5 inline-block align-middle min-w-[18px] text-center">{{ log.count }}</span>
                        <span class="align-middle">{{ log.message }}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  `,
  setup(props) {
    const activeTab = ref('preview');
    const copied = ref(false);
    const localContent = ref('');
    const svgWrapper = ref(null);
    const mainContainer = ref(null);
    const mermaidRef = ref(null);
    const mermaidContainerRef = ref(null);
    const echartsRef = ref(null);
    const drawioRef = ref(null);
    const reloadKey = ref(0); // Key to force re-rendering
    
    // View Modes
    const deviceMode = ref('desktop');
    const isFullscreen = ref(false);
    const mermaidLook = ref('default'); // 'default' | 'handDrawn'

    // Console State
    const isConsoleOpen = ref(false);
    const consoleLogs = ref([]);
    const consoleScrollRef = ref(null);
    const consoleErrorCount = computed(() => consoleLogs.value.filter(l => l.level === 'error').length);

    let chartInstance = null;
    
    // --- History State ---
    const history = ref([]);
    const historyIndex = ref(-1);

    // --- Editor State ---
    const isEditing = ref(false);
    const selectedElement = ref(null);
    const selectionBox = ref(null);
    
    // Interaction State
    const interactionMode = ref(null); 
    const startMouse = ref({ x: 0, y: 0 });
    const initialTransform = ref({ x: 0, y: 0, rotation: 0, scale: 1 });
    const currentTransform = ref({ x: 0, y: 0, rotation: 0, scale: 1 });
    
    const selectionStyle = ref({
      fill: '#000000',
      stroke: '#000000',
      strokeWidth: 1,
      fontSize: 16
    });

    // --- Inline Text Edit State ---
    const inlineEdit = ref({
      active: false,
      value: '',
      style: {},
      element: null
    });
    const inlineInputRef = ref(null);

    // --- Draw.io State ---
    const drawioInitialized = ref(false);
    const isUpdatingFromDrawio = ref(false);

    // --- Logging Utility ---
    const addLog = (level, message) => {
        const lastLog = consoleLogs.value[consoleLogs.value.length - 1];
        if (lastLog && lastLog.message === message && lastLog.level === level) {
            lastLog.count++;
            lastLog.timestamp = Date.now();
        } else {
            consoleLogs.value.push({
                level, 
                message, 
                timestamp: Date.now(),
                count: 1
            });
        }
        
        // Auto-open/notify logic could go here
        
        nextTick(() => {
            if (consoleScrollRef.value) {
                consoleScrollRef.value.scrollTop = consoleScrollRef.value.scrollHeight;
            }
        });
    };

    const handleComponentError = (errorMsg) => {
        addLog('error', errorMsg);
        // Optional: Auto-open console on generic component errors
        // isConsoleOpen.value = true; 
    };

    // --- HTML Enriched Content ---
    const enrichedHtmlContent = computed(() => {
      if (!props.artifact || props.artifact.type !== 'html') return '';
      let raw = localContent.value; 
      
      // IMPROVEMENT: CSS Reset to prevent flexbox clipping on overflow
      const resetCss = `
        html { height: 100%; width: 100%; }
        body { 
            min-height: 100vh; 
            margin: 0; padding: 0; 
            background-color: white; 
            font-family: system-ui, sans-serif;
            height: auto; /* Allow growing beyond 100% */
            position: relative;
        }
        canvas { display: block; outline: none; } 
        #app { width: 100%; min-height: 100%; }
        
        /* SAFE CENTERING PATCH */
        /* Fixes the issue where 'flex items-center' clips top content if it overflows vertically */
        body.flex.items-center, 
        body.flex.justify-center {
            align-items: flex-start; /* Force start to allow scrolling */
            justify-content: flex-start;
        }
        /* Re-apply centering via safe margins on the direct child */
        body.flex.items-center > *, 
        body.flex.justify-center > * {
            margin: auto;
        }
      `;

      // Console Interceptor (Injects into iframe)
      const consoleInterceptor = `
      <script>
        (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;

            function sendLog(level, args) {
                try {
                    const message = args.map(arg => {
                        if (typeof arg === 'object') {
                            try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                        }
                        return String(arg);
                    }).join(' ');
                    window.parent.postMessage({ type: 'iframe-log', level, message }, '*');
                } catch(e) {}
            }

            console.log = function(...args) { originalLog.apply(console, args); sendLog('log', args); };
            console.error = function(...args) { originalError.apply(console, args); sendLog('error', args); };
            
            console.warn = function(...args) { 
                // Suppress Tailwind CDN warning
                if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com should not be used in production')) {
                    return;
                }
                originalWarn.apply(console, args); 
                sendLog('warn', args); 
            };
            
            console.info = function(...args) { originalInfo.apply(console, args); sendLog('info', args); };

            window.onerror = function(msg, source, lineno, colno, error) {
                window.parent.postMessage({ 
                    type: 'iframe-log', 
                    level: 'error', 
                    message: 'Uncaught Error: ' + msg + ' (Line ' + lineno + ')' 
                }, '*');
                return false; 
            };

            window.addEventListener('unhandledrejection', function(event) {
               window.parent.postMessage({ 
                    type: 'iframe-log', 
                    level: 'error', 
                    message: 'Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : 'Unknown') 
                }, '*');
            });
        })();
      <\/script>
      `;

      // JS Imports & Shims
      const shimScript = `
      <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        window.THREE = { ...THREE, OrbitControls };
        window.OrbitControls = OrbitControls;
      <\/script>
      `;

      // Ensure ECharts and GSAP can be imported via ESM or used globally
      const importMap = `
      <script type="importmap">
        {
          "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
            "echarts": "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.esm.min.js",
            "gsap": "https://esm.sh/gsap@3.12.5",
            "gsap/ScrollTrigger": "https://esm.sh/gsap@3.12.5/ScrollTrigger"
          }
        }
      <\/script>
      `;

      // Libraries Injector
      const libraries = `
      <script src="https://cdn.tailwindcss.com"><\/script>
      <script src="https://unpkg.com/lucide@latest"><\/script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"><\/script>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"><\/script>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
      `;

      // Force user scripts to be modules so they execute after the shim/map
      raw = raw.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, inner) => {
          if (attrs.match(/\bsrc\s*=/i) || attrs.match(/\btype\s*=/i)) {
             return match;
          }
          return `<script type="module" ${attrs}>${inner}</script>`;
      });

      const headContent = `${consoleInterceptor}${libraries}${importMap}${shimScript}<style>${resetCss}</style>`;

      if (raw.includes('<!DOCTYPE html>') || raw.includes('<html')) {
         return raw.replace('<head>', `<head>${headContent}`);
      }
      
      // Wrap snippet
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${headContent}</head><body class="p-0">
        <div id="app">${raw}</div>
        <script>
          window.onload = function() {
             if (window.lucide) window.lucide.createIcons();
          };
        <\/script>
      </body></html>`;
    });

    // --- Message Handler (Iframe Logs) ---
    const handleWindowMessage = (event) => {
        if (event.data && event.data.type === 'iframe-log') {
            addLog(event.data.level, event.data.message);
        }
        handleDrawioMessage(event);
    };

    // --- Fullscreen & Download ---
    const toggleFullscreen = () => {
       if (!document.fullscreenElement) {
          mainContainer.value.requestFullscreen().catch(err => {
             console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
          });
          isFullscreen.value = true;
       } else {
          document.exitFullscreen();
          isFullscreen.value = false;
       }
    };

    const reloadPreview = () => {
        consoleLogs.value = []; // Clear logs on reload
        if (props.artifact && props.artifact.type === 'html') {
            reloadKey.value++;
        } else if (props.artifact && props.artifact.type === 'echarts') {
            renderECharts();
        } else if (props.artifact && props.artifact.type === 'mermaid') {
            renderMermaid();
        } else if (props.artifact && props.artifact.type === 'drawio') {
            sendDrawioXml(localContent.value);
        }
    };

    const downloadArtifact = () => {
        const type = props.artifact?.type;
        const content = localContent.value;
        let blob, url, filename;

        if (type === 'html') {
             blob = new Blob([enrichedHtmlContent.value], { type: 'text/html' });
             filename = 'playground-export.html';
        } else if (type === 'svg') {
             const svgHtml = getDisplayCode();
             blob = new Blob([svgHtml], { type: 'image/svg+xml' });
             filename = 'image.svg';
        } else if (type === 'drawio') {
             blob = new Blob([content], { type: 'application/xml' });
             filename = 'diagram.xml';
        } else if (type === 'mermaid') {
             const svg = mermaidRef.value?.querySelector('svg');
             if (svg) {
                 const clone = svg.cloneNode(true);
                 clone.removeAttribute('transform'); 
                 clone.removeAttribute('style'); 
                 const serializer = new XMLSerializer();
                 const source = serializer.serializeToString(clone);
                 blob = new Blob([source], { type: 'image/svg+xml' });
                 filename = 'diagram.svg';
             }
        } else if (type === 'echarts') {
             const dataUrl = chartInstance?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
             if (dataUrl) {
                 const link = document.createElement('a');
                 link.download = 'chart.png';
                 link.href = dataUrl;
                 link.click();
                 return;
             }
        } else if (type === 'markdown') {
             blob = new Blob([content], { type: 'text/markdown' });
             filename = 'readme.md';
        } else if (type === 'mindmap') {
             blob = new Blob([content], { type: 'application/json' });
             filename = 'mindmap.json';
        } else if (type === 'json') {
             blob = new Blob([content], { type: 'application/json' });
             filename = 'data.json';
        }

        if (blob) {
            url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    // --- Rendering Logic ---
    
    const toggleMermaidLook = (look) => {
       mermaidLook.value = look;
       renderMermaid();
    };

    const renderMermaid = async () => {
      if (!mermaidRef.value || !localContent.value) return;
      
      if (mermaidContainerRef.value) {
         d3.select(mermaidContainerRef.value).on('.zoom', null);
      }
      
      mermaid.initialize({ 
          startOnLoad: false, 
          look: mermaidLook.value, 
          theme: mermaidLook.value === 'handDrawn' ? 'neutral' : 'base',
          securityLevel: 'loose',
      });

      try {
        const id = 'mermaid-graph-' + Date.now();
        const { svg } = await mermaid.render(id, localContent.value);
        mermaidRef.value.innerHTML = svg;
        initMermaidZoom();
      } catch (e) {
        // ERROR HANDLING: Log to our custom console
        const errMsg = `Mermaid Render Error: ${e.message}`;
        addLog('error', errMsg);
        mermaidRef.value.innerHTML = `<div class="text-red-600 font-mono text-xs p-4 bg-red-50 border border-red-200 rounded">${errMsg}</div>`;
      }
    };

    const initMermaidZoom = () => {
        if (!mermaidContainerRef.value || !mermaidRef.value) return;
        
        const svgElement = mermaidRef.value.querySelector('svg');
        if (!svgElement) return;

        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.maxWidth = 'none';
        
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', (e) => {
                d3.select(mermaidRef.value).style('transform', `translate(${e.transform.x}px, ${e.transform.y}px) scale(${e.transform.k})`);
            });

        d3.select(mermaidContainerRef.value).call(zoom);
        d3.select(mermaidContainerRef.value).call(zoom.transform, d3.zoomIdentity.translate(20, 20).scale(1));
    };

    const renderECharts = () => {
      if (!echartsRef.value || !localContent.value) return;
      if (chartInstance) chartInstance.dispose();
      chartInstance = echarts.init(echartsRef.value);
      
      try {
         let jsonStr = localContent.value.trim();
         if (jsonStr.startsWith('option =')) jsonStr = jsonStr.replace('option =', '');
         if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
         
         // ERROR HANDLING: Wrap parse in try-catch and log specifically
         const option = JSON.parse(jsonStr);
         chartInstance.setOption(option);
      } catch (e) {
         const errMsg = `ECharts Parse Error: ${e.message}`;
         console.error(e);
         addLog('error', errMsg);
         // Show visual feedback
         chartInstance.setOption({
             title: { 
                 text: 'Error Parsing Chart Data', 
                 subtext: e.message,
                 left: 'center', top: 'center',
                 textStyle: { color: '#d32f2f' }
             }
         });
      }
      
      const ro = new ResizeObserver(() => chartInstance.resize());
      ro.observe(echartsRef.value);
    };

    // --- Draw.io Integration ---
    const sendDrawioXml = (xml) => {
        if(!drawioRef.value || !drawioInitialized.value) return;
        drawioRef.value.contentWindow.postMessage(JSON.stringify({
            action: 'load',
            xml: xml,
            autosave: 1
        }), '*');
    };

    const handleDrawioMessage = (e) => {
        if (!drawioRef.value || !e.data || typeof e.data !== 'string') return;
        try {
            const msg = JSON.parse(e.data);
            if (msg.event === 'init') {
                drawioInitialized.value = true;
                sendDrawioXml(localContent.value);
            } else if (msg.event === 'autosave' || msg.event === 'save') {
                if (msg.xml) {
                   isUpdatingFromDrawio.value = true;
                   localContent.value = msg.xml;
                   nextTick(() => { isUpdatingFromDrawio.value = false; });
                }
            }
        } catch (err) { }
    };

    // --- History & Editors (SVG) ---
    const saveHistory = () => {
      if (!svgWrapper.value) return;
      removeEditorLayer();
      const svgTag = svgWrapper.value.querySelector('svg');
      if (!svgTag) return;
      if (svgTag.getAttribute('overflow') !== 'visible') svgTag.setAttribute('overflow', 'visible');
      const content = svgTag.outerHTML;
      if (historyIndex.value >= 0 && history.value[historyIndex.value] === content) {
        if(selectedElement.value) updateGizmo();
        return; 
      }
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }
      history.value.push(content);
      historyIndex.value++;
      localContent.value = content; 
      if (isEditing.value && selectedElement.value) updateGizmo();
    };

    const undo = () => {
      if (historyIndex.value > 0) {
        historyIndex.value--;
        localContent.value = history.value[historyIndex.value];
        deselectAll(); 
      }
    };

    const redo = () => {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value++;
        localContent.value = history.value[historyIndex.value];
        deselectAll();
      }
    };

    const handleKeydown = (e) => {
      if (inlineEdit.value.active) return; 
      const isCmd = e.ctrlKey || e.metaKey;
      if (isCmd && e.key === 'z') { e.preventDefault(); undo(); }
      else if (isCmd && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
      else if (isCmd && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement.value) {
         if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
         saveHistory(); deleteSelected();
      }
    };

    // --- Transform Parsers (SVG) ---
    const parseTransform = (el) => {
      const t = { x: 0, y: 0, rotation: 0, scale: 1 };
      const transformAttr = el.getAttribute('transform') || '';
      const translateMatch = transformAttr.match(/translate\(([^,]+)[,\s]([^)]+)\)/);
      if (translateMatch) { t.x = parseFloat(translateMatch[1]) || 0; t.y = parseFloat(translateMatch[2]) || 0; }
      const rotateMatch = transformAttr.match(/rotate\(([^)]+)\)/);
      if (rotateMatch) { t.rotation = parseFloat(rotateMatch[1]) || 0; }
      const scaleMatch = transformAttr.match(/scale\(([^)]+)\)/);
      if (scaleMatch) { t.scale = parseFloat(scaleMatch[1]) || 1; }
      return t;
    };

    const applyTransform = (el, t) => {
      const tx = isNaN(t.x) ? 0 : t.x;
      const ty = isNaN(t.y) ? 0 : t.y;
      const rot = isNaN(t.rotation) ? 0 : t.rotation;
      const scale = (isNaN(t.scale) || t.scale <= 0) ? 1 : t.scale;
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'center';
      let str = `translate(${tx}, ${ty})`;
      if (rot !== 0) str += ` rotate(${rot})`;
      if (scale !== 1) str += ` scale(${scale})`;
      el.setAttribute('transform', str);
    };

    const updateTextContent = (text) => {
      if (selectedElement.value && selectedElement.value.tagName === 'text') {
        saveHistory(); selectedElement.value.textContent = text; updateGizmo();
      }
    };

    // --- Gizmo Management (SVG) ---
    const getEditorLayer = (svg) => {
      let layer = svg.querySelector('#__editor_controls__');
      if (!layer) {
        layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        layer.id = '__editor_controls__';
        svg.appendChild(layer);
      }
      return layer;
    };

    const removeEditorLayer = () => {
      if (!svgWrapper.value) return;
      const layer = svgWrapper.value.querySelector('#__editor_controls__');
      if (layer) layer.remove();
    };

    const updateGizmo = () => {
      if (!selectedElement.value || !isEditing.value) { removeEditorLayer(); return; }
      if (inlineEdit.value.active) { removeEditorLayer(); return; }

      const el = selectedElement.value;
      const svg = el.ownerSVGElement;
      if (!svg) return;

      const layer = getEditorLayer(svg);
      while (layer.firstChild) layer.firstChild.remove();

      let bbox;
      try {
         bbox = el.getBBox();
         if (bbox.width === 0 && bbox.height === 0 && el.tagName !== 'g') { bbox = { x: 0, y: 0, width: 10, height: 10 }; }
      } catch(e) { return; }

      const gizmoGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmoGroup.setAttribute('transform', el.getAttribute('transform') || '');
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      gizmoGroup.style.transformBox = 'view-box';
      gizmoGroup.style.transformOrigin = `${cx}px ${cy}px`;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute('x', bbox.x); rect.setAttribute('y', bbox.y);
      rect.setAttribute('width', bbox.width); rect.setAttribute('height', bbox.height);
      rect.setAttribute('fill', 'none'); rect.setAttribute('stroke', '#3b82f6'); rect.setAttribute('stroke-width', '1.5');
      rect.style.vectorEffect = 'non-scaling-stroke'; 
      gizmoGroup.appendChild(rect);

      const currentScale = currentTransform.value.scale || 1;
      const handleRadius = 4 / currentScale; 
      const handleStroke = 1.5 / currentScale;

      const createHandle = (x, y, cursor, type) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', handleRadius); 
        c.setAttribute('fill', 'white'); c.setAttribute('stroke', '#3b82f6'); c.setAttribute('stroke-width', handleStroke);
        c.style.cursor = cursor; c.style.vectorEffect = 'non-scaling-stroke'; c.dataset.handleType = type;
        c.addEventListener('mousedown', (e) => { e.stopPropagation(); startGizmoAction(e, type); });
        return c;
      };

      gizmoGroup.appendChild(createHandle(bbox.x, bbox.y, 'nwse-resize', 'scale')); 
      gizmoGroup.appendChild(createHandle(bbox.x + bbox.width, bbox.y, 'nesw-resize', 'scale')); 
      gizmoGroup.appendChild(createHandle(bbox.x, bbox.y + bbox.height, 'nesw-resize', 'scale')); 
      gizmoGroup.appendChild(createHandle(bbox.x + bbox.width, bbox.y + bbox.height, 'nwse-resize', 'scale')); 

      const rotLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rotLine.setAttribute('x1', bbox.x + bbox.width/2); rotLine.setAttribute('y1', bbox.y);
      rotLine.setAttribute('x2', bbox.x + bbox.width/2); rotLine.setAttribute('y2', bbox.y - (20 / currentScale));
      rotLine.setAttribute('stroke', '#3b82f6'); rotLine.setAttribute('stroke-width', handleStroke);
      gizmoGroup.appendChild(rotLine);

      gizmoGroup.appendChild(createHandle(bbox.x + bbox.width/2, bbox.y - (20 / currentScale), 'grab', 'rotate'));
      layer.appendChild(gizmoGroup);
    };

    // --- Interaction Logic (SVG) ---
    const handleSvgMouseDown = (e) => {
      if (inlineEdit.value.active) { commitInlineEdit(); return; }
      if (!isEditing.value) return;
      if (mainContainer.value) mainContainer.value.focus();
      if (e.target.closest('#__editor_controls__')) return;

      const target = e.target.closest('path, rect, circle, ellipse, line, polyline, polygon, text');
      
      if (!target || target.closest('svg') !== svgWrapper.value.querySelector('svg')) {
        deselectAll();
        interactionMode.value = 'box-select';
        startMouse.value = { x: e.clientX, y: e.clientY };
        selectionBox.value = { x: 0, y: 0, w: 0, h: 0, visualX: e.clientX, visualY: e.clientY };
        return;
      }
      e.preventDefault(); e.stopPropagation();
      
      selectedElement.value = target;
      if (!target.style.transformBox) { target.style.transformBox = 'fill-box'; target.style.transformOrigin = 'center'; }
      currentTransform.value = parseTransform(target);
      initialTransform.value = { ...currentTransform.value };
      startMouse.value = { x: e.clientX, y: e.clientY };
      interactionMode.value = 'drag';
      saveHistory(); 
      updateGizmo(); updateSelectionStyleModel();
    };

    const startGizmoAction = (e, type) => {
       interactionMode.value = type;
       startMouse.value = { x: e.clientX, y: e.clientY };
       initialTransform.value = { ...currentTransform.value };
       saveHistory();
       if (type === 'rotate') {
          const rect = selectedElement.value.getBoundingClientRect();
          startMouse.value.center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
       }
    };

    const handleGlobalMouseMove = (e) => {
      if (!interactionMode.value) return;
      e.preventDefault();

      if (interactionMode.value === 'box-select') {
        const currentX = e.clientX; const currentY = e.clientY;
        const w = Math.abs(currentX - startMouse.value.x); const h = Math.abs(currentY - startMouse.value.y);
        const left = Math.min(currentX, startMouse.value.x); const top = Math.min(currentY, startMouse.value.y);
        selectionBox.value = { x: left, y: top, w, h, visualX: left, visualY: top };
        return;
      }
      if (!selectedElement.value) return;
      const el = selectedElement.value;

      if (interactionMode.value === 'drag') {
         const dx = e.clientX - startMouse.value.x; const dy = e.clientY - startMouse.value.y;
         currentTransform.value.x = initialTransform.value.x + dx; currentTransform.value.y = initialTransform.value.y + dy;
         applyTransform(el, currentTransform.value); updateGizmo(); 
      } else if (interactionMode.value === 'rotate') {
         const center = startMouse.value.center;
         const startAngle = Math.atan2(startMouse.value.y - center.y, startMouse.value.x - center.x);
         const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
         const degDelta = (currentAngle - startAngle) * (180 / Math.PI);
         currentTransform.value.rotation = initialTransform.value.rotation + degDelta;
         applyTransform(el, currentTransform.value); updateGizmo();
      } else if (interactionMode.value === 'scale') {
         const dy = e.clientY - startMouse.value.y;
         const scaleDelta = dy * 0.01;
         const newScale = Math.max(0.1, initialTransform.value.scale + scaleDelta);
         currentTransform.value.scale = newScale;
         applyTransform(el, currentTransform.value); updateGizmo();
      }
    };

    const handleGlobalMouseUp = () => {
      if (interactionMode.value === 'box-select' && selectionBox.value) {
        const svg = svgWrapper.value.querySelector('svg');
        if (svg) {
           const sb = selectionBox.value; 
           const candidates = svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text');
           for (let i = candidates.length - 1; i >= 0; i--) {
              const el = candidates[i];
              if (el.closest('#__editor_controls__') || el.closest('defs') || el.closest('marker')) continue;
              const bbox = el.getBoundingClientRect();
              const intersects = !(bbox.right < sb.x || bbox.left > sb.x + sb.w || bbox.bottom < sb.y || bbox.top > sb.y + sb.h);
              if (intersects) {
                 selectedElement.value = el;
                 if (!el.style.transformBox) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; }
                 currentTransform.value = parseTransform(el);
                 updateGizmo(); updateSelectionStyleModel();
                 break; 
              }
           }
        }
        selectionBox.value = null;
      }
      interactionMode.value = null;
    };

    // --- Inline Editing (SVG) ---
    const handleSvgDoubleClick = (e) => {
       if (!isEditing.value) return;
       if (e.target.tagName === 'text') {
         e.stopPropagation(); e.preventDefault(); startInlineEdit(e.target);
       }
    };

    const startInlineEdit = (el) => {
       selectedElement.value = el;
       inlineEdit.value.active = true;
       inlineEdit.value.value = el.textContent;
       inlineEdit.value.element = el;
       removeEditorLayer();

       const rect = el.getBoundingClientRect();
       const containerRect = svgWrapper.value.getBoundingClientRect();
       const compStyle = window.getComputedStyle(el);
       const fontSize = parseFloat(compStyle.fontSize) || 16;
       const scrollTop = svgWrapper.value.scrollTop;
       const scrollLeft = svgWrapper.value.scrollLeft;

       inlineEdit.value.style = {
          top: (rect.top - containerRect.top + scrollTop) + 'px',
          left: (rect.left - containerRect.left + scrollLeft) + 'px',
          width: Math.max(rect.width + 20, 100) + 'px',
          height: Math.max(rect.height, fontSize * 1.5) + 'px',
          fontSize: compStyle.fontSize, fontFamily: compStyle.fontFamily, color: compStyle.fill || '#000', lineHeight: compStyle.lineHeight, minWidth: '60px'
       };
       nextTick(() => { if (inlineInputRef.value) { inlineInputRef.value.focus(); inlineInputRef.value.select(); } });
    };

    const commitInlineEdit = () => {
       if (!inlineEdit.value.active) return;
       const el = inlineEdit.value.element;
       if (el && inlineEdit.value.value !== el.textContent) {
           saveHistory(); el.textContent = inlineEdit.value.value;
       }
       inlineEdit.value.active = false; inlineEdit.value.element = null; updateGizmo();
    };

    const handleInlineInputKeydown = (e) => {
       if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitInlineEdit(); }
    };

    // --- Property & Utils (SVG) ---
    const updateSelectionStyleModel = () => {
       if (!selectedElement.value) return;
       const el = selectedElement.value;
       const style = window.getComputedStyle(el);
       const rgb2hex = (rgb) => {
        if (!rgb || rgb === 'none') return '#000000';
        if (rgb.startsWith('#')) return rgb;
        const rgbMatch = rgb.match(/\d+/g);
        if (!rgbMatch) return '#000000';
        return "#" + ((1 << 24) + (parseInt(rgbMatch[0]) << 16) + (parseInt(rgbMatch[1]) << 8) + parseInt(rgbMatch[2])).toString(16).slice(1);
      };
      selectionStyle.value.fill = rgb2hex(el.getAttribute('fill') || style.fill);
      selectionStyle.value.stroke = rgb2hex(el.getAttribute('stroke') || style.stroke);
      selectionStyle.value.strokeWidth = parseFloat(el.getAttribute('stroke-width') || style.strokeWidth) || 1;
      selectionStyle.value.fontSize = parseFloat(el.getAttribute('font-size') || style.fontSize) || 16;
    };

    const updateElementStyle = (attr) => {
      if (!selectedElement.value) return;
      let val = selectionStyle.value[attr === 'stroke-width' ? 'strokeWidth' : (attr === 'font-size' ? 'fontSize' : attr)];
      selectedElement.value.setAttribute(attr, val);
    };

    const duplicateSelected = () => {
       if (!selectedElement.value) return;
       saveHistory();
       const original = selectedElement.value;
       const clone = original.cloneNode(true);
       clone.removeAttribute('id');
       const t = parseTransform(original);
       t.x += 20; t.y += 20;
       applyTransform(clone, t);
       original.parentNode.appendChild(clone);
       deselectAll();
       nextTick(() => { selectedElement.value = clone; currentTransform.value = t; updateGizmo(); updateSelectionStyleModel(); });
    };
    
    const deleteSelected = () => { if (selectedElement.value) { selectedElement.value.remove(); deselectAll(); } };
    const deselectAll = () => { selectedElement.value = null; removeEditorLayer(); inlineEdit.value.active = false; };
    const toggleEditMode = () => {
      isEditing.value = !isEditing.value;
      if (!isEditing.value) deselectAll();
      else {
         if (svgWrapper.value) svgWrapper.value.querySelector('svg')?.setAttribute('overflow', 'visible');
         if (history.value.length === 0 && svgWrapper.value) {
            history.value.push(svgWrapper.value.querySelector('svg')?.outerHTML || localContent.value);
            historyIndex.value = 0;
         }
      }
    };

    // --- Add Elements (SVG) ---
    const addSvgElement = (type, attrs) => {
       if (!svgWrapper.value) return null;
       const svg = svgWrapper.value.querySelector('svg');
       if (!svg) return null;
       saveHistory();
       const el = document.createElementNS("http://www.w3.org/2000/svg", type);
       for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
       svg.appendChild(el);
       nextTick(() => { selectedElement.value = el; applyTransform(el, { x: 0, y: 0, rotation: 0, scale: 1 }); currentTransform.value = { x: 0, y: 0, rotation: 0, scale: 1 }; updateGizmo(); updateSelectionStyleModel(); });
       return el;
    };
    const addText = () => { const el = addSvgElement('text', { x: 50, y: 50, 'font-size': 24, fill: '#000000', 'font-family': 'sans-serif' }); if (el) el.textContent = "Double Click"; };
    const addRect = () => addSvgElement('rect', { x: 50, y: 50, width: 100, height: 80, fill: '#3b82f6', stroke: '#1d4ed8', 'stroke-width': 2 });
    const addCircle = () => addSvgElement('circle', { cx: 100, cy: 100, r: 40, fill: '#ef4444', stroke: '#b91c1c', 'stroke-width': 2 });
    const ensureArrowMarker = (svg) => {
      let defs = svg.querySelector('defs');
      if (!defs) { defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"); svg.insertBefore(defs, svg.firstChild); }
      if (!defs.querySelector('#arrowhead')) {
          const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
          marker.setAttribute('id', 'arrowhead'); marker.setAttribute('markerWidth', '10'); marker.setAttribute('markerHeight', '7'); marker.setAttribute('refX', '9'); marker.setAttribute('refY', '3.5'); marker.setAttribute('orient', 'auto');
          const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          poly.setAttribute('points', '0 0, 10 3.5, 0 7'); poly.setAttribute('fill', '#374151'); marker.appendChild(poly); defs.appendChild(marker);
      }
    };
    const addLine = () => addSvgElement('line', { x1: 50, y1: 50, x2: 200, y2: 50, stroke: '#000000', 'stroke-width': 2 });
    const addArrow = () => { if (svgWrapper.value) ensureArrowMarker(svgWrapper.value.querySelector('svg')); addSvgElement('line', { x1: 50, y1: 100, x2: 200, y2: 100, stroke: '#374151', 'stroke-width': 2, 'marker-end': 'url(#arrowhead)' }); };

    // --- Output ---
    const getDisplayCode = () => {
      if (!svgWrapper.value) return localContent.value;
      const clone = svgWrapper.value.cloneNode(true);
      clone.querySelector('#__editor_controls__')?.remove();
      return clone.querySelector('svg')?.outerHTML || localContent.value;
    };
    const copyCode = () => { navigator.clipboard.writeText(getDisplayCode()); copied.value = true; setTimeout(() => copied.value = false, 2000); };
    const renderMarkdown = (text) => window.marked ? window.marked.parse(text, { breaks: true, gfm: true }) : text;
    const refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };

    watch(() => props.artifact, (newVal) => {
      if (newVal) {
        localContent.value = newVal.content;
        history.value = [newVal.content];
        historyIndex.value = 0;
        isEditing.value = false;
        deselectAll();
        // Reset logs on new artifact
        consoleLogs.value = []; 

        if (newVal.type === 'mermaid') { mermaidLook.value = 'default'; }
        if (newVal.type === 'drawio' && drawioInitialized.value) { nextTick(() => sendDrawioXml(newVal.content)); }
        nextTick(() => {
           if (newVal.type === 'mermaid') renderMermaid();
           if (newVal.type === 'echarts') renderECharts();
           // Trigger syntax highlight for JSON view
           if (newVal.type === 'json' && window.hljs) {
               document.querySelectorAll('pre code').forEach((block) => {
                   window.hljs.highlightElement(block);
               });
           }
        });
      }
    }, { immediate: true });
    
    watch(localContent, (newVal) => {
      if (props.artifact?.type === 'drawio' && drawioInitialized.value && !isUpdatingFromDrawio.value && activeTab.value === 'preview') {
           sendDrawioXml(newVal);
      }
    });

    watch(activeTab, (newTab) => {
       if (newTab === 'preview') {
          nextTick(() => {
             if (props.artifact?.type === 'mermaid') renderMermaid();
             if (props.artifact?.type === 'echarts') renderECharts();
             if (props.artifact?.type === 'drawio' && drawioInitialized.value) { sendDrawioXml(localContent.value); }
             if (props.artifact?.type === 'json' && window.hljs) {
               document.querySelectorAll('pre code').forEach((block) => {
                   window.hljs.highlightElement(block);
               });
             }
          });
       }
    });

    onMounted(() => {
      if (props.artifact) localContent.value = props.artifact.content;
      refreshIcons();
      document.addEventListener("fullscreenchange", () => isFullscreen.value = !!document.fullscreenElement);
      window.addEventListener('message', handleWindowMessage);
    });

    onUnmounted(() => { window.removeEventListener('message', handleWindowMessage); });
    
    onUpdated(refreshIcons);

    return { 
        activeTab, copyCode, copied, enrichedHtmlContent, renderMarkdown, localContent,
        isEditing, toggleEditMode, selectedElement, selectionStyle,
        handleSvgMouseDown, handleSvgDoubleClick, handleGlobalMouseMove, handleGlobalMouseUp,
        updateElementStyle, updateTextContent, duplicateSelected, deleteSelected,
        addText, addRect, addCircle, addLine, addArrow, deselectAll,
        svgWrapper, mermaidRef, mermaidContainerRef, echartsRef, drawioRef, currentTransform, mainContainer,
        undo, redo, handleKeydown, historyIndex, history,
        selectionBox, inlineEdit, inlineInputRef, commitInlineEdit, handleInlineInputKeydown,
        deviceMode, toggleFullscreen, isFullscreen, downloadArtifact,
        mermaidLook, toggleMermaidLook,
        reloadPreview, reloadKey,
        // Console
        isConsoleOpen, consoleLogs, consoleErrorCount, consoleScrollRef, handleComponentError
    };
  }
};
