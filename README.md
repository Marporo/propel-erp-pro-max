# 🚀 Propel ERP Pro Max
Un Mini-ERP centralizado y completamente automatizado diseñado específicamente para la gestión administrativa, financiera y de recursos humanos de un taller mecánico.

## 📌 Contexto y Meta del Proyecto
El software resuelve la carga manual duplicada y desconectada que se genera al usar múltiples hojas de Excel para registrar Ventas, Caja Diaria, RRHH y Cheques. El sistema impone el principio del **"Dato Único"**: la información se ingresa una vez en el módulo correspondiente, y el backend actualiza de forma automática todos los registros financieros relacionados y los saldos del Dashboard.

---

## 🛠️ Stack Tecnológico

### Backend (Cerebro & Lógica de Negocios)
* **Lenguaje:** Python 3.9+
* **Framework:** FastAPI (asíncrono y ultra rápido)
* **ORM:** SQLAlchemy 2.0
* **Base de Datos:** SQLite (ligera, ideal para tráfico interno)
* **Validación:** Pydantic

### Frontend (Interfaz Gráfica)
* **Librería Core:** React 18
* **Herramienta de Build:** Vite
* **Estilos:** TailwindCSS v4 (Diseño estricto corporativo, modo claro, sin bordes burbuja)
* **Íconos & Notificaciones:** Lucide React & React Hot Toast
* **Cliente HTTP:** Axios (Redireccionado mediante Proxy de Vite)

---

## ⚙️ Reglas de Negocio Automatizadas

El núcleo del sistema depende de 4 reglas de automatización que evitan el descuadre de fondos:

* **[Regla A] Cobro de Ventas:** Si una venta se paga con `[Efectivo, Transf BNA, Transf BBVA, Apps]`, el dinero ingresa **automáticamente** a la Caja Diaria con origen "Auto". Si se paga con `Cheque`, impacta directamente en la tabla de *Cheques Terceros en Cartera*.
* **[Regla B] Pago a RRHH:** Al cargar un pago a un empleado, el sistema registra dos movimientos encadenados: genera un **Ingreso** (retirando fondos desde Efectivo/Bancos hacia la Caja Gasto_Taller) y luego genera un **Egreso** en Gasto_Taller concretando el pago.
* **[Regla C] Cheques de Terceros:** Cuando un cheque depositado en cartera se marca como "depositado", el backend dispara automáticamente un impacto positivo en la cuenta bancaria asiganda en la Caja Diaria.
* **[Regla D] Protección de Caja Diaria:** El módulo visual de Caja prohíbe terminantemente la alteración o carga manual en categorías bloqueadas (`Gasto_Taller`, `Apps`). Sólo permite generar gastos regulares en categorías libres (`G_Casa`, `G_Banco`, `Casa_Fabi`, `Córdoba`).

---

## 💻 Manual de Uso Instalación / Ejecución

Para iniciar la aplicación bajo entorno de desarrollo local, se requieren abrir **dos consolas (terminales)** en paralelo:

### 1. Iniciar el Backend (Terminal 1)
\`\`\`bash
# Posicionarse en la carpeta
cd backend

# Activar el entorno virtual de Python
source venv/bin/activate

# Encender el servidor
uvicorn app.main:app --reload --port 8000
\`\`\`
> **Nota:** La documentación generada automáticamente de la API puede ser visitada en \`http://localhost:8000/docs\`.

### 2. Iniciar el Frontend (Terminal 2)
\`\`\`bash
# Posicionarse en la carpeta
cd frontend

# Encender el servidor React en modo live
npm run dev
\`\`\`
> **Nota:** La aplicación se servirá en \`http://localhost:5173\`. Cualquier modificación visual en los archivos reactivará la página inmediatamente en tu navegador.

---

## 📁 Arquitectura de Carpetas

\`\`\`
sistema_admin_taller/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Core de la API FastAPI
│   │   ├── database.py             # Config de SQLAlchemy
│   │   ├── core/enums.py           # Constantes financieras
│   │   ├── models/                 # Modelos ORM BD (Tablas)
│   │   ├── schemas/                # Modelos Pydantic (Validación In/Out)
│   │   ├── services/               # Lógica de reglas de negocio
│   │   └── routers/                # Endpoints (Rutas API)
│   └── propel_erp.db               # Base de datos SQLite local
│
└── frontend/
    ├── src/
    │   ├── api/axios.js            # Interceptor global
    │   ├── components/layout/      # Sidebar, Header y Estructura central
    │   ├── components/ui/          # Componentes reutilizables (Modales)
    │   ├── pages/                  # Las 5 vistas mayores del ERP
    │   └── index.css               # Diseño global unificado (Radios, Temas)
    └── vite.config.js              # Proxy para evitar CORS contra el puerto 8000
\`\`\`

---
*Desarrollado con ❤️ para máxima escalabilidad y simplicidad administrativa.*
