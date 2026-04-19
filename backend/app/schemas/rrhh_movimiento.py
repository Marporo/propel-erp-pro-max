"""
Schemas Pydantic: RRHHMovimiento
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.enums import OrigenFondo


class RRHHMovimientoBase(BaseModel):
    empleado_id: int
    fecha: date
    concepto: str
    ingreso: float = 0.0
    egreso: float = 0.0
    origen_fondo_pago: Optional[OrigenFondo] = None


class RRHHMovimientoCreate(RRHHMovimientoBase):
    pass


class RRHHMovimientoResponse(RRHHMovimientoBase):
    id: int
    empleado_nombre: Optional[str] = None

    model_config = {"from_attributes": True}
