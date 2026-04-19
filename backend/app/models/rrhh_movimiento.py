"""
Modelo: RRHHMovimiento (reemplaza "Personal de Taller")
Registra ingresos (trabajo ganado) y egresos (pagos) de empleados.
Dispara la REGLA B de automatización (ver rrhh_service.py).
"""
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.enums import OrigenFondo
from datetime import date


class RRHHMovimiento(Base):
    __tablename__ = "rrhh_movimientos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, default=date.today)
    concepto = Column(String(300), nullable=False)
    # ingreso = trabajo ganado por el empleado (lo que el taller le debe)
    ingreso = Column(Float, nullable=False, default=0.0)
    # egreso = pago realizado al empleado (el taller le paga)
    egreso = Column(Float, nullable=False, default=0.0)
    # origen_fondo_pago: de dónde sale el dinero cuando es un egreso
    # Solo se completa cuando egreso > 0
    origen_fondo_pago = Column(SAEnum(OrigenFondo), nullable=True)

    # Relación con el empleado
    empleado = relationship("Empleado", back_populates="movimientos")

    def __repr__(self):
        return f"<RRHHMovimiento(id={self.id}, empleado_id={self.empleado_id}, ingreso={self.ingreso}, egreso={self.egreso})>"
