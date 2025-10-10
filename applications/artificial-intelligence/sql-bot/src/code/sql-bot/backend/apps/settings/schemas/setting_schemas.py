from pydantic import BaseModel

class term_schema_creator(BaseModel):
    term: str
    definition: str
    domain: str
    