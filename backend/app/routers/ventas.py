"""
Router: Ventas
Endpoints para la gestión de ventas/facturación.
"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_active_operator
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.venta import VentaCreate, VentaUpdate, VentaResponse
from app.services import venta_service

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


@router.get("/", response_model=list[VentaResponse])
def listar_ventas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todas las ventas con saldo deudor calculado."""
    ventas = venta_service.obtener_ventas(db, skip, limit)
    result = []
    for v in ventas:
        result.append(VentaResponse(
            id=v.id,
            fecha=v.fecha,
            cliente_id=v.cliente_id,
            factura_remito=v.factura_remito,
            importe_neto=v.importe_neto,
            lleva_iva=v.lleva_iva,
            total=v.total,
            costo_repuestos=v.costo_repuestos,
            observaciones=v.observaciones,
            saldo_deudor=v.saldo_deudor,
            estado_pago=v.estado_pago,
            cliente_nombre=v.cliente.nombre if v.cliente else None,
        ))
    return result


@router.post("/", response_model=VentaResponse, status_code=201, dependencies=[Depends(get_current_active_operator)])
def crear_venta(data: VentaCreate, db: Session = Depends(get_db)):
    """Crea una nueva venta. El total se calcula automáticamente."""
    v = venta_service.crear_venta(db, data)
    return VentaResponse(
        id=v.id,
        fecha=v.fecha,
        cliente_id=v.cliente_id,
        factura_remito=v.factura_remito,
        importe_neto=v.importe_neto,
        lleva_iva=v.lleva_iva,
        total=v.total,
        costo_repuestos=v.costo_repuestos,
        observaciones=v.observaciones,
        saldo_deudor=v.saldo_deudor,
        estado_pago=v.estado_pago,
        cliente_nombre=v.cliente.nombre if v.cliente else None,
    )


@router.get("/{venta_id}", response_model=VentaResponse)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    """Obtiene una venta por ID con saldo deudor."""
    v = venta_service.obtener_venta(db, venta_id)
    return VentaResponse(
        id=v.id,
        fecha=v.fecha,
        cliente_id=v.cliente_id,
        factura_remito=v.factura_remito,
        importe_neto=v.importe_neto,
        lleva_iva=v.lleva_iva,
        total=v.total,
        costo_repuestos=v.costo_repuestos,
        observaciones=v.observaciones,
        saldo_deudor=v.saldo_deudor,
        estado_pago=v.estado_pago,
        cliente_nombre=v.cliente.nombre if v.cliente else None,
    )


@router.put("/{venta_id}", response_model=VentaResponse, dependencies=[Depends(get_current_active_operator)])
def actualizar_venta(venta_id: int, data: VentaUpdate, db: Session = Depends(get_db)):
    """Actualiza una venta. Recalcula total si cambia importe/IVA."""
    v = venta_service.actualizar_venta(db, venta_id, data)
    return VentaResponse(
        id=v.id,
        fecha=v.fecha,
        cliente_id=v.cliente_id,
        factura_remito=v.factura_remito,
        importe_neto=v.importe_neto,
        lleva_iva=v.lleva_iva,
        total=v.total,
        costo_repuestos=v.costo_repuestos,
        observaciones=v.observaciones,
        saldo_deudor=v.saldo_deudor,
        estado_pago=v.estado_pago,
        cliente_nombre=v.cliente.nombre if v.cliente else None,
    )


@router.delete("/{venta_id}", status_code=204, dependencies=[Depends(get_current_active_operator)])
def eliminar_venta(venta_id: int, db: Session = Depends(get_db)):
    """Elimina una venta (solo si no tiene pagos)."""
    venta_service.eliminar_venta(db, venta_id)
