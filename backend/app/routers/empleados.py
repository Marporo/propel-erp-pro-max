"""
Router: Empleados
Endpoints CRUD para la gestión de empleados.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.empleado import Empleado
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse

router = APIRouter(prefix="/api/empleados", tags=["Empleados"])


@router.get("/", response_model=list[EmpleadoResponse])
def listar_empleados(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos los empleados."""
    return db.query(Empleado).order_by(Empleado.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=EmpleadoResponse, status_code=201)
def crear_empleado(data: EmpleadoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo empleado."""
    empleado = Empleado(nombre=data.nombre)
    db.add(empleado)
    db.commit()
    db.refresh(empleado)
    return empleado


@router.get("/{empleado_id}", response_model=EmpleadoResponse)
def obtener_empleado(empleado_id: int, db: Session = Depends(get_db)):
    """Obtiene un empleado por ID."""
    from fastapi import HTTPException
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


@router.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(empleado_id: int, data: EmpleadoUpdate, db: Session = Depends(get_db)):
    """Actualiza un empleado existente."""
    from fastapi import HTTPException
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(empleado, key, value)

    db.commit()
    db.refresh(empleado)
    return empleado


@router.delete("/{empleado_id}", status_code=204)
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    """Elimina un empleado (solo si no tiene movimientos asociados)."""
    from fastapi import HTTPException
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    if empleado.movimientos.count() > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar un empleado con movimientos")
    db.delete(empleado)
    db.commit()
