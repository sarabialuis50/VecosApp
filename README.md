# 🍽️ Menu.IA - Sistema de Gestión para Negocios

Menu.IA es una plataforma integral diseñada para modernizar la operación de restaurantes, cafeterías y negocios gastronómicos. Permite gestionar pedidos, mesas, inventario y fidelizar clientes de forma eficiente y en tiempo real.

## 🚀 Estado del Proyecto: Migración a Supabase Completada

El proyecto ha sido recientemente migrado de MongoDB a **Supabase**, consolidando el backend en una infraestructura relacional potente con capacidades de tiempo real nativas y una administración de datos más robusta.

---

## ✨ Características Principales

- **🔐 Autenticación Multi-nivel:** Registro y acceso seguro para Dueños de Negocios y Empleados (Meseros, Cocina).
- **📋 Gestión de Productos:** CRUD completo de menú con categorías y control de disponibilidad.
- **🪑 Control de Mesas:** Gestión de estados de mesa (Libre, Ocupada, Pendiente) y generación de códigos QR.
- **⚡ Pedidos en Tiempo Real:** Comunicación instantánea entre sala y cocina mediante WebSockets.
- **🎁 Programa de Fidelización:** Sistema de puntos para clientes basado en compras, con capacidad de canje por descuentos.
- **📊 Analíticas de Negocio:** Panel visual con ventas diarias, pedidos activos y estadísticas de los últimos 7 días.

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework:** FastAPI (Python)
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** JWT (PyJWT) + Bcrypt para hashing.
- **Real-time:** WebSockets.

### Frontend
- **Framework:** React.js
- **Estilos:** Tailwind CSS
- **Componentes UI:** Radix UI / Shadcn UI
- **Iconografía:** Lucide React

---

## ⚙️ Configuración del Entorno

### Requisitos Previos
- Python 3.10+
- Node.js & npm (para el frontend)
- Una cuenta en [Supabase](https://supabase.com)

### Variables de Entorno (.env)

Configura los siguientes archivos `.env` en sus respectivas carpetas:

#### Backend (`/backend/.env`)
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (crítico para el backend)
JWT_SECRET=tu_secreto_para_tokens
PORT=8000
```

---

## 🏁 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd MenuPro
```

### 2. Configurar el Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

### 3. Configurar el Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📱 Uso de la Aplicación

1. **Registro:** El dueño registra su negocio y obtiene un slug único (ej: `menuia.co/mi-restaurante`).
2. **Configuración:** Carga productos, categorías y crea las mesas del local.
3. **Operación:** 
   - Los meseros inician sesión con su PIN.
   - Los pedidos se crean asociados a una mesa.
   - La cocina recibe notificaciones automáticas vía WebSocket.
4. **Fidelización:** Al cerrar un pedido, el cliente (identificado por su teléfono) acumula puntos automáticamente.

---

## 📄 Licencia
Este proyecto es de uso privado para Menu.IA.

---
*Desarrollado con ❤️ por el equipo de Menu.IA.*
