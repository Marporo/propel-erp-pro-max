"""
Configuración de la base de datos SQLite con SQLAlchemy.
Engine, SessionLocal y Base declarativa.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./propel_erp.db")

# SQLite requiere check_same_thread=False para FastAPI (multi-thread)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # Cambiar a True para debug SQL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency de FastAPI para obtener una sesión de BD.
    Se usa con Depends(get_db) en los routers.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
