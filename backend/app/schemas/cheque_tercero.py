"""
Schemas Pydantic: ChequeTercero
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.enums import EstadoCheque, CategoriaMov


class ChequeTerceroBase(BaseModel):
    fecha_ingreso: date
    librador: str
    banco: str
    numero_cheque: str
    importe: float
    fecha_vto: date
    observaciones: Optional[str] = None


class ChequeTerceroCreate(ChequeTerceroBase):
    pass


class ChequeTerceroUpdate(BaseModel):
    observaciones: Optional[str] = None


class CambioEstadoCheque(BaseModel):
    """Schema para cambiar el estado de un cheque de tercero."""
    nuevo_estado: EstadoCheque
    # Si se deposita: en qué banco (BNA o BBVA)
    banco_destino: Optional[str] = None  # "BNA" o "BBVA"
    # Si se entrega a tercero: a quién y bajo qué categoría de caja
    destino_nombre: Optional[str] = None
    categoria_caja: Optional[CategoriaMov] = None  # G_Casa, Gasto_Taller, etc.


class ChequeTerceroResponse(ChequeTerceroBase):
    id: int
    estado: EstadoCheque
    destino_id: Optional[str] = None
    dias_para_vencimiento: int = 0

    model_config = {"from_attributes": True}
