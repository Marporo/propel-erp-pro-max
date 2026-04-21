# 🚀 Propel ERP Pro Max
Un Mini-ERP centralizado y completamente automatizado diseñado específicamente para la gestión administrativa, financiera y de recursos humanos de un taller mecánico.

## 📌 Contexto y Meta del Proyecto
El software resuelve la carga manual duplicada y desconectada que se genera al usar múltiples hojas de Excel para registrar Ventas, Caja Diaria, RRHH y Cheques. El sistema impone el principio del **"Dato Único"**: la información se ingresa una vez en el módulo correspondiente, y el backend actualiza de forma automática todos los registros financieros relacionados y los saldos del Dashboard.

---

## 🛠️ Stack Tecnológico

### Backend (Cerebro & Lógica de Negocios)
* **Lenguaje:** Python 3.9+
* **Framework:** FastAPI (asíncrono y ultra rápido)
* **Seguridad:** Autenticación JWT (Bearer Token) con hashing de claves (BCrypt).
* **ORM:** SQLAlchemy 2.0
* **Base de Datos:** SQLite (ligera, ideal para tráfico interno)
* **Validación:** Pydantic

### Frontend (Interfaz Gráfica)
* **Librería Core:** React 18
* **Herramienta de Build:** Vite
* **Estilos:** TailwindCSS v4 (Diseño estricto corporativo, modo claro, sin bordes burbuja)
* **Íconos & Notificaciones:** Lucide React & React Hot Toast
* **Cliente HTTP:** Axios (Redireccionado mediante Proxy de Vite con interceptor de tokens)

---

## 🔒 Seguridad y Roles
El sistema cuenta con un control de acceso basado en roles (RBAC) para proteger la integridad de los datos financieros:

1.  **ADMIN (Administrador):** Acceso total. Puede gestionar usuarios, resetear contraseñas y ver todos los informes.
2.  **OPERADOR:** Puede realizar todas las acciones operativas (ventas, cobros, rrhh, caja), pero no tiene acceso al panel de gestión de usuarios.
3.  **VISOR:** Acceso de **Solo Lectura**. Puede ver todas las tablas, filtros y dashboard, pero no puede crear, editar ni eliminar ningún registro (botones deshabilitados e integridad forzada por el servidor).

### 🚀 Flujo de Onboarding de Seguridad
Para garantizar la privacidad, los nuevos usuarios creados por el administrador reciben una contraseña temporal (`Propel2024!`). Al iniciar sesión por primera vez, el sistema los redirige obligatoriamente a una pantalla de **Cambio de Contraseña**, impidiendo el acceso al resto de las funciones hasta que establezcan su propia clave privada.

---

## ⚙️ Reglas de Negocio Automatizadas

El núcleo del sistema depende de 4 reglas de automatización que evitan el descuadre de fondos:

* **[Regla A] Cobro de Ventas:** Si una venta se paga con `[Efectivo, Transf BNA, Transf BBVA, Apps]`, el dinero ingresa **automáticamente** a la Caja Diaria con origen "Auto". Si se paga con `Cheque`, impacta directamente en la tabla de *Cheques Terceros en Cartera*.
* **[Regla B] Pago a RRHH:** Al cargar un pago a un empleado, el sistema registra dos movimientos encadenados: genera un **Ingreso** (retirando fondos desde Efectivo/Bancos hacia la Caja Gasto_Taller) y luego genera un **Egreso** en Gasto_Taller concretando el pago.
* **[Regla C] Cheques de Terceros:** Cuando un cheque depositado en cartera se marca como "depositado", el backend dispara automáticamente un impacto positivo en la cuenta bancaria asignada en la Caja Diaria.
* **[Regla D] Protección de Caja Diaria:** El módulo visual de Caja prohíbe terminantemente la alteración o carga manual en categorías bloqueadas (`Gasto_Taller`, `Apps`). Sólo permite generar gastos regulares en categorías libres (`G_Casa`, `G_Banco`, `Casa_Fabi`, `Córdoba`).

---

## 💻 Manual de Uso Instalación / Ejecución

Para iniciar la aplicación bajo entorno de desarrollo local, se requieren abrir **dos consolas (terminales)** en paralelo:

### 1. Iniciar el Backend (Terminal 1)
```bash
# Posicionarse en la carpeta
cd backend

# Activar el entorno virtual de Python
source venv/bin/activate

# Encender el servidor
uvicorn app.main:app --reload --port 8000
```
> **Nota:** La documentación generada automáticamente de la API puede ser visitada en `http://localhost:8000/docs`.

### 2. Iniciar el Frontend (Terminal 2)
```bash
# Posicionarse en la carpeta
cd frontend

# Encender el servidor React en modo live
npm run dev
```
> **Nota:** La aplicación se servirá en `http://localhost:5173`.

---

## 🐳 Despliegue con Docker (Recomendado para Producción)

Si tienes Docker instalado, puedes encender todo el sistema con un solo comando sin instalar dependencias manualmente:

```bash
# Construir y encender los contenedores
docker-compose up --build -d
```

*   **Interfaz:** Accede a `http://localhost`.
*   **API / Documentación:** `http://localhost/api/docs`.
*   **Persistencia:** La base de datos se guarda en `backend/propel_erp.db`, permitiendo que los datos sobrevivan a reinicios de contenedores.

---

## 📁 Arquitectura de Carpetas

```
sistema_admin_taller/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Core de la API FastAPI
│   │   ├── database.py             # Config de SQLAlchemy
│   │   ├── core/
│   │   │   ├── enums.py            # Constantes financieras y roles
│   │   │   └── security.py         # Lógica de JWT y Roles
│   │   ├── models/                 # Modelos ORM BD (Tablas)
│   │   ├── schemas/                # Modelos Pydantic (Validación In/Out)
│   │   ├── services/               # Lógica de reglas de negocio
│   │   └── routers/                # Endpoints (Rutas API protegidas)
│   └── propel_erp.db               # Base de datos SQLite local
│
└── frontend/
    ├── src/
    │   ├── api/axios.js            # Interceptor global de seguridad
    │   ├── context/AuthContext.jsx # Gestión de estado de sesión
    │   ├── components/layout/      # Sidebar dinámica por rol
    │   ├── components/ui/          # Componentes reutilizables (Modales, Filtros)
    │   ├── pages/                  # Las vistas principales del ERP
    │   └── index.css               # Diseño global unificado
    └── vite.config.js              # Proxy para evitar CORS
```

---
*Desarrollado para máxima escalabilidad y simplicidad administrativa.*

*Despliegue automático configurado con éxito.*