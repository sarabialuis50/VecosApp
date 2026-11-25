# MenuPro PWA - Product Requirements Document

## Original Problem Statement
Desarrollar MenuPro - un sistema PWA + SaaS completo para restaurantes colombianos con menús digitales, gestión de pedidos en tiempo real. Basado en los documentos "Reporte Estratégico de Investigación y Prototipado" y "PROMPT INTEGRAL".

## User Personas
1. **Dueño de Restaurante**: Gestiona negocio, productos, mesas, empleados, programa de fidelidad y ve analytics
2. **Mesero**: Usa app PWA con login PIN para tomar pedidos en mesas
3. **Cocina**: Ve pantalla de pedidos en tiempo real para preparar
4. **Cliente**: Escanea QR, ve menú, hace pedido, acumula y canjea puntos, y sigue estado

## Core Requirements (Static)
- Multi-tenant SaaS (múltiples negocios con slug único)
- PWA compatible (instalable en móviles)
- Menú digital público con categorías
- Carrito de compras persistente
- Sistema de pedidos en tiempo real (WebSocket)
- Pantalla de cocina con gestión de estados
- Generación de códigos QR para mesas
- Timeline visual de seguimiento de pedidos
- **Programa de fidelidad con puntos configurables**
- WhatsApp integration preparada
- Branding verde WhatsApp (#25D366)

## Tech Stack
- Frontend: React 18 + Tailwind CSS + Framer Motion
- Backend: FastAPI (Python)
- Database: MongoDB
- Real-time: WebSockets
- Charts: Recharts

## What's Been Implemented

### Feb 4, 2026 - Initial MVP
- Complete auth system (register, login, JWT tokens)
- Business CRUD with slug-based routing
- Products CRUD with categories
- Tables management with QR codes
- Employees with PIN authentication
- Orders system with status workflow
- Real-time WebSocket for kitchen updates
- Analytics endpoint (sales, orders, 7-day stats)
- WhatsApp webhook endpoints (prepared)
- All frontend pages (Landing, Dashboard, Catalog, Tables, Kitchen, Menu, Waiter App)

### Feb 4, 2026 - Loyalty Program Feature
- **Loyalty Configuration**: Dueños configuran pesos por punto, mínimo canje, valor por punto
- **Points Accumulation**: Clientes ganan puntos automáticamente al completar pedidos
- **Points Redemption**: Clientes canjean puntos por descuentos en checkout
- **Transaction History**: Registro de puntos ganados y canjeados
- **Customer Dashboard**: Lista de clientes con sus puntos acumulados
- **New API Endpoints**: 6 nuevos endpoints de fidelidad

### Loyalty Program Configuration (Demo)
- $1,000 COP = 1 punto
- Mínimo 50 puntos para canjear
- 1 punto = $100 COP de descuento
- Ejemplo: Compra de $100,000 → 100 puntos → $10,000 descuento

## API Endpoints Summary
```
Auth: POST /api/auth/register, /api/auth/login, GET /api/auth/me
Business: GET /api/business/{slug}, GET /api/business/{slug}/analytics
Products: GET/POST /api/products/{slug}, PUT/DELETE /api/products/{slug}/{id}
Tables: GET/POST /api/tables/{slug}, PUT/DELETE /api/tables/{slug}/{id}
Employees: GET/POST /api/employees/{slug}, DELETE /api/employees/{slug}/{id}
Orders: GET/POST /api/orders/{slug}, PUT /api/orders/{slug}/{id}, GET /api/orders/{slug}/active
Loyalty: GET/POST /api/loyalty/{slug}/config, PUT /api/loyalty/{slug}/config
         GET /api/loyalty/{slug}/points/{telefono}, GET /api/loyalty/{slug}/customers
         POST /api/loyalty/{slug}/redeem, GET /api/loyalty/{slug}/transactions/{telefono}
WhatsApp: GET/POST /api/whatsapp/webhook
WebSocket: /ws/{negocio_id}
```

## URLs Structure
- `/` - Landing page
- `/login`, `/register` - Authentication
- `/dashboard/{slug}` - Business dashboard
- `/dashboard/{slug}/catalogo` - Product catalog
- `/dashboard/{slug}/mesas` - Table management
- `/dashboard/{slug}/cocina` - Kitchen display
- `/dashboard/{slug}/empleados` - Employee management
- `/dashboard/{slug}/fidelidad` - Loyalty program config
- `/mesero/{slug}` - Waiter PWA app
- `/{slug}` - Public menu
- `/{slug}/mesa/{numero}` - Table-specific menu
- `/{slug}/mis-pedidos` - Order tracking

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] WhatsApp Cloud API integration (needs credentials)
- [ ] WhatsApp notification when points are earned/redeemed
- [ ] Order notification sounds

### P1 - High Priority
- [ ] Product image upload (Cloudinary)
- [ ] Menu modifiers (extras, sizes)
- [ ] Delivery mode support
- [ ] Push notifications for order status
- [ ] Loyalty tier levels (Bronze, Silver, Gold)

### P2 - Medium Priority
- [ ] Multi-language support
- [ ] Multiple payment methods
- [ ] Inventory management
- [ ] Staff scheduling
- [ ] Points expiration dates

### P3 - Nice to Have
- [ ] AI chatbot for WhatsApp orders
- [ ] Sales reports export
- [ ] Kitchen display customization
- [ ] Table reservations
- [ ] Referral program

## Demo Credentials
- **Dashboard**: test@menupro.co / 123456
- **Public Menu**: /demo-restaurante
- **Waiter PIN**: 1234
- **Loyalty**: Activo ($1,000/punto, mín 50 pts, $100/pt descuento)
