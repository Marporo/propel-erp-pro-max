"""
Servicio: Caja Diaria
Implementa la REGLA D de automatización.

═══════════════════════════════════════════════════════════════
REGLA D — Caja Diaria Manual
═══════════════════════════════════════════════════════════════
Permite ingresos/egresos manuales SOLO para estas categorías:
  • G_Casa, G_Banco, Casa_Fabi, Cordoba (gastos manuales libres)
  • MOV_Efectivo, MOV_BNA, MOV_BBVA (solo como ajustes/correcciones,
    marcados con es_ajuste=True)
Las categorías GASTO_TALLER y APPS están bloqueadas para carga manual
(solo se generan automáticamente por Reglas A y B).
═══════════════════════════════════════════════════════════════
"""
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.caja_diaria import CajaDiaria
from app.core.enums import (
    CATEGORIAS_MANUALES,
    CATEGORIAS_AJUSTE_MANUAL,
    CATEGORIAS_SOLO_AUTOMATICAS,
)
from app.schemas.caja_diaria import CajaDiariaCreate
from datetime import date


def crear_movimiento_manual(db: Session, data: CajaDiariaCreate) -> CajaDiaria:
    """
    Crear un movimiento manual en Caja Diaria (REGLA D).
    Valida que la categoría sea permitida para carga manual.
    """
    # ═══════════════════════════════════════════
    # REGLA D: Validación de categorías permitidas
    # ═══════════════════════════════════════════

    if data.categoria_movimiento in CATEGORIAS_SOLO_AUTOMATICAS:
        raise HTTPException(
            status_code=400,
            detail=f"La categoría '{data.categoria_movimiento.value}' solo se genera automáticamente. "
                   f"No se permite carga manual."
        )

    # Si es una categoría de ajuste (Efectivo/BNA/BBVA), marcar como ajuste
    es_ajuste = data.categoria_movimiento in CATEGORIAS_AJUSTE_MANUAL
    if es_ajuste and not data.es_ajuste:
        raise HTTPException(
            status_code=400,
            detail=f"Los movimientos manuales en '{data.categoria_movimiento.value}' "
                   f"deben marcarse como ajuste (es_ajuste=true)"
        )

    movimiento = CajaDiaria(
        fecha=data.fecha,
        concepto=data.concepto,
        categoria_movimiento=data.categoria_movimiento,
        ingreso=data.ingreso,
        egreso=data.egreso,
        entidad_relacionada_id=None,
        entidad_tipo="manual",
        es_automatico=False,
        es_ajuste=es_ajuste,
    )
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento


def obtener_movimientos(
    db: Session,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    categoria: Optional[str] = None,
    solo_automaticos: Optional[bool] = None,
    skip: int = 0,
    limit: int = 200,
):
    """
    Lista movimientos de Caja Diaria con filtros opcionales.
    """
    query = db.query(CajaDiaria)

    if fecha_desde:
        query = query.filter(CajaDiaria.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(CajaDiaria.fecha <= fecha_hasta)
    if categoria:
        query = query.filter(CajaDiaria.categoria_movimiento == categoria)
    if solo_automaticos is not None:
        query = query.filter(CajaDiaria.es_automatico == solo_automaticos)

    return query.order_by(CajaDiaria.fecha.desc(), CajaDiaria.id.desc()).offset(skip).limit(limit).all()


def obtener_movimiento(db: Session, movimiento_id: int) -> CajaDiaria:
    """Obtiene un movimiento por ID."""
    movimiento = db.query(CajaDiaria).filter(CajaDiaria.id == movimiento_id).first()
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movimiento
