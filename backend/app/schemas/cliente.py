"""
Schemas Pydantic: Cliente
"""
from typing import Optional
from pydantic import BaseModel


class ClienteBase(BaseModel):
    nombre: str


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None


class ClienteResponse(ClienteBase):
    id: int

    model_config = {"from_attributes": True}
