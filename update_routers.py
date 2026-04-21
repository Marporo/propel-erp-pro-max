import os
import re

ROUTERS_DIR = "backend/app/routers"

routers_to_update = [
    "clientes.py", "empleados.py", "ventas.py", "pagos_ventas.py", 
    "rrhh.py", "cheques.py", "caja_diaria.py"
]

for filename in routers_to_update:
    filepath = os.path.join(ROUTERS_DIR, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, "r") as f:
        content = f.read()
    
    # Add import if not exists
    if "get_current_active_operator" not in content:
        import_stmt = "from app.core.security import get_current_active_operator\n"
        # Find first from fastapi import
        content = re.sub(r'(from fastapi import APIRouter.*?\n)', r'\1' + import_stmt, content)
    
    # Add dependency to post, put, delete
    # Replace @router.post("...", response_model=...) with @router.post("...", response_model=..., dependencies=[Depends(get_current_active_operator)])
    # We must be careful if dependencies already exist.
    
    # For post
    content = re.sub(r'(@router\.(post|put|delete)\([^)]*?)(?<!dependencies=\[Depends\(get_current_active_operator\)\])\)', r'\1, dependencies=[Depends(get_current_active_operator)])', content)
    
    with open(filepath, "w") as f:
        f.write(content)
print("Routers actualizados")
