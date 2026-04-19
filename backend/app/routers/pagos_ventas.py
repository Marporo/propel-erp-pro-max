"""
Router: Pagos de Ventas
Endpoints para registrar pagos (dispara REGLA A automáticamente).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.pago_venta import PagoVentaCreate, PagoVentaResponse
from app.services import pago_service

router = APIRouter(prefix="/api/pagos-ventas", tags=["Pagos de Ventas"])


@router.post("/", response_model=PagoVentaResponse, status_code=201)
def registrar_pago(data: PagoVentaCreate, db: Session = Depends(get_db)):
    """
    Registra un pago de venta.
    REGLA A: Si es efectivo/BNA/BBVA/Apps → crea movimiento en Caja Diaria.
    Si es cheque → crea registro en Cheques Terceros.
    """
    return pago_service.registrar_pago(db, data)


@router.get("/venta/{venta_id}", response_model=list[PagoVentaResponse])
def listar_pagos_venta(venta_id: int, db: Session = Depends(get_db)):
    """Lista todos los pagos de una venta específica."""
    return pago_service.obtener_pagos_venta(db, venta_id)
