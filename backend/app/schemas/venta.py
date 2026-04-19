"""
Schemas Pydantic: Venta
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date


class VentaBase(BaseModel):
    fecha: date
    cliente_id: int
    factura_remito: Optional[str] = None
    importe_neto: float
    lleva_iva: bool = False
    costo_repuestos: float = 0.0
    observaciones: Optional[str] = None


class VentaCreate(VentaBase):
    pass


class VentaUpdate(BaseModel):
    fecha: Optional[date] = None
    cliente_id: Optional[int] = None
    factura_remito: Optional[str] = None
    importe_neto: Optional[float] = None
    lleva_iva: Optional[bool] = None
    costo_repuestos: Optional[float] = None
    observaciones: Optional[str] = None


class VentaResponse(VentaBase):
    id: int
    total: float
    saldo_deudor: float = 0.0
    estado_pago: str = "Pendiente"
    cliente_nombre: Optional[str] = None

    model_config = {"from_attributes": True}
