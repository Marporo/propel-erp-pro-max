"""
Modelo: PagoVenta (reemplaza "Entregas")
Registra los pagos/cobros realizados contra una venta.
Dispara la REGLA A de automatización (ver pago_service.py).
"""
from sqlalchemy import Column, Integer, Float, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.enums import MetodoPago
from datetime import date


class PagoVenta(Base):
    __tablename__ = "pagos_ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, default=date.today)
    monto = Column(Float, nullable=False)
    metodo_pago = Column(SAEnum(MetodoPago), nullable=False)

    # Relación con la venta
    venta = relationship("Venta", back_populates="pagos")

    def __repr__(self):
        return f"<PagoVenta(id={self.id}, venta_id={self.venta_id}, monto={self.monto}, metodo={self.metodo_pago})>"
