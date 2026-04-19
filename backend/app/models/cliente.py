"""
Modelo: Cliente
Representa a los clientes del taller mecánico.
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(200), nullable=False, index=True)

    # Relación: un cliente puede tener muchas ventas
    ventas = relationship("Venta", back_populates="cliente", lazy="dynamic")

    def __repr__(self):
        return f"<Cliente(id={self.id}, nombre='{self.nombre}')>"
