# 🗺️ MenuPro — Roadmap de Implementación de Agentes IA

<div align="center">

**Plan de desarrollo para el Agente WhatsApp (OpenAI) y el Agente Analítico (Gemini)**
*Fecha de inicio estimada: Febrero 2026*

</div>

---

## 📋 Resumen Ejecutivo

Este roadmap detalla el plan de implementación en **4 fases** para integrar dos agentes de IA en MenuPro:

1. **MenuBot WhatsApp** — Automatización de pedidos por WhatsApp con OpenAI.
2. **MenuPro Insights** — Panel de análisis inteligente con Google Gemini para dueños de negocios.

**Duración total estimada:** 10–14 semanas.

---

## 🏗️ Refactorización Arquitectura Multisede (Actual)

**Objetivo:** Transformar la plataforma de un SaaS B2B Multitenant a un sistema de negocio único con múltiples sedes operativas ("The Golden Burger").

### ✅ Completado
- **Migraciones SQL en Supabase:**
  - Creación de jerarquía `brands` -> `sedes`.
  - Catálogo maestro (`global_products`, `global_categories`).
  - Overrides locales por sede (`sede_products`).
  - Módulo de Inventario con recetas (`global_recipes`, `recipe_ingredients`, `sede_inventory`, `inventory_transactions`).
  - Sistema global de fidelidad (`loyalty_clients`, `loyalty_transactions`).
- **Backend (Motor de Pedidos):**
  - Implementación de deducción de inventario (`sede_inventory`) de forma transaccional e idempotente al pasar pedido a estado `PREPARANDO`.
  - Implementación de reversos automáticos de inventario al pasar pedido a `CANCELADO`.
- **Frontend (Rediseño):**
  - `LandingPage.jsx` rediseñado con tema de hamburguesería "Premium" (Oscuro/Dorado).
  - Integración de las 3 sedes fijas (Norte, Centro, Sur).
  - Íconos oficiales integrados. Animaciones inmersivas (modal flotante).

### ⏳ Pendiente
- **Backend (Endpoints de Catálogo):**
  - Modificar `get_menu_items` en `server.py` para cruzar `global_products` con `sede_products` (aplicar `precio_local` y visibilidad por sede).
- **Frontend (Paneles y Flujos):**
  - Construir Panel Administrativo Global vs. Local (Selector de contexto de sede).
  - Desarrollar la vista de Control de Inventario (`InventoryPage.jsx`).
  - Desarrollar el panel de edición del Catálogo Maestro y Override de Sedes.
  - Adaptar el flujo del carrito de compras al contexto de la sede seleccionada.

---

## 📌 Estado del Proyecto (IA)

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend FastAPI + Supabase | ✅ Completado | Migración de MongoDB finalizada |
| Autenticación JWT (Negocios + Empleados) | ✅ Completado | Login por PIN para meseros |
| CRUD Productos, Mesas, Pedidos | ✅ Completado | Operaciones vía Supabase |
| WebSockets (Cocina Real-time) | ✅ Completado | ConnectionManager funcionando |
| Programa de Fidelización (Puntos) | ✅ Completado | Config + puntos + transacciones |
| Frontend React + Tailwind | ✅ Completado | Dashboard, menú público, cocina |
| Deployment (Hostinger + Supabase) | ✅ Completado | En producción |
| Agente WhatsApp | ❌ Pendiente | Este roadmap |
| Agente Gemini Analytics | ❌ Pendiente | Este roadmap |

---

## 🟢 FASE 1: Infraestructura y Conexión WhatsApp (Semana 1–2)

### Objetivo
Establecer la base técnica para recibir y responder mensajes de WhatsApp a través de Twilio.

### Tareas

| # | Tarea | Prioridad | Estimado |
|---|-------|-----------|----------|
| 1.1 | Crear cuenta Twilio y configurar WhatsApp Sandbox | 🔴 Alta | 1 día |
| 1.2 | Crear Edge Function `menubot-webhook` en Supabase | 🔴 Alta | 2 días |
| 1.3 | Configurar Secrets en Supabase (TWILIO_ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER, OPENAI_API_KEY) | 🔴 Alta | 1 hora |
| 1.4 | Implementar parseo de `application/x-www-form-urlencoded` (Gotcha #1) | 🔴 Alta | 2 horas |
| 1.5 | Implementar normalización de teléfonos (Gotcha #2) | 🔴 Alta | 1 hora |
| 1.6 | Crear tablas `agent_conversations` y `agent_messages` en Supabase | 🔴 Alta | 1 día |
| 1.7 | Implementar lógica de envío de respuesta vía Twilio API | 🔴 Alta | 1 día |
| 1.8 | Configurar Webhook URL en Twilio Console apuntando a la Edge Function | 🔴 Alta | 1 hora |
| 1.9 | Prueba end-to-end: enviar "hola" → recibir respuesta fija | 🔴 Alta | 1 día |

### Entregables
- ✅ Edge Function `menubot-webhook` desplegada y recibiendo mensajes.
- ✅ Tablas de conversación y mensajes creadas.
- ✅ Respuesta de eco funcional (sin IA aún).

### ⚠️ Gotchas a Prevenir
- **#1:** Twilio envía form-urlencoded. Parsear según Content-Type.
- **#2:** Normalizar `whatsapp:` en números.
- **#3:** Verificar que el Auth Token esté actualizado.
- **#5:** Verificar que la Edge Function NO se despliegue vacía.

---

## 🟡 FASE 2: Agente WhatsApp con IA (Semana 3–5)

### Objetivo
Integrar OpenAI GPT-4o-mini con Function Calling para interpretar mensajes y ejecutar acciones sobre la base de datos.

### Tareas

| # | Tarea | Prioridad | Estimado |
|---|-------|-----------|----------|
| 2.1 | Crear System Prompt del agente WhatsApp con contexto del negocio | 🔴 Alta | 1 día |
| 2.2 | Implementar Function Calling: `get_menu_items` (consulta tabla `productos`) | 🔴 Alta | 2 días |
| 2.3 | Implementar Function Calling: `get_dish_details` (detalle de un plato) | 🟡 Media | 1 día |
| 2.4 | Implementar Function Calling: `create_order` (crea pedido en `pedidos`) | 🔴 Alta | 3 días |
| 2.5 | Implementar Function Calling: `get_order_status` (consultar estado) | 🟡 Media | 1 día |
| 2.6 | Implementar inyección de fecha actual en el prompt (Gotcha #11) | 🔴 Alta | 1 hora |
| 2.7 | Implementar validación de `dish_id` (longitud > 10, Gotcha #9) | 🔴 Alta | 2 horas |
| 2.8 | Implementar forzado de `function_call` en keywords de confirmación (Gotcha #8) | 🔴 Alta | 2 horas |
| 2.9 | Implementar fallback si OpenAI no genera texto post-función (Gotcha #10) | 🟡 Media | 2 horas |
| 2.10 | Implementar conversación multi-turno (carrito persistente en `context` JSONB) | 🟡 Media | 2 días |
| 2.11 | Implementar pedir nombre si es genérico (Gotcha #13) | 🟡 Media | 1 hora |
| 2.12 | Implementar flujo completo: menú → carrito → tipo servicio → dirección → confirmar | 🔴 Alta | 2 días |
| 2.13 | Notificación a cocina vía WebSocket al crear pedido por WhatsApp | 🔴 Alta | 1 día |
| 2.14 | Pruebas end-to-end del flujo completo | 🔴 Alta | 2 días |

### Entregables
- ✅ Agente WhatsApp funcional con IA para toma de pedidos.
- ✅ Menú, detalle de platos, creación de pedidos y consulta de estado operativos.
- ✅ Pedidos creados por WhatsApp aparecen en tiempo real en cocina.

### ⚠️ Gotchas a Prevenir
- **#8:** Forzar function_call cuando usuario confirma.
- **#9:** Validar UUID de platos.
- **#10:** Fallback si no hay texto post-función.
- **#11:** Inyectar fecha actual.
- **#13:** Pedir nombre real del cliente.

---

## 🔵 FASE 3: Agente Gemini Analytics (Semana 6–9)

### Objetivo
Crear un panel de inteligencia artificial en el dashboard del dueño que analice datos operativos y genere recomendaciones.

### Tareas

| # | Tarea | Prioridad | Estimado |
|---|-------|-----------|----------|
| 3.1 | Crear cuenta Google AI Studio y obtener API Key de Gemini | 🔴 Alta | 1 hora |
| 3.2 | Instalar `google-generativeai` en el backend Python | 🔴 Alta | 1 hora |
| 3.3 | Crear endpoint `GET /api/gemini/insights/{negocio_id}` | 🔴 Alta | 2 días |
| 3.4 | Implementar Data Aggregator: recopilar datos de pedidos, mesas, productos, empleados (últimas 24h) | 🔴 Alta | 2 días |
| 3.5 | Diseñar prompt para Gemini con instrucciones de formato JSON | 🔴 Alta | 1 día |
| 3.6 | Implementar parseo y validación del JSON de respuesta de Gemini | 🟡 Media | 1 día |
| 3.7 | Crear componente React `InsightsPanel` con cards informativas | 🔴 Alta | 3 días |
| 3.8 | Card: Resumen del Día (ventas, pedidos, ticket promedio) | 🔴 Alta | 1 día |
| 3.9 | Card: Top 5 Platos Más Vendidos (gráfico de barras) | 🟡 Media | 1 día |
| 3.10 | Card: Horas Pico (mapa de calor) | 🟡 Media | 1 día |
| 3.11 | Card: Alertas de Mesas (tiempos de espera altos) | 🟡 Media | 1 día |
| 3.12 | Card: Rendimiento de Meseros (ranking) | 🟡 Media | 1 día |
| 3.13 | Card: Acciones Recomendadas (lista priorizada de IA) | 🔴 Alta | 1 día |
| 3.14 | Card: Tendencia Semanal (patrones y oportunidades) | 🟢 Baja | 1 día |
| 3.15 | Agregar ruta `/dashboard/[slug]/ia` en el frontend | 🔴 Alta | 1 día |
| 3.16 | Implementar caché de insights (no recalcular cada vez, máx. 1 vez por hora) | 🟡 Media | 1 día |
| 3.17 | Agregar variable `GOOGLE_GEMINI_API_KEY` al `.env` | 🔴 Alta | 10 min |
| 3.18 | Pruebas con datos reales de negocio | 🔴 Alta | 2 días |

### Entregables
- ✅ Endpoint de insights funcional con Gemini 1.5 Flash.
- ✅ Panel de IA en el dashboard del dueño con 7 cards informativas.
- ✅ Recomendaciones accionables basadas en datos reales.

### ⚠️ Riesgos a Mitigar
- Gemini puede devolver JSON malformado → Implementar parseo defensivo con try/catch.
- Costos de API → Usar caché de 1 hora para evitar llamadas excesivas.
- Modelo no disponible → Usar `gemini-1.5-flash` (más estable y económico).

---

## 🟣 FASE 4: Optimización, Producción y Automatización (Semana 10–14)

### Objetivo
Pulir ambos agentes, preparar para producción y agregar funcionalidades avanzadas.

### Tareas

| # | Tarea | Prioridad | Estimado |
|---|-------|-----------|----------|
| 4.1 | Migrar de Twilio Sandbox a WhatsApp Business API (producción) | 🔴 Alta | 3 días |
| 4.2 | Implementar notificaciones automáticas de estado de pedido por WhatsApp | 🔴 Alta | 2 días |
| 4.3 | Implementar rate limiting para el agente WhatsApp (anti-spam) | 🟡 Media | 1 día |
| 4.4 | Agregar soporte para cancelación y edición de pedidos por WhatsApp | 🟡 Media | 2 días |
| 4.5 | Dashboard de conversaciones WhatsApp para el dueño (vista de mensajes) | 🟡 Media | 3 días |
| 4.6 | Implementar escalamiento a humano (`pending_human` status) | 🟡 Media | 2 días |
| 4.7 | Agregar análisis de satisfacción de clientes al Agente Gemini | 🟢 Baja | 2 días |
| 4.8 | Agregar recomendaciones de menú basadas en historial del cliente | 🟢 Baja | 2 días |
| 4.9 | Implementar métricas de uso de ambos agentes (Response Time, Conversion Rate) | 🟡 Media | 2 días |
| 4.10 | Optimizar costos de API (batching, caché, modelo más económico si aplica) | 🟡 Media | 1 día |
| 4.11 | Documentar APIs y flujos para mantenimiento futuro | 🟡 Media | 1 día |
| 4.12 | Test de carga: simular 20+ conversaciones simultáneas | 🟡 Media | 1 día |
| 4.13 | Deploy final a producción con monitoreo | 🔴 Alta | 1 día |

### Entregables
- ✅ Agente WhatsApp en producción con WhatsApp Business API.
- ✅ Notificaciones automáticas de estado de pedido.
- ✅ Dashboard de conversaciones para el dueño.
- ✅ Métricas y monitoreo activo.

---

## 💰 Estimación de Costos Mensuales (Producción)

| Servicio | Costo Estimado | Notas |
|----------|----------------|-------|
| **OpenAI GPT-4o-mini** | ~$5–15 USD/mes | Basado en ~500–1000 conversaciones/mes |
| **Google Gemini 1.5 Flash** | ~$2–5 USD/mes | 1 consulta/hora por negocio activo |
| **Twilio WhatsApp** | ~$15–30 USD/mes | Basado en volumen de mensajes (Sandbox es gratis) |
| **Supabase (plan actual)** | Ya incluido | Free tier soporta el volumen inicial |
| **TOTAL ESTIMADO** | **~$22–50 USD/mes** | Escala con número de negocios activos |

---

## 📊 KPIs de Éxito por Fase

### Fase 1 (Infraestructura)
- [ ] Edge Function recibiendo y respondiendo mensajes correctamente.
- [ ] Tablas de agente creadas y funcionales.

### Fase 2 (Agente WhatsApp)
- [ ] Tasa de pedidos completados por WhatsApp > 30%.
- [ ] Tiempo de respuesta < 3 segundos.
- [ ] 0 pedidos con datos inválidos (dish_id, fechas).

### Fase 3 (Agente Gemini)
- [ ] Panel de IA visible y funcional en el dashboard.
- [ ] > 80% de recomendaciones relevantes (validación manual inicial).
- [ ] Carga del panel < 5 segundos.

### Fase 4 (Producción)
- [ ] WhatsApp Business API aprobado por Meta.
- [ ] < 5% tasa de opt-out de clientes.
- [ ] Sistema estable con 20+ negocios activos.

---

## 📅 Cronograma Visual

```
Semana   1   2   3   4   5   6   7   8   9   10  11  12  13  14
         ├───────┤
         Fase 1: Infraestructura WhatsApp
                 ├───────────────┤
                 Fase 2: Agente WhatsApp + IA
                                 ├───────────────────┤
                                 Fase 3: Agente Gemini
                                                     ├───────────────────┤
                                                     Fase 4: Producción
```

---

## 🔗 Documentos de Referencia

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| `Agent.md` | `/Agent.md` | Especificación técnica completa de ambos agentes |
| `Gatchas.md` | `/Gatchas.md` | Problemas conocidos y soluciones (22 items) |
| `Prompt.md` | `/Prompt.md` | Especificación del proyecto MenuPro SaaS |
| `Estudio.md` | `/Estudio.md` | Reporte estratégico y benchmarking |
| `README.md` | `/README.md` | Guía de instalación y stack tecnológico |

---

## ⚠️ Lecciones Aprendidas (de `Gatchas.md`)

Estas son las lecciones **más críticas** a tener en cuenta durante el desarrollo:

1. **Siempre verificar que las Edge Functions tengan contenido real** después de cada deploy.
2. **Normalizar teléfonos** (eliminar `whatsapp:`) antes de cualquier operación de base de datos.
3. **Forzar function_call** cuando el usuario usa keywords de confirmación.
4. **Inyectar la fecha actual** en el system prompt de OpenAI.
5. **Pedir nombre real** antes de crear pedidos con nombres genéricos.
6. **Logging obligatorio** en toda función crítica para facilitar debugging.

---

*Documento creado: Febrero 10, 2026*
*Próxima revisión: Al finalizar Fase 1*
