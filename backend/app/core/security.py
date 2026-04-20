"""
Núcleo de Seguridad: JWT y Hashing
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario

# --- Configuración (En producción mover a variables de entorno) ---
SECRET_KEY = "propel-erp-pro-max-super-secret-key-change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# --- Inicializaciones ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# URL a la que el frontend envía las credenciales
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- Funciones de Utilidad ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependencia Principal para Proteger Rutas ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None or not user.activo:
        raise credentials_exception
    return user

def get_current_admin_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    from app.core.enums import RolUsuario
    if current_user.rol != RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes los privilegios necesarios para esta acción"
        )
    return current_user

def get_current_active_operator(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    from app.core.enums import RolUsuario
    if current_user.rol == RolUsuario.VISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los usuarios con rol Visor no pueden realizar modificaciones"
        )
    return current_user
