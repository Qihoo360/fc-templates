"""
Database health check utilities for LandPPT
"""

import time
import logging
from typing import Dict, Any, List
from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal
from .models import Project, TodoBoard, TodoStage, ProjectVersion, SlideData

logger = logging.getLogger(__name__)


class DatabaseHealthChecker:
    """Database health check and diagnostics"""
    
    def __init__(self):
        self.checks = []
        self._register_checks()
    
    def _register_checks(self):
        """Register all health checks"""
        self.checks = [
            {
                "name": "connection",
                "description": "Database connection test",
                "check": self._check_connection,
                "critical": True
            },
            {
                "name": "tables",
                "description": "Table existence and structure",
                "check": self._check_tables,
                "critical": True
            },
            {
                "name": "data_integrity",
                "description": "Data integrity and relationships",
                "check": self._check_data_integrity,
                "critical": False
            },
            {
                "name": "performance",
                "description": "Database performance metrics",
                "check": self._check_performance,
                "critical": False
            },
            {
                "name": "storage",
                "description": "Storage usage and optimization",
                "check": self._check_storage,
                "critical": False
            }
        ]
    
    async def _check_connection(self, session: AsyncSession) -> Dict[str, Any]:
        """Test database connection"""
        try:
            start_time = time.time()
            result = await session.execute(text("SELECT 1"))
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "message": "Database connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Database connection failed"
            }
    
    async def _check_tables(self, session: AsyncSession) -> Dict[str, Any]:
        """Check table existence and structure"""
        try:
            tables = ["projects", "todo_boards", "todo_stages", "project_versions", "slide_data"]
            existing_tables = []
            missing_tables = []
            
            for table in tables:
                try:
                    result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    existing_tables.append({"name": table, "row_count": count})
                except Exception:
                    missing_tables.append(table)
            
            if missing_tables:
                return {
                    "status": "unhealthy",
                    "existing_tables": existing_tables,
                    "missing_tables": missing_tables,
                    "message": f"Missing tables: {', '.join(missing_tables)}"
                }
            else:
                return {
                    "status": "healthy",
                    "tables": existing_tables,
                    "message": "All required tables exist"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Table structure check failed"
            }
    
    async def _check_data_integrity(self, session: AsyncSession) -> Dict[str, Any]:
        """Check data integrity and relationships"""
        try:
            issues = []
            
            # Check for orphaned todo_boards
            result = await session.execute(text("""
                SELECT COUNT(*) FROM todo_boards tb 
                LEFT JOIN projects p ON tb.project_id = p.project_id 
                WHERE p.project_id IS NULL
            """))
            orphaned_boards = result.scalar()
            if orphaned_boards > 0:
                issues.append(f"{orphaned_boards} orphaned todo_boards")
            
            # Check for orphaned todo_stages
            result = await session.execute(text("""
                SELECT COUNT(*) FROM todo_stages ts 
                LEFT JOIN todo_boards tb ON ts.todo_board_id = tb.id 
                WHERE tb.id IS NULL
            """))
            orphaned_stages = result.scalar()
            if orphaned_stages > 0:
                issues.append(f"{orphaned_stages} orphaned todo_stages")
            
            # Check for orphaned slide_data
            result = await session.execute(text("""
                SELECT COUNT(*) FROM slide_data sd 
                LEFT JOIN projects p ON sd.project_id = p.project_id 
                WHERE p.project_id IS NULL
            """))
            orphaned_slides = result.scalar()
            if orphaned_slides > 0:
                issues.append(f"{orphaned_slides} orphaned slide_data")
            
            # Check for orphaned project_versions
            result = await session.execute(text("""
                SELECT COUNT(*) FROM project_versions pv 
                LEFT JOIN projects p ON pv.project_id = p.project_id 
                WHERE p.project_id IS NULL
            """))
            orphaned_versions = result.scalar()
            if orphaned_versions > 0:
                issues.append(f"{orphaned_versions} orphaned project_versions")
            
            if issues:
                return {
                    "status": "warning",
                    "issues": issues,
                    "message": f"Data integrity issues found: {'; '.join(issues)}"
                }
            else:
                return {
                    "status": "healthy",
                    "message": "No data integrity issues found"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Data integrity check failed"
            }
    
    async def _check_performance(self, session: AsyncSession) -> Dict[str, Any]:
        """Check database performance metrics"""
        try:
            metrics = {}
            
            # Test query performance
            queries = [
                ("projects_count", "SELECT COUNT(*) FROM projects"),
                ("recent_projects", "SELECT COUNT(*) FROM projects WHERE created_at > ?", [time.time() - 86400]),
                ("active_stages", "SELECT COUNT(*) FROM todo_stages WHERE status = 'running'")
            ]
            
            for name, query, *params in queries:
                start_time = time.time()
                if params:
                    result = await session.execute(text(query), params[0])
                else:
                    result = await session.execute(text(query))
                response_time = (time.time() - start_time) * 1000
                
                metrics[name] = {
                    "response_time_ms": round(response_time, 2),
                    "result": result.scalar()
                }
            
            # Check for slow queries (>100ms)
            slow_queries = [name for name, data in metrics.items() if data["response_time_ms"] > 100]
            
            if slow_queries:
                return {
                    "status": "warning",
                    "metrics": metrics,
                    "slow_queries": slow_queries,
                    "message": f"Slow queries detected: {', '.join(slow_queries)}"
                }
            else:
                return {
                    "status": "healthy",
                    "metrics": metrics,
                    "message": "Database performance is good"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Performance check failed"
            }
    
    async def _check_storage(self, session: AsyncSession) -> Dict[str, Any]:
        """Check storage usage and optimization"""
        try:
            storage_info = {}
            
            # Get table sizes (SQLite specific)
            tables = ["projects", "todo_boards", "todo_stages", "project_versions", "slide_data"]
            
            for table in tables:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                row_count = result.scalar()
                storage_info[table] = {"row_count": row_count}
            
            # Calculate total rows
            total_rows = sum(info["row_count"] for info in storage_info.values())
            
            # Check for large tables
            large_tables = [table for table, info in storage_info.items() if info["row_count"] > 10000]
            
            return {
                "status": "healthy",
                "storage_info": storage_info,
                "total_rows": total_rows,
                "large_tables": large_tables,
                "message": f"Total rows: {total_rows}"
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Storage check failed"
            }
    
    async def run_health_check(self, check_names: List[str] = None) -> Dict[str, Any]:
        """Run health checks"""
        if check_names is None:
            checks_to_run = self.checks
        else:
            checks_to_run = [check for check in self.checks if check["name"] in check_names]
        
        results = {}
        overall_status = "healthy"
        critical_failures = []
        
        try:
            async with AsyncSessionLocal() as session:
                for check in checks_to_run:
                    logger.info(f"Running health check: {check['name']}")
                    
                    try:
                        result = await check["check"](session)
                        results[check["name"]] = {
                            "description": check["description"],
                            "critical": check["critical"],
                            **result
                        }
                        
                        # Update overall status
                        if result["status"] == "unhealthy":
                            if check["critical"]:
                                overall_status = "unhealthy"
                                critical_failures.append(check["name"])
                            elif overall_status == "healthy":
                                overall_status = "warning"
                        elif result["status"] == "warning" and overall_status == "healthy":
                            overall_status = "warning"
                            
                    except Exception as e:
                        logger.error(f"Health check {check['name']} failed: {e}")
                        results[check["name"]] = {
                            "description": check["description"],
                            "critical": check["critical"],
                            "status": "unhealthy",
                            "error": str(e),
                            "message": f"Health check failed: {e}"
                        }
                        
                        if check["critical"]:
                            overall_status = "unhealthy"
                            critical_failures.append(check["name"])
        
        except Exception as e:
            logger.error(f"Health check session failed: {e}")
            return {
                "overall_status": "unhealthy",
                "error": str(e),
                "message": "Failed to establish database session for health check"
            }
        
        return {
            "overall_status": overall_status,
            "timestamp": time.time(),
            "critical_failures": critical_failures,
            "checks": results,
            "summary": {
                "total_checks": len(checks_to_run),
                "healthy": len([r for r in results.values() if r["status"] == "healthy"]),
                "warning": len([r for r in results.values() if r["status"] == "warning"]),
                "unhealthy": len([r for r in results.values() if r["status"] == "unhealthy"])
            }
        }
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics"""
        try:
            async with AsyncSessionLocal() as session:
                stats = {}
                
                # Project statistics
                result = await session.execute(text("SELECT COUNT(*) FROM projects"))
                stats["total_projects"] = result.scalar()
                
                result = await session.execute(text("SELECT COUNT(*) FROM projects WHERE status = 'completed'"))
                stats["completed_projects"] = result.scalar()
                
                result = await session.execute(text("SELECT COUNT(*) FROM projects WHERE status = 'draft'"))
                stats["draft_projects"] = result.scalar()
                
                # TODO board statistics
                result = await session.execute(text("SELECT COUNT(*) FROM todo_boards"))
                stats["total_todo_boards"] = result.scalar()
                
                result = await session.execute(text("SELECT COUNT(*) FROM todo_stages WHERE status = 'completed'"))
                stats["completed_stages"] = result.scalar()
                
                result = await session.execute(text("SELECT COUNT(*) FROM todo_stages WHERE status = 'running'"))
                stats["running_stages"] = result.scalar()
                
                # Slide statistics
                result = await session.execute(text("SELECT COUNT(*) FROM slide_data"))
                stats["total_slides"] = result.scalar()
                
                # Version statistics
                result = await session.execute(text("SELECT COUNT(*) FROM project_versions"))
                stats["total_versions"] = result.scalar()
                
                # Recent activity (last 24 hours)
                yesterday = time.time() - 86400
                result = await session.execute(text("SELECT COUNT(*) FROM projects WHERE created_at > :yesterday"), {"yesterday": yesterday})
                stats["projects_created_24h"] = result.scalar()
                
                return {
                    "status": "success",
                    "stats": stats,
                    "timestamp": time.time()
                }
                
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": time.time()
            }


# Global health checker instance
health_checker = DatabaseHealthChecker()
