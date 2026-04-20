from pydantic import BaseModel
from typing import Optional
from app.core.enums import RolUsuario

class UsuarioBase(BaseModel):
    username: str
    email: Optional[str] = None
    nombre_completo: Optional[str] = None
    rol: RolUsuario = RolUsuario.OPERADOR
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UsuarioOut(UsuarioBase):
    id: int

    class Config:
        from_attributes = True
