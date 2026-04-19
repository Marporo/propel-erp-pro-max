"""
Servicio: Pagos de Ventas
Implementa la REGLA A de automatización.

═══════════════════════════════════════════════════════════════
REGLA A — Cobro a Clientes
═══════════════════════════════════════════════════════════════
Cuando se registra un Pago_Venta:
  • Si metodo_pago ∈ {Efectivo, BNA, BBVA, Apps}:
    → Crea registro AUTOMÁTICO en Caja_Diaria como ingreso
      en la categoría correspondiente (Mov_Efectivo, Mov_BNA, etc.)
  • Si metodo_pago == Cheque:
    → Crea registro en Cheques_Terceros con estado "En Cartera"
═══════════════════════════════════════════════════════════════
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.pago_venta import PagoVenta
from app.models.venta import Venta
from app.models.caja_diaria import CajaDiaria
from app.models.cheque_tercero import ChequeTercero
from app.core.enums import MetodoPago, EstadoCheque, METODO_PAGO_A_CATEGORIA
from app.schemas.pago_venta import PagoVentaCreate


def registrar_pago(db: Session, data: PagoVentaCreate) -> PagoVenta:
    """
    Registra un pago de una venta y dispara la REGLA A.
    """
    # Verificar que la venta exista
    venta = db.query(Venta).filter(Venta.id == data.venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Validar que el monto no exceda el saldo deudor
    if data.monto > venta.saldo_deudor:
        raise HTTPException(
            status_code=400,
            detail=f"El monto ({data.monto}) excede el saldo deudor ({venta.saldo_deudor})"
        )

    # Crear el registro de pago
    pago = PagoVenta(
        venta_id=data.venta_id,
        fecha=data.fecha,
        monto=data.monto,
        metodo_pago=data.metodo_pago,
    )
    db.add(pago)
    db.flush()  # Para obtener el ID del pago antes del commit

    # ═══════════════════════════════════════════
    # REGLA A: Inserción automática según método
    # ═══════════════════════════════════════════

    if data.metodo_pago != MetodoPago.CHEQUE:
        # Método NO es cheque → crear ingreso en Caja_Diaria
        categoria = METODO_PAGO_A_CATEGORIA[data.metodo_pago]
        nombre_cliente = venta.cliente.nombre if venta.cliente else "N/A"

        movimiento_caja = CajaDiaria(
            fecha=data.fecha,
            concepto=f"Cobro Factura {venta.factura_remito or 'S/N'} - Cliente {nombre_cliente}",
            categoria_movimiento=categoria,
            ingreso=data.monto,
            egreso=0.0,
            entidad_relacionada_id=pago.id,
            entidad_tipo="pago_venta",
            es_automatico=True,  # Marcado como automático (Regla A)
            es_ajuste=False,
        )
        db.add(movimiento_caja)

    else:
        # Método ES cheque → crear registro en Cheques_Terceros
        if not data.cheque_banco or not data.cheque_numero or not data.cheque_fecha_vto:
            raise HTTPException(
                status_code=400,
                detail="Para pago con cheque debe indicar banco, número y fecha de vencimiento"
            )

        nombre_cliente = venta.cliente.nombre if venta.cliente else "N/A"

        cheque = ChequeTercero(
            fecha_ingreso=data.fecha,
            librador=nombre_cliente,
            banco=data.cheque_banco,
            numero_cheque=data.cheque_numero,
            importe=data.monto,
            fecha_vto=data.cheque_fecha_vto,
            observaciones=data.cheque_observaciones,
            estado=EstadoCheque.EN_CARTERA,  # Entra a cartera automáticamente
        )
        db.add(cheque)

    db.commit()
    db.refresh(pago)
    return pago


def obtener_pagos_venta(db: Session, venta_id: int):
    """Lista todos los pagos de una venta específica."""
    return db.query(PagoVenta).filter(PagoVenta.venta_id == venta_id).order_by(PagoVenta.fecha.desc()).all()
