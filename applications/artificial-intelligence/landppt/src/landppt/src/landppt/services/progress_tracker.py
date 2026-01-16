"""
Progress Tracker for Speech Script Generation
"""

import time
import threading
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class ProgressInfo:
    """Progress information for speech script generation"""
    task_id: str
    project_id: str
    total_slides: int
    completed_slides: int
    failed_slides: int
    skipped_slides: int
    current_slide: Optional[int] = None
    current_slide_title: Optional[str] = None
    status: str = "running"  # running, completed, failed
    message: str = ""
    start_time: float = 0
    last_update: float = 0
    error_details: list = None
    
    def __post_init__(self):
        if self.start_time == 0:
            self.start_time = time.time()
        self.last_update = time.time()
        if self.error_details is None:
            self.error_details = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Add computed properties
        data['progress_percentage'] = self.progress_percentage
        data['elapsed_time'] = self.elapsed_time
        return data
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage"""
        if self.total_slides == 0:
            return 0
        return (self.completed_slides / self.total_slides) * 100
    
    @property
    def elapsed_time(self) -> float:
        """Get elapsed time in seconds"""
        return time.time() - self.start_time


class ProgressTracker:
    """Thread-safe progress tracker for speech script generation"""
    
    def __init__(self):
        self._progress_data: Dict[str, ProgressInfo] = {}
        self._lock = threading.Lock()
    
    def create_task(self, task_id: str, project_id: str, total_slides: int) -> ProgressInfo:
        """Create a new progress tracking task"""
        with self._lock:
            progress = ProgressInfo(
                task_id=task_id,
                project_id=project_id,
                total_slides=total_slides,
                completed_slides=0,
                failed_slides=0,
                skipped_slides=0,
                status="running",
                message="开始生成演讲稿..."
            )
            self._progress_data[task_id] = progress
            return progress
    
    def update_progress(self, task_id: str, **kwargs) -> Optional[ProgressInfo]:
        """Update progress for a task"""
        with self._lock:
            if task_id not in self._progress_data:
                return None
            
            progress = self._progress_data[task_id]
            
            # Update fields
            for key, value in kwargs.items():
                if hasattr(progress, key):
                    setattr(progress, key, value)
            
            progress.last_update = time.time()
            return progress
    
    def get_progress(self, task_id: str) -> Optional[ProgressInfo]:
        """Get progress for a task"""
        with self._lock:
            return self._progress_data.get(task_id)
    
    def complete_task(self, task_id: str, message: str = "生成完成") -> Optional[ProgressInfo]:
        """Mark task as completed"""
        return self.update_progress(
            task_id,
            status="completed",
            message=message
        )
    
    def fail_task(self, task_id: str, error_message: str) -> Optional[ProgressInfo]:
        """Mark task as failed"""
        return self.update_progress(
            task_id,
            status="failed",
            message=f"生成失败: {error_message}"
        )
    
    def add_slide_completed(self, task_id: str, slide_index: int, slide_title: str) -> Optional[ProgressInfo]:
        """Mark a slide as completed"""
        with self._lock:
            if task_id not in self._progress_data:
                return None
            
            progress = self._progress_data[task_id]
            progress.completed_slides += 1
            progress.current_slide = slide_index
            progress.current_slide_title = slide_title
            progress.message = f"已完成第{slide_index + 1}页: {slide_title}"
            progress.last_update = time.time()
            
            return progress
    
    def add_slide_failed(self, task_id: str, slide_index: int, slide_title: str, error: str) -> Optional[ProgressInfo]:
        """Mark a slide as failed"""
        with self._lock:
            if task_id not in self._progress_data:
                return None
            
            progress = self._progress_data[task_id]
            progress.failed_slides += 1
            progress.current_slide = slide_index
            progress.current_slide_title = slide_title
            progress.message = f"第{slide_index + 1}页生成失败: {slide_title}"
            progress.error_details.append({
                'slide_index': slide_index,
                'slide_title': slide_title,
                'error': error
            })
            progress.last_update = time.time()
            
            return progress
    
    def add_slide_skipped(self, task_id: str, slide_index: int, slide_title: str, reason: str) -> Optional[ProgressInfo]:
        """Mark a slide as skipped"""
        with self._lock:
            if task_id not in self._progress_data:
                return None
            
            progress = self._progress_data[task_id]
            progress.skipped_slides += 1
            progress.current_slide = slide_index
            progress.current_slide_title = slide_title
            progress.message = f"第{slide_index + 1}页已跳过: {slide_title}"
            progress.last_update = time.time()
            
            return progress
    
    def cleanup_old_tasks(self, max_age_seconds: int = 3600):
        """Clean up old completed/failed tasks"""
        current_time = time.time()
        with self._lock:
            to_remove = []
            for task_id, progress in self._progress_data.items():
                if (progress.status in ["completed", "failed"] and 
                    current_time - progress.last_update > max_age_seconds):
                    to_remove.append(task_id)
            
            for task_id in to_remove:
                del self._progress_data[task_id]
    
    def remove_task(self, task_id: str) -> bool:
        """Remove a specific task"""
        with self._lock:
            if task_id in self._progress_data:
                del self._progress_data[task_id]
                return True
            return False


# Global progress tracker instance
progress_tracker = ProgressTracker()
