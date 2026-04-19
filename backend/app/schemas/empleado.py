"""
Schemas Pydantic: Empleado
"""
from typing import Optional
from pydantic import BaseModel


class EmpleadoBase(BaseModel):
    nombre: str


class EmpleadoCreate(EmpleadoBase):
    pass


class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = None


class EmpleadoResponse(EmpleadoBase):
    id: int

    model_config = {"from_attributes": True}


class EmpleadoFichaResponse(EmpleadoResponse):
    """Respuesta extendida con saldo calculado del empleado."""
    total_ingresos: float = 0.0
    total_egresos: float = 0.0
    saldo: float = 0.0
