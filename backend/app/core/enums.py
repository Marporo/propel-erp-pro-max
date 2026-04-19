"""
Enums compartidos del sistema Propel ERP Pro Max.
Definen los valores válidos para métodos de pago, categorías de movimiento,
estados de cheques y orígenes de fondos.
"""
import enum


class MetodoPago(str, enum.Enum):
    """Métodos de pago disponibles para cobros a clientes."""
    EFECTIVO = "Efectivo"
    TRANSFERENCIA_BNA = "Transferencia BNA"
    TRANSFERENCIA_BBVA = "Transferencia BBVA"
    CHEQUE = "Cheque"
    APPS = "Apps"


class CategoriaMov(str, enum.Enum):
    """
    Categorías de movimiento en Caja Diaria.
    Cada categoría representa un 'libro' o 'columna' del libro mayor.
    """
    MOV_EFECTIVO = "Mov_Efectivo"
    MOV_BNA = "Mov_BNA"
    MOV_BBVA = "Mov_BBVA"
    GASTO_TALLER = "Gasto_Taller"
    G_CASA = "G_Casa"
    G_BANCO = "G_Banco"
    APPS = "Apps"
    CASA_FABI = "Casa_Fabi"
    CORDOBA = "Cordoba"


class EstadoCheque(str, enum.Enum):
    """Estados posibles de un cheque de tercero."""
    EN_CARTERA = "En Cartera"
    DEPOSITADO = "Depositado"
    ENTREGADO_A_TERCERO = "Entregado a Tercero"


class OrigenFondo(str, enum.Enum):
    """Origen del fondo utilizado para pagos (ej: pago a empleados)."""
    EFECTIVO = "Efectivo"
    BNA = "BNA"
    BBVA = "BBVA"


class RolUsuario(str, enum.Enum):
    """Roles de usuario (preparado, inactivo inicialmente)."""
    ADMIN = "admin"
    OPERADOR = "operador"
    VISOR = "visor"


# --- Mapeos auxiliares para las reglas de negocio ---

# Mapeo: MetodoPago -> CategoriaMov (Regla A)
METODO_PAGO_A_CATEGORIA = {
    MetodoPago.EFECTIVO: CategoriaMov.MOV_EFECTIVO,
    MetodoPago.TRANSFERENCIA_BNA: CategoriaMov.MOV_BNA,
    MetodoPago.TRANSFERENCIA_BBVA: CategoriaMov.MOV_BBVA,
    MetodoPago.APPS: CategoriaMov.APPS,
}

# Mapeo: OrigenFondo -> CategoriaMov (Regla B)
ORIGEN_FONDO_A_CATEGORIA = {
    OrigenFondo.EFECTIVO: CategoriaMov.MOV_EFECTIVO,
    OrigenFondo.BNA: CategoriaMov.MOV_BNA,
    OrigenFondo.BBVA: CategoriaMov.MOV_BBVA,
}

# Categorías permitidas para carga manual (Regla D)
CATEGORIAS_MANUALES = {
    CategoriaMov.G_CASA,
    CategoriaMov.G_BANCO,
    CategoriaMov.CASA_FABI,
    CategoriaMov.CORDOBA,
}

# Categorías permitidas para ajustes manuales (correcciones)
CATEGORIAS_AJUSTE_MANUAL = {
    CategoriaMov.MOV_EFECTIVO,
    CategoriaMov.MOV_BNA,
    CategoriaMov.MOV_BBVA,
}

# Categorías bloqueadas para carga manual (solo se generan automáticamente)
CATEGORIAS_SOLO_AUTOMATICAS = {
    CategoriaMov.GASTO_TALLER,
    CategoriaMov.APPS,
}
