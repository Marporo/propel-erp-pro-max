"""
Router: Dashboard
Endpoint para el resumen financiero del sistema.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.caja_diaria import ResumenCaja
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/resumen", response_model=ResumenCaja)
def obtener_resumen(db: Session = Depends(get_db)):
    """
    Devuelve el resumen financiero para las tarjetas del Dashboard:
    - Saldo Efectivo, BNA, BBVA
    - Total y cantidad de cheques en cartera
    - Cuentas por cobrar (saldo deudor de clientes)
    """
    return dashboard_service.obtener_resumen(db)
