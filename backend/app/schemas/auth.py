"""
Esquemas para Autenticación
"""
from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class UsuarioLogin(BaseModel):
    username: str
    password: str

class UsuarioBasico(BaseModel):
    id: int
    username: str
    nombre_completo: Optional[str] = None
    rol: str

    class Config:
        from_attributes = True
