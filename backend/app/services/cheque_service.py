"""
Servicio: Cheques
Implementa la REGLA C de automatización.

═══════════════════════════════════════════════════════════════
REGLA C — Gestión de Cheques de Terceros
═══════════════════════════════════════════════════════════════
Cuando un cheque cambia de estado:
  • EN_CARTERA → DEPOSITADO:
    → Crea ingreso automático en Caja_Diaria bajo MOV_BNA o MOV_BBVA
      según el banco destino indicado por el usuario
  • EN_CARTERA → ENTREGADO_A_TERCERO:
    → Crea egreso automático en Caja_Diaria bajo la categoría elegida
      por el usuario (G_Casa, Gasto_Taller, etc.)
═══════════════════════════════════════════════════════════════
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.cheque_tercero import ChequeTercero
from app.models.cheque_emitido import ChequeEmitido
from app.models.caja_diaria import CajaDiaria
from app.core.enums import EstadoCheque, CategoriaMov
from app.schemas.cheque_tercero import (
    ChequeTerceroCreate,
    CambioEstadoCheque,
    ChequeTerceroUpdate,
)
from app.schemas.cheque_emitido import ChequeEmitidoCreate, ChequeEmitidoUpdate


# ═══════════════════════════════════════════
# Cheques de Terceros
# ═══════════════════════════════════════════

def crear_cheque_tercero(db: Session, data: ChequeTerceroCreate) -> ChequeTercero:
    """Crea un cheque de tercero manualmente (sin pasar por Regla A)."""
    cheque = ChequeTercero(
        fecha_ingreso=data.fecha_ingreso,
        librador=data.librador,
        banco=data.banco,
        numero_cheque=data.numero_cheque,
        importe=data.importe,
        fecha_vto=data.fecha_vto,
        observaciones=data.observaciones,
        estado=EstadoCheque.EN_CARTERA,
    )
    db.add(cheque)
    db.commit()
    db.refresh(cheque)
    return cheque


def cambiar_estado_cheque(db: Session, cheque_id: int, data: CambioEstadoCheque) -> ChequeTercero:
    """
    Cambia el estado de un cheque de tercero y dispara la REGLA C.
    """
    cheque = db.query(ChequeTercero).filter(ChequeTercero.id == cheque_id).first()
    if not cheque:
        raise HTTPException(status_code=404, detail="Cheque no encontrado")

    if cheque.estado != EstadoCheque.EN_CARTERA:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden cambiar cheques en cartera. Estado actual: {cheque.estado.value}"
        )

    # ═══════════════════════════════════════════
    # REGLA C: Inserción automática al cambiar estado
    # ═══════════════════════════════════════════

    if data.nuevo_estado == EstadoCheque.DEPOSITADO:
        # Validar que se indicó el banco destino
        if not data.banco_destino:
            raise HTTPException(
                status_code=400,
                detail="Debe indicar el banco destino (BNA o BBVA) para depositar el cheque"
            )

        # Determinar la categoría según el banco
        if data.banco_destino.upper() == "BNA":
            categoria = CategoriaMov.MOV_BNA
        elif data.banco_destino.upper() == "BBVA":
            categoria = CategoriaMov.MOV_BBVA
        else:
            raise HTTPException(status_code=400, detail="Banco destino debe ser BNA o BBVA")

        # Crear ingreso automático en Caja_Diaria
        movimiento = CajaDiaria(
            fecha=cheque.fecha_vto,
            concepto=f"Depósito cheque #{cheque.numero_cheque} - {cheque.librador} en {data.banco_destino}",
            categoria_movimiento=categoria,
            ingreso=cheque.importe,
            egreso=0.0,
            entidad_relacionada_id=cheque.id,
            entidad_tipo="cheque_tercero",
            es_automatico=True,  # Marcado como automático (Regla C)
            es_ajuste=False,
        )
        db.add(movimiento)
        cheque.destino_id = f"Banco {data.banco_destino}"

    elif data.nuevo_estado == EstadoCheque.ENTREGADO_A_TERCERO:
        # Validar datos de entrega
        if not data.destino_nombre:
            raise HTTPException(
                status_code=400,
                detail="Debe indicar el nombre del destinatario del cheque"
            )
        if not data.categoria_caja:
            raise HTTPException(
                status_code=400,
                detail="Debe indicar la categoría de caja para registrar el egreso"
            )

        # Crear egreso automático en Caja_Diaria
        movimiento = CajaDiaria(
            fecha=cheque.fecha_vto,
            concepto=f"Cheque #{cheque.numero_cheque} entregado a {data.destino_nombre}",
            categoria_movimiento=data.categoria_caja,
            ingreso=0.0,
            egreso=cheque.importe,
            entidad_relacionada_id=cheque.id,
            entidad_tipo="cheque_tercero",
            es_automatico=True,  # Marcado como automático (Regla C)
            es_ajuste=False,
        )
        db.add(movimiento)
        cheque.destino_id = data.destino_nombre

    # Actualizar el estado del cheque
    cheque.estado = data.nuevo_estado
    db.commit()
    db.refresh(cheque)
    return cheque


def obtener_cheques_cartera(db: Session):
    """Lista cheques en cartera ordenados por fecha de vencimiento."""
    return (
        db.query(ChequeTercero)
        .filter(ChequeTercero.estado == EstadoCheque.EN_CARTERA)
        .order_by(ChequeTercero.fecha_vto.asc())
        .all()
    )


def obtener_cheques_terceros(db: Session, skip: int = 0, limit: int = 100):
    """Lista todos los cheques de terceros."""
    return (
        db.query(ChequeTercero)
        .order_by(ChequeTercero.fecha_ingreso.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ═══════════════════════════════════════════
# Cheques Emitidos
# ═══════════════════════════════════════════

def crear_cheque_emitido(db: Session, data: ChequeEmitidoCreate) -> ChequeEmitido:
    """Crea un nuevo cheque emitido (cuenta por pagar)."""
    cheque = ChequeEmitido(
        fecha_emision=data.fecha_emision,
        destino=data.destino,
        numero_cheque=data.numero_cheque,
        fecha_vto=data.fecha_vto,
        importe=data.importe,
        pagado=False,
    )
    db.add(cheque)
    db.commit()
    db.refresh(cheque)
    return cheque


def marcar_cheque_pagado(db: Session, cheque_id: int, pagado: bool = True) -> ChequeEmitido:
    """Marca un cheque emitido como pagado o pendiente."""
    cheque = db.query(ChequeEmitido).filter(ChequeEmitido.id == cheque_id).first()
    if not cheque:
        raise HTTPException(status_code=404, detail="Cheque emitido no encontrado")
    cheque.pagado = pagado
    db.commit()
    db.refresh(cheque)
    return cheque


def obtener_cheques_emitidos(db: Session, skip: int = 0, limit: int = 100):
    """Lista todos los cheques emitidos ordenados por fecha de vencimiento."""
    return (
        db.query(ChequeEmitido)
        .order_by(ChequeEmitido.fecha_vto.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
