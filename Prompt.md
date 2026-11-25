🚀 PROMPT INTEGRAL: MenuPro SaaS + POS Realtime = Menu.IA
Proyecto: Sistema PWA + SaaS para restaurantes y tiendas colombianas con catálogos digitales, WhatsApp Bot, gestión de mesas, roles de empleados y seguimiento en tiempo real.
🎯 DESCRIPCIÓN DEL NEGOCIO
Plataforma multi-tenant donde:
Dueños de negocios: Crean su cuenta, arman catálogos con fotos, gestionan mesas/QR, supervisan analíticas y definen planes de suscripción.
Clientes: Acceden vía URL personalizada (menupro.co/[slug]) o QR de mesa, realizan pedidos online o presenciales y reciben confirmación por WhatsApp.
Meseros: App PWA para escanear QR de mesas, tomar pedidos con PIN de seguridad y enviarlos instantáneamente a cocina.
Cocina: Pantalla dedicada que recibe pedidos en tiempo real ordenados por llegada, permitiendo cambiar estados (Preparando/Listo).
Sistema Realtime: Todos los actores (cliente, mesero, dueño, cocina) ven cambios de estado de pedidos instantáneamente.


🛠️ STACK TÉCNICO OBLIGATORIO
Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS + PWA.
Backend: Next.js API Routes + Supabase (Auth + Postgres + Realtime).
Base de datos: Supabase Postgres con RLS (Row Level Security) + Realtime.
WhatsApp: Webhook para WhatsApp Cloud API (Meta).
Pagos: Epayco (Colombia)
Despliegue: Hostinger + Supabase.
Almacenamiento: Supabase Storage para imágenes de productos.


📊 ESQUEMA DE BASE DE DATOS (Supabase Postgres)
SQL
-- 1. Negocios (Tenants)
CREATE TABLE negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo TEXT,
  whatsapp TEXT NOT NULL,
  direccion TEXT,
  horarios JSONB,
  plan TEXT DEFAULT 'basic', -- basic/pro/enterprise
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);


-- 2. Mesas por negocio
CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  capacidad INTEGER DEFAULT 4,
  estado TEXT DEFAULT 'libre', -- libre/ocupada/pendiente
  created_at TIMESTAMP DEFAULT NOW()
);


-- 3. Productos/Catálogo
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen TEXT,
  categoria VARCHAR(50),
  disponible BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);


-- 4. Pedidos con Seguimiento Realtime
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  mesa_id INTEGER REFERENCES mesas(id),
  mesa_numero INTEGER,
  tipo_pedido TEXT DEFAULT 'online', -- online/mesa/takeaway/delivery
  cliente_nombre VARCHAR(100),
  cliente_telefono TEXT,
  cliente_whatsapp TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente', -- pendiente/preparando/listo/enviado/entregado/cancelado
  estado_actualizacion TIMESTAMP DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);


-- 5. Empleados (Meseros)
CREATE TABLE empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre VARCHAR(100),
  rol TEXT DEFAULT 'mesero',
  pin TEXT -- PIN de 4 dígitos para login rápido
);


-- 6. Configuración WhatsApp Bot
CREATE TABLE whatsapp_config (
  negocio_id UUID PRIMARY KEY REFERENCES negocios(id) ON DELETE CASCADE,
  bienvenida TEXT DEFAULT '¡Hola! 👋 Bienvenido a [NOMBRE]. ¿En qué te ayudo?',
  menu_comando TEXT DEFAULT 'menu',
  pedido_comando TEXT DEFAULT 'pedido',
  respuestas JSONB
);


🔐 RLS POLICIES + REALTIME
RLS: Dueños y empleados solo ven/editan datos de su propio negocio (negocio_id).
Público: Los clientes pueden ver productos de cualquier negocio y sus propios pedidos por teléfono.
Habilitar Realtime:
SQL
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos, mesas;




🎨 PANTALLAS Y UI (Responsive + PWA)
1. Gestión y Administración
Dashboard Negocio (/dashboard/[slug]): Analytics de ventas, ingresos estimados, gestión de mesas (grid clickable con estados 🟢/🔴/⏳) y últimos pedidos.
Catálogo (/dashboard/[slug]/catalogo): Grid de productos con Drag & Drop y Modal CRUD (foto, precio, categoría).
Gestión de Mesas (/dashboard/[slug]/mesas): Creación de mesas y descarga de QRs personalizados (menupro.co/[slug]/mesa/[numero]).
Pantalla de Cocina (/dashboard/[slug]/cocina): Lista de pedidos pendientes en tiempo real ordenados por llegada (ASC) con botones de estado.
2. Operación (Meseros y Clientes)
App Meseros (/mesero/[slug]): Login por PIN, escáner QR de mesa y formulario rápido para toma de pedidos.
Menú Público y Mesa (/[slug] / /[slug]/mesa/[numero]): Tabs por categorías (Platos/Bebidas), carrito flotante y checkout con datos de contacto.
Seguimiento (/[slug]/mis-pedidos): Timeline visual en tiempo real (Pendiente → Preparando → Enviado → Entregado).


🚀 FLUJOS PRINCIPALES
Flujo de Pedido Híbrido (Online/Mesa)
Entrada: Cliente accede vía URL o Mesero abre mesa vía PWA.
Creación: Se envía POST /api/pedidos -> Estado 'pendiente'.
Notificación: Cocina ve el pedido al instante; el dueño y cliente reciben confirmación por WhatsApp.
Proceso: Cocina marca "Preparando" -> El estado se actualiza vía Realtime en el dashboard del dueño, el celular del mesero y la pantalla del cliente.
Flujo WhatsApp Bot
Cliente escribe "menu" -> Bot responde: "Aquí tu menú: menupro.co/[slug]".
Cliente escribe "estado #123" -> Bot consulta DB y responde el estado actual.


💻 CÓDIGO CLAVE (Ejemplos de Implementación)
Hook Realtime para Cocina
TypeScript
const usePedidosCocina = (negocioId: string) => {
  const [pedidos, setPedidos] = useState([]);
  useEffect(() => {
    const channel = supabase
      .channel('cocina')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos',
        filter: `negocio_id=eq.${negocioId}`
      }, (payload) => {
        setPedidos(prev => [...prev.filter(p => p.id !== payload.new.id), payload.new]
          .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocioId]);
  return pedidos;
};



💰 MONETIZACIÓN (Suscripciones)
Básico: $29k/mes - Hasta 300 pedidos mensuales.
Pro: $79k/mes - Pedidos ilimitados + Realtime avanzado.
Enterprise: $199k/mes - Dominio personalizado + Soporte premium.


📱 REQUISITOS DE ENTREGA
Estructura: Next.js 15 completa, API Routes optimizadas para Vercel Edge Runtime.
Idioma: UI y comentarios de código totalmente en Español.
PWA: Configuración de manifest.json y Service Workers para caché offline de menús.
Diseño: Mobile-first con Tailwind CSS, optimizado para el mercado colombiano.
