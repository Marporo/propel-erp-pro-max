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

class CambiarClaveInicial(BaseModel):
    nueva_clave: str

class UsuarioBasico(BaseModel):
    id: int
    username: str
    nombre_completo: Optional[str] = None
    rol: str
    debe_cambiar_clave: bool

    class Config:
        from_attributes = True
