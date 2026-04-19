"""
Servicio: Dashboard
Calcula los resúmenes financieros para las tarjetas del Dashboard.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.caja_diaria import CajaDiaria
from app.models.cheque_tercero import ChequeTercero
from app.models.venta import Venta
from app.models.pago_venta import PagoVenta
from app.core.enums import CategoriaMov, EstadoCheque


def obtener_resumen(db: Session) -> dict:
    """
    Calcula todos los saldos para el Dashboard:
    - Saldo Efectivo: Σ ingresos - Σ egresos en MOV_EFECTIVO
    - Saldo BNA: Σ ingresos - Σ egresos en MOV_BNA
    - Saldo BBVA: Σ ingresos - Σ egresos en MOV_BBVA
    - Total cheques en cartera: Σ importes de cheques EN_CARTERA
    - Cuentas por cobrar: Σ (total_venta - pagos_realizados)
    """
    # Saldo por categoría en Caja Diaria
    def _saldo_categoria(categoria: CategoriaMov) -> float:
        result = (
            db.query(
                func.coalesce(func.sum(CajaDiaria.ingreso), 0.0) -
                func.coalesce(func.sum(CajaDiaria.egreso), 0.0)
            )
            .filter(CajaDiaria.categoria_movimiento == categoria)
            .scalar()
        )
        return round(float(result), 2)

    saldo_efectivo = _saldo_categoria(CategoriaMov.MOV_EFECTIVO)
    saldo_bna = _saldo_categoria(CategoriaMov.MOV_BNA)
    saldo_bbva = _saldo_categoria(CategoriaMov.MOV_BBVA)

    # Cheques en cartera
    cheques_cartera = (
        db.query(
            func.coalesce(func.sum(ChequeTercero.importe), 0.0),
            func.count(ChequeTercero.id),
        )
        .filter(ChequeTercero.estado == EstadoCheque.EN_CARTERA)
        .first()
    )
    total_cheques = round(float(cheques_cartera[0]), 2)
    cantidad_cheques = int(cheques_cartera[1])

    # Cuentas por cobrar (saldo deudor de todas las ventas)
    ventas = db.query(Venta).all()
    cuentas_por_cobrar = sum(v.saldo_deudor for v in ventas if v.saldo_deudor > 0)

    return {
        "saldo_efectivo": saldo_efectivo,
        "saldo_bna": saldo_bna,
        "saldo_bbva": saldo_bbva,
        "total_cheques_cartera": total_cheques,
        "cantidad_cheques_cartera": cantidad_cheques,
        "cuentas_por_cobrar": round(cuentas_por_cobrar, 2),
    }
