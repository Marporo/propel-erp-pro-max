"""
Router: Caja Diaria
Endpoints para el libro mayor (movimientos automáticos y manuales).
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_active_operator
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.schemas.caja_diaria import CajaDiariaCreate, CajaDiariaResponse
from app.services import caja_service

router = APIRouter(prefix="/api/caja-diaria", tags=["Caja Diaria"])


@router.get("/", response_model=list[CajaDiariaResponse])
def listar_movimientos(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    categoria: Optional[str] = Query(None),
    solo_automaticos: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    """
    Lista movimientos de Caja Diaria con filtros opcionales.
    Incluye movimientos automáticos (Reglas A, B, C) y manuales (Regla D).
    """
    return caja_service.obtener_movimientos(
        db, fecha_desde, fecha_hasta, categoria, solo_automaticos, skip, limit
    )


@router.post("/", response_model=CajaDiariaResponse, status_code=201, dependencies=[Depends(get_current_active_operator)])
def crear_movimiento_manual(data: CajaDiariaCreate, db: Session = Depends(get_db)):
    """
    Crea un movimiento manual en Caja Diaria (REGLA D).
    Solo para categorías manuales (G_Casa, G_Banco, Casa_Fabi, Cordoba)
    o ajustes (Mov_Efectivo, Mov_BNA, Mov_BBVA con es_ajuste=true).
    """
    return caja_service.crear_movimiento_manual(db, data)


@router.get("/{movimiento_id}", response_model=CajaDiariaResponse)
def obtener_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    """Obtiene un movimiento por ID."""
    return caja_service.obtener_movimiento(db, movimiento_id)
