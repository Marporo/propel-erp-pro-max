"""
Router: Clientes
Endpoints CRUD para la gestión de clientes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos los clientes."""
    return db.query(Cliente).order_by(Cliente.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=ClienteResponse, status_code=201)
def crear_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cliente."""
    cliente = Cliente(nombre=data.nombre)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por ID."""
    from fastapi import HTTPException
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, data: ClienteUpdate, db: Session = Depends(get_db)):
    """Actualiza un cliente existente."""
    from fastapi import HTTPException
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cliente, key, value)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Elimina un cliente (solo si no tiene ventas asociadas)."""
    from fastapi import HTTPException
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if cliente.ventas.count() > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar un cliente con ventas")
    db.delete(cliente)
    db.commit()
