"""
Modelo: Usuario
Sistema de autenticación con roles (preparado, inactivo inicialmente).
"""
from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from app.database import Base
from app.core.enums import RolUsuario


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), nullable=True)
    hashed_password = Column(String(300), nullable=False)
    nombre_completo = Column(String(200), nullable=True)
    rol = Column(SAEnum(RolUsuario), nullable=False, default=RolUsuario.OPERADOR)
    activo = Column(Boolean, nullable=False, default=True)

    def __repr__(self):
        return f"<Usuario(id={self.id}, username='{self.username}', rol={self.rol})>"
