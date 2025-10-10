# Author: Junjun
# Date: 2025/6/25

from typing import List, Dict
from apps.datasource.models.datasource import CoreField, CoreDatasource
from apps.db.constant import DB
from common.core.deps import SessionDep


def transFilterTree(session: SessionDep, tree_list: List[any], ds: CoreDatasource) -> str | None:
    if tree_list is None:
        return None
    res: List[str] = []
    for dto in tree_list:
        tree = dto.tree
        if tree is None:
            continue
        tree_exp = transTreeToWhere(session, tree, ds)
        if tree_exp is not None:
            res.append(tree_exp)
    return " AND ".join(res)


def transTreeToWhere(session: SessionDep, tree: any, ds: CoreDatasource) -> str | None:
    if tree is None:
        return None
    logic = tree['logic']

    items = tree['items']
    list: List[str] = []
    if items is not None:
        for item in items:
            exp: str = None
            if item['type'] == 'item':
                exp = transTreeItem(session, item, ds)
            elif item['type'] == 'tree':
                exp = transTreeToWhere(session, item['sub_tree'], ds)

            if exp is not None:
                list.append(exp)
    return '(' + f' {logic} '.join(list) + ')' if len(list) > 0 else None


def transTreeItem(session: SessionDep, item: Dict, ds: CoreDatasource) -> str | None:
    res: str = None
    field = session.query(CoreField).filter(CoreField.id == int(item['field_id'])).first()
    if field is None:
        return None

    db = DB.get_db(ds.type)
    whereName = db.prefix + field.field_name + db.suffix
    if item['filter_type'] == 'enum':
        if len(item['enum_value']) > 0:
            if ds['type'] == 'sqlServer' and (
                    field.field_type == 'nchar' or field.field_type == 'NCHAR' or field.field_type == 'nvarchar' or field.field_type == 'NVARCHAR'):
                res = "(" + whereName + " IN (N'" + "',N'".join(item['enum_value']) + "'))"
            else:
                res = "(" + whereName + " IN ('" + "','".join(item['enum_value']) + "'))"
    else:
        value = item['value']
        whereTerm = transFilterTerm(item['term'])
        whereValue = ''

        if item['term'] == 'null':
            whereValue = ''
        elif item['term'] == 'not_null':
            whereValue = ''
        elif item['term'] == 'empty':
            whereValue = "''"
        elif item['term'] == 'not_empty':
            whereValue = "''"
        elif item['term'] == 'in' or item['term'] == 'not in':
            if ds.type == 'sqlServer' and (
                    field.field_type == 'nchar' or field.field_type == 'NCHAR' or field.field_type == 'nvarchar' or field.field_type == 'NVARCHAR'):
                whereValue = "(N'" + "', N'".join(value.split(",")) + "')"
            else:
                whereValue = "('" + "', '".join(value.split(",")) + "')"
        elif item['term'] == 'like' or item['term'] == 'not like':
            if ds.type == 'sqlServer' and (
                    field.field_type == 'nchar' or field.field_type == 'NCHAR' or field.field_type == 'nvarchar' or field.field_type == 'NVARCHAR'):
                whereValue = f"N'%{value}%'"
            else:
                whereValue = f"'%{value}%'"
        else:
            if ds.type == 'sqlServer' and (
                    field.field_type == 'nchar' or field.field_type == 'NCHAR' or field.field_type == 'nvarchar' or field.field_type == 'NVARCHAR'):
                whereValue = f"N'{value}'"
            else:
                whereValue = f"'{value}'"

        res = whereName + whereTerm + whereValue
    return res


def transFilterTerm(term: str) -> str:
    if term == "eq":
        return " = "
    if term == "not_eq":
        return " <> "
    if term == "lt":
        return " < "
    if term == "le":
        return " <= "
    if term == "gt":
        return " > "
    if term == "ge":
        return " >= "
    if term == "in":
        return " IN "
    if term == "not in":
        return " NOT IN "
    if term == "like":
        return " LIKE "
    if term == "not like":
        return " NOT LIKE "
    if term == "null":
        return " IS NULL "
    if term == "not_null":
        return " IS NOT NULL "
    if term == "empty":
        return " = "
    if term == "not_empty":
        return " <> "
    if term == "between":
        return " BETWEEN "
    return ""
