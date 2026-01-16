"""
工作流管理器 - 定义和管理LangGraph工作流
"""

from typing import Dict, Any, Optional, Callable, AsyncGenerator, TYPE_CHECKING
import logging
from langgraph.graph import END, START, StateGraph

if TYPE_CHECKING:
    from langgraph.graph.state import CompiledStateGraph

from ..core.models import PPTState
from ..generators.chains import ChainManager
from .nodes import GraphNodes
from ..utils.logger import LoggerMixin

logger = logging.getLogger(__name__)


class WorkflowManager(LoggerMixin):
    """工作流管理器，负责构建和执行LangGraph工作流"""

    def __init__(self, chain_manager: ChainManager, config=None):
        self.chain_manager = chain_manager
        self.config = config
        self.nodes = GraphNodes(chain_manager, config)
        self.app: Optional["CompiledStateGraph"] = None
        self._setup_graph()
    
    def _setup_graph(self):
        """设置LangGraph工作流"""
        self.logger.info("正在设置LangGraph工作流...")
        
        # 创建状态图
        graph = StateGraph(PPTState)
        
        # 添加节点
        graph.add_node("analyze_structure", self.nodes.analyze_structure)
        graph.add_node("generate_initial_outline", self.nodes.generate_initial_outline)
        graph.add_node("refine_outline", self.nodes.refine_outline)
        
        # 定义边
        graph.add_edge(START, "analyze_structure")
        graph.add_edge("analyze_structure", "generate_initial_outline")
        graph.add_conditional_edges(
            "generate_initial_outline",
            self.nodes.should_continue_refining,
            {
                "refine_outline": "refine_outline",
                "end": END
            }
        )
        graph.add_conditional_edges(
            "refine_outline",
            self.nodes.should_continue_refining,
            {
                "refine_outline": "refine_outline",
                "end": END
            }
        )
        
        # 编译图
        self.app = graph.compile()

        # 计算递归限制
        if self.config and hasattr(self.config, 'recursion_limit') and self.config.recursion_limit is not None:
            # 使用用户配置的递归限制
            self.recursion_limit = self.config.recursion_limit
        elif self.config and hasattr(self.config, 'max_slides'):
            # 基于最大页数自动计算递归限制
            # 每个文档块可能需要1-2次递归，加上初始化和最终化步骤
            self.recursion_limit = max(100, self.config.max_slides * 3 + 50)
        else:
            # 默认递归限制
            self.recursion_limit = 100

        self.logger.info(f"LangGraph工作流设置完成，递归限制: {self.recursion_limit}")
    
    async def execute_workflow(
        self,
        initial_state: PPTState,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> Dict[str, Any]:
        """
        执行完整的工作流
        
        Args:
            initial_state: 初始状态
            progress_callback: 进度回调函数
            
        Returns:
            最终状态
        """
        if not self.app:
            raise RuntimeError("工作流未初始化")
        
        self.logger.info("开始执行PPT生成工作流...")
        
        try:
            final_state = None
            step_count = 0
            total_chunks = len(initial_state["document_chunks"])
            
            # 估算总步数：结构分析(1) + 初始大纲(1) + 细化(chunks)
            estimated_steps = 2 + total_chunks
            
            # 创建运行配置
            run_config = {"recursion_limit": self.recursion_limit}

            async for step in self.app.astream(initial_state, config=run_config, stream_mode="values"):
                final_state = step
                step_count += 1
                
                # 计算进度
                progress = min((step_count / estimated_steps) * 100, 95)  # 最多95%，留5%给最终处理
                
                # 确定当前步骤名称
                current_step = self._get_current_step_name(step, step_count)
                
                # 调用进度回调
                if progress_callback:
                    progress_callback(current_step, progress)
                
                self.logger.debug(f"工作流步骤 {step_count}: {current_step} (进度: {progress:.1f}%)")
            
            # 最终进度
            if progress_callback:
                progress_callback("处理完成", 100.0)
            
            self.logger.info("PPT生成工作流执行完成")
            return final_state
            
        except Exception as e:
            self.logger.error(f"工作流执行失败: {e}")
            raise
    
    def _get_current_step_name(self, state: Dict[str, Any], step_count: int) -> str:
        """根据状态确定当前步骤名称"""
        if "document_structure" in state and step_count == 1:
            return "分析文档结构"
        elif "ppt_title" in state and "slides" in state:
            current_index = state.get("current_index", 0)
            total_chunks = len(state.get("document_chunks", []))
            
            if current_index == 1:
                return "生成初始框架"
            elif current_index <= total_chunks:
                return f"细化内容 ({current_index}/{total_chunks})"
            else:
                return "处理中"
        else:
            return f"处理中 (步骤 {step_count})"
    
    async def execute_step_by_step(
        self,
        initial_state: PPTState
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        逐步执行工作流，返回每个步骤的结果
        
        Args:
            initial_state: 初始状态
            
        Yields:
            每个步骤的状态
        """
        if not self.app:
            raise RuntimeError("工作流未初始化")
        
        self.logger.info("开始逐步执行PPT生成工作流...")

        # 创建运行配置
        run_config = {"recursion_limit": self.recursion_limit}

        async for step in self.app.astream(initial_state, config=run_config, stream_mode="values"):
            yield step
    
    def get_workflow_info(self) -> Dict[str, Any]:
        """获取工作流信息"""
        if not self.app:
            return {"status": "未初始化"}
        
        return {
            "status": "已初始化",
            "nodes": ["analyze_structure", "generate_initial_outline", "refine_outline"],
            "description": "基于LangGraph的PPT大纲生成工作流"
        }
    
    def reset_workflow(self):
        """重置工作流"""
        self.logger.info("重置工作流...")
        self._setup_graph()
    
    def update_chain_manager(self, chain_manager: ChainManager):
        """更新链管理器并重新设置工作流"""
        self.logger.info("更新链管理器...")
        self.chain_manager = chain_manager
        self.nodes = GraphNodes(chain_manager, self.config)
        self._setup_graph()


class WorkflowExecutor:
    """工作流执行器，提供高级执行接口"""
    
    def __init__(self, workflow_manager: WorkflowManager):
        self.workflow_manager = workflow_manager
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def execute_with_monitoring(
        self,
        initial_state: PPTState,
        progress_callback: Optional[Callable[[str, float], None]] = None,
        error_callback: Optional[Callable[[Exception], None]] = None
    ) -> Dict[str, Any]:
        """
        带监控的工作流执行
        
        Args:
            initial_state: 初始状态
            progress_callback: 进度回调
            error_callback: 错误回调
            
        Returns:
            最终状态
        """
        try:
            return await self.workflow_manager.execute_workflow(
                initial_state, 
                progress_callback
            )
        except Exception as e:
            self.logger.error(f"工作流执行出错: {e}")
            if error_callback:
                error_callback(e)
            raise
    
    async def execute_with_checkpoints(
        self,
        initial_state: PPTState,
        checkpoint_callback: Optional[Callable[[str, Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        带检查点的工作流执行
        
        Args:
            initial_state: 初始状态
            checkpoint_callback: 检查点回调
            
        Returns:
            最终状态
        """
        final_state = None
        
        async for state in self.workflow_manager.execute_step_by_step(initial_state):
            final_state = state
            
            # 确定检查点名称
            checkpoint_name = self._get_checkpoint_name(state)
            
            if checkpoint_callback:
                checkpoint_callback(checkpoint_name, state)
            
            self.logger.debug(f"检查点: {checkpoint_name}")
        
        return final_state
    
    def _get_checkpoint_name(self, state: Dict[str, Any]) -> str:
        """确定检查点名称"""
        if "document_structure" in state and "ppt_title" not in state:
            return "structure_analyzed"
        elif "ppt_title" in state and state.get("page_count_mode") == "estimated":
            return "initial_outline_generated"
        elif state.get("page_count_mode") == "final":
            return "outline_finalized"
        else:
            current_index = state.get("current_index", 0)
            return f"content_refined_{current_index}"
