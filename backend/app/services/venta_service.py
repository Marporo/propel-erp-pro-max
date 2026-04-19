"""
Servicio: Ventas
CRUD de ventas con cálculo automático del total (IVA).
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.venta import Venta
from app.models.cliente import Cliente
from app.schemas.venta import VentaCreate, VentaUpdate


def crear_venta(db: Session, data: VentaCreate) -> Venta:
    """
    Crea una nueva venta y calcula el total automáticamente.
    Si lleva_iva=True → total = importe_neto * 1.21
    Si lleva_iva=False → total = importe_neto
    """
    # Verificar que el cliente exista
    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    venta = Venta(
        fecha=data.fecha,
        cliente_id=data.cliente_id,
        factura_remito=data.factura_remito,
        importe_neto=data.importe_neto,
        lleva_iva=data.lleva_iva,
        costo_repuestos=data.costo_repuestos,
        observaciones=data.observaciones,
    )
    # Cálculo automático del total
    venta.calcular_total()

    db.add(venta)
    db.commit()
    db.refresh(venta)
    return venta


def obtener_ventas(db: Session, skip: int = 0, limit: int = 100):
    """Lista todas las ventas con datos del cliente."""
    return db.query(Venta).order_by(Venta.fecha.desc()).offset(skip).limit(limit).all()


def obtener_venta(db: Session, venta_id: int) -> Venta:
    """Obtiene una venta por ID."""
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


def actualizar_venta(db: Session, venta_id: int, data: VentaUpdate) -> Venta:
    """Actualiza una venta y recalcula el total si cambian importe o IVA."""
    venta = obtener_venta(db, venta_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(venta, key, value)

    # Recalcular total si se modificó importe_neto o lleva_iva
    if "importe_neto" in update_data or "lleva_iva" in update_data:
        venta.calcular_total()

    db.commit()
    db.refresh(venta)
    return venta


def eliminar_venta(db: Session, venta_id: int):
    """Elimina una venta (solo si no tiene pagos asociados)."""
    venta = obtener_venta(db, venta_id)
    if venta.pagos.count() > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una venta que tiene pagos registrados"
        )
    db.delete(venta)
    db.commit()
