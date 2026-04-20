"""
Router de Autenticación
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.core.security import (
    verify_password, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    get_password_hash
)
from app.schemas.auth import Token, UsuarioBasico, CambiarClaveInicial

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación"]
)

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UsuarioBasico)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Devuelve la información del usuario logueado actualmente"""
    return current_user

@router.post("/cambiar-clave-inicial", response_model=UsuarioBasico)
def cambiar_clave_inicial(payload: CambiarClaveInicial, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.debe_cambiar_clave:
        raise HTTPException(status_code=400, detail="El usuario ya cambió su clave inicial")
    
    current_user.hashed_password = get_password_hash(payload.nueva_clave)
    current_user.debe_cambiar_clave = False
    db.commit()
    db.refresh(current_user)
    return current_user
