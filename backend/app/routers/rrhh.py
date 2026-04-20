"""
Router: RRHH
Endpoints para movimientos de personal (dispara REGLA B automáticamente).
"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_active_operator
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rrhh_movimiento import RRHHMovimientoCreate, RRHHMovimientoResponse
from app.schemas.empleado import EmpleadoFichaResponse
from app.services import rrhh_service

router = APIRouter(prefix="/api/rrhh", tags=["RRHH"])


@router.post("/movimientos", response_model=RRHHMovimientoResponse, status_code=201, dependencies=[Depends(get_current_active_operator)])
def registrar_movimiento(data: RRHHMovimientoCreate, db: Session = Depends(get_db)):
    """
    Registra un movimiento de RRHH (ingreso/trabajo o egreso/pago).
    REGLA B: Si es egreso → crea 2 registros en Caja Diaria automáticamente.
    """
    mov = rrhh_service.registrar_movimiento(db, data)
    return RRHHMovimientoResponse(
        id=mov.id,
        empleado_id=mov.empleado_id,
        fecha=mov.fecha,
        concepto=mov.concepto,
        ingreso=mov.ingreso,
        egreso=mov.egreso,
        origen_fondo_pago=mov.origen_fondo_pago,
        empleado_nombre=mov.empleado.nombre if mov.empleado else None,
    )


@router.get("/movimientos/{empleado_id}", response_model=list[RRHHMovimientoResponse])
def listar_movimientos(empleado_id: int, db: Session = Depends(get_db)):
    """Lista todos los movimientos de un empleado."""
    movs = rrhh_service.obtener_movimientos_empleado(db, empleado_id)
    result = []
    for m in movs:
        result.append(RRHHMovimientoResponse(
            id=m.id,
            empleado_id=m.empleado_id,
            fecha=m.fecha,
            concepto=m.concepto,
            ingreso=m.ingreso,
            egreso=m.egreso,
            origen_fondo_pago=m.origen_fondo_pago,
            empleado_nombre=m.empleado.nombre if m.empleado else None,
        ))
    return result


@router.get("/ficha/{empleado_id}", response_model=EmpleadoFichaResponse)
def obtener_ficha(empleado_id: int, db: Session = Depends(get_db)):
    """
    Obtiene la ficha financiera del empleado:
    total ingresos, total egresos, y saldo (lo que el taller le debe).
    """
    return rrhh_service.obtener_ficha_empleado(db, empleado_id)
