"""
Modelo: Empleado
Representa a los empleados/personal del taller.
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(200), nullable=False, index=True)

    # Relación: un empleado puede tener muchos movimientos de RRHH
    movimientos = relationship("RRHHMovimiento", back_populates="empleado", lazy="dynamic")

    def __repr__(self):
        return f"<Empleado(id={self.id}, nombre='{self.nombre}')>"
