"""
Modelo: ChequeTercero (reemplaza "Ingreso de Cheques")
Registra cheques recibidos de terceros (clientes, proveedores).
Dispara la REGLA C de automatización (ver cheque_service.py).
"""
from sqlalchemy import Column, Integer, String, Float, Date, Text, Enum as SAEnum
from app.database import Base
from app.core.enums import EstadoCheque
from datetime import date


class ChequeTercero(Base):
    __tablename__ = "cheques_terceros"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha_ingreso = Column(Date, nullable=False, default=date.today)
    librador = Column(String(200), nullable=False)
    banco = Column(String(100), nullable=False)
    numero_cheque = Column(String(50), nullable=False, index=True)
    importe = Column(Float, nullable=False)
    fecha_vto = Column(Date, nullable=False)
    observaciones = Column(Text, nullable=True)
    estado = Column(SAEnum(EstadoCheque), nullable=False, default=EstadoCheque.EN_CARTERA)
    # destino_id: a quién se entregó o en qué cuenta se depositó
    # Se completa cuando el estado cambia a DEPOSITADO o ENTREGADO_A_TERCERO
    destino_id = Column(String(200), nullable=True)

    @property
    def dias_para_vencimiento(self) -> int:
        """Calcula cuántos días faltan para el vencimiento del cheque."""
        delta = self.fecha_vto - date.today()
        return delta.days

    def __repr__(self):
        return f"<ChequeTercero(id={self.id}, nro={self.numero_cheque}, estado={self.estado})>"
