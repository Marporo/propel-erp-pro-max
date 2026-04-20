from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.core.security import get_current_admin_user, get_password_hash

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(get_current_admin_user)] # Solo admins pueden acceder
)

@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    if usuario.email and db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está en uso")
    
    hashed_pwd = get_password_hash(usuario.password)
    nuevo_usuario = Usuario(
        username=usuario.username,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        hashed_password=hashed_pwd,
        rol=usuario.rol,
        activo=usuario.activo
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.put("/{usuario_id}", response_model=UsuarioOut)
def editar_usuario(usuario_id: int, usuario_in: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = usuario_in.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        update_data["debe_cambiar_clave"] = True
    
    for key, value in update_data.items():
        setattr(usuario, key, value)
        
    db.commit()
    db.refresh(usuario)
    return usuario
