"""
后台任务管理器
用于处理耗时的异步任务，如PDF转PPTX转换
"""

import asyncio
import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Any, Callable
from dataclasses import dataclass, field
import traceback

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class BackgroundTask:
    """后台任务"""
    task_id: str
    task_type: str
    status: TaskStatus = TaskStatus.PENDING
    progress: float = 0.0
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


class BackgroundTaskManager:
    """后台任务管理器"""

    def __init__(self):
        self.tasks: Dict[str, BackgroundTask] = {}
        self.running_tasks: Dict[str, asyncio.Task] = {}

    def create_task(self, task_type: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """创建新任务

        Args:
            task_type: 任务类型
            metadata: 任务元数据

        Returns:
            任务ID
        """
        task_id = str(uuid.uuid4())
        task = BackgroundTask(
            task_id=task_id,
            task_type=task_type,
            metadata=metadata or {}
        )
        self.tasks[task_id] = task
        logger.info(f"创建后台任务: {task_id} (类型: {task_type})")
        return task_id

    def get_task(self, task_id: str) -> Optional[BackgroundTask]:
        """获取任务信息"""
        return self.tasks.get(task_id)

    def update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        progress: Optional[float] = None,
        result: Optional[Any] = None,
        error: Optional[str] = None
    ):
        """更新任务状态"""
        if task_id not in self.tasks:
            logger.warning(f"任务不存在: {task_id}")
            return

        task = self.tasks[task_id]
        task.status = status
        task.updated_at = datetime.now()

        if progress is not None:
            task.progress = progress
        if result is not None:
            task.result = result
        if error is not None:
            task.error = error

        logger.info(f"任务状态更新: {task_id} -> {status} (进度: {task.progress}%)")

    async def execute_task(
        self,
        task_id: str,
        func: Callable,
        *args,
        **kwargs
    ):
        """执行任务

        Args:
            task_id: 任务ID
            func: 要执行的函数（可以是同步或异步）
            *args: 函数参数
            **kwargs: 函数关键字参数
        """
        try:
            self.update_task_status(task_id, TaskStatus.RUNNING, progress=0.0)

            # 检查函数是否是协程
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                # 同步函数，在线程池中执行
                from ..utils.thread_pool import run_blocking_io
                result = await run_blocking_io(func, *args, **kwargs)

            self.update_task_status(
                task_id,
                TaskStatus.COMPLETED,
                progress=100.0,
                result=result
            )

        except asyncio.CancelledError:
            self.update_task_status(
                task_id,
                TaskStatus.CANCELLED,
                error="任务被取消"
            )
            logger.info(f"任务被取消: {task_id}")

        except Exception as e:
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            self.update_task_status(
                task_id,
                TaskStatus.FAILED,
                error=error_msg
            )
            logger.error(f"任务执行失败: {task_id}\n{error_msg}")

        finally:
            # 清理运行中的任务引用
            if task_id in self.running_tasks:
                del self.running_tasks[task_id]

    def submit_task(
        self,
        task_type: str,
        func: Callable,
        *args,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """提交任务到后台执行

        Args:
            task_type: 任务类型
            func: 要执行的函数
            *args: 函数参数
            metadata: 任务元数据
            **kwargs: 函数关键字参数

        Returns:
            任务ID
        """
        # 创建任务
        task_id = self.create_task(task_type, metadata)

        # 创建异步任务并开始执行
        async_task = asyncio.create_task(
            self.execute_task(task_id, func, *args, **kwargs)
        )
        self.running_tasks[task_id] = async_task

        logger.info(f"提交后台任务: {task_id}")
        return task_id

    def cancel_task(self, task_id: str) -> bool:
        """取消任务

        Args:
            task_id: 任务ID

        Returns:
            是否成功取消
        """
        if task_id in self.running_tasks:
            self.running_tasks[task_id].cancel()
            logger.info(f"取消任务: {task_id}")
            return True
        return False

    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """清理旧任务

        Args:
            max_age_hours: 任务保留时间（小时）
        """
        from datetime import timedelta
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)

        tasks_to_remove = [
            task_id for task_id, task in self.tasks.items()
            if task.updated_at < cutoff_time and task.status in [
                TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED
            ]
        ]

        for task_id in tasks_to_remove:
            del self.tasks[task_id]

        if tasks_to_remove:
            logger.info(f"清理了 {len(tasks_to_remove)} 个过期任务")

    def get_task_stats(self) -> Dict[str, int]:
        """获取任务统计信息"""
        stats = {
            "total": len(self.tasks),
            "pending": 0,
            "running": 0,
            "completed": 0,
            "failed": 0,
            "cancelled": 0
        }

        for task in self.tasks.values():
            stats[task.status.value] += 1

        return stats


# 全局任务管理器实例
_task_manager = None

def get_task_manager() -> BackgroundTaskManager:
    """获取全局任务管理器实例"""
    global _task_manager
    if _task_manager is None:
        _task_manager = BackgroundTaskManager()
    return _task_manager
