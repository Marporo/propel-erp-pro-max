"""
Modelo: CajaDiaria (Libro Mayor)
Centraliza TODOS los movimientos financieros del taller.
Los registros pueden ser automáticos (Reglas A, B, C) o manuales (Regla D).
"""
from sqlalchemy import Column, Integer, String, Float, Date, Boolean, Enum as SAEnum
from app.database import Base
from app.core.enums import CategoriaMov
from datetime import date


class CajaDiaria(Base):
    __tablename__ = "caja_diaria"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha = Column(Date, nullable=False, default=date.today, index=True)
    concepto = Column(String(500), nullable=False)
    categoria_movimiento = Column(SAEnum(CategoriaMov), nullable=False, index=True)
    ingreso = Column(Float, nullable=False, default=0.0)
    egreso = Column(Float, nullable=False, default=0.0)

    # Trazabilidad: vincula con la entidad que originó este movimiento
    entidad_relacionada_id = Column(Integer, nullable=True)
    # Tipo de entidad: "pago_venta", "rrhh_movimiento", "cheque_tercero", "manual"
    entidad_tipo = Column(String(50), nullable=True)

    # Flags de control
    es_automatico = Column(Boolean, nullable=False, default=False)
    es_ajuste = Column(Boolean, nullable=False, default=False)

    @property
    def neto(self) -> float:
        """Diferencia entre ingreso y egreso para este movimiento."""
        return round(self.ingreso - self.egreso, 2)

    def __repr__(self):
        return f"<CajaDiaria(id={self.id}, cat={self.categoria_movimiento}, ingreso={self.ingreso}, egreso={self.egreso})>"
