"""
线程池工具类，用于将阻塞操作放入线程池中执行
"""

import asyncio
import concurrent.futures
import functools
import logging
import os
from typing import Any, Callable, TypeVar, Coroutine, Optional, Dict

# 类型变量
T = TypeVar('T')
R = TypeVar('R')

logger = logging.getLogger(__name__)

class ThreadPoolManager:
    """线程池管理器，提供全局线程池和辅助方法"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ThreadPoolManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self, max_workers: Optional[int] = None):
        """初始化线程池管理器
        
        Args:
            max_workers: 最大工作线程数，默认为 None（使用 CPU 核心数 * 5）
        """
        if not self._initialized:
            # 如果未指定最大工作线程数，则使用 CPU 核心数 * 5
            if max_workers is None:
                max_workers = os.cpu_count() * 5 if os.cpu_count() else 20
            
            self.executor = concurrent.futures.ThreadPoolExecutor(
                max_workers=max_workers,
                thread_name_prefix="landppt_worker"
            )
            
            # 统计信息
            self.stats = {
                "total_tasks": 0,
                "completed_tasks": 0,
                "failed_tasks": 0,
                "active_tasks": 0
            }
            
            self._initialized = True
            logger.info(f"线程池初始化完成，最大工作线程数: {max_workers}")
    
    async def run_in_thread(self, func: Callable[..., T], *args, **kwargs) -> T:
        """在线程池中运行同步函数
        
        Args:
            func: 要运行的同步函数
            *args: 传递给函数的位置参数
            **kwargs: 传递给函数的关键字参数
            
        Returns:
            函数的返回值
            
        Raises:
            Exception: 如果函数执行失败，则抛出异常
        """
        self.stats["total_tasks"] += 1
        self.stats["active_tasks"] += 1
        
        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                self.executor,
                functools.partial(func, *args, **kwargs)
            )
            
            self.stats["completed_tasks"] += 1
            return result
        except Exception as e:
            self.stats["failed_tasks"] += 1
            logger.error(f"线程池任务执行失败: {e}")
            raise
        finally:
            self.stats["active_tasks"] -= 1
    
    def get_stats(self) -> Dict[str, int]:
        """获取线程池统计信息"""
        return self.stats.copy()
    
    def shutdown(self, wait: bool = True):
        """关闭线程池
        
        Args:
            wait: 是否等待所有线程完成
        """
        if self._initialized:
            self.executor.shutdown(wait=wait)
            self._initialized = False
            logger.info("线程池已关闭")


# 全局线程池实例
thread_pool = ThreadPoolManager()


async def run_blocking_io(func: Callable[..., T], *args, **kwargs) -> T:
    """运行阻塞的 I/O 操作
    
    这是一个便捷函数，用于将阻塞的 I/O 操作放入线程池中执行
    
    Args:
        func: 要运行的阻塞函数
        *args: 传递给函数的位置参数
        **kwargs: 传递给函数的关键字参数
        
    Returns:
        函数的返回值
    """
    return await thread_pool.run_in_thread(func, *args, **kwargs)


def to_thread(func: Callable[..., T]) -> Callable[..., Coroutine[Any, Any, T]]:
    """装饰器：将同步函数转换为在线程池中运行的异步函数
    
    用法:
        @to_thread
        def blocking_function(arg1, arg2):
            # 执行阻塞操作
            return result
            
        # 调用
        result = await blocking_function(arg1, arg2)
    
    Args:
        func: 要装饰的同步函数
        
    Returns:
        异步包装函数
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        return await thread_pool.run_in_thread(func, *args, **kwargs)
    return wrapper
