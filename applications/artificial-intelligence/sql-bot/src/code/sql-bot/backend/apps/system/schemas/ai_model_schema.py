
from typing import List
from pydantic import BaseModel

from common.core.schemas import BaseCreatorDTO

class AiModelItem(BaseModel):
    name: str
    model_type: int
    base_model: str
    supplier: int
    protocol: int
    default_model: bool = False

class AiModelGridItem(AiModelItem, BaseCreatorDTO):
    pass

class AiModelConfigItem(BaseModel):
    key: str
    val: object
    name: str
    
class AiModelCreator(AiModelItem):
    api_domain: str
    api_key: str
    config_list: List[AiModelConfigItem]
    
class AiModelEditor(AiModelCreator, BaseCreatorDTO):
    pass