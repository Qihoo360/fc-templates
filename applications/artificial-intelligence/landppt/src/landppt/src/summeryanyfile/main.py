"""
主入口模块 - 命令行界面和主要功能
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Optional
import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.panel import Panel
from rich.table import Table

from .config.settings import load_settings, create_default_config, create_env_template
from .core.models import ProcessingConfig, ChunkStrategy
from .generators.ppt_generator import PPTOutlineGenerator
from .utils.logger import setup_logging, get_logger
from .utils.file_handler import FileHandler
from .utils.validators import validate_file_path, validate_url, validate_config

console = Console()
logger = get_logger(__name__)


@click.group()
@click.option('--config', '-c', help='配置文件路径')
@click.option('--log-level', default='INFO', help='日志级别')
@click.option('--debug', is_flag=True, help='启用调试模式')
@click.pass_context
def cli(ctx, config, log_level, debug):
    """通用文本转PPT大纲生成器"""
    ctx.ensure_object(dict)
    
    # 设置日志
    if debug:
        log_level = 'DEBUG'
    
    setup_logging(level=log_level, rich_logging=True)
    
    # 加载设置
    settings = load_settings(config_file=config, debug_mode=debug)
    ctx.obj['settings'] = settings
    
    if debug:
        console.print(f"[dim]配置加载完成: {settings.llm_provider}/{settings.llm_model}[/dim]")


@cli.command()
@click.argument('input_path')
@click.option('--output', '-o', help='输出文件路径')
@click.option('--encoding', help='文件编码')
@click.option('--max-slides', type=int, help='最大幻灯片数量')
@click.option('--min-slides', type=int, help='最小幻灯片数量')
@click.option('--chunk-size', type=int, help='文档块大小')
@click.option('--chunk-strategy', type=click.Choice(['paragraph', 'semantic', 'recursive', 'hybrid', 'fast']), help='分块策略')
@click.option('--model', help='LLM模型名称')
@click.option('--provider', type=click.Choice(['openai', 'anthropic', 'azure']), help='LLM提供商')
@click.option('--temperature', type=float, help='温度参数 (0.0-2.0)')
@click.option('--max-tokens', type=int, help='最大token数量')
@click.option('--base-url', help='自定义OpenAI API端点URL')
@click.option('--save-markdown', is_flag=True, help='保存转换后的Markdown文件到temp目录')
@click.option('--temp-dir', help='自定义temp目录路径')
@click.option('--no-magic-pdf', is_flag=True, help='禁用Magic-PDF，强制使用MarkItDown处理PDF')
@click.option('--no-progress', is_flag=True, help='禁用进度条')
@click.pass_context
def generate(ctx, input_path, output, encoding, max_slides, min_slides, chunk_size, chunk_strategy,
             model, provider, temperature, max_tokens, base_url, save_markdown, temp_dir, no_magic_pdf, no_progress):
    """生成PPT大纲"""
    settings = ctx.obj['settings']
    
    # 更新设置
    if max_slides:
        settings.max_slides = max_slides
    if min_slides:
        settings.min_slides = min_slides
    if chunk_size:
        settings.chunk_size = chunk_size
    if chunk_strategy:
        settings.chunk_strategy = chunk_strategy
    if model:
        settings.llm_model = model
    if provider:
        settings.llm_provider = provider
    if temperature is not None:
        settings.temperature = temperature
    if max_tokens:
        settings.max_tokens = max_tokens
    if base_url:
        settings.openai_base_url = base_url
    
    # 验证配置
    config_errors = validate_config(settings.__dict__)
    if config_errors:
        console.print("[red]配置错误:[/red]")
        for error in config_errors:
            console.print(f"  • {error}")
        sys.exit(1)
    
    # 运行生成
    asyncio.run(_run_generation(
        input_path, output, encoding, settings, not no_progress, save_markdown, temp_dir, not no_magic_pdf
    ))


async def _run_generation(
    input_path: str,
    output_path: Optional[str],
    encoding: Optional[str],
    settings,
    show_progress: bool,
    save_markdown: bool = False,
    temp_dir: Optional[str] = None,
    use_magic_pdf: bool = True
):
    """运行PPT生成"""
    try:
        # 验证输入
        if validate_url(input_path):
            console.print(f"[blue]正在处理URL:[/blue] {input_path}")
            file_handler = FileHandler()
            local_path = file_handler.handle_input(input_path)[0]
            is_temp = True
        elif validate_file_path(input_path):
            console.print(f"[blue]正在处理文件:[/blue] {input_path}")
            local_path = input_path
            is_temp = False
        else:
            console.print(f"[red]无效的输入路径:[/red] {input_path}")
            sys.exit(1)
        
        # 创建生成器
        config = settings.to_processing_config()
        generator = PPTOutlineGenerator(
            config,
            save_markdown=save_markdown,
            temp_dir=temp_dir,
            use_magic_pdf=use_magic_pdf,
            cache_dir=None  # 使用默认缓存目录
        )

        # 显示配置信息
        if save_markdown:
            markdown_dir = temp_dir or generator.document_processor.temp_dir
            console.print(f"[yellow]Markdown文件将保存到:[/yellow] {markdown_dir}")

        # 显示PDF处理方式
        if use_magic_pdf:
            console.print("[green]PDF转换:[/green] 使用Magic-PDF (本地高质量)")
        else:
            console.print("[yellow]PDF转换:[/yellow] 使用MarkItDown (标准质量)")
        
        # 进度回调
        progress_task = None
        if show_progress:
            progress = Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeElapsedColumn(),
                console=console
            )
            progress.start()
            progress_task = progress.add_task("初始化...", total=100)
            
            def progress_callback(step_name: str, percent: float):
                progress.update(progress_task, description=step_name, completed=percent)
        else:
            def progress_callback(step_name: str, percent: float):
                console.print(f"[dim]{step_name} ({percent:.1f}%)[/dim]")
        
        try:
            # 生成PPT大纲
            outline = await generator.generate_from_file(
                local_path,
                encoding=encoding,
                progress_callback=progress_callback
            )
            
            if show_progress:
                progress.stop()
            
            # 输出结果
            result_json = outline.to_dict()
            
            if output_path:
                # 保存到文件
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result_json, f, ensure_ascii=False, indent=2)
                
                console.print(f"[green]PPT大纲已保存到:[/green] {output_file}")
            else:
                # 输出到控制台
                console.print(json.dumps(result_json, ensure_ascii=False, indent=2))
            
            # 显示摘要
            _show_generation_summary(outline)
            
        finally:
            if show_progress and progress_task:
                progress.stop()
            
            # 清理临时文件
            if is_temp:
                file_handler.cleanup_temp_file(local_path)
    
    except Exception as e:
        console.print(f"[red]生成失败:[/red] {e}")
        logger.error(f"生成失败: {e}", exc_info=True)
        sys.exit(1)


def _show_generation_summary(outline):
    """显示生成摘要"""
    table = Table(title="PPT大纲摘要")
    table.add_column("属性", style="cyan")
    table.add_column("值", style="green")
    
    table.add_row("标题", outline.title)
    table.add_row("总页数", str(outline.total_pages))
    table.add_row("状态", outline.page_count_mode)
    
    # 统计幻灯片类型
    type_counts = {}
    for slide in outline.slides:
        slide_type = slide.slide_type
        type_counts[slide_type] = type_counts.get(slide_type, 0) + 1
    
    type_summary = ", ".join([f"{k}: {v}" for k, v in type_counts.items()])
    table.add_row("幻灯片类型分布", type_summary)
    
    console.print(table)


@cli.command()
@click.option('--provider', type=click.Choice(['openai', 'anthropic', 'azure']), help='LLM提供商')
def validate_setup(provider):
    """验证设置和API连接"""
    console.print("[blue]正在验证设置...[/blue]")
    
    settings = load_settings()
    
    # 验证配置
    config_errors = validate_config(settings.__dict__)
    if config_errors:
        console.print("[red]配置错误:[/red]")
        for error in config_errors:
            console.print(f"  • {error}")
        return
    
    # 验证LLM连接
    from .core.llm_manager import LLMManager
    
    llm_manager = LLMManager()
    test_provider = provider or settings.llm_provider
    
    if llm_manager.validate_configuration(test_provider, **settings.get_llm_kwargs()):
        console.print(f"[green]✓[/green] {test_provider} 配置有效")
    else:
        console.print(f"[red]✗[/red] {test_provider} 配置无效")
        return
    
    # 测试LLM连接
    try:
        llm = llm_manager.get_llm(
            model=settings.llm_model,
            provider=test_provider,
            **settings.get_llm_kwargs()
        )
        console.print(f"[green]✓[/green] LLM连接成功: {settings.llm_model}")
    except Exception as e:
        console.print(f"[red]✗[/red] LLM连接失败: {e}")


@cli.command()
def init_config():
    """初始化配置文件"""
    console.print("[blue]正在创建配置文件...[/blue]")
    
    create_default_config()
    create_env_template()
    
    console.print("[green]配置文件创建完成![/green]")
    console.print("请编辑 .env 文件并填入您的API密钥")


@cli.command()
@click.argument('input_path')
def analyze(input_path):
    """分析文档结构"""
    console.print(f"[blue]正在分析文档:[/blue] {input_path}")
    
    try:
        from .core.document_processor import DocumentProcessor
        
        processor = DocumentProcessor()
        doc_info = processor.load_document(input_path)
        
        # 显示文档信息
        info_table = Table(title="文档信息")
        info_table.add_column("属性", style="cyan")
        info_table.add_column("值", style="green")
        
        info_table.add_row("标题", doc_info.title)
        info_table.add_row("文件类型", doc_info.file_type)
        info_table.add_row("编码", doc_info.encoding)
        info_table.add_row("大小", f"{doc_info.size:,} 字节")
        info_table.add_row("内容长度", f"{len(doc_info.content):,} 字符")
        
        console.print(info_table)
        
        # 显示内容预览
        preview = doc_info.content[:500] + "..." if len(doc_info.content) > 500 else doc_info.content
        console.print(Panel(preview, title="内容预览"))
        
    except Exception as e:
        console.print(f"[red]分析失败:[/red] {e}")


@cli.command()
def list_models():
    """列出支持的模型"""
    from .core.llm_manager import LLMManager
    
    llm_manager = LLMManager()
    
    for provider in llm_manager.SUPPORTED_PROVIDERS:
        models = llm_manager.list_available_models(provider)
        
        table = Table(title=f"{provider.upper()} 模型")
        table.add_column("模型名称", style="cyan")
        
        for model in models:
            table.add_row(model)
        
        console.print(table)


if __name__ == '__main__':
    cli()
