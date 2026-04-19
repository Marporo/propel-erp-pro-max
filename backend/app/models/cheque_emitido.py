"""
Modelo: ChequeEmitido (reemplaza "Cuentas por Pagar")
Registra cheques emitidos por el taller a proveedores/terceros.
"""
from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from app.database import Base
from datetime import date


class ChequeEmitido(Base):
    __tablename__ = "cheques_emitidos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha_emision = Column(Date, nullable=False, default=date.today)
    destino = Column(String(200), nullable=False)
    numero_cheque = Column(String(50), nullable=False, index=True)
    fecha_vto = Column(Date, nullable=False)
    importe = Column(Float, nullable=False)
    pagado = Column(Boolean, nullable=False, default=False)

    @property
    def dias_para_vencimiento(self) -> int:
        """Calcula cuántos días faltan para el vencimiento."""
        delta = self.fecha_vto - date.today()
        return delta.days

    def __repr__(self):
        return f"<ChequeEmitido(id={self.id}, nro={self.numero_cheque}, destino='{self.destino}')>"
