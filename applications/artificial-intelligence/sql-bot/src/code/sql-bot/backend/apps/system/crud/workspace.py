
from collections import defaultdict
from typing import Optional
from sqlmodel import Session, func, select, update

from apps.system.models.system_model import UserWsModel
from apps.system.models.user import UserModel

async def reset_single_user_oid(session: Session, uid: int, oid: int, add: Optional[bool] = True):
    user_model = session.get(UserModel, uid)
    if not user_model:
        return
    origin_oid = user_model.oid
    if add and (not origin_oid or origin_oid == 0):
        user_model.oid = oid
        session.add(user_model)
    if not add and origin_oid and origin_oid == oid:
        user_model.oid = 0
        user_ws = session.exec(select(UserWsModel).where(UserWsModel.uid == uid, UserWsModel.oid != oid)).first()
        if user_ws:
            user_model.oid = user_ws.oid
        session.add(user_model)
    
async def reset_user_oid(session: Session, oid: int):
    stmt = (
        select(
            UserModel.id,
            UserModel.oid,
            UserWsModel.oid.label("associated_oid")
        )
        .join(UserWsModel, UserModel.id == UserWsModel.uid, isouter=True)
        .where(UserModel.id != 1)
    )
    
    user_filter = (
        select(UserModel.id)
            .join(UserWsModel, UserModel.id == UserWsModel.uid)
            .where(UserWsModel.oid == oid)
            .distinct()
    )
    stmt = stmt.where(UserModel.id.in_(user_filter))
    
    result_user_list = session.exec(stmt).all()
    if not result_user_list:
        return
    
    merged = defaultdict(list)
    extra_attrs = {}

    for (id, oid, associated_oid) in result_user_list:
        item = {"id": id, "oid": oid}
        merged[id].append(associated_oid)
        if id not in extra_attrs:
            extra_attrs[id] = {k: v for k, v in item.items()}

    # 组合结果
    result = [
        {**extra_attrs[user_id], "oid_list": oid_list} 
        for user_id, oid_list in merged.items()
    ]
    
    for row in result:
        origin_oid = row['oid']
        oid_list: list = list(filter(lambda x: x != oid, row['oid_list']))
        if origin_oid not in oid_list:
            row['oid'] = oid_list[0] if oid_list else 0
            if row['oid'] != origin_oid:
                update_stmt = update(UserModel).where(UserModel.id == row['id']).values(oid=row['oid'])
                session.exec(update_stmt)
