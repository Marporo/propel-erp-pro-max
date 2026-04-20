"""
Propel ERP Pro Max — Entry Point
Mini-ERP para gestión administrativa y financiera de taller mecánico.

Configuración de FastAPI, CORS, y registro de routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth,
    clientes,
    empleados,
    ventas,
    pagos_ventas,
    rrhh,
    cheques,
    caja_diaria,
    dashboard,
)
from app.core.security import get_current_user, get_password_hash
from fastapi import Depends

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

# Crear todas las tablas en la BD
Base.metadata.create_all(bind=engine)

# Crear usuario admin por defecto si no existe
from app.database import SessionLocal
def create_initial_admin():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.username == "admin").first():
            print("Creando usuario admin inicial...")
            hashed_pwd = get_password_hash("admin123")
            admin_user = Usuario(
                username="admin",
                hashed_password=hashed_pwd,
                nombre_completo="Administrador",
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

create_initial_admin()

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
app.include_router(auth.router)

# Rutas protegidas (Requieren Token)
auth_dep = [Depends(get_current_user)]
app.include_router(dashboard.router, dependencies=auth_dep)
app.include_router(clientes.router, dependencies=auth_dep)
app.include_router(empleados.router, dependencies=auth_dep)
app.include_router(ventas.router, dependencies=auth_dep)
app.include_router(pagos_ventas.router, dependencies=auth_dep)
app.include_router(rrhh.router, dependencies=auth_dep)
app.include_router(cheques.router, dependencies=auth_dep)
app.include_router(caja_diaria.router, dependencies=auth_dep)


@app.get("/")
def root():
    """Health check y bienvenida."""
    return {
        "app": "Propel ERP Pro Max",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }
