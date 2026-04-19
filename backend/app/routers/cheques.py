"""
Router: Cheques
Endpoints para cheques de terceros y emitidos (dispara REGLA C automáticamente).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.cheque_tercero import (
    ChequeTerceroCreate,
    ChequeTerceroResponse,
    CambioEstadoCheque,
)
from app.schemas.cheque_emitido import (
    ChequeEmitidoCreate,
    ChequeEmitidoResponse,
)
from app.services import cheque_service

router = APIRouter(prefix="/api/cheques", tags=["Cheques"])


# --- Cheques de Terceros ---

@router.get("/terceros", response_model=list[ChequeTerceroResponse])
def listar_cheques_terceros(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos los cheques de terceros."""
    cheques = cheque_service.obtener_cheques_terceros(db, skip, limit)
    result = []
    for c in cheques:
        result.append(ChequeTerceroResponse(
            id=c.id,
            fecha_ingreso=c.fecha_ingreso,
            librador=c.librador,
            banco=c.banco,
            numero_cheque=c.numero_cheque,
            importe=c.importe,
            fecha_vto=c.fecha_vto,
            observaciones=c.observaciones,
            estado=c.estado,
            destino_id=c.destino_id,
            dias_para_vencimiento=c.dias_para_vencimiento,
        ))
    return result


@router.get("/cartera", response_model=list[ChequeTerceroResponse])
def listar_cartera(db: Session = Depends(get_db)):
    """Lista cheques en cartera ordenados por fecha de vencimiento."""
    cheques = cheque_service.obtener_cheques_cartera(db)
    result = []
    for c in cheques:
        result.append(ChequeTerceroResponse(
            id=c.id,
            fecha_ingreso=c.fecha_ingreso,
            librador=c.librador,
            banco=c.banco,
            numero_cheque=c.numero_cheque,
            importe=c.importe,
            fecha_vto=c.fecha_vto,
            observaciones=c.observaciones,
            estado=c.estado,
            destino_id=c.destino_id,
            dias_para_vencimiento=c.dias_para_vencimiento,
        ))
    return result


@router.post("/terceros", response_model=ChequeTerceroResponse, status_code=201)
def crear_cheque_tercero(data: ChequeTerceroCreate, db: Session = Depends(get_db)):
    """Crea un cheque de tercero manualmente (ingresa a cartera)."""
    c = cheque_service.crear_cheque_tercero(db, data)
    return ChequeTerceroResponse(
        id=c.id,
        fecha_ingreso=c.fecha_ingreso,
        librador=c.librador,
        banco=c.banco,
        numero_cheque=c.numero_cheque,
        importe=c.importe,
        fecha_vto=c.fecha_vto,
        observaciones=c.observaciones,
        estado=c.estado,
        destino_id=c.destino_id,
        dias_para_vencimiento=c.dias_para_vencimiento,
    )


@router.patch("/terceros/{cheque_id}/estado", response_model=ChequeTerceroResponse)
def cambiar_estado(cheque_id: int, data: CambioEstadoCheque, db: Session = Depends(get_db)):
    """
    Cambia el estado de un cheque de tercero.
    REGLA C: 
    - Si pasa a DEPOSITADO → crea ingreso en Caja Diaria (BNA/BBVA).
    - Si pasa a ENTREGADO_A_TERCERO → crea egreso en Caja Diaria.
    """
    c = cheque_service.cambiar_estado_cheque(db, cheque_id, data)
    return ChequeTerceroResponse(
        id=c.id,
        fecha_ingreso=c.fecha_ingreso,
        librador=c.librador,
        banco=c.banco,
        numero_cheque=c.numero_cheque,
        importe=c.importe,
        fecha_vto=c.fecha_vto,
        observaciones=c.observaciones,
        estado=c.estado,
        destino_id=c.destino_id,
        dias_para_vencimiento=c.dias_para_vencimiento,
    )


# --- Cheques Emitidos ---

@router.get("/emitidos", response_model=list[ChequeEmitidoResponse])
def listar_cheques_emitidos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos los cheques emitidos."""
    cheques = cheque_service.obtener_cheques_emitidos(db, skip, limit)
    result = []
    for c in cheques:
        result.append(ChequeEmitidoResponse(
            id=c.id,
            fecha_emision=c.fecha_emision,
            destino=c.destino,
            numero_cheque=c.numero_cheque,
            fecha_vto=c.fecha_vto,
            importe=c.importe,
            pagado=c.pagado,
            dias_para_vencimiento=c.dias_para_vencimiento,
        ))
    return result


@router.post("/emitidos", response_model=ChequeEmitidoResponse, status_code=201)
def crear_cheque_emitido(data: ChequeEmitidoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cheque emitido (cuenta por pagar)."""
    c = cheque_service.crear_cheque_emitido(db, data)
    return ChequeEmitidoResponse(
        id=c.id,
        fecha_emision=c.fecha_emision,
        destino=c.destino,
        numero_cheque=c.numero_cheque,
        fecha_vto=c.fecha_vto,
        importe=c.importe,
        pagado=c.pagado,
        dias_para_vencimiento=c.dias_para_vencimiento,
    )


@router.patch("/emitidos/{cheque_id}/pagado", response_model=ChequeEmitidoResponse)
def marcar_pagado(cheque_id: int, pagado: bool = True, db: Session = Depends(get_db)):
    """Marca un cheque emitido como pagado o pendiente."""
    c = cheque_service.marcar_cheque_pagado(db, cheque_id, pagado)
    return ChequeEmitidoResponse(
        id=c.id,
        fecha_emision=c.fecha_emision,
        destino=c.destino,
        numero_cheque=c.numero_cheque,
        fecha_vto=c.fecha_vto,
        importe=c.importe,
        pagado=c.pagado,
        dias_para_vencimiento=c.dias_para_vencimiento,
    )
