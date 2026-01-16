"""
Playwright-based PDF converter for LandPPT
Replaces the Pyppeteer implementation with Python Playwright for better stability and performance
"""

import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import time

try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    # Create dummy types for type hints when playwright is not available
    class Browser:
        pass
    class Page:
        pass
    class BrowserContext:
        pass

logger = logging.getLogger(__name__)


class PlaywrightPDFConverter:
    """
    PDF converter using Playwright
    Optimized for 16:9 PPT slides with complete style preservation
    """

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.playwright = None
        self._browser_lock = asyncio.Lock()

    def is_available(self) -> bool:
        """Check if Playwright is available"""
        return PLAYWRIGHT_AVAILABLE

    @staticmethod
    def install_chromium():
        """手动安装 Chromium 的辅助方法"""
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError("Playwright is not available. Please install: pip install playwright")

        try:
            logger.info("🔄 开始手动安装 Chromium...")

            # 方法1: 使用 playwright install 命令
            try:
                import subprocess
                result = subprocess.run([
                    'python', '-m', 'playwright', 'install', 'chromium'
                ], capture_output=True, text=True, timeout=300)

                if result.returncode == 0:
                    logger.info("✅ Chromium 通过 Playwright 安装成功")
                    return True
                else:
                    logger.warning(f"⚠️ Playwright 安装失败: {result.stderr}")
            except Exception as e:
                logger.warning(f"⚠️ Playwright 安装出错: {e}")

            # 方法2: 尝试安装所有浏览器
            try:
                import subprocess
                result = subprocess.run([
                    'python', '-m', 'playwright', 'install'
                ], capture_output=True, text=True, timeout=600)

                if result.returncode == 0:
                    logger.info("✅ 所有浏览器通过 Playwright 安装成功")
                    return True
                else:
                    logger.warning(f"⚠️ Playwright 全量安装失败: {result.stderr}")
            except Exception as e:
                logger.warning(f"⚠️ Playwright 全量安装出错: {e}")

            return False

        except Exception as e:
            logger.error(f"❌ Chromium 安装失败: {e}")
            return False
    
    async def _launch_browser(self) -> Browser:
        """Launch browser with enhanced settings optimized for chart rendering"""
        if not self.is_available():
            raise ImportError("Playwright is not available. Please install: pip install playwright")

        # Enhanced launch options with better Windows compatibility
        launch_args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--run-all-compositor-stages-before-draw',
            '--disable-checker-imaging',
            # Additional stability options for Windows
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-ipc-flooding-protection',
            '--disable-software-rasterizer',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-pings',
            '--password-store=basic',
            '--use-mock-keychain',
            # Windows specific fixes
            '--disable-logging',
            '--disable-gpu-logging',
            '--disable-crash-reporter',
            '--disable-in-process-stack-traces',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-domain-reliability',
            '--disable-component-update',
            '--no-service-autorun',
            '--disable-background-mode'
        ]

        try:
            # Initialize Playwright
            if self.playwright is None:
                self.playwright = await async_playwright().start()

            # Method 1: Try Playwright's installed Chromium first (especially for Docker)
            logger.info("🔄 Trying Playwright's installed Chromium...")
            try:
                browser = await self.playwright.chromium.launch(
                    headless=True,
                    args=launch_args
                )
                logger.info("✅ Playwright Chromium launched successfully")
                return browser

            except Exception as playwright_error:
                logger.warning(f"❌ Playwright Chromium launch failed: {playwright_error}")

            # Method 2: Try system Chrome with enhanced error handling
            system_chrome_paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Users\\{}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'.format(os.environ.get('USERNAME', '')),
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/snap/bin/chromium'
            ]

            for chrome_path in system_chrome_paths:
                if os.path.exists(chrome_path):
                    logger.info(f"🔍 Found system Chrome at: {chrome_path}")

                    # Try different Chrome configurations
                    chrome_configs = [
                        # Config 1: Standard headless with custom executable
                        {
                            'executable_path': chrome_path,
                            'headless': True,
                            'args': [
                                '--no-sandbox',
                                '--disable-setuid-sandbox',
                                '--disable-dev-shm-usage',
                                '--disable-gpu',
                                '--disable-extensions',
                                '--disable-plugins'
                            ]
                        },
                        # Config 2: Minimal args
                        {
                            'executable_path': chrome_path,
                            'headless': True,
                            'args': ['--no-sandbox', '--disable-setuid-sandbox']
                        },
                        # Config 3: No custom args
                        {
                            'executable_path': chrome_path,
                            'headless': True,
                            'args': []
                        }
                    ]

                    for config_idx, config in enumerate(chrome_configs):
                        try:
                            logger.info(f"🔄 尝试 Chrome 配置 {config_idx + 1}/3")
                            browser = await self.playwright.chromium.launch(**config)
                            logger.info(f"✅ Chrome 启动成功 (配置 {config_idx + 1})")
                            return browser

                        except Exception as e:
                            logger.warning(f"❌ Chrome 配置 {config_idx + 1} 失败: {e}")
                            if "远程主机强迫关闭" in str(e) or "Connection" in str(e):
                                # 网络连接问题，等待后重试
                                await asyncio.sleep(2)
                            continue

            # Method 3: Try portable Chrome
            logger.info("🔄 System Chrome failed, trying portable solutions...")

            # Try to use any available Chrome-like browser
            portable_browsers = [
                'chrome.exe',  # Portable Chrome in current directory
                'chromium.exe',  # Portable Chromium
            ]

            for browser_exe in portable_browsers:
                if os.path.exists(browser_exe):
                    logger.info(f"🔍 Found portable browser: {browser_exe}")
                    try:
                        portable_config = {
                            'executable_path': os.path.abspath(browser_exe),
                            'headless': True,
                            'args': ['--no-sandbox', '--disable-setuid-sandbox']
                        }
                        browser = await self.playwright.chromium.launch(**portable_config)
                        logger.info(f"✅ Portable browser launched: {browser_exe}")
                        return browser
                    except Exception as e:
                        logger.warning(f"❌ Portable browser failed: {e}")

            # Method 4: Final attempt with minimal config
            logger.info("🔄 Final attempt with minimal configuration...")
            try:
                browser = await self.playwright.chromium.launch(
                    headless=True,
                    args=['--no-sandbox']  # Only essential arg
                )
                logger.info("✅ Browser launched with minimal configuration")
                return browser

            except Exception as minimal_error:
                logger.error(f"❌ Minimal launch also failed: {minimal_error}")

        except Exception as e:
            logger.error(f"❌ All browser launch methods failed: {e}")

            # Provide comprehensive error message with solutions
            error_msg = (
                f"无法启动浏览器: {e}\n\n"
                "解决方案:\n"
                "1. 确保已安装 Google Chrome 浏览器\n"
                "2. 运行: pip install --upgrade playwright\n"
                "3. 手动安装 Chromium: python -m playwright install chromium\n"
                "4. 或者安装所有浏览器: python -m playwright install\n"
                "5. 检查防火墙和杀毒软件是否阻止了浏览器启动"
            )
            raise ImportError(error_msg)

    async def _get_or_create_browser(self) -> Browser:
        """Get existing browser or create a new one (with thread safety)"""
        async with self._browser_lock:
            if self.browser is None:
                self.browser = await self._launch_browser()
                # Create a browser context for better isolation
                self.context = await self.browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    device_scale_factor=2,
                    ignore_https_errors=True
                )
            return self.browser
    
    async def _wait_for_charts_and_dynamic_content(self, page: Page, max_wait_time: int = 15000):
        """
        Enhanced function to wait for Chart.js, ECharts.js, D3.js charts and dynamic content to fully render
        Improved detection for multiple chart libraries and animations with extended wait time
        """
        logger.debug("🎯 等待图表和动态内容完全渲染...")

        start_time = time.time() * 1000  # Convert to milliseconds
        attempts = 0
        max_attempts = 30  # 进一步增加尝试次数以确保所有动态内容完全加载

        # 首先等待基础DOM和资源加载
        await page.wait_for_selector('body', timeout=5000)

        # 等待所有图片加载完成
        await page.evaluate('''() => {
            return new Promise((resolve) => {
                const images = Array.from(document.querySelectorAll('img'));
                if (images.length === 0) {
                    resolve();
                    return;
                }

                let loadedCount = 0;
                const checkComplete = () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                        resolve();
                    }
                };

                images.forEach(img => {
                    if (img.complete) {
                        checkComplete();
                    } else {
                        img.onload = checkComplete;
                        img.onerror = checkComplete;
                    }
                });

                // 超时保护
                setTimeout(resolve, 3000);
            });
        }''')

        while (time.time() * 1000 - start_time) < max_wait_time and attempts < max_attempts:
            attempts += 1

            try:
                # 详细检查页面状态，包括多种图表库的动态内容
                chart_status = await page.evaluate('''() => {
                    const results = {
                        domReady: document.readyState === 'complete',
                        chartJsLoaded: typeof window.Chart !== 'undefined',
                        echartsLoaded: typeof window.echarts !== 'undefined',
                        d3Loaded: typeof window.d3 !== 'undefined',
                        canvasElements: 0,
                        svgElements: 0,
                        totalCharts: 0,
                        renderedCharts: 0,
                        echartsInstances: 0,
                        renderedEcharts: 0,
                        d3Elements: 0,
                        renderedD3: 0,
                        animationsComplete: true,
                        scriptsLoaded: true,
                        imagesLoaded: true
                    };

                    // 检查所有canvas元素
                    const canvasElements = document.querySelectorAll('canvas');
                    results.canvasElements = canvasElements.length;

                    // 检查所有SVG元素
                    const svgElements = document.querySelectorAll('svg');
                    results.svgElements = svgElements.length;

                    // 检查图片是否全部加载完成
                    const images = document.querySelectorAll('img');
                    images.forEach(img => {
                        if (!img.complete || img.naturalWidth === 0) {
                            results.imagesLoaded = false;
                        }
                    });

                    // 检查脚本是否加载完成
                    const scripts = document.querySelectorAll('script[src]');
                    scripts.forEach(script => {
                        if (script.readyState && script.readyState !== 'complete' && script.readyState !== 'loaded') {
                            results.scriptsLoaded = false;
                        }
                    });

                    // 详细检查Chart.js实例和渲染状态
                    if (results.chartJsLoaded && window.Chart && window.Chart.instances) {
                        results.totalCharts = Object.keys(window.Chart.instances).length;

                        // 检查每个图表的渲染状态
                        Object.values(window.Chart.instances).forEach(chart => {
                            if (chart && chart.canvas) {
                                try {
                                    const ctx = chart.canvas.getContext('2d');
                                    if (ctx) {
                                        // 检查canvas是否有实际内容
                                        const imageData = ctx.getImageData(0, 0, Math.min(chart.canvas.width, 100), Math.min(chart.canvas.height, 100));
                                        let hasContent = false;

                                        // 检查前100x100像素区域是否有非透明内容
                                        for (let i = 3; i < imageData.data.length; i += 4) {
                                            if (imageData.data[i] > 0) { // alpha channel > 0
                                                hasContent = true;
                                                break;
                                            }
                                        }

                                        if (hasContent) {
                                            results.renderedCharts++;
                                        }
                                    }
                                } catch (e) {
                                    // 如果无法检查内容，假设已渲染
                                    results.renderedCharts++;
                                }

                                // 检查图表动画是否完成
                                if (chart.animating || (chart.options && chart.options.animation && chart.options.animation.duration > 0)) {
                                    results.animationsComplete = false;
                                }
                            }
                        });
                    }

                    // 详细检查ECharts实例和渲染状态
                    if (results.echartsLoaded && window.echarts) {
                        // 查找所有ECharts实例
                        document.querySelectorAll('[_echarts_instance_], [id*="chart"], [class*="chart"], [class*="echarts"]').forEach(el => {
                            const instance = window.echarts.getInstanceByDom(el);
                            if (instance) {
                                results.echartsInstances++;

                                try {
                                    // 检查ECharts是否已完成渲染
                                    const option = instance.getOption();
                                    if (option && option.series && option.series.length > 0) {
                                        // 检查canvas内容
                                        const canvas = el.querySelector('canvas');
                                        if (canvas) {
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) {
                                                const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
                                                let hasContent = false;

                                                for (let i = 3; i < imageData.data.length; i += 4) {
                                                    if (imageData.data[i] > 0) {
                                                        hasContent = true;
                                                        break;
                                                    }
                                                }

                                                if (hasContent) {
                                                    results.renderedEcharts++;
                                                }
                                            }
                                        } else {
                                            // 如果没有canvas，假设已渲染（可能是SVG模式）
                                            results.renderedEcharts++;
                                        }
                                    }

                                    // 检查ECharts动画状态
                                    if (option && option.animation !== false) {
                                        results.animationsComplete = false;
                                    }
                                } catch (e) {
                                    // 出错时保守处理，假设已渲染
                                    results.renderedEcharts++;
                                }
                            }
                        });
                    }

                    // 详细检查D3.js SVG元素和渲染状态
                    if (results.d3Loaded && window.d3) {
                        svgElements.forEach(svg => {
                            results.d3Elements++;

                            try {
                                // 检查SVG是否有实际内容
                                const children = svg.children;
                                let hasContent = false;

                                // 检查是否有路径、圆形、矩形等图形元素
                                const graphicElements = svg.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse, text, g');
                                if (graphicElements.length > 0) {
                                    // 进一步检查是否有实际的绘制内容
                                    for (let elem of graphicElements) {
                                        const bbox = elem.getBBox ? elem.getBBox() : null;
                                        if (bbox && (bbox.width > 0 || bbox.height > 0)) {
                                            hasContent = true;
                                            break;
                                        }
                                        // 检查是否有填充或描边
                                        const style = window.getComputedStyle(elem);
                                        if (style.fill !== 'none' || style.stroke !== 'none') {
                                            hasContent = true;
                                            break;
                                        }
                                    }
                                }

                                if (hasContent) {
                                    results.renderedD3++;
                                }
                            } catch (e) {
                                // 出错时保守处理，假设已渲染
                                results.renderedD3++;
                            }
                        });
                    }

                    // 检查其他可能的动态内容
                    const dynamicElements = document.querySelectorAll('[class*="animate"], [class*="transition"], [style*="transition"], [style*="animation"]');
                    if (dynamicElements.length > 0) {
                        // 给动态元素一些时间完成动画
                        results.animationsComplete = false;
                    }

                    return results;
                }''')

                logger.debug(f"📊 图表检查 (第{attempts}次): DOM:{chart_status['domReady']}, Chart.js:{chart_status['renderedCharts']}/{chart_status['totalCharts']}, ECharts:{chart_status['renderedEcharts']}/{chart_status['echartsInstances']}, D3:{chart_status['renderedD3']}/{chart_status['d3Elements']}, 动画:{chart_status['animationsComplete']}")

                # 判断是否所有内容都已准备就绪
                all_charts_ready = (
                    (chart_status['totalCharts'] == 0 or chart_status['renderedCharts'] >= chart_status['totalCharts']) and
                    (chart_status['echartsInstances'] == 0 or chart_status['renderedEcharts'] >= chart_status['echartsInstances']) and
                    (chart_status['d3Elements'] == 0 or chart_status['renderedD3'] >= chart_status['d3Elements'])
                )

                all_ready = (chart_status['domReady'] and
                           chart_status['scriptsLoaded'] and
                           chart_status['imagesLoaded'] and
                           chart_status['animationsComplete'] and
                           all_charts_ready)

                if all_ready:
                    logger.debug("✅ 所有图表和动态内容已完全渲染")
                    break

                # 动态等待时间：如果有图表内容，等待时间更短
                total_rendered = chart_status['renderedCharts'] + chart_status['renderedEcharts'] + chart_status['renderedD3']
                total_expected = chart_status['totalCharts'] + chart_status['echartsInstances'] + chart_status['d3Elements']

                if total_rendered > 0 or total_expected == 0:
                    await asyncio.sleep(0.2)  # 已有内容，快速检查
                else:
                    await asyncio.sleep(0.5)  # 等待内容加载

            except Exception as error:
                logger.warning(f"⚠️ 渲染检查出错 (第{attempts}次): {error}")
                await asyncio.sleep(0.5)

        # 根据检测结果决定最终等待时间
        if attempts < 5:  # 如果很快就检测到内容完成，只需短暂等待
            await asyncio.sleep(0.5)
        else:  # 如果需要较长时间检测，给更多稳定时间
            await asyncio.sleep(1.2)

        # 额外的稳定等待，确保所有异步渲染完成
        logger.debug("🔄 执行最终稳定等待...")
        await asyncio.sleep(1.0)

        # 强制触发一次重排和重绘
        await page.evaluate('''() => {
            // 强制重排
            document.body.offsetHeight;

            // 触发resize事件确保所有响应式内容更新
            window.dispatchEvent(new Event('resize'));

            // 等待一个渲染帧
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });
        }''')

        total_time = time.time() * 1000 - start_time
        logger.debug(f"✨ 图表和动态内容等待完成，总耗时: {total_time:.0f}ms")

    async def _perform_final_chart_verification(self, page: Page) -> Optional[Dict]:
        """Enhanced final verification for Chart.js, ECharts, and D3.js charts"""
        logger.debug("🔍 执行最终图表渲染验证...")

        try:
            final_status = await page.evaluate('''() => {
                const results = {
                    totalCanvasElements: 0,
                    renderedCanvasElements: 0,
                    chartInstances: 0,
                    echartsInstances: 0,
                    renderedEchartsInstances: 0,
                    svgElements: 0,
                    renderedSvgElements: 0,
                    d3Elements: 0,
                    renderedD3Elements: 0,
                    errors: [],
                    contentVerified: false
                };

                // 检查Canvas元素
                const canvasElements = document.querySelectorAll('canvas');
                results.totalCanvasElements = canvasElements.length;

                canvasElements.forEach((canvas, index) => {
                    try {
                        const ctx = canvas.getContext('2d');
                        if (ctx && canvas.width > 0 && canvas.height > 0) {
                            let hasContent = false;

                            try {
                                // 方法1：检查canvas数据URL（降低阈值）
                                const dataURL = canvas.toDataURL();
                                // 空白canvas的dataURL通常很短，降低阈值以适应更多情况
                                if (dataURL && dataURL.length > 500) {
                                    hasContent = true;
                                }
                            } catch (e) {
                                // 如果toDataURL失败，尝试其他方法
                            }

                            if (!hasContent) {
                                try {
                                    // 方法2：检查像素数据（更宽松的检测）
                                    const sampleSize = Math.min(50, canvas.width, canvas.height);
                                    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);

                                    // 检查是否有任何非透明像素（更宽松的条件）
                                    for (let i = 3; i < imageData.data.length; i += 4) {
                                        const a = imageData.data[i];
                                        // 只要有非透明像素就认为有内容
                                        if (a > 0) {
                                            hasContent = true;
                                            break;
                                        }
                                    }

                                    // 如果没有透明度变化，检查颜色变化
                                    if (!hasContent) {
                                        for (let i = 0; i < imageData.data.length; i += 4) {
                                            const r = imageData.data[i];
                                            const g = imageData.data[i + 1];
                                            const b = imageData.data[i + 2];

                                            // 检查是否有任何颜色变化（不限于非白色）
                                            if (r !== imageData.data[0] || g !== imageData.data[1] || b !== imageData.data[2]) {
                                                hasContent = true;
                                                break;
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // 如果像素检查失败，假设有内容（保守处理）
                                    hasContent = true;
                                }
                            }

                            // 方法3：检查是否关联了Chart.js实例
                            if (!hasContent && window.Chart && window.Chart.instances) {
                                Object.values(window.Chart.instances).forEach(chart => {
                                    if (chart && chart.canvas === canvas) {
                                        hasContent = true;
                                    }
                                });
                            }

                            // 方法4：检查是否关联了ECharts实例
                            if (!hasContent && window.echarts) {
                                const parentElement = canvas.parentElement;
                                if (parentElement) {
                                    const instance = window.echarts.getInstanceByDom(parentElement);
                                    if (instance) {
                                        hasContent = true;
                                    }
                                }
                            }

                            if (hasContent) {
                                results.renderedCanvasElements++;
                            }
                        }
                    } catch (e) {
                        results.errors.push(`Canvas ${index}: ${e.message}`);
                        // 出错时保守处理，假设有内容
                        results.renderedCanvasElements++;
                    }
                });

                // 检查Chart.js实例
                if (window.Chart && window.Chart.instances) {
                    results.chartInstances = Object.keys(window.Chart.instances).length;
                }

                // 详细检查ECharts实例
                if (window.echarts) {
                    document.querySelectorAll('[_echarts_instance_], [id*="chart"], [class*="chart"], [class*="echarts"]').forEach((el, index) => {
                        const instance = window.echarts.getInstanceByDom(el);
                        if (instance) {
                            results.echartsInstances++;

                            try {
                                // 检查ECharts是否有有效的配置和数据
                                const option = instance.getOption();
                                if (option && option.series && option.series.length > 0) {
                                    let hasValidData = false;

                                    // 检查系列数据
                                    option.series.forEach(series => {
                                        if (series.data && series.data.length > 0) {
                                            hasValidData = true;
                                        }
                                    });

                                    if (hasValidData) {
                                        // 检查渲染的canvas或SVG内容
                                        const canvas = el.querySelector('canvas');
                                        const svg = el.querySelector('svg');
                                        let contentRendered = false;

                                        if (canvas) {
                                            try {
                                                const ctx = canvas.getContext('2d');
                                                if (ctx && canvas.width > 0 && canvas.height > 0) {
                                                    // 检查canvas数据URL
                                                    const dataURL = canvas.toDataURL();
                                                    if (dataURL && dataURL.length > 500) {
                                                        contentRendered = true;
                                                    } else {
                                                        // 检查像素数据
                                                        const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 30), Math.min(canvas.height, 30));
                                                        for (let i = 3; i < imageData.data.length; i += 4) {
                                                            if (imageData.data[i] > 0) {
                                                                contentRendered = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            } catch (e) {
                                                // canvas检查失败，假设已渲染
                                                contentRendered = true;
                                            }
                                        } else if (svg) {
                                            const graphicElements = svg.querySelectorAll('path, circle, rect, line, polygon, text, g');
                                            if (graphicElements.length > 0) {
                                                contentRendered = true;
                                            }
                                        } else {
                                            // 如果找不到canvas或svg，但有数据和配置，假设已渲染
                                            contentRendered = true;
                                        }

                                        if (contentRendered) {
                                            results.renderedEchartsInstances++;
                                        }
                                    } else {
                                        // 即使没有数据，如果有配置也可能是有效的图表
                                        results.renderedEchartsInstances++;
                                    }
                                }
                            } catch (e) {
                                results.errors.push(`ECharts ${index}: ${e.message}`);
                                // 出错时保守处理，假设已渲染
                                results.renderedEchartsInstances++;
                            }
                        }
                    });
                }

                // 详细检查SVG元素（主要针对D3.js）
                const svgElements = document.querySelectorAll('svg');
                results.svgElements = svgElements.length;

                svgElements.forEach((svg, index) => {
                    try {
                        // 检查SVG是否有实际的图形内容
                        const graphicElements = svg.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse, text, g');
                        let hasContent = false;

                        if (graphicElements.length > 0) {
                            // 检查图形元素是否有实际的尺寸和样式
                            for (let elem of graphicElements) {
                                try {
                                    const bbox = elem.getBBox ? elem.getBBox() : null;
                                    if (bbox && (bbox.width > 0 || bbox.height > 0)) {
                                        hasContent = true;
                                        break;
                                    }

                                    // 检查是否有填充或描边
                                    const style = window.getComputedStyle(elem);
                                    if ((style.fill && style.fill !== 'none') || (style.stroke && style.stroke !== 'none')) {
                                        hasContent = true;
                                        break;
                                    }

                                    // 检查内联样式
                                    if (elem.getAttribute('fill') || elem.getAttribute('stroke')) {
                                        hasContent = true;
                                        break;
                                    }
                                } catch (e) {
                                    // 单个元素检查失败，继续检查其他元素
                                    continue;
                                }
                            }
                        }

                        if (hasContent) {
                            results.renderedSvgElements++;

                            // 如果这个SVG看起来像D3.js创建的，计入D3元素
                            if (svg.classList.contains('d3') ||
                                svg.getAttribute('class')?.includes('d3') ||
                                svg.querySelector('[class*="d3"]') ||
                                window.d3) {
                                results.d3Elements++;
                                results.renderedD3Elements++;
                            }
                        }
                    } catch (e) {
                        results.errors.push(`SVG ${index}: ${e.message}`);
                        // 出错时保守处理，假设有内容
                        results.renderedSvgElements++;
                        if (window.d3) {
                            results.d3Elements++;
                            results.renderedD3Elements++;
                        }
                    }
                });

                // 如果没有明确的D3标识，但有D3库且有SVG，将所有SVG视为潜在的D3元素
                if (window.d3 && results.d3Elements === 0 && results.svgElements > 0) {
                    results.d3Elements = results.svgElements;
                    results.renderedD3Elements = results.renderedSvgElements;
                }

                // 智能验证内容是否充分渲染
                const totalRendered = results.renderedCanvasElements + results.renderedEchartsInstances + results.renderedSvgElements;
                const totalExpected = results.totalCanvasElements + results.echartsInstances + results.svgElements;

                // 更智能的验证逻辑
                let contentVerified = false;

                if (totalExpected === 0) {
                    // 如果没有图表元素，认为验证通过
                    contentVerified = true;
                } else if (totalRendered >= totalExpected * 0.6) {
                    // 降低阈值到60%，更宽松的验证
                    contentVerified = true;
                } else if (results.chartInstances > 0 || results.echartsInstances > 0 || results.svgElements > 0) {
                    // 如果有图表库实例或SVG元素，即使检测不完美也认为可能已渲染
                    contentVerified = true;
                } else if (totalRendered > 0) {
                    // 只要有任何渲染内容就认为部分成功
                    contentVerified = true;
                }

                results.contentVerified = contentVerified;

                return results;
            }''')

            # 计算渲染统计
            total_rendered = final_status['renderedCanvasElements'] + final_status['renderedEchartsInstances'] + final_status['renderedSvgElements']
            total_expected = final_status['totalCanvasElements'] + final_status['echartsInstances'] + final_status['svgElements']
            render_percentage = (total_rendered / total_expected * 100) if total_expected > 0 else 100

            logger.debug(f"📊 最终验证结果: Canvas:{final_status['renderedCanvasElements']}/{final_status['totalCanvasElements']}, Chart.js:{final_status['chartInstances']}, ECharts:{final_status['renderedEchartsInstances']}/{final_status['echartsInstances']}, SVG:{final_status['renderedSvgElements']}/{final_status['svgElements']}, D3:{final_status['renderedD3Elements']}/{final_status['d3Elements']}")
            logger.debug(f"📈 渲染完成度: {render_percentage:.1f}% ({total_rendered}/{total_expected})")

            if final_status['errors']:
                logger.debug(f"⚠️ 验证中发现错误: {final_status['errors'][:3]}")  # 只显示前3个错误

            if not final_status['contentVerified']:
                logger.info(f"⚠️ 图表渲染检测: {render_percentage:.1f}%完成 ({total_rendered}/{total_expected})，但PDF生成将继续")
            else:
                logger.debug(f"✅ 图表内容验证通过: {render_percentage:.1f}%渲染完成")

            return final_status

        except Exception as error:
            logger.error(f"❌ 最终图表验证失败: {error}")
            # 返回一个基础的验证结果，假设内容已渲染
            return {
                'totalCanvasElements': 0,
                'renderedCanvasElements': 0,
                'chartInstances': 0,
                'echartsInstances': 0,
                'renderedEchartsInstances': 0,
                'svgElements': 0,
                'renderedSvgElements': 0,
                'd3Elements': 0,
                'renderedD3Elements': 0,
                'errors': [f"验证失败: {error}"],
                'contentVerified': True  # 验证失败时保守处理，假设已渲染
            }

    async def _force_chart_initialization(self, page: Page):
        """Enhanced chart initialization for Chart.js, ECharts, and D3.js"""
        logger.debug("🎨 强制初始化和触发图表渲染...")

        try:
            # 第一步：查找并重新执行图表相关脚本
            script_count = await page.evaluate('''() => {
                // 查找所有可能包含图表配置的script标签
                const scripts = document.querySelectorAll('script');
                const chartScripts = [];

                scripts.forEach(script => {
                    if (script.textContent && (
                        script.textContent.includes('Chart') ||
                        script.textContent.includes('chart') ||
                        script.textContent.includes('new Chart') ||
                        script.textContent.includes('echarts') ||
                        script.textContent.includes('d3') ||
                        script.textContent.includes('plotly') ||
                        script.textContent.includes('setOption') ||
                        script.textContent.includes('select(') ||
                        script.textContent.includes('append(')
                    )) {
                        chartScripts.push(script.textContent);
                    }
                });

                // 重新执行图表相关的脚本
                chartScripts.forEach((scriptContent, index) => {
                    try {
                        console.log(`重新执行图表脚本 ${index + 1}/${chartScripts.length}`);
                        eval(scriptContent);
                    } catch (e) {
                        console.warn(`图表脚本 ${index + 1} 执行失败:`, e.message);
                    }
                });

                return chartScripts.length;
            }''')

            logger.debug(f"🔄 重新执行了 {script_count} 个图表相关脚本")

            # 等待脚本执行
            await asyncio.sleep(0.5)

            # 第二步：强制触发图表渲染和更新
            chart_results = await page.evaluate('''() => {
                const results = {
                    chartJsProcessed: 0,
                    echartsProcessed: 0,
                    d3Processed: 0,
                    errors: []
                };

                // Chart.js 处理
                if (window.Chart && window.Chart.instances) {
                    Object.values(window.Chart.instances).forEach((chart, index) => {
                        try {
                            if (chart) {
                                // 禁用动画以加快渲染
                                if (chart.options) {
                                    if (chart.options.animation) {
                                        chart.options.animation.duration = 0;
                                        chart.options.animation.animateRotate = false;
                                        chart.options.animation.animateScale = false;
                                    }
                                    if (chart.options.plugins && chart.options.plugins.legend) {
                                        chart.options.plugins.legend.animation = false;
                                    }
                                }

                                // 强制渲染
                                if (typeof chart.render === 'function') {
                                    chart.render();
                                }

                                // 无动画更新
                                if (typeof chart.update === 'function') {
                                    chart.update('none');
                                }

                                // 强制重绘
                                if (typeof chart.draw === 'function') {
                                    chart.draw();
                                }

                                results.chartJsProcessed++;
                                console.log(`处理Chart.js图表 ${index + 1}`);
                            }
                        } catch (e) {
                            results.errors.push(`Chart.js图表 ${index + 1}: ${e.message}`);
                            console.warn(`Chart.js图表 ${index + 1} 处理失败:`, e.message);
                        }
                    });
                }

                // ECharts 处理
                if (window.echarts) {
                    const charts = [];
                    // 查找所有可能的ECharts容器
                    document.querySelectorAll('[id*="chart"], [class*="chart"], [class*="echarts"], [_echarts_instance_]').forEach(el => {
                        const instance = window.echarts.getInstanceByDom(el);
                        if (instance) {
                            charts.push({instance, element: el});
                        }
                    });

                    charts.forEach(({instance, element}, index) => {
                        try {
                            // 获取当前配置
                            const option = instance.getOption();

                            if (option) {
                                // 禁用动画
                                const newOption = JSON.parse(JSON.stringify(option));
                                newOption.animation = false;

                                if (newOption.series) {
                                    if (Array.isArray(newOption.series)) {
                                        newOption.series.forEach(s => {
                                            s.animation = false;
                                            s.animationDuration = 0;
                                        });
                                    } else {
                                        newOption.series.animation = false;
                                        newOption.series.animationDuration = 0;
                                    }
                                }

                                // 重新设置配置
                                instance.setOption(newOption, true);
                            }

                            // 强制调整大小
                            instance.resize();

                            // 强制重绘
                            if (typeof instance.refresh === 'function') {
                                instance.refresh();
                            }

                            results.echartsProcessed++;
                            console.log(`处理ECharts图表 ${index + 1}`);
                        } catch (e) {
                            results.errors.push(`ECharts图表 ${index + 1}: ${e.message}`);
                            console.warn(`ECharts图表 ${index + 1} 处理失败:`, e.message);
                        }
                    });
                }

                // D3.js 处理 - 触发重绘和更新
                if (window.d3) {
                    const svgElements = document.querySelectorAll('svg');
                    svgElements.forEach((svg, index) => {
                        try {
                            // 触发多种事件来确保D3图表重绘
                            const events = ['resize', 'load', 'DOMContentLoaded'];
                            events.forEach(eventType => {
                                const event = new Event(eventType);
                                svg.dispatchEvent(event);
                                if (svg.parentElement) {
                                    svg.parentElement.dispatchEvent(event);
                                }
                            });

                            // 强制重新计算SVG尺寸
                            const bbox = svg.getBBox();
                            if (bbox.width === 0 || bbox.height === 0) {
                                // 如果SVG没有内容，尝试触发重绘
                                svg.style.display = 'none';
                                svg.offsetHeight; // 强制重排
                                svg.style.display = '';
                            }

                            // 如果SVG有D3相关的类或属性，尝试调用D3的更新方法
                            if (svg.__data__ || svg.classList.contains('d3') || svg.getAttribute('class')?.includes('d3')) {
                                // 尝试触发D3的transition完成
                                if (window.d3.select) {
                                    const selection = window.d3.select(svg);
                                    if (selection.interrupt) {
                                        selection.interrupt();
                                    }
                                }
                            }

                            results.d3Processed++;
                            console.log(`处理D3.js SVG ${index + 1}`);
                        } catch (e) {
                            results.errors.push(`D3.js SVG ${index + 1}: ${e.message}`);
                            console.warn(`D3.js SVG ${index + 1} 处理失败:`, e.message);
                        }
                    });
                }

                // 通用处理：触发窗口事件
                try {
                    window.dispatchEvent(new Event('resize'));
                    window.dispatchEvent(new Event('load'));
                    window.dispatchEvent(new Event('DOMContentLoaded'));

                    // 强制重排和重绘
                    document.body.offsetHeight;

                    // 触发所有可能的图表容器的resize事件
                    document.querySelectorAll('[id*="chart"], [class*="chart"]').forEach(el => {
                        el.dispatchEvent(new Event('resize'));
                    });
                } catch (e) {
                    results.errors.push(`通用事件触发失败: ${e.message}`);
                }

                return results;
            }''')

            logger.debug(f"✅ 图表强制初始化完成: Chart.js:{chart_results['chartJsProcessed']}, ECharts:{chart_results['echartsProcessed']}, D3:{chart_results['d3Processed']}")

            if chart_results['errors']:
                logger.debug(f"⚠️ 初始化过程中的错误: {chart_results['errors']}")

        except Exception as error:
            logger.debug(f"⚠️ 图表强制初始化失败: {error}")

    async def _wait_for_fonts_and_resources(self, page: Page, max_wait_time: int = 8000):
        """等待所有字体和外部资源加载完成"""
        logger.debug("🔤 等待字体和外部资源加载...")

        start_time = time.time() * 1000

        try:
            # 等待字体加载完成
            await page.evaluate('''() => {
                return new Promise((resolve) => {
                    if (document.fonts && document.fonts.ready) {
                        document.fonts.ready.then(resolve);
                        // 超时保护
                        setTimeout(resolve, 5000);
                    } else {
                        // 如果不支持 document.fonts，等待一段时间
                        setTimeout(resolve, 2000);
                    }
                });
            }''')

            # 等待所有样式表加载完成
            await page.evaluate('''() => {
                return new Promise((resolve) => {
                    const stylesheets = Array.from(document.styleSheets);
                    let loadedCount = 0;

                    if (stylesheets.length === 0) {
                        resolve();
                        return;
                    }

                    const checkComplete = () => {
                        loadedCount++;
                        if (loadedCount === stylesheets.length) {
                            resolve();
                        }
                    };

                    stylesheets.forEach(sheet => {
                        try {
                            // 尝试访问样式表规则来确认加载完成
                            const rules = sheet.cssRules || sheet.rules;
                            checkComplete();
                        } catch (e) {
                            // 如果无法访问，可能还在加载中
                            if (sheet.ownerNode) {
                                sheet.ownerNode.onload = checkComplete;
                                sheet.ownerNode.onerror = checkComplete;
                            } else {
                                checkComplete();
                            }
                        }
                    });

                    // 超时保护
                    setTimeout(resolve, 3000);
                });
            }''')

            # 检查是否有延迟加载的内容
            await page.evaluate('''() => {
                // 触发所有可能的懒加载内容
                const lazyElements = document.querySelectorAll('[data-src], [loading="lazy"], .lazy');
                lazyElements.forEach(el => {
                    if (el.dataset.src) {
                        el.src = el.dataset.src;
                    }
                    // 滚动到元素位置触发懒加载
                    el.scrollIntoView();
                });

                // 强制重新计算所有元素的样式
                document.querySelectorAll('*').forEach(el => {
                    window.getComputedStyle(el).getPropertyValue('opacity');
                });
            }''')

            elapsed_time = time.time() * 1000 - start_time
            logger.debug(f"✅ 字体和资源加载完成，耗时: {elapsed_time:.0f}ms")

        except Exception as error:
            logger.debug(f"⚠️ 字体和资源等待过程中出错: {error}")

    async def _comprehensive_page_ready_check(self, page: Page) -> bool:
        """综合检查页面是否完全准备就绪"""
        logger.debug("🔍 执行综合页面就绪检查...")

        try:
            page_status = await page.evaluate('''() => {
                const status = {
                    domReady: document.readyState === 'complete',
                    fontsReady: false,
                    imagesLoaded: true,
                    scriptsLoaded: true,
                    stylesheetsLoaded: true,
                    chartsReady: true,
                    noActiveAnimations: true,
                    visibleContent: false,
                    errors: []
                };

                // 检查字体
                if (document.fonts && document.fonts.status) {
                    status.fontsReady = document.fonts.status === 'loaded';
                } else {
                    status.fontsReady = true; // 假设已加载
                }

                // 检查图片
                document.querySelectorAll('img').forEach((img, index) => {
                    if (!img.complete || img.naturalWidth === 0) {
                        status.imagesLoaded = false;
                        status.errors.push(`Image ${index} not loaded`);
                    }
                });

                // 检查脚本
                document.querySelectorAll('script[src]').forEach((script, index) => {
                    if (script.readyState && script.readyState !== 'complete' && script.readyState !== 'loaded') {
                        status.scriptsLoaded = false;
                        status.errors.push(`Script ${index} not loaded`);
                    }
                });

                // 检查样式表
                try {
                    Array.from(document.styleSheets).forEach((sheet, index) => {
                        try {
                            const rules = sheet.cssRules || sheet.rules;
                            // 如果能访问规则，说明已加载
                        } catch (e) {
                            status.stylesheetsLoaded = false;
                            status.errors.push(`Stylesheet ${index} not accessible`);
                        }
                    });
                } catch (e) {
                    status.errors.push(`Stylesheet check failed: ${e.message}`);
                }

                // 检查图表
                const canvasElements = document.querySelectorAll('canvas');
                const svgElements = document.querySelectorAll('svg');

                if (canvasElements.length > 0 || svgElements.length > 0) {
                    let renderedCount = 0;
                    let totalCount = canvasElements.length + svgElements.length;

                    // 检查canvas
                    canvasElements.forEach(canvas => {
                        try {
                            const ctx = canvas.getContext('2d');
                            if (ctx && canvas.width > 0 && canvas.height > 0) {
                                const imageData = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height));
                                for (let i = 3; i < imageData.data.length; i += 4) {
                                    if (imageData.data[i] > 0) {
                                        renderedCount++;
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            renderedCount++; // 保守处理
                        }
                    });

                    // 检查SVG
                    svgElements.forEach(svg => {
                        const graphicElements = svg.querySelectorAll('path, circle, rect, line, polygon, text');
                        if (graphicElements.length > 0) {
                            renderedCount++;
                        }
                    });

                    status.chartsReady = renderedCount >= totalCount * 0.8; // 至少80%渲染
                }

                // 检查动画
                const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"], .animate');
                status.noActiveAnimations = animatedElements.length === 0;

                // 检查可见内容
                const contentElements = document.querySelectorAll('body *');
                for (let el of contentElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        status.visibleContent = true;
                        break;
                    }
                }

                return status;
            }''')

            logger.debug(f"📊 页面状态: DOM:{page_status['domReady']}, 字体:{page_status['fontsReady']}, 图片:{page_status['imagesLoaded']}, 脚本:{page_status['scriptsLoaded']}, 样式:{page_status['stylesheetsLoaded']}, 图表:{page_status['chartsReady']}, 无动画:{page_status['noActiveAnimations']}, 可见内容:{page_status['visibleContent']}")

            if page_status['errors']:
                logger.debug(f"⚠️ 检查中发现问题: {page_status['errors'][:5]}")  # 只显示前5个错误

            # 判断页面是否完全就绪
            is_ready = (page_status['domReady'] and
                       page_status['fontsReady'] and
                       page_status['imagesLoaded'] and
                       page_status['scriptsLoaded'] and
                       page_status['stylesheetsLoaded'] and
                       page_status['chartsReady'] and
                       page_status['visibleContent'])

            if is_ready:
                logger.debug("✅ 页面完全就绪")
            else:
                logger.debug("⚠️ 页面尚未完全就绪，但将继续处理")

            return is_ready

        except Exception as error:
            logger.debug(f"⚠️ 页面就绪检查失败: {error}")
            return False

    async def _inject_pdf_styles(self, page: Page):
        """Inject CSS styles optimized for PDF generation"""
        pdf_styles = '''
            /* Comprehensive animation and transition disabling for PDF */
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                animation-iteration-count: 1 !important;
                animation-play-state: paused !important;
                transition-property: none !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                transform-origin: center center !important;
            }

            /* Disable CSS animations globally */
            @keyframes * {
                0%, 100% {
                    animation-play-state: paused !important;
                }
            }

            /* Ensure transforms are reset */
            .slide-container {
                transform: rotateY(0deg) rotateX(0deg) !important;
            }

            /* Ensure all elements are visible and properly positioned */
            .feature-card, .slide-content, .content-section {
                opacity: 1 !important;
                transform: translateY(0) translateX(0) scale(1) !important;
                visibility: visible !important;
            }

            /* Ensure charts and canvas elements are visible and properly sized */
            canvas, .chart-container, [id*="chart"], [class*="chart"] {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                position: relative !important;
                transform: none !important;
                animation: none !important;
                transition: none !important;
            }

            /* Force chart containers to maintain their dimensions */
            .chart-container {
                min-height: 300px !important;
                width: 100% !important;
            }

            /* Force 1280x720 landscape layout */
            html, body {
                width: 1280px !important;
                height: 720px !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            /* Ensure proper page breaks for slides */
            .slide-page {
                page-break-before: always !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                break-before: always !important;
                break-after: always !important;
                break-inside: avoid !important;
                display: block !important;
                width: 1280px !important;
                height: 720px !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }

            .slide-page:first-child {
                page-break-before: avoid !important;
                break-before: avoid !important;
            }

            .slide-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }

            /* Optimize for print */
            body {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            @media print {
                @page {
                    size: 338.67mm 190.5mm !important;
                    margin: 0 !important;
                }

                html, body {
                    width: 1280px !important;
                    height: 720px !important;
                }

                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
            }
        '''

        await page.add_style_tag(content=pdf_styles)

    async def _inject_javascript_optimizations(self, page: Page):
        """Enhanced JavaScript optimizations for Chart.js, ECharts, and D3.js"""
        # Pre-load optimizations
        await page.add_init_script('''() => {
            // Override animation-related functions globally
            window.requestAnimationFrame = function(callback) {
                return setTimeout(callback, 0);
            };

            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };

            // Disable jQuery animations if present
            if (window.jQuery) {
                window.jQuery.fx.off = true;
            }

            // Override Chart.js defaults before any charts are created
            if (typeof Chart !== 'undefined') {
                Chart.defaults.animation = false;
                Chart.defaults.responsive = true;
                Chart.defaults.maintainAspectRatio = false;
            }

            // Override ECharts animation settings
            if (typeof echarts !== 'undefined') {
                const originalInit = echarts.init;
                echarts.init = function(dom, theme, opts) {
                    const chart = originalInit.call(this, dom, theme, opts);
                    // Disable animations for all ECharts instances
                    const originalSetOption = chart.setOption;
                    chart.setOption = function(option, notMerge, lazyUpdate) {
                        if (option && typeof option === 'object') {
                            option.animation = false;
                            option.animationDuration = 0;
                            option.animationEasing = 'linear';
                            if (option.series) {
                                if (Array.isArray(option.series)) {
                                    option.series.forEach(s => {
                                        s.animation = false;
                                        s.animationDuration = 0;
                                    });
                                } else {
                                    option.series.animation = false;
                                    option.series.animationDuration = 0;
                                }
                            }
                            // 禁用各种动画效果
                            if (option.animationDurationUpdate) option.animationDurationUpdate = 0;
                            if (option.animationDelayUpdate) option.animationDelayUpdate = 0;
                        }
                        return originalSetOption.call(this, option, notMerge, lazyUpdate);
                    };
                    return chart;
                };
            }

            // Override D3.js transition settings
            if (typeof d3 !== 'undefined') {
                // Override transition creation
                const originalTransition = d3.transition;
                d3.transition = function() {
                    const t = originalTransition.apply(this, arguments);
                    if (t && typeof t.duration === 'function') {
                        return t.duration(0);
                    }
                    return t;
                };

                // Override selection.transition
                if (d3.selection && d3.selection.prototype.transition) {
                    const originalSelectionTransition = d3.selection.prototype.transition;
                    d3.selection.prototype.transition = function() {
                        const t = originalSelectionTransition.apply(this, arguments);
                        if (t && typeof t.duration === 'function') {
                            return t.duration(0);
                        }
                        return t;
                    };
                }
            }
        }''')

        # Post-load optimizations
        await page.evaluate('''() => {
            // Enhanced Chart.js animation disabling
            if (window.Chart) {
                // Set global Chart.js defaults
                if (window.Chart.defaults) {
                    if (window.Chart.defaults.global) {
                        window.Chart.defaults.global.animation = false;
                        window.Chart.defaults.global.responsive = true;
                        window.Chart.defaults.global.maintainAspectRatio = false;
                    }
                    if (window.Chart.defaults.animation) {
                        window.Chart.defaults.animation.duration = 0;
                        window.Chart.defaults.animation.animateRotate = false;
                        window.Chart.defaults.animation.animateScale = false;
                    }
                    if (window.Chart.defaults.plugins && window.Chart.defaults.plugins.legend) {
                        window.Chart.defaults.plugins.legend.animation = false;
                    }
                }

                // Disable animations for existing instances
                if (window.Chart.instances) {
                    Object.values(window.Chart.instances).forEach(chart => {
                        if (chart && chart.options) {
                            chart.options.animation = false;
                            if (chart.options.plugins && chart.options.plugins.legend) {
                                chart.options.plugins.legend.animation = false;
                            }
                        }
                    });
                }
            }

            // Enhanced ECharts animation disabling for existing instances
            if (window.echarts) {
                document.querySelectorAll('[_echarts_instance_], [id*="chart"], [class*="chart"], [class*="echarts"]').forEach(el => {
                    const instance = window.echarts.getInstanceByDom(el);
                    if (instance) {
                        try {
                            const option = instance.getOption();
                            if (option) {
                                // 深度禁用所有动画
                                const newOption = JSON.parse(JSON.stringify(option));
                                newOption.animation = false;
                                newOption.animationDuration = 0;
                                newOption.animationEasing = 'linear';
                                newOption.animationDurationUpdate = 0;
                                newOption.animationDelayUpdate = 0;

                                if (newOption.series) {
                                    if (Array.isArray(newOption.series)) {
                                        newOption.series.forEach(s => {
                                            s.animation = false;
                                            s.animationDuration = 0;
                                            s.animationDelay = 0;
                                        });
                                    } else {
                                        newOption.series.animation = false;
                                        newOption.series.animationDuration = 0;
                                        newOption.series.animationDelay = 0;
                                    }
                                }

                                // 禁用各个组件的动画
                                ['xAxis', 'yAxis', 'legend', 'tooltip', 'dataZoom'].forEach(component => {
                                    if (newOption[component]) {
                                        if (Array.isArray(newOption[component])) {
                                            newOption[component].forEach(c => c.animation = false);
                                        } else {
                                            newOption[component].animation = false;
                                        }
                                    }
                                });

                                instance.setOption(newOption, true);
                            }
                        } catch (e) {
                            console.warn('ECharts动画禁用失败:', e.message);
                        }
                    }
                });
            }

            // Enhanced D3.js transition disabling
            if (window.d3) {
                // Override existing transition methods
                if (d3.transition) {
                    const originalTransition = d3.transition;
                    d3.transition = function() {
                        const t = originalTransition.apply(this, arguments);
                        if (t && typeof t.duration === 'function') {
                            return t.duration(0);
                        }
                        return t;
                    };
                }

                // Override selection.transition for existing selections
                if (d3.selection && d3.selection.prototype.transition) {
                    const originalSelectionTransition = d3.selection.prototype.transition;
                    d3.selection.prototype.transition = function() {
                        const t = originalSelectionTransition.apply(this, arguments);
                        if (t && typeof t.duration === 'function') {
                            return t.duration(0);
                        }
                        return t;
                    };
                }

                // 中断所有正在进行的D3 transition
                try {
                    d3.selectAll('*').interrupt();
                } catch (e) {
                    console.warn('D3 transition中断失败:', e.message);
                }
            }

            // Override setTimeout and setInterval for faster execution
            const originalSetTimeout = window.setTimeout;
            const originalSetInterval = window.setInterval;

            window.setTimeout = function(callback, delay) {
                return originalSetTimeout(callback, Math.min(delay || 0, 10));
            };

            window.setInterval = function(callback, delay) {
                return originalSetInterval(callback, Math.min(delay || 0, 10));
            };

            // Force immediate execution of any pending animations
            if (window.getComputedStyle) {
                document.querySelectorAll('*').forEach(el => {
                    try {
                        window.getComputedStyle(el).getPropertyValue('transform');
                    } catch (e) {
                        // Ignore errors
                    }
                });
            }

            // 强制完成所有可能的异步渲染
            if (window.requestIdleCallback) {
                window.requestIdleCallback = function(callback) {
                    return setTimeout(callback, 0);
                };
            }
        }''')

    async def html_to_pdf(self, html_file_path: str, pdf_output_path: str,
                         options: Optional[Dict[str, Any]] = None) -> bool:
        """
        Convert HTML file to PDF using Pyppeteer
        Optimized for 16:9 PPT slides with complete style preservation
        """
        logger.info(f"🚀 Starting PDF conversion for: {html_file_path}")

        if not os.path.exists(html_file_path):
            logger.error(f"❌ Error: HTML file not found at {html_file_path}")
            return False

        if options is None:
            options = {}

        page = None
        try:
            # Get or create shared browser
            browser = await self._get_or_create_browser()
            page = await self.context.new_page()

            # Set viewport for 16:9 aspect ratio (1280x720)
            viewport_width = options.get('viewportWidth', 1280)
            viewport_height = options.get('viewportHeight', 720)
            await page.set_viewport_size({'width': viewport_width, 'height': viewport_height})

            # Navigate to the HTML file
            absolute_html_path = Path(html_file_path).resolve()
            logger.debug(f"📄 Navigating to: file://{absolute_html_path}")

            await page.goto(f"file://{absolute_html_path}",
                          wait_until='networkidle',  # 等待网络空闲，确保所有资源加载完成
                          timeout=60000)  # 增加超时时间以确保完整加载

            # 智能等待：根据页面复杂度动态调整等待时间
            page_complexity = await page.evaluate('''() => {
                const complexity = {
                    canvasCount: document.querySelectorAll('canvas').length,
                    svgCount: document.querySelectorAll('svg').length,
                    imageCount: document.querySelectorAll('img').length,
                    scriptCount: document.querySelectorAll('script').length,
                    stylesheetCount: document.styleSheets.length,
                    totalElements: document.querySelectorAll('*').length
                };

                // 计算复杂度分数
                let score = 0;
                score += complexity.canvasCount * 3;  // 图表权重高
                score += complexity.svgCount * 2;
                score += complexity.imageCount * 1;
                score += complexity.scriptCount * 1;
                score += complexity.stylesheetCount * 1;
                score += Math.floor(complexity.totalElements / 100);

                return {
                    ...complexity,
                    complexityScore: score
                };
            }''')

            # 根据复杂度调整等待时间
            base_wait = 1.0
            if page_complexity['complexityScore'] > 20:
                wait_time = base_wait + 1.5  # 复杂页面等待更久
            elif page_complexity['complexityScore'] > 10:
                wait_time = base_wait + 1.0
            elif page_complexity['complexityScore'] > 5:
                wait_time = base_wait + 0.5
            else:
                wait_time = base_wait

            logger.debug(f"📊 页面复杂度分析: 图表:{page_complexity['canvasCount']+page_complexity['svgCount']}, 图片:{page_complexity['imageCount']}, 总分:{page_complexity['complexityScore']}, 等待时间:{wait_time}s")
            await asyncio.sleep(wait_time)

            # 等待字体和外部资源加载完成
            await self._wait_for_fonts_and_resources(page)

            # Inject optimizations
            await self._inject_pdf_styles(page)
            await self._inject_javascript_optimizations(page)

            # Force chart initialization after page load
            await self._force_chart_initialization(page)

            # Enhanced waiting for Chart.js and dynamic content rendering
            await self._wait_for_charts_and_dynamic_content(page)

            # Perform final chart verification before PDF generation
            await self._perform_final_chart_verification(page)

            # 最终确认所有内容已准备就绪
            logger.debug("🔍 执行最终内容检查...")
            await page.evaluate('''() => {
                // 最后一次强制重排和重绘
                document.body.offsetHeight;

                // 确保所有图表容器都可见
                document.querySelectorAll('canvas, svg, [id*="chart"], [class*="chart"]').forEach(el => {
                    if (el.style.display === 'none') {
                        el.style.display = 'block';
                    }
                    if (el.style.visibility === 'hidden') {
                        el.style.visibility = 'visible';
                    }
                });

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                });
            }''')

            # 最终稳定等待
            await asyncio.sleep(0.5)

            # 执行最终的综合页面就绪检查
            await self._comprehensive_page_ready_check(page)

            # PDF generation options - optimized for 1280x720 landscape (16:9)
            pdf_options = {
                'path': pdf_output_path,
                'width': '338.67mm',  # 1280px at 96dpi = 338.67mm (landscape width)
                'height': '190.5mm',  # 720px at 96dpi = 190.5mm (landscape height)
                'print_background': True,  # Include background colors and images
                'landscape': False,  # Set to false since we're manually setting dimensions
                'margin': {
                    'top': '0mm',
                    'right': '0mm',
                    'bottom': '0mm',
                    'left': '0mm'
                },
                'prefer_css_page_size': False,  # Use our custom dimensions
                'display_header_footer': False,  # No header/footer
                'scale': 1  # No scaling
            }

            logger.debug(f"📑 Generating PDF with options: {pdf_options['width']} x {pdf_options['height']}")

            await page.pdf(**pdf_options)

            logger.info(f"✅ PDF generated successfully: {pdf_output_path}")
            return True

        except Exception as error:
            logger.error(f"❌ Error during PDF generation: {error}")
            return False
        finally:
            if page:
                await page.close()
                logger.debug("📄 Page closed.")

    async def html_to_pdf_with_browser(self, browser: Browser, html_file_path: str,
                                     pdf_output_path: str, options: Optional[Dict[str, Any]] = None) -> bool:
        """
        Convert HTML file to PDF using an existing browser instance
        More efficient for batch processing
        """
        logger.info(f"🚀 Converting with shared browser: {html_file_path}")

        if not os.path.exists(html_file_path):
            logger.error(f"❌ Error: HTML file not found at {html_file_path}")
            return False

        if options is None:
            options = {}

        page = None
        try:
            # Create a new context for this conversion to ensure isolation
            context = await browser.new_context(
                viewport={'width': options.get('viewportWidth', 1280),
                         'height': options.get('viewportHeight', 720)},
                device_scale_factor=2,
                ignore_https_errors=True
            )
            page = await context.new_page()

            # Navigate to the HTML file with comprehensive loading strategy
            absolute_html_path = Path(html_file_path).resolve()
            await page.goto(f"file://{absolute_html_path}",
                          wait_until='networkidle',  # 等待网络空闲，确保所有资源加载完成
                          timeout=60000)  # 适当的超时时间

            # 批处理中也需要额外等待确保内容完全加载
            await asyncio.sleep(0.8)

            # 等待字体和外部资源加载完成（批处理版本，时间稍短）
            await self._wait_for_fonts_and_resources(page, max_wait_time=50000)

            # Force chart initialization after page load
            await self._force_chart_initialization(page)

            # Enhanced waiting for Chart.js and dynamic content rendering
            await self._wait_for_charts_and_dynamic_content(page, max_wait_time=120000)

            # Enhanced CSS injection for batch processing
            await page.add_style_tag(content='''
                    /* Comprehensive animation and transition disabling for PDF */
                    *, *::before, *::after {
                        animation-duration: 0s !important;
                        animation-delay: 0s !important;
                        animation-iteration-count: 1 !important;
                        animation-play-state: paused !important;
                        transition-property: none !important;
                        transition-duration: 0s !important;
                        transition-delay: 0s !important;
                        transform-origin: center center !important;
                    }

                    /* Disable CSS animations globally */
                    @keyframes * {
                        0%, 100% {
                            animation-play-state: paused !important;
                        }
                    }

                    /* Ensure charts and canvas elements are visible */
                    canvas, .chart-container, [id*="chart"], [class*="chart"] {
                        opacity: 1 !important;
                        visibility: visible !important;
                        display: block !important;
                        position: relative !important;
                        transform: none !important;
                        animation: none !important;
                        transition: none !important;
                    }

                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                ''')

            # Inject JavaScript optimizations for batch processing
            await page.evaluate('''() => {
                // Force disable Chart.js animations
                if (window.Chart && window.Chart.defaults) {
                    if (window.Chart.defaults.global) {
                        window.Chart.defaults.global.animation = false;
                    }
                    if (window.Chart.defaults.animation) {
                        window.Chart.defaults.animation.duration = 0;
                    }
                }
            }''')

            # Perform final chart verification before PDF generation
            await self._perform_final_chart_verification(page)

            # 批处理中的最终页面就绪检查
            await self._comprehensive_page_ready_check(page)

            # PDF generation options - 1280x720 landscape (16:9)
            pdf_options = {
                'path': pdf_output_path,
                'width': '338.67mm',  # 1280px at 96dpi = 338.67mm (landscape width)
                'height': '190.5mm',  # 720px at 96dpi = 190.5mm (landscape height)
                'print_background': True,
                'landscape': False,  # Set to false since we're manually setting dimensions
                'margin': {
                    'top': '0mm',
                    'right': '0mm',
                    'bottom': '0mm',
                    'left': '0mm'
                },
                'prefer_css_page_size': False,  # Use our custom dimensions
                'display_header_footer': False,
                'scale': 1
            }

            await page.pdf(**pdf_options)
            logger.info(f"✅ PDF generated: {pdf_output_path}")
            return True

        except Exception as error:
            logger.error(f"❌ Error converting {html_file_path}: {error}")
            return False
        finally:
            if page:
                await page.close()
            if 'context' in locals():
                await context.close()

    async def convert_multiple_html_to_pdf(self, html_files: List[str], output_dir: str,
                                         merged_pdf_path: Optional[str] = None) -> List[str]:
        """
        Convert multiple HTML files to PDFs and optionally merge them
        Optimized version with shared browser instance and parallel processing
        """
        logger.info(f"🚀 Starting batch PDF conversion for {len(html_files)} files")

        pdf_files = []
        browser = None

        try:
            # Launch browser once for all conversions with enhanced chart rendering support
            browser = await self._launch_browser()

            # Process files in smaller batches to avoid memory issues
            # Adjust batch size based on total number of files
            batch_size = 3 if len(html_files) > 20 else 4 if len(html_files) > 10 else 5

            for i in range(0, len(html_files), batch_size):
                batch = html_files[i:i + batch_size]
                batch_num = i // batch_size + 1
                total_batches = (len(html_files) + batch_size - 1) // batch_size
                logger.info(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} files)")

                # Process batch with retry mechanism
                batch_results = []
                for batch_index, html_file in enumerate(batch):
                    global_index = i + batch_index
                    base_name = Path(html_file).stem
                    pdf_file = os.path.join(output_dir, f"{base_name}.pdf")

                    logger.info(f"📄 Converting {global_index + 1}/{len(html_files)}: {html_file}")

                    # Try conversion with retry mechanism
                    success = False
                    retry_count = 0
                    max_retries = 5

                    while not success and retry_count <= max_retries:
                        if retry_count > 0:
                            logger.info(f"🔄 Retry {retry_count}/{max_retries} for: {html_file}")
                            # Wait a bit before retry
                            await asyncio.sleep(2)

                        success = await self.html_to_pdf_with_browser(browser, html_file, pdf_file)
                        retry_count += 1

                    if success:
                        batch_results.append(pdf_file)
                    else:
                        logger.error(f"❌ Failed to convert after {max_retries} retries: {html_file}")

                pdf_files.extend(batch_results)

                # Small delay between batches to prevent overwhelming the system
                if i + batch_size < len(html_files):
                    logger.info("💾 Memory cleanup between batches...")
                    await asyncio.sleep(2)

            logger.info(f"✅ Batch conversion completed. Generated {len(pdf_files)} PDF files.")

            # If merging is requested and we have PDFs
            if merged_pdf_path and len(pdf_files) > 0:
                if len(pdf_files) == 1:
                    # For single PDF, just copy it to the merged path
                    logger.info("📄 Single PDF detected, copying to merged path...")
                    try:
                        from ..utils.thread_pool import run_blocking_io
                        import shutil
                        await run_blocking_io(shutil.copy2, pdf_files[0], merged_pdf_path)
                        logger.info(f"✅ Single PDF copied to: {merged_pdf_path}")
                    except Exception as e:
                        logger.error(f"❌ Failed to copy single PDF: {e}")
                        return pdf_files
                else:
                    # For multiple PDFs, merge them
                    logger.info("🔗 Merging multiple PDFs...")
                    merge_success = await self.merge_pdfs(pdf_files, merged_pdf_path)
                    if merge_success:
                        logger.info(f"✅ Merged PDF created: {merged_pdf_path}")

            return pdf_files

        except Exception as error:
            logger.error(f"❌ Error during batch PDF conversion: {error}")
            return []
        finally:
            if browser:
                await browser.close()
                logger.debug("🔒 Shared browser closed.")

    def _merge_pdfs_sync(self, pdf_files: List[str], output_path: str) -> bool:
        """Synchronous PDF merging function to be run in thread pool"""
        try:
            # Try to use PyPDF2 first
            try:
                from PyPDF2 import PdfMerger

                merger = PdfMerger()

                for pdf_file in pdf_files:
                    if os.path.exists(pdf_file):
                        merger.append(pdf_file)

                with open(output_path, 'wb') as output_file:
                    merger.write(output_file)

                merger.close()
                return True

            except ImportError:
                # Fallback to pypdf
                from pypdf import PdfMerger

                merger = PdfMerger()

                for pdf_file in pdf_files:
                    if os.path.exists(pdf_file):
                        merger.append(pdf_file)

                with open(output_path, 'wb') as output_file:
                    merger.write(output_file)

                merger.close()
                return True

        except Exception as error:
            logger.error(f"❌ Error merging PDFs: {error}")
            logger.info("💡 Tip: Install PyPDF2 for PDF merging: pip install PyPDF2")
            return False

    async def merge_pdfs(self, pdf_files: List[str], output_path: str) -> bool:
        """Merge multiple PDF files into one using thread pool to avoid blocking"""
        from ..utils.thread_pool import run_blocking_io
        return await run_blocking_io(self._merge_pdfs_sync, pdf_files, output_path)

    async def close(self):
        """Close the browser if it's still open"""
        async with self._browser_lock:
            if self.context:
                await self.context.close()
                self.context = None
            if self.browser:
                await self.browser.close()
                self.browser = None
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
                logger.debug("🔒 Shared browser and Playwright closed.")

    async def screenshot_html(
        self,
        html_file_path: str,
        screenshot_path: str,
        width: int = 1280,
        height: int = 720,
        wait_for_stable: bool = True,
        stability_checks: int = 3,
        stability_interval: float = 0.75,
    ) -> bool:
        """
        Take a high-quality screenshot of an HTML file using Playwright

        Args:
            html_file_path: Path to HTML file
            screenshot_path: Output path for screenshot
            width: Screenshot width in pixels
            height: Screenshot height in pixels

        Returns:
            True if successful, False otherwise
        """
        logger.info(f"📸 Taking screenshot: {html_file_path} -> {screenshot_path}")

        if not os.path.exists(html_file_path):
            logger.error(f"❌ HTML file not found: {html_file_path}")
            return False

        page = None
        try:
            # Get or create browser
            browser = await self._get_or_create_browser()
            page = await self.context.new_page()

            # Set viewport
            await page.set_viewport_size({'width': width, 'height': height})

            # Navigate to HTML file
            absolute_html_path = Path(html_file_path).resolve()
            await page.goto(f"file://{absolute_html_path}",
                          wait_until='networkidle',
                          timeout=60000)

            # Wait for content to be ready (similar to PDF generation)
            await asyncio.sleep(0.75)

            # Wait for fonts and resources
            await self._wait_for_fonts_and_resources(page, max_wait_time=30000)

            # Force chart initialization
            await self._force_chart_initialization(page)

            # Wait for charts and dynamic content
            await self._wait_for_charts_and_dynamic_content(page, max_wait_time=60000)

            if wait_for_stable:
                last_snapshot = None
                stable_count = 0

                while stable_count < stability_checks:
                    layout_snapshot = await page.evaluate(
                        "document.body ? document.body.innerHTML : ''"
                    )

                    if last_snapshot is not None and layout_snapshot == last_snapshot:
                        stable_count += 1
                    else:
                        stable_count = 1
                        last_snapshot = layout_snapshot

                    if stable_count < stability_checks:
                        await asyncio.sleep(stability_interval)

            # Take screenshot
            await page.screenshot(
                path=screenshot_path,
                type='png',
                full_page=False,
                clip={'x': 0, 'y': 0, 'width': width, 'height': height}
            )

            logger.info(f"✅ Screenshot saved: {screenshot_path}")
            return True

        except Exception as e:
            logger.error(f"❌ Screenshot failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if page:
                try:
                    await page.close()
                except Exception:  # noqa: BLE001
                    logger.debug("Page already closed or closing failed, ignoring.")


# Global converter instance
_pdf_converter = None


def get_pdf_converter() -> PlaywrightPDFConverter:
    """Get the global PDF converter instance"""
    global _pdf_converter
    if _pdf_converter is None:
        _pdf_converter = PlaywrightPDFConverter()
    return _pdf_converter


async def convert_html_to_pdf(html_file_path: str, pdf_output_path: str,
                            options: Optional[Dict[str, Any]] = None) -> bool:
    """Convenience function for single HTML to PDF conversion"""
    converter = get_pdf_converter()
    return await converter.html_to_pdf(html_file_path, pdf_output_path, options)


async def convert_multiple_html_to_pdf(html_files: List[str], output_dir: str,
                                     merged_pdf_path: Optional[str] = None) -> List[str]:
    """Convenience function for batch HTML to PDF conversion"""
    converter = get_pdf_converter()
    return await converter.convert_multiple_html_to_pdf(html_files, output_dir, merged_pdf_path)
