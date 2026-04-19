"""
Servicio: RRHH Movimientos
Implementa la REGLA B de automatización.

═══════════════════════════════════════════════════════════════
REGLA B — Pago a Empleados
═══════════════════════════════════════════════════════════════
Cuando se registra un RRHH_Movimiento con egreso > 0:
  → Crear 2 registros en Caja_Diaria:
    1. Egreso bajo GASTO_TALLER (categorización del gasto del negocio)
    2. Egreso bajo MOV_EFECTIVO/MOV_BNA/MOV_BBVA (descuento del saldo
       según origen_fondo_pago)
═══════════════════════════════════════════════════════════════
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models.rrhh_movimiento import RRHHMovimiento
from app.models.empleado import Empleado
from app.models.caja_diaria import CajaDiaria
from app.core.enums import CategoriaMov, ORIGEN_FONDO_A_CATEGORIA
from app.schemas.rrhh_movimiento import RRHHMovimientoCreate


def registrar_movimiento(db: Session, data: RRHHMovimientoCreate) -> RRHHMovimiento:
    """
    Registra un movimiento de RRHH y dispara la REGLA B si es un egreso.
    """
    # Verificar que el empleado exista
    empleado = db.query(Empleado).filter(Empleado.id == data.empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Validar que si hay egreso, se indique el origen del fondo
    if data.egreso > 0 and not data.origen_fondo_pago:
        raise HTTPException(
            status_code=400,
            detail="Debe indicar el origen del fondo cuando se registra un egreso (pago al empleado)"
        )

    movimiento = RRHHMovimiento(
        empleado_id=data.empleado_id,
        fecha=data.fecha,
        concepto=data.concepto,
        ingreso=data.ingreso,
        egreso=data.egreso,
        origen_fondo_pago=data.origen_fondo_pago,
    )
    db.add(movimiento)
    db.flush()  # Para obtener el ID antes del commit

    # ═══════════════════════════════════════════
    # REGLA B: Doble inserción automática en Caja
    # ═══════════════════════════════════════════

    if data.egreso > 0:
        # Registro 1: Egreso como GASTO_TALLER (categorización del gasto)
        gasto_taller = CajaDiaria(
            fecha=data.fecha,
            concepto=f"Pago a {empleado.nombre} - {data.concepto}",
            categoria_movimiento=CategoriaMov.GASTO_TALLER,
            ingreso=0.0,
            egreso=data.egreso,
            entidad_relacionada_id=movimiento.id,
            entidad_tipo="rrhh_movimiento",
            es_automatico=True,  # Marcado como automático (Regla B)
            es_ajuste=False,
        )
        db.add(gasto_taller)

        # Registro 2: Egreso en la categoría del origen del fondo
        # (descuenta del saldo de Efectivo, BNA o BBVA)
        categoria_origen = ORIGEN_FONDO_A_CATEGORIA[data.origen_fondo_pago]
        salida_fondo = CajaDiaria(
            fecha=data.fecha,
            concepto=f"Pago a {empleado.nombre} - {data.concepto} (salida de {data.origen_fondo_pago.value})",
            categoria_movimiento=categoria_origen,
            ingreso=0.0,
            egreso=data.egreso,
            entidad_relacionada_id=movimiento.id,
            entidad_tipo="rrhh_movimiento",
            es_automatico=True,  # Marcado como automático (Regla B)
            es_ajuste=False,
        )
        db.add(salida_fondo)

    db.commit()
    db.refresh(movimiento)
    return movimiento


def obtener_movimientos_empleado(db: Session, empleado_id: int):
    """Lista todos los movimientos de un empleado ordenados por fecha."""
    return (
        db.query(RRHHMovimiento)
        .filter(RRHHMovimiento.empleado_id == empleado_id)
        .order_by(RRHHMovimiento.fecha.desc())
        .all()
    )


def obtener_ficha_empleado(db: Session, empleado_id: int) -> dict:
    """
    Calcula la ficha financiera del empleado:
    - total_ingresos: suma de todo lo que ganó (trabajos)
    - total_egresos: suma de todo lo que se le pagó
    - saldo: ingresos - egresos (lo que el taller le debe)
    """
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    total_ingresos = (
        db.query(func.coalesce(func.sum(RRHHMovimiento.ingreso), 0.0))
        .filter(RRHHMovimiento.empleado_id == empleado_id)
        .scalar()
    )
    total_egresos = (
        db.query(func.coalesce(func.sum(RRHHMovimiento.egreso), 0.0))
        .filter(RRHHMovimiento.empleado_id == empleado_id)
        .scalar()
    )

    return {
        "id": empleado.id,
        "nombre": empleado.nombre,
        "total_ingresos": round(float(total_ingresos), 2),
        "total_egresos": round(float(total_egresos), 2),
        "saldo": round(float(total_ingresos) - float(total_egresos), 2),
    }
