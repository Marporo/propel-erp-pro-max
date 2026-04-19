"""
Propel ERP Pro Max — Entry Point
Mini-ERP para gestión administrativa y financiera de taller mecánico.

Configuración de FastAPI, CORS, y registro de routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    clientes,
    empleados,
    ventas,
    pagos_ventas,
    rrhh,
    cheques,
    caja_diaria,
    dashboard,
)

# Importar todos los modelos para que SQLAlchemy los registre
from app.models import (  # noqa: F401
    Cliente,
    Empleado,
    Venta,
    PagoVenta,
    RRHHMovimiento,
    ChequeTercero,
    ChequeEmitido,
    CajaDiaria,
    Usuario,
)

# Crear todas las tablas en la BD (solo en desarrollo)
Base.metadata.create_all(bind=engine)

# Instancia de la aplicación
app = FastAPI(
    title="Propel ERP Pro Max",
    description="Mini-ERP para gestión administrativa y financiera de taller mecánico",
    version="1.0.0",
)

# Configuración de CORS para permitir el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternativa
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(dashboard.router)
app.include_router(clientes.router)
app.include_router(empleados.router)
app.include_router(ventas.router)
app.include_router(pagos_ventas.router)
app.include_router(rrhh.router)
app.include_router(cheques.router)
app.include_router(caja_diaria.router)


@app.get("/")
def root():
    """Health check y bienvenida."""
    return {
        "app": "Propel ERP Pro Max",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }
