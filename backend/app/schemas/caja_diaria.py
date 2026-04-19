"""
Schemas Pydantic: CajaDiaria
"""
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.enums import CategoriaMov


class CajaDiariaBase(BaseModel):
    fecha: date
    concepto: str
    categoria_movimiento: CategoriaMov
    ingreso: float = 0.0
    egreso: float = 0.0


class CajaDiariaCreate(CajaDiariaBase):
    """
    Schema para movimientos manuales en Caja Diaria (Regla D).
    Solo se permite para categorías manuales y ajustes.
    """
    es_ajuste: bool = False


class CajaDiariaResponse(CajaDiariaBase):
    id: int
    entidad_relacionada_id: Optional[int] = None
    entidad_tipo: Optional[str] = None
    es_automatico: bool = False
    es_ajuste: bool = False

    model_config = {"from_attributes": True}


class ResumenCaja(BaseModel):
    """Resumen de saldos por categoría para el Dashboard."""
    saldo_efectivo: float = 0.0
    saldo_bna: float = 0.0
    saldo_bbva: float = 0.0
    total_cheques_cartera: float = 0.0
    cantidad_cheques_cartera: int = 0
    cuentas_por_cobrar: float = 0.0
