"""
Modelo: Venta (reemplaza Facturación)
Registra las ventas/servicios realizados a clientes.
El campo 'total' se calcula automáticamente en el backend.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha = Column(Date, nullable=False, default=date.today, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False, index=True)
    factura_remito = Column(String(100), nullable=True)
    importe_neto = Column(Float, nullable=False, default=0.0)
    lleva_iva = Column(Boolean, nullable=False, default=False)
    # total se calcula: importe_neto * 1.21 si lleva_iva, sino importe_neto
    total = Column(Float, nullable=False, default=0.0)
    costo_repuestos = Column(Float, nullable=False, default=0.0)
    observaciones = Column(Text, nullable=True)

    # Relaciones
    cliente = relationship("Cliente", back_populates="ventas")
    pagos = relationship("PagoVenta", back_populates="venta", lazy="dynamic")

    @property
    def saldo_deudor(self) -> float:
        """Calcula el saldo pendiente: Total - Sumatoria de pagos realizados."""
        total_pagado = sum(p.monto for p in self.pagos)
        return round(self.total - total_pagado, 2)

    @property
    def estado_pago(self) -> str:
        """Devuelve el estado del pago: Pagada, Pago Parcial, o Pendiente."""
        saldo = self.saldo_deudor
        if saldo <= 0:
            return "Pagada"
        elif saldo < self.total:
            return "Pago Parcial"
        else:
            return "Pendiente"

    def calcular_total(self):
        """Calcula y setea el total basado en importe_neto y lleva_iva."""
        if self.lleva_iva:
            self.total = round(self.importe_neto * 1.21, 2)
        else:
            self.total = round(self.importe_neto, 2)

    def __repr__(self):
        return f"<Venta(id={self.id}, factura='{self.factura_remito}', total={self.total})>"
