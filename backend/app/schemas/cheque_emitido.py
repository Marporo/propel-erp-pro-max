"""
Schemas Pydantic: ChequeEmitido
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date


class ChequeEmitidoBase(BaseModel):
    fecha_emision: date
    destino: str
    numero_cheque: str
    fecha_vto: date
    importe: float


class ChequeEmitidoCreate(ChequeEmitidoBase):
    pass


class ChequeEmitidoUpdate(BaseModel):
    pagado: Optional[bool] = None
    destino: Optional[str] = None
    fecha_vto: Optional[date] = None
    importe: Optional[float] = None


class ChequeEmitidoResponse(ChequeEmitidoBase):
    id: int
    pagado: bool
    dias_para_vencimiento: int = 0

    model_config = {"from_attributes": True}
