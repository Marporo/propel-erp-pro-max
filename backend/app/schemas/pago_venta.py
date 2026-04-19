"""
Schemas Pydantic: PagoVenta
Incluye datos opcionales de cheque cuando el método de pago es Cheque.
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.enums import MetodoPago


class PagoVentaBase(BaseModel):
    venta_id: int
    fecha: date
    monto: float
    metodo_pago: MetodoPago


class PagoVentaCreate(PagoVentaBase):
    # Datos del cheque (solo cuando metodo_pago == CHEQUE)
    cheque_banco: Optional[str] = None
    cheque_numero: Optional[str] = None
    cheque_fecha_vto: Optional[date] = None
    cheque_observaciones: Optional[str] = None


class PagoVentaResponse(PagoVentaBase):
    id: int

    model_config = {"from_attributes": True}
