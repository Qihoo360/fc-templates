from sqlalchemy import Row, Select
from sqlmodel import Session, select, func, SQLModel
from typing import Dict, Type, TypeVar, Sequence, Optional
from common.core.schemas import PaginationParams, PaginatedResponse
from sqlmodel.sql.expression import SelectOfScalar
from typing import Union, Any

ModelT = TypeVar('ModelT', bound=SQLModel)

class Paginator:
    def __init__(self, session: Session):
        self.session = session
    def _process_result_row(self, row: Row) -> Dict[str, Any]:
        result_dict = {}
        if isinstance(row, int):
            return {'id': row}
        if isinstance(row, SQLModel) and not hasattr(row, '_fields'):
            return row.model_dump()
        for item, key in zip(row, row._fields):
            if isinstance(item, SQLModel):
                result_dict.update(item.model_dump())
            else:
                result_dict[key] = item
                
        return result_dict
    async def paginate(
        self,
        stmt: Union[Select, SelectOfScalar, Type[ModelT]],
        page: int = 1,
        size: int = 20,
        order_by: Optional[str] = None,
        desc: bool = False,
        **filters
    ) -> tuple[Sequence[Any], int]:
        offset = (page - 1) * size
        single_model: bool = False
        if isinstance(stmt, type) and issubclass(stmt, SQLModel):
            stmt = select(stmt)
            single_model = True
        
        # 应用过滤条件
        for field, value in filters.items():
            if value is not None:
                # 处理关联模型的字段 (如 user.name)
                if '.' in field:
                    related_model, related_field = field.split('.')
                    # 这里需要根据实际关联关系调整
                    stmt = stmt.where(getattr(getattr(stmt.selected_columns, related_model), related_field) == value)
                else:
                    stmt = stmt.where(getattr(stmt.selected_columns, field) == value)
        
        # 应用排序
        if order_by:
            if '.' in order_by:
                related_model, related_field = order_by.split('.')
                column = getattr(getattr(stmt.selected_columns, related_model), related_field)
            else:
                column = getattr(stmt.selected_columns, order_by)
            stmt = stmt.order_by(column.desc() if desc else column.asc())
        
        # 计算总数
        """ count_stmt = stmt.with_only_columns(func.count(), maintain_column_froms=True)
        result = self.session.exec(count_stmt)
        total: int = result.first() """
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = self.session.exec(count_stmt)
        total: int = total_result.first()
        
        # 应用分页
        stmt = stmt.offset(offset).limit(size)
        
        # 执行查询
        result = self.session.exec(stmt)
        if not single_model:
            items = [self._process_result_row(row) for row in result]
        else:
            items = result.all()
        return items, total

    async def get_paginated_response(
        self,
        stmt: Union[Select, SelectOfScalar, Type[ModelT]],
        pagination: PaginationParams,
        **filters
    ) -> PaginatedResponse[Any]:
        items, total = await self.paginate(
            stmt=stmt,
            page=pagination.page,
            size=pagination.size,
            order_by=pagination.order_by,
            desc=pagination.desc,
            **filters
        )
        
        total_pages = (total + pagination.size - 1) // pagination.size
        
        return PaginatedResponse[Any](
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            total_pages=total_pages
        )