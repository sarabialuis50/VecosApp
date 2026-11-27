// Unified real-time local + API data store for Veco's Restaurante (single-business architecture)
// Synchronizes Orders, Kitchen, Tables, Customers, Loyalty, Employees, Inventory, Catalog, and Analytics.
import {
  loadWheelConfigLocal,
  saveWheelConfigLocal,
  loadWheelHistoryLocal,
  saveWheelHistoryLocal,
  getTodayDateStr,
  generateCouponCode,
  pickWeightedSegment,
} from './wheelDefaults';
import {
  loadMenuIngredientsLocal,
  saveMenuIngredientsLocal,
  ensureVecosMenuMigration,
} from './menuIngredients';
import { VECOS_CATEGORIES, VECOS_PRODUCTS } from './vecosMenuData';

const KEYS = {
  BUSINESS: 'vecos_business_config',
  TABLES: 'vecos_tables',
  EMPLOYEES: 'vecos_employees',
  ORDERS: 'vecos_orders',
  CUSTOMERS: 'vecos_customers',
  LOYALTY_CONFIG: 'vecos_loyalty_config',
  LOYALTY_TX: 'vecos_loyalty_transactions',
  INVENTORY: 'vecos_inventory',
  PRODUCTS: 'fogon_mesa_custom_products',
  CATEGORIES: 'fogon_mesa_custom_categories',
  TAGS: 'fogon_mesa_custom_tags',
};

const DEFAULT_BUSINESS = {
  id: 'vecos-restaurante-id',
  nombre: "Veco's Restaurante",
  slug: 'vecos',
  email: 'sarabialuis50@gmail.com',
  plan: 'pro',
  telefono: '3017810256',
  direccion: "Zona Gastronómica — Veco's Restaurante",
  slogan: 'Sabor que te encanta — Ejecutivos, Preparados del Día, Asados, Vaqueritos y Picadas.',
  logo_url: '/images/vecos-logo.jpg',
  banner_url: '/images/hero-almuerzo.jpg',
  whatsapp_activo: true,
  whatsapp_creditos: 120,
  dual_kitchen: false,
  metodos_pago: {
    efectivo: true,
    nequi: true,
    daviplata: true,
    transferencia: true,
    tarjeta: false,
    link: false,
  },
  datos_pago: {
    nequi: { numero: '', qr_url: '' },
    daviplata: { numero: '', qr_url: '' },
    transferencia: { banco: '', numero_cuenta: '' },
    tarjeta: { link_pago: '', qr_url: '' },
    link: { llave: '', qr_url: '' },
  },
};

const DEFAULT_TABLES = [
  { id: 't-1', numero: 1, nombre: 'Mesa 1', capacidad: 4, estado: 'libre', ubicacion: 'Salón Principal', empleado_id: null },
  { id: 't-2', numero: 2, nombre: 'Mesa 2', capacidad: 4, estado: 'libre', ubicacion: 'Salón Principal', empleado_id: null },
  { id: 't-3', numero: 3, nombre: 'Mesa 3', capacidad: 2, estado: 'libre', ubicacion: 'Ventana', empleado_id: null },
  { id: 't-4', numero: 4, nombre: 'Mesa 4', capacidad: 6, estado: 'libre', ubicacion: 'Terraza', empleado_id: null },
  { id: 't-5', numero: 5, nombre: 'Mesa 5', capacidad: 4, estado: 'libre', ubicacion: 'Terraza', empleado_id: null },
  { id: 't-6', numero: 6, nombre: 'Mesa 6', capacidad: 2, estado: 'libre', ubicacion: 'Barra', empleado_id: null },
];

const DEFAULT_LOYALTY_CONFIG = {
  activo: true,
  pesos_por_punto: 1000,
  puntos_minimo_canje: 100,
  valor_punto_descuento: 50,
  nivel_bronce_min: 0,
  nivel_plata_min: 300,
  nivel_oro_min: 1000,
};

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {}
  return typeof fallback === 'function' ? fallback() : JSON.parse(JSON.stringify(fallback));
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vecos-data-updated', { detail: { key } }));
    }
  } catch (e) {}
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function loadBusiness() {
  const saved = readLS(KEYS.BUSINESS, DEFAULT_BUSINESS);
  const logoOverride = typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_logo') : null;
  const bannerOverride = typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_banner') : null;
  const savedPaymentData = readLS('fogon_mesa_datos_pago', null);
  const savedPaymentMethods = readLS('vecos_metodos_pago', null);
  const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('vecos_restaurant_phone') : null;
  return {
    ...DEFAULT_BUSINESS,
    ...saved,
    nombre: saved?.nombre && !/fog[oó]n/i.test(saved.nombre) ? saved.nombre : DEFAULT_BUSINESS.nombre,
    slug: 'vecos',
    logo_url: logoOverride || saved?.logo_url || DEFAULT_BUSINESS.logo_url,
    banner_url: bannerOverride || saved?.banner_url || DEFAULT_BUSINESS.banner_url,
    telefono: savedPhone || saved?.telefono || DEFAULT_BUSINESS.telefono,
    datos_pago: savedPaymentData || saved?.datos_pago || DEFAULT_BUSINESS.datos_pago,
    metodos_pago: savedPaymentMethods || saved?.metodos_pago || DEFAULT_BUSINESS.metodos_pago,
  };
}

function loadOrders() {
  const orders = readLS(KEYS.ORDERS, []);
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  writeLS(KEYS.ORDERS, orders);
}

function loadTables() {
  const tables = readLS(KEYS.TABLES, DEFAULT_TABLES);
  return Array.isArray(tables) ? tables : [...DEFAULT_TABLES];
}

function saveTables(tables) {
  writeLS(KEYS.TABLES, tables);
}

function loadEmployees() {
  const emps = readLS(KEYS.EMPLOYEES, []);
  return Array.isArray(emps) ? emps : [];
}

function saveEmployees(emps) {
  writeLS(KEYS.EMPLOYEES, emps);
}

function loadCustomers() {
  const custs = readLS(KEYS.CUSTOMERS, []);
  return Array.isArray(custs) ? custs : [];
}

function saveCustomers(custs) {
  writeLS(KEYS.CUSTOMERS, custs);
}

function loadLoyaltyConfig() {
  return { ...DEFAULT_LOYALTY_CONFIG, ...readLS(KEYS.LOYALTY_CONFIG, DEFAULT_LOYALTY_CONFIG) };
}

function saveLoyaltyConfig(cfg) {
  writeLS(KEYS.LOYALTY_CONFIG, cfg);
}

function loadLoyaltyTx() {
  const txs = readLS(KEYS.LOYALTY_TX, []);
  return Array.isArray(txs) ? txs : [];
}

function saveLoyaltyTx(txs) {
  writeLS(KEYS.LOYALTY_TX, txs);
}

function loadInventory() {
  const inv = readLS(KEYS.INVENTORY, []);
  return Array.isArray(inv) ? inv : [];
}

function saveInventory(inv) {
  writeLS(KEYS.INVENTORY, inv);
}

// Recompute table status based on active orders
function syncTableStatuses(orders) {
  const tables = loadTables();
  const occupiedNumbers = new Set(
    orders
      .filter((o) => {
        const active = o.estado !== 'entregado' && o.estado !== 'cancelado';
        const isMesa = o.tipo === 'mesa' || o.tipo_servicio === 'mesa' || Boolean(o.mesa_numero);
        return active && isMesa && o.mesa_numero;
      })
      .map((o) => String(o.mesa_numero))
  );

  let changed = false;
  const updated = tables.map((t) => {
    const numStr = String(t.numero);
    if (occupiedNumbers.has(numStr) && t.estado !== 'ocupada') {
      changed = true;
      return { ...t, estado: 'ocupada' };
    }
    if (!occupiedNumbers.has(numStr) && t.estado === 'ocupada') {
      changed = true;
      return { ...t, estado: 'libre' };
    }
    return t;
  });

  if (changed) saveTables(updated);
}

// Automatically upsert customer & award loyalty points when a real order is created
export function syncCustomerAndPointsForOrder(order) {
  const phone = normalizePhone(order.cliente_telefono);
  if (!phone) return null;

  const customers = loadCustomers();
  const loyaltyCfg = loadLoyaltyConfig();
  const orderTotal = Number(order.total || 0);
  const pesosPorPunto = Math.max(1, Number(loyaltyCfg.pesos_por_punto || 1000));
  const earnedPoints = loyaltyCfg.activo !== false ? Math.floor(orderTotal / pesosPorPunto) : 0;

  let customer = customers.find((c) => normalizePhone(c.telefono || c.phone) === phone);
  if (customer) {
    customer.nombre = order.cliente_nombre || customer.nombre;
    customer.name = customer.nombre;
    customer.pedidos_count = Number(customer.pedidos_count || 0) + 1;
    customer.total_gastado = Number(customer.total_gastado || 0) + orderTotal;
    customer.puntos = Number(customer.puntos || 0) + earnedPoints;
    customer.points = customer.puntos;
    customer.puntos_totales = Number(customer.puntos_totales || 0) + earnedPoints;
    customer.puntos_disponibles = Number(customer.puntos_disponibles ?? customer.puntos ?? 0) + earnedPoints;
    customer.ultima_visita = order.created_at || new Date().toISOString();
    if (order.direccion && !customer.direccion) customer.direccion = order.direccion;
  } else {
    customer = {
      id: `cust-${Date.now()}`,
      nombre: order.cliente_nombre || `Cliente ${phone.slice(-4)}`,
      name: order.cliente_nombre || `Cliente ${phone.slice(-4)}`,
      telefono: phone,
      phone,
      direccion: order.direccion || '',
      puntos: earnedPoints,
      points: earnedPoints,
      puntos_totales: earnedPoints,
      puntos_disponibles: earnedPoints,
      total_gastado: orderTotal,
      pedidos_count: 1,
      ultima_visita: order.created_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    customers.unshift(customer);
  }
  saveCustomers(customers);

  if (earnedPoints > 0) {
    const txs = loadLoyaltyTx();
    txs.unshift({
      id: `tx-${Date.now()}`,
      customer_id: customer.id,
      telefono: phone,
      cliente_nombre: customer.nombre,
      tipo: 'ganados',
      puntos: earnedPoints,
      descripcion: `Pedido #${order.numero_orden || order.id}`,
      created_at: order.created_at || new Date().toISOString(),
    });
    saveLoyaltyTx(txs.slice(0, 200));
  }

  return customer;
}

// Public helper so /menu and LandingPage create real orders that interlock with ALL modules
export function registerRealOrder(orderInput) {
  const orders = loadOrders();
  const normalizedTipo =
    orderInput.tipo ||
    (orderInput.tipo_servicio === 'domicilio'
      ? 'delivery'
      : orderInput.tipo_servicio === 'recoger' || orderInput.tipo_servicio === 'para_llevar'
        ? 'takeaway'
        : orderInput.tipo_servicio || 'delivery');

  const newOrder = {
    id: orderInput.id || `VEC-${Date.now().toString().slice(-5)}`,
    numero_orden: orderInput.numero_orden || orderInput.id || `VEC-${Date.now().toString().slice(-5)}`,
    estado: orderInput.estado || 'pendiente',
    created_at: orderInput.created_at || new Date().toISOString(),
    ...orderInput,
    tipo: normalizedTipo,
  };

  orders.unshift(newOrder);
  saveOrders(orders);
  syncCustomerAndPointsForOrder(newOrder);
  syncTableStatuses(orders);
  return newOrder;
}

function parseBody(data) {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

const BROKEN_LEGACY_IMAGES = new Set([
  '/images/churrasco.png',
  '/images/pechuga.png',
  '/images/jugo_maracuya.png',
  '/images/flan_caramelo.png',
  '/images/cazuela_frijoles.png',
]);

export function pickFallbackFoodImage(nombre = '') {
  const nameLower = String(nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/marisco|camaron|pescado|salmon|ceviche|pulpo|langostin|atun|mojarra|trucha|calamar/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80';
  }
  if (/pollo|pechuga|alita/.test(nameLower)) return '/images/plato-pollo.jpg';
  if (/sancocho|cazuela|sopa|ajiaco|frijol|caldo|mondongo/.test(nameLower)) return '/images/plato-cazuela.jpg';
  if (/jugo|limonada|bebida|maracuya|gaseosa|agua|te|cafe|batido/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80';
  }
  if (/flan|postre|dulce|torta|helado|brownie|cheesecake|tres leches/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80';
  }
  if (/ensalada|bowl|vegano|vegetariano|quinua/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
  }
  if (/hamburguesa|burger/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80';
  }
  if (/costilla|bbq|cerdo|lomo/.test(nameLower)) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80';
  }
  return '/images/hero-almuerzo.jpg';
}

const LEGACY_TAG_MAP = {
  'MÁS PEDIDO': 'Más Vendido',
  'FAVORITO': 'Más Vendido',
  'ESPECIALIDAD': 'Recomendado',
  'IMPERDIBLE': 'Recomendado',
  'CORTE PREMIUM': 'Recomendado',
  'OFERTA': 'Oferta',
  'BALANCEADO': 'Nuevo',
  'FROZEN': 'Nuevo',
  'LIGERO': '',
  'FRESCO': '',
  'SOLO JUE-DOM': '',
  'FIN DE SEMANA': '',
  'TRADICIONAL': '',
  'AL CARBÓN': '',
  'REFRESCANTE': '',
  'NATURAL': '',
  'POSTRE': '',
  'ARTESANAL': '',
};

export function repairProductImages(products) {
  if (!Array.isArray(products)) return products;
  let changed = false;
  const repaired = products.map((p) => {
    let next = p;
    const rawImg = next.imagen_url || next.imagen || '';
    if (BROKEN_LEGACY_IMAGES.has(rawImg)) {
      changed = true;
      const fixed = pickFallbackFoodImage(next.nombre);
      next = { ...next, imagen: fixed, imagen_url: fixed };
    } else if (next.imagen_url && !next.imagen) {
      changed = true;
      next = { ...next, imagen: next.imagen_url };
    } else if (next.imagen && !next.imagen_url) {
      changed = true;
      next = { ...next, imagen_url: next.imagen };
    }

    if (next.etiqueta && Object.prototype.hasOwnProperty.call(LEGACY_TAG_MAP, next.etiqueta)) {
      changed = true;
      next = { ...next, etiqueta: LEGACY_TAG_MAP[next.etiqueta] };
    }
    return next;
  });
  if (changed) {
    writeLS(KEYS.PRODUCTS, repaired);
  }
  return repaired;
}

function loadProductsFromStorage() {
  ensureVecosMenuMigration();
  try {
    const saved = localStorage.getItem(KEYS.PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return repairProductImages(parsed);
      }
    }
  } catch (e) {}
  return repairProductImages(JSON.parse(JSON.stringify(VECOS_PRODUCTS)));
}

function computeRealAnalytics() {
  const orders = loadOrders();
  const tables = loadTables();
  const customers = loadCustomers();
  const products = loadProductsFromStorage();
  const inventory = loadInventory();

  const validOrders = orders.filter((o) => o.estado !== 'cancelado');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = validOrders.filter((o) => String(o.created_at || '').slice(0, 10) === todayStr);

  const ventasTotal = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const pedidosTotal = validOrders.length;
  const domiciliosTotal = validOrders.filter((o) => o.tipo === 'delivery' || o.tipo_servicio === 'domicilio').length;
  const mesaPedidosTotal = validOrders.filter((o) => o.tipo === 'mesa' || o.tipo_servicio === 'mesa').length;
  const llevarPedidosTotal = validOrders.filter((o) => o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar').length;
  const ventasHoy = todayOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const pedidosHoy = todayOrders.length;
  const pedidosActivos = orders.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado').length;
  const mesasOcupadas = tables.filter((t) => t.estado === 'ocupada').length;
  const puntosTotal = customers.reduce((acc, c) => acc + Number(c.puntos_disponibles ?? c.puntos ?? 0), 0);
  const productosAgotados = products.filter((p) => p.disponible === false || p.available === false).length;

  // Accounting breakdown (Icopor, Discounts, Inventory Value, Payment Methods, Channels, Top Dishes, Categories)
  const icoporRecaudado = validOrders.reduce((acc, o) => acc + Number(o.icopor_total || 0), 0);
  const descuentosCupones = validOrders.reduce((acc, o) => acc + Number(o.descuento_cupon || 0), 0);
  const valorInventario = inventory.reduce((acc, i) => acc + Number(i.stock_actual || 0) * Number(i.costo_unitario || 0), 0);
  const insumosStockBajo = inventory.filter((i) => Number(i.stock_actual || 0) <= Number(i.stock_minimo || 5) && Number(i.stock_minimo || 0) > 0).length;

  const paymentMap = { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0 };
  const paymentCountMap = { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0 };
  const channelSalesMap = { domicilio: 0, mesa: 0, llevar: 0 };
  const productSalesMap = {};
  const categoryLookup = {};
  products.forEach((p) => {
    if (p.nombre) categoryLookup[p.nombre.toLowerCase()] = p.categoria || 'General';
  });
  const categorySalesMap = {};
  const hourBuckets = {};

  validOrders.forEach((o) => {
    const tot = Number(o.total || 0);
    const mp = String(o.metodo_pago || 'efectivo').toLowerCase();
    const keyMp = paymentMap[mp] !== undefined ? mp : 'efectivo';
    paymentMap[keyMp] += tot;
    paymentCountMap[keyMp] += 1;

    if (o.tipo === 'mesa' || o.tipo_servicio === 'mesa') {
      channelSalesMap.mesa += tot;
    } else if (o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar') {
      channelSalesMap.llevar += tot;
    } else {
      channelSalesMap.domicilio += tot;
    }

    if (o.created_at) {
      const hr = new Date(o.created_at).getHours();
      const label = `${String(hr).padStart(2, '0')}:00`;
      hourBuckets[label] = (hourBuckets[label] || 0) + 1;
    }

    (o.items || []).forEach((it) => {
      const name = it.nombre || 'Plato';
      const qty = Number(it.cantidad || 1);
      const unit = Number(it.precio_unitario || it.precio || 0);
      const lineTotal = qty * unit;
      if (!productSalesMap[name]) {
        productSalesMap[name] = { nombre: name, unidades: 0, ingresos: 0 };
      }
      productSalesMap[name].unidades += qty;
      productSalesMap[name].ingresos += lineTotal;

      const baseName = name.split(' (')[0].toLowerCase();
      const cat = categoryLookup[name.toLowerCase()] || categoryLookup[baseName] || 'Ejecutivos';
      if (!categorySalesMap[cat]) {
        categorySalesMap[cat] = { categoria: cat, unidades: 0, ingresos: 0 };
      }
      categorySalesMap[cat].unidades += qty;
      categorySalesMap[cat].ingresos += lineTotal;
    });
  });

  const topPlatos = Object.values(productSalesMap)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8);

  const ventasPorCategoria = Object.values(categorySalesMap).sort((a, b) => b.ingresos - a.ingresos);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const ultimos7Dias = [];
  const dailyStats = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = validOrders.filter((o) => String(o.created_at || '').slice(0, 10) === key);
    const daySales = dayOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    ultimos7Dias.push({
      fecha: d.toISOString(),
      total_ventas: daySales,
      total_pedidos: dayOrders.length,
    });
    dailyStats.push({
      date: dayNames[d.getDay()],
      ventas: daySales,
      pedidos: dayOrders.length,
    });
  }

  return {
    ventas_total: ventasTotal,
    pedidos_total: pedidosTotal,
    domicilios_total: domiciliosTotal,
    mesa_pedidos_total: mesaPedidosTotal,
    llevar_pedidos_total: llevarPedidosTotal,
    mesas_ocupadas: mesasOcupadas,
    mesas_totales: tables.length,
    clientes_total: customers.length,
    puntos_total: puntosTotal,
    mensajes_total: pedidosTotal,
    ticket_promedio_total: pedidosTotal > 0 ? Math.round(ventasTotal / pedidosTotal) : 0,
    productos_agotados: productosAgotados,
    insumos_stock_bajo: insumosStockBajo,
    valor_inventario: valorInventario,
    icopor_recaudado: icoporRecaudado,
    descuentos_cupones: descuentosCupones,
    pagos_desglose: paymentMap,
    pagos_conteo: paymentCountMap,
    canales_ventas: channelSalesMap,
    top_platos: topPlatos,
    ventas_por_categoria: ventasPorCategoria,
    horas_pico: hourBuckets,
    ventas_hoy: ventasHoy,
    pedidos_hoy: pedidosHoy,
    pedidos_activos: pedidosActivos,
    ticket_promedio: pedidosHoy > 0 ? Math.round(ventasHoy / pedidosHoy) : (pedidosTotal > 0 ? Math.round(ventasTotal / pedidosTotal) : 0),
    clientes_activos: customers.length,
    ultimos_7_dias: ultimos7Dias,
    daily_stats: dailyStats,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === 'undefined') {
      resolve('/images/hero-almuerzo.jpg');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '/images/hero-almuerzo.jpg'));
    reader.onerror = () => resolve('/images/hero-almuerzo.jpg');
    reader.readAsDataURL(file);
  });
}

export async function demoMockAdapter(config) {
  const method = (config.method || 'get').toLowerCase();
  const rawUrl = config.url || '';
  const path = rawUrl.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?')[0];
  const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `http://localhost${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`);
  const body = config.data instanceof FormData ? config.data : parseBody(config.data);

  let data = null;

  // 1. Business & Real Analytics
  if (path.match(/^\/business\/[^/]+\/analytics\/month$/)) {
    const stats = computeRealAnalytics();
    data = {
      ventas_mes: stats.ventas_total,
      pedidos_mes: stats.pedidos_total,
      ticket_promedio: stats.ticket_promedio_total,
      daily_stats: stats.daily_stats,
    };
  } else if (path.match(/^\/business\/[^/]+\/analytics$/)) {
    data = computeRealAnalytics();
  } else if (path.match(/^\/business\/[^/]+$/)) {
    let biz = loadBusiness();
    if (method === 'put' || method === 'patch') {
      biz = { ...biz, ...body, slug: 'vecos' };
      writeLS(KEYS.BUSINESS, biz);
      if (body.datos_pago) writeLS('fogon_mesa_datos_pago', body.datos_pago);
      if (body.metodos_pago) writeLS('vecos_metodos_pago', body.metodos_pago);
      if (body.telefono) {
        try { localStorage.setItem('vecos_restaurant_phone', String(body.telefono)); } catch (e) {}
      }
      if (body.logo_url) {
        try { localStorage.setItem('fogon_mesa_logo', String(body.logo_url)); } catch (e) {}
      }
      if (body.banner_url) {
        try { localStorage.setItem('fogon_mesa_banner', String(body.banner_url)); } catch (e) {}
      }
    }
    data = biz;
  }

  // 2. Tables (persisted + synced with active orders)
  else if (path.match(/^\/tables\/[^/]+$/)) {
    const tables = loadTables();
    if (method === 'post') {
      const newTable = {
        id: `t-${Date.now()}`,
        estado: 'libre',
        nombre: `Mesa ${body.numero}`,
        ...body,
      };
      tables.push(newTable);
      saveTables(tables);
      data = newTable;
    } else {
      data = tables;
    }
  } else if (path.match(/^\/tables\/[^/]+\/[^/]+$/)) {
    const tableId = path.split('/').pop();
    let tables = loadTables();
    if (method === 'put' || method === 'patch') {
      tables = tables.map((t) => (String(t.id) === String(tableId) ? { ...t, ...body } : t));
      saveTables(tables);
      data = tables.find((t) => String(t.id) === String(tableId)) || { ok: true };
    } else if (method === 'delete') {
      tables = tables.filter((t) => String(t.id) !== String(tableId));
      saveTables(tables);
      data = { deleted: true };
    }
  }

  // 3. Orders (persisted + auto-syncs Customers, Loyalty Points, and Tables)
  else if (path.match(/^\/orders\/[^/]+\/active$/)) {
    const orders = loadOrders();
    data = orders.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado');
  } else if (path.match(/^\/orders\/[^/]+$/)) {
    const orders = loadOrders();
    if (method === 'post') {
      data = registerRealOrder(body);
    } else {
      const limit = Number(urlObj.searchParams.get('limit') || 0);
      data = limit > 0 ? orders.slice(0, limit) : orders;
    }
  } else if (path.match(/^\/orders\/[^/]+\/[^/]+$/)) {
    const orderId = path.split('/').pop();
    let orders = loadOrders();
    if (method === 'put' || method === 'patch') {
      orders = orders.map((o) => (String(o.id) === String(orderId) ? { ...o, ...body } : o));
      saveOrders(orders);
      syncTableStatuses(orders);
      data = orders.find((o) => String(o.id) === String(orderId)) || { ok: true };
    } else if (method === 'delete') {
      orders = orders.filter((o) => String(o.id) !== String(orderId));
      saveOrders(orders);
      syncTableStatuses(orders);
      data = { deleted: true };
    }
  }

  // 4. Employees (full CRUD persisted)
  else if (path.match(/^\/employees\/[^/]+$/)) {
    const employees = loadEmployees();
    if (method === 'post') {
      const emp = { id: `emp-${Date.now()}`, activo: true, ...body };
      employees.push(emp);
      saveEmployees(employees);
      data = emp;
    } else {
      data = employees;
    }
  } else if (path.match(/^\/employees\/[^/]+\/[^/]+$/)) {
    const empId = path.split('/').pop();
    let employees = loadEmployees();
    if (method === 'put' || method === 'patch') {
      employees = employees.map((e) => (String(e.id) === String(empId) ? { ...e, ...body } : e));
      saveEmployees(employees);
      data = employees.find((e) => String(e.id) === String(empId)) || { ok: true };
    } else if (method === 'delete') {
      employees = employees.filter((e) => String(e.id) !== String(empId));
      saveEmployees(employees);
      data = { deleted: true };
    }
  }

  // 5. Inventory (full CRUD + stock adjustment transactions)
  else if (path.match(/^\/(catalog\/sedes\/[^/]+\/)?inventory$/)) {
    const inventory = loadInventory();
    if (method === 'post') {
      const item = {
        id: `inv-${Date.now()}`,
        stock_actual: Number(body.stock_actual || 0),
        stock_minimo: Number(body.stock_minimo || 5),
        unidad: body.unidad || 'kg',
        costo_unitario: Number(body.costo_unitario || 0),
        ...body,
        updated_at: new Date().toISOString(),
      };
      inventory.unshift(item);
      saveInventory(inventory);
      data = item;
    } else {
      data = inventory;
    }
  } else if (path.match(/^\/(catalog\/sedes\/)?inventory\/transaction$/) && method === 'post') {
    const inventory = loadInventory();
    const targetId = body.inventory_id || body.ingredient_id || body.item_id;
    const qty = Number(body.cantidad || body.quantity || 0);
    const tipo = String(body.tipo || body.type || 'entrada').toLowerCase();
    const updated = inventory.map((item) => {
      if (String(item.id) !== String(targetId)) return item;
      const current = Number(item.stock_actual || 0);
      let next = current;
      if (tipo === 'salida' || tipo === 'merma' || tipo === 'consumo') {
        next = Math.max(0, current - Math.abs(qty));
      } else if (tipo === 'ajuste' || tipo === 'set') {
        next = Math.max(0, qty);
      } else {
        next = current + Math.abs(qty);
      }
      return { ...item, stock_actual: next, updated_at: new Date().toISOString() };
    });
    saveInventory(updated);
    data = updated.find((i) => String(i.id) === String(targetId)) || { ok: true };
  } else if (path.match(/^\/(catalog\/sedes\/[^/]+\/)?inventory\/[^/]+$/)) {
    const itemId = path.split('/').pop();
    let inventory = loadInventory();
    if (method === 'put' || method === 'patch') {
      inventory = inventory.map((i) =>
        String(i.id) === String(itemId) ? { ...i, ...body, updated_at: new Date().toISOString() } : i
      );
      saveInventory(inventory);
      data = inventory.find((i) => String(i.id) === String(itemId)) || { ok: true };
    } else if (method === 'delete') {
      inventory = inventory.filter((i) => String(i.id) !== String(itemId));
      saveInventory(inventory);
      data = { deleted: true };
    }
  }

  // 6. Products / Menu Items / Categories / Tags / Ingredients
  else if (path.match(/^\/(menu-items|products)\/[^/]+$/)) {
    const products = loadProductsFromStorage();
    if (method === 'post') {
      const imgUrl = body.imagen_url || body.imagen || '';
      const prod = {
        id: `prod-${Date.now()}`,
        disponible: true,
        available: true,
        ...body,
        imagen: imgUrl,
        imagen_url: imgUrl,
      };
      products.push(prod);
      writeLS(KEYS.PRODUCTS, products);
      data = prod;
    } else {
      data = products;
    }
  } else if (path.match(/^\/(menu-items|products)\/[^/]+\/[^/]+$/)) {
    let products = loadProductsFromStorage();
    const prodId = path.split('/').pop();
    if (method === 'put' || method === 'patch') {
      const imgPatch =
        body.imagen_url !== undefined || body.imagen !== undefined
          ? { imagen: body.imagen_url ?? body.imagen, imagen_url: body.imagen_url ?? body.imagen }
          : {};
      products = products.map((p) =>
        String(p.id) === String(prodId)
          ? {
              ...p,
              ...body,
              ...imgPatch,
              disponible: body.disponible !== undefined ? body.disponible : body.available !== undefined ? body.available : p.disponible,
              available: body.available !== undefined ? body.available : body.disponible !== undefined ? body.disponible : p.available,
            }
          : p
      );
      writeLS(KEYS.PRODUCTS, products);
      data = products.find((p) => String(p.id) === String(prodId)) || { ok: true };
    } else if (method === 'delete') {
      products = products.filter((p) => String(p.id) !== String(prodId));
      writeLS(KEYS.PRODUCTS, products);
      data = { deleted: true };
    }
  } else if (path.match(/^\/categories\/[^/]+$/)) {
    ensureVecosMenuMigration();
    let categories = readLS(KEYS.CATEGORIES, [...VECOS_CATEGORIES]);
    if (method === 'post') {
      const cat = { id: `cat-${Date.now()}`, nombre: body.nombre || 'Nueva Categoría', icono: body.icono || '🍽️' };
      categories.push(cat);
      writeLS(KEYS.CATEGORIES, categories);
      data = cat;
    } else if (method === 'put' || method === 'patch') {
      const oldName = body.old_name || body.original_nombre;
      categories = categories.map((c) =>
        c.nombre === oldName ? { ...c, nombre: body.nombre || c.nombre, icono: body.icono || c.icono } : c
      );
      writeLS(KEYS.CATEGORIES, categories);
      data = { ok: true };
    } else if (method === 'delete') {
      const catName = urlObj.searchParams.get('nombre');
      if (catName) {
        categories = categories.filter((c) => c.nombre !== catName);
        writeLS(KEYS.CATEGORIES, categories);
      }
      data = { ok: true };
    } else {
      data = categories;
    }
  } else if (path === '/menu-ingredients/bulk-assign-category' && method === 'post') {
    const targetCat = String(body.category || '').trim();
    const ingId = String(body.ingredient_id || '').trim();
    const action = body.action || 'add';
    const isReq = body.is_required === true;
    let products = loadProductsFromStorage();
    let affected = 0;
    products = products.map((p) => {
      if (p.categoria !== targetCat) return p;
      const current = Array.isArray(p.menu_item_ingredients) ? p.menu_item_ingredients : [];
      if (action === 'remove') {
        const next = current.filter((l) => String(l.ingredient_id) !== ingId);
        if (next.length !== current.length) affected += 1;
        return { ...p, menu_item_ingredients: next };
      }
      if (current.some((l) => String(l.ingredient_id) === ingId)) return p;
      affected += 1;
      return {
        ...p,
        menu_item_ingredients: [...current, { ingredient_id: ingId, is_required: isReq }],
      };
    });
    writeLS(KEYS.PRODUCTS, products);
    data = { ok: true, affected };
  } else if (path === '/menu-ingredients') {
    const list = loadMenuIngredientsLocal();
    if (method === 'post') {
      const nameTrim = String(body.name || '').trim();
      const menuCats = Array.isArray(body.menu_categories)
        ? body.menu_categories
        : body.menu_category
          ? [String(body.menu_category)]
          : [];
      if (list.some((i) => i.name.toLowerCase() === nameTrim.toLowerCase())) {
        data = { error: `Ya existe el ingrediente "${nameTrim}"`, ingredients: list };
      } else {
        const newIng = {
          id: `ing-${Date.now()}`,
          name: nameTrim || 'Nuevo ingrediente',
          category: body.category || 'acompanante',
          menu_categories: menuCats,
          is_available: body.is_available !== false,
          is_active: true,
        };
        saveMenuIngredientsLocal([...list, newIng]);
        if (menuCats.length > 0) {
          let products = loadProductsFromStorage();
          products = products.map((p) => {
            if (!menuCats.includes(p.categoria)) return p;
            const current = Array.isArray(p.menu_item_ingredients) ? p.menu_item_ingredients : [];
            if (current.some((l) => String(l.ingredient_id) === String(newIng.id))) return p;
            return {
              ...p,
              menu_item_ingredients: [...current, { ingredient_id: newIng.id, is_required: false }],
            };
          });
          writeLS(KEYS.PRODUCTS, products);
        }
        data = newIng;
      }
    } else {
      data = list;
    }
  } else if (path.match(/^\/menu-ingredients\/[^/]+$/)) {
    const ingId = path.split('/').pop();
    const list = loadMenuIngredientsLocal();
    if (method === 'put' || method === 'patch') {
      const updated = list.map((i) => (String(i.id) === String(ingId) ? { ...i, ...body } : i));
      saveMenuIngredientsLocal(updated);
      data = updated.find((i) => String(i.id) === String(ingId)) || { ok: true };
    } else if (method === 'delete') {
      saveMenuIngredientsLocal(list.filter((i) => String(i.id) !== String(ingId)));
      let products = loadProductsFromStorage();
      products = products.map((p) => {
        if (!Array.isArray(p.menu_item_ingredients)) return p;
        return {
          ...p,
          menu_item_ingredients: p.menu_item_ingredients.filter((l) => String(l.ingredient_id) !== String(ingId)),
        };
      });
      writeLS(KEYS.PRODUCTS, products);
      data = { deleted: true };
    }
  } else if (path.match(/^\/tags\/[^/]+$/)) {
    let tagsList = readLS(KEYS.TAGS, ['Recomendado', 'Más Vendido', 'Nuevo', 'Oferta', 'Picante']);
    if (method === 'post') {
      if (body.nombre && !tagsList.includes(body.nombre)) {
        tagsList.push(body.nombre);
        writeLS(KEYS.TAGS, tagsList);
      }
      data = tagsList;
    } else if (method === 'put' || method === 'patch') {
      const oldTag = body.old_name || body.original_nombre;
      tagsList = tagsList.map((t) => (t === oldTag ? (body.nombre || t) : t));
      writeLS(KEYS.TAGS, tagsList);
      data = tagsList;
    } else if (method === 'delete') {
      const tagName = urlObj.searchParams.get('nombre');
      if (tagName) {
        tagsList = tagsList.filter((t) => t !== tagName);
        writeLS(KEYS.TAGS, tagsList);
      }
      data = tagsList;
    } else {
      data = tagsList;
    }
  }

  // 7. AI Tools & Real Business Insights
  else if ((path === '/ai/nutrition' || path === '/gemini/nutrition') && method === 'post') {
    const nameLower = String(body.name || body.nombre || '').toLowerCase();
    const isDrinkOrDessert = /jugo|limonada|agua|bebida|coca|postre|flan|torta|helado/.test(nameLower);
    data = isDrinkOrDessert
      ? { kcal: 195, proteina: '3g', carbohidratos: '34g', grasa: '5g' }
      : { kcal: 680, proteina: '42g', carbohidratos: '48g', grasa: '28g' };
  } else if (path === '/ai/generate-product-description' && method === 'post') {
    const dishName = String(body.nombre || '').trim();
    const dishCat = String(body.categoria || '').trim();
    let generatedDesc = '';

    // 1. Intentar primero con el motor real de IA en backend
    try {
      const apiBase = (import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');
      const endpoint = apiBase
        ? (apiBase.endsWith('/api') ? `${apiBase}/ai/demo-generate-product-description` : `${apiBase}/api/ai/demo-generate-product-description`)
        : '/api/ai/demo-generate-product-description';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: dishName, categoria: dishCat }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.description && json.description.trim().length > 20) {
          generatedDesc = json.description.trim();
        }
      }
    } catch (err) {}

    // 2. Motor culinario local enriquecido (nunca repite el nombre del plato ni inventa acompañantes)
    if (!generatedDesc) {
      const n = dishName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cat = dishCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (/bebida|jugo|limonada|gaseosa|agua|te|cafe|batido|malteada|smoothie|michelada|cerveza/.test(n) || cat.includes('bebida')) {
        if (/coco/.test(n)) {
          generatedDesc = 'Preparación cremosa y bien fría con notas frescas de cítrico y coco natural. Suave, aromática y muy refrescante.';
        } else if (/hierbabuena|menta|cerezada|mango|maracuya|lulo|mora|fresa|guanabana/.test(n)) {
          generatedDesc = 'Elaborada al momento con fruta fresca seleccionada y el punto justo de dulzor. Llega bien fría, ligera y natural.';
        } else {
          generatedDesc = 'Servida bien fría y lista para disfrutar al instante. Refrescante y de sabor limpio en cada sorbo.';
        }
      } else if (/sopa|sancocho|mondongo|ajiaco|cazuela|caldo|frijol|lenteja/.test(n)) {
        generatedDesc = 'Caldo sustancioso de cocción lenta que concentra sabores caseros profundos, carnes tiernas, tubérculos suaves y un toque aromático de cilantro fresco.';
      } else if (/picada/.test(n)) {
        generatedDesc = 'Selección generosa de cortes dorados a la brasa, embutidos jugosos y bocados crocantes sazonados con el toque de la casa. Ideal para compartir en la mesa.';
      } else if (/hamburguesa|burger|perro|sandwich|wrap/.test(n)) {
        generatedDesc = 'Armado al momento con proteína jugosa a la plancha, queso fundido, vegetales frescos y salsa artesanal en pan suave ligeramente tostado.';
      } else if (/mojarra|tilapia|trucha|salmon|pescado|robalo|bagre|camaron|marisco/.test(n)) {
        if (/frit/.test(n)) {
          generatedDesc = 'Pieza fresca de pesca seleccionada, dorada hasta lograr una piel crujiente por fuera y carne blanca sumamente jugosa por dentro.';
        } else if (/ajillo|salsa|coco|criolla/.test(n)) {
          generatedDesc = 'Corte de pescado tierno bañado en una salsa aromática reducida a fuego suave que realza su frescura natural y textura delicada.';
        } else {
          generatedDesc = 'Pesca fresca sellada al punto exacto para conservar toda su jugosidad, textura suave y sabor limpio.';
        }
      } else if (/pechuga|pollo/.test(n)) {
        if (/gratinad|queso/.test(n)) {
          generatedDesc = 'Filete de pollo jugoso, sazonado al punto y cubierto con una capa generosa de queso fundido y dorado al horno. Acabado cremoso por fuera y tierno por dentro.';
        } else if (/champinon|salsa|crema|bechamel/.test(n)) {
          generatedDesc = 'Corte tierno de pollo sellado a la plancha y bañado en una salsa cremosa de cocción suave con notas aromáticas y textura envolvente.';
        } else if (/hawaian|pina/.test(n)) {
          generatedDesc = 'Filete de pollo dorado a la plancha con un contraste dulce y salado de piña caramelizada y queso fundido al calor.';
        } else if (/bbq|barbecue|miel|mostaza/.test(n)) {
          generatedDesc = 'Corte jugoso de pollo glaseado al calor con salsa artesanal ligeramente caramelizada, de exterior brillante y centro muy suave.';
        } else if (/apanad|empanizad|milanesa|crispy|crocant/.test(n)) {
          generatedDesc = 'Filete de pollo marinado en especias suaves y cubierto con un apanado dorado y muy crocante, tierno y jugoso por dentro.';
        } else {
          generatedDesc = 'Corte de pollo marinado en hierbas y especias de la casa, sellado al calor para mantener un dorado parejo y toda su jugosidad natural.';
        }
      } else if (/costilla/.test(n)) {
        generatedDesc = 'Tierna y jugosa de cocción lenta, terminada al calor con un glaseado ahumado y caramelizado que se desprende fácilmente del hueso.';
      } else if (/churrasco|punta de anca|bife|baby beef|carne|res|lomo|sobrebarriga|higado|lengua/.test(n)) {
        if (/gratinad|queso/.test(n)) {
          generatedDesc = 'Corte seleccionado sellado al punto y coronado con queso fundido y ligeramente dorado, combinando jugosidad intensa con un acabado cremoso.';
        } else if (/salsa|criolla|sudada|guisada|champinon/.test(n)) {
          generatedDesc = 'Corte tierno cocinado lentamente en salsa casera espesa y aromática que impregna cada fibra con un sabor profundo y tradicional.';
        } else {
          generatedDesc = 'Corte jugoso sazonado con sal y especias de la casa, sellado a fuego alto para lograr un dorado exterior ahumado y centro tierno.';
        }
      } else if (/cerdo|chuleta|chicharron|bondiola|tocineta/.test(n)) {
        if (/chicharron/.test(n)) {
          generatedDesc = 'Corte crujiente y bien dorado de piel tostada con centro suave y jugoso, sazonado al punto justo.';
        } else {
          generatedDesc = 'Corte tierno de cerdo marinado en sazón artesanal y sellado al calor hasta lograr un dorado parejo, jugoso y bien balanceado.';
        }
      } else if (/arroz/.test(n)) {
        generatedDesc = 'Grano suelto salteado al fuego con vegetales frescos, proteínas jugosas y condimentos tradicionales que perfuman cada cucharada.';
      } else if (/pasta|espagueti|fetuccini|lasana/.test(n)) {
        generatedDesc = 'Preparación al dente envuelta en salsa cremosa o reducida a fuego lento con hierbas aromáticas y un toque de queso fundido.';
      } else {
        generatedDesc = 'Preparación artesanal elaborada al momento con ingredientes frescos, sazón equilibrada y punto de cocción cuidado al detalle.';
      }
    }

    data = { description: generatedDesc };
  } else if (path === '/ai/generate-product-image' && method === 'post') {
    const reqProvider = body.provider || 'both';
    try {
      const apiBase = (import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');
      const endpoint = apiBase
        ? (apiBase.endsWith('/api') ? `${apiBase}/ai/demo-generate-product-image` : `${apiBase}/api/ai/demo-generate-product-image`)
        : '/api/ai/demo-generate-product-image';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: body.nombre || 'Plato',
          descripcion: body.descripcion || '',
          provider: reqProvider,
          pexels_page: body.pexels_page || 1,
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        data = {
          openai: json.openai || null,
          pexels: json.pexels || null,
          url: json.url || json.openai?.url || json.pexels?.url || pickFallbackFoodImage(body.nombre),
        };
      }
    } catch (err) {}
    if (!data) {
      const fallbackUrl = pickFallbackFoodImage(body.nombre);
      data = {
        openai: { url: null, error: 'Backend no disponible' },
        pexels: { url: fallbackUrl, options: [{ url: fallbackUrl, photographer: 'Catálogo Veco\'s' }], error: null },
        url: fallbackUrl,
      };
    }
  } else if (path.match(/^\/ai\/insights\//)) {
    const stats = computeRealAnalytics();
    const inv = loadInventory();
    const lowStock = inv.filter((i) => Number(i.stock_actual || 0) <= Number(i.stock_minimo || 5));
    data = {
      resumen:
        stats.pedidos_total > 0
          ? `Veco's Restaurante acumula ${stats.pedidos_total} pedido(s) registrados por $${stats.ventas_total.toLocaleString('es-CO')} (ticket promedio $${stats.ticket_promedio_total.toLocaleString('es-CO')}).`
          : "Aún no hay pedidos registrados hoy en Veco's Restaurante. A medida que entren pedidos desde el menú o mesas, verás tus métricas reales aquí.",
      insights: [
        {
          titulo: 'Operación en vivo',
          descripcion: `${stats.pedidos_activos} pedido(s) activos en cocina y ${stats.mesas_ocupadas}/${stats.mesas_totales} mesas ocupadas.`,
          tipo: 'operacion',
        },
        {
          titulo: 'Base de clientes y fidelidad',
          descripcion: `${stats.clientes_total} cliente(s) registrados con ${stats.puntos_total} puntos acumulados.`,
          tipo: 'fidelidad',
        },
        ...(lowStock.length > 0
          ? [{
              titulo: 'Alerta de inventario',
              descripcion: `${lowStock.length} insumo(s) con stock bajo: ${lowStock.slice(0, 3).map((i) => i.nombre).join(', ')}.`,
              tipo: 'inventario',
            }]
          : []),
      ],
    };
  } else if (path.match(/^\/ai\/consultant\/chat\//) && method === 'post') {
    const stats = computeRealAnalytics();
    const inv = loadInventory();
    const orders = loadOrders().filter((o) => o.estado !== 'cancelado');
    const lowStock = inv.filter((i) => Number(i.stock_actual || 0) <= Number(i.stock_minimo || 5) && Number(i.stock_minimo || 0) > 0);
    const bodyMsg = String(body.message || '').toLowerCase();

    // 1. Arqueo / Medios de pago / Caja / Efectivo / Nequi
    if (bodyMsg.includes('arqueo') || bodyMsg.includes('caja') || bodyMsg.includes('nequi') || bodyMsg.includes('efectivo') || bodyMsg.includes('daviplata') || bodyMsg.includes('pago')) {
      const pMap = { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0 };
      orders.forEach((o) => {
        const mp = String(o.metodo_pago || 'efectivo').toLowerCase();
        const key = pMap[mp] !== undefined ? mp : 'efectivo';
        pMap[key] += Number(o.total || 0);
      });
      const tot = Object.values(pMap).reduce((a, b) => a + b, 0);
      const efPct = tot > 0 ? Math.round((pMap.efectivo / tot) * 100) : 0;
      const nqPct = tot > 0 ? Math.round((pMap.nequi / tot) * 100) : 0;
      const dvPct = tot > 0 ? Math.round((pMap.daviplata / tot) * 100) : 0;
      const trPct = tot > 0 ? Math.round((pMap.transferencia / tot) * 100) : 0;

      data = {
        reply: `💰 **Arqueo de Caja y Medios de Pago (Veco's Restaurante):**\n\n• **Efectivo Físico en Caja:** $${pMap.efectivo.toLocaleString('es-CO')} (${efPct}%)\n• **Nequi:** $${pMap.nequi.toLocaleString('es-CO')} (${nqPct}%)\n• **Daviplata:** $${pMap.daviplata.toLocaleString('es-CO')} (${dvPct}%)\n• **Transferencia Bancaria:** $${pMap.transferencia.toLocaleString('es-CO')} (${trPct}%)\n• **Total Recaudado:** $${tot.toLocaleString('es-CO')}\n\n💡 **Recomendación Contable:** Los canales digitales (Nequi/Daviplata) representan el ${nqPct + dvPct + trPct}% del ingreso. Asegúrate de verificar los comprobantes en el celular de caja antes de entregar los pedidos.`,
      };
    }
    // 2. Platos / Menú / Rentables / Margen
    else if (bodyMsg.includes('plato') || bodyMsg.includes('rentab') || bodyMsg.includes('menu') || bodyMsg.includes('menú') || bodyMsg.includes('margen')) {
      const itemMap = {};
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const name = it.nombre || it.name || 'Plato';
          const price = Number(it.precio || it.price || 0);
          const qty = Number(it.cantidad || it.quantity || 1);
          if (!itemMap[name]) itemMap[name] = { name, count: 0, revenue: 0, price };
          itemMap[name].count += qty;
          itemMap[name].revenue += price * qty;
        });
      });
      const sorted = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
      const top3 = sorted.slice(0, 3);

      const topText = top3.length > 0
        ? top3.map((p, idx) => `${idx + 1}. **${p.name}**: ${p.count} vendidos — $${p.revenue.toLocaleString('es-CO')} (Margen estimado: ~68%)`).join('\n')
        : '• Aún no hay ventas suficientes para determinar el ranking.';

      data = {
        reply: `🍽️ **Análisis de Rentabilidad y Menú:**\n\n${topText}\n\n💡 **Estrategia para el Admin:** Platos estrella como el *Sancocho de Costilla* y los *Asados* tienen excelente rotación. Te recomiendo ofrecer siempre un combo con bebida o postre adicional para incrementar el ticket promedio en un 15% a 20%.`,
      };
    }
    // 3. Inventario / Insumos / Stock / Agotados
    else if (bodyMsg.includes('inventario') || bodyMsg.includes('insumo') || bodyMsg.includes('stock') || bodyMsg.includes('agotado') || bodyMsg.includes('merma')) {
      const totalInvVal = inv.reduce((acc, i) => acc + Number(i.stock_actual || 0) * Number(i.costo_unitario || 0), 0);
      data = {
        reply: `📦 **Auditoría de Inventario en Tiempo Real:**\n\n• **Valorización de Stock:** $${totalInvVal.toLocaleString('es-CO')}\n• **Total Insumos Registrados:** ${inv.length}\n• **Insumos en Alerta Crítica (Stock Bajo):** ${lowStock.length}\n${lowStock.length > 0 ? `\n⚠️ **Insumos que debes reponer urgentemente:**\n${lowStock.map((i) => `• ${i.nombre}: ${i.stock_actual} ${i.unidad || 'und'} (Mínimo requerido: ${i.stock_minimo})`).join('\n')}` : '\n✅ Todos los insumos tienen niveles saludables de existencias.'}\n\n💡 **Tip de Ahorro:** Revisa las mermas semanales para evitar sobrecostos en carnes y verduras.`,
      };
    }
    // 4. Domicilio vs Mesa vs Llevar / Icopor
    else if (bodyMsg.includes('domicilio') || bodyMsg.includes('mesa') || bodyMsg.includes('llevar') || bodyMsg.includes('canal') || bodyMsg.includes('icopor')) {
      const cMap = { domicilio: 0, mesa: 0, llevar: 0 };
      let icoporTotal = 0;
      orders.forEach((o) => {
        const tot = Number(o.total || 0);
        icoporTotal += Number(o.icopor_total || 0);
        if (o.tipo === 'mesa' || o.tipo_servicio === 'mesa') cMap.mesa += tot;
        else if (o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar') cMap.llevar += tot;
        else cMap.domicilio += tot;
      });
      data = {
        reply: `🛵 **Distribución por Canales de Venta & Empaque:**\n\n• **En Mesa (Salón):** $${cMap.mesa.toLocaleString('es-CO')}\n• **Domicilios:** $${cMap.domicilio.toLocaleString('es-CO')}\n• **Para Llevar (Takeaway):** $${cMap.llevar.toLocaleString('es-CO')}\n• **Recaudo por Empaque Icopor:** $${icoporTotal.toLocaleString('es-CO')}\n\n💡 **Control:** El recaudo de icopor ($1.000 por empaque) cubre el costo del recipiente térmico y la bolsa, protegiendo el margen neto de la comida.`,
      };
    }
    // 5. Ticket promedio / Ventas generales
    else if (bodyMsg.includes('ticket') || bodyMsg.includes('promedio') || bodyMsg.includes('subir') || bodyMsg.includes('estrategia')) {
      const ticketProm = stats.pedidos_total > 0 ? Math.round(stats.ventas_total / stats.pedidos_total) : 0;
      data = {
        reply: `📈 **Estrategia de Ticket Promedio & Crecimiento:**\n\n• **Ticket Promedio Actual:** $${ticketProm.toLocaleString('es-CO')} por pedido.\n• **Ventas Totales:** $${stats.ventas_total.toLocaleString('es-CO')} en ${stats.pedidos_total} órdenes.\n\n🎯 **3 Acciones Inmediatas para Subir Ventas:**\n1. **Venta Cruzada en Mesa:** Entrenar a los meseros para ofrecer entrada (Picada pequeña) o postre en mesa.\n2. **Fidelidad & Ruleta:** Promover el giro de la ruleta después del pago para incentivar la visita en menos de 48 horas.\n3. **Bebidas en Combo:** Crear precios especiales de almuerzo ejecutivo + limonada natural.`,
      };
    }
    // 6. Resumen general
    else {
      data = {
        reply: `📊 **Reporte Gerencial & Contable (Veco's Restaurante):**\n\n• **Ventas Acumuladas:** $${stats.ventas_total.toLocaleString('es-CO')} (${stats.pedidos_total} órdenes)\n• **Ventas de Hoy:** $${stats.ventas_hoy.toLocaleString('es-CO')} (${stats.pedidos_hoy} pedidos)\n• **Ticket Promedio:** $${(stats.pedidos_total > 0 ? Math.round(stats.ventas_total / stats.pedidos_total) : 0).toLocaleString('es-CO')}\n• **Estado Cocina:** ${stats.pedidos_activos} pedidos en preparación\n• **Mesas Ocupadas:** ${stats.mesas_ocupadas} de ${stats.mesas_totales}\n• **Insumos en Alerta:** ${lowStock.length > 0 ? `${lowStock.length} insumos requieren pedido` : 'Stock al día'}\n\n¿Deseas que auditemos **arqueo de caja**, **platos rentables**, **inventario** o **estrategias de venta**?`,
      };
    }
  }

  // 8. Loyalty & Customers (100% persisted and interlocked)
  else if (path.match(/^\/loyalty\/[^/]+\/customers\/[^/]+$/)) {
    const phoneOrId = decodeURIComponent(path.split('/').pop() || '');
    const norm = normalizePhone(phoneOrId);
    let customers = loadCustomers();
    if (method === 'delete') {
      customers = customers.filter(
        (c) => String(c.id) !== phoneOrId && normalizePhone(c.telefono || c.phone) !== norm
      );
      saveCustomers(customers);
      data = { deleted: true };
    } else if (method === 'put' || method === 'patch') {
      customers = customers.map((c) =>
        String(c.id) === phoneOrId || normalizePhone(c.telefono || c.phone) === norm
          ? { ...c, ...body, nombre: body.nombre || body.name || c.nombre, name: body.name || body.nombre || c.name }
          : c
      );
      saveCustomers(customers);
      data = customers.find((c) => String(c.id) === phoneOrId || normalizePhone(c.telefono || c.phone) === norm) || { ok: true };
    } else {
      data = customers.find((c) => String(c.id) === phoneOrId || normalizePhone(c.telefono || c.phone) === norm) || null;
    }
  } else if (path.match(/^\/loyalty\/[^/]+\/customers$/)) {
    const customers = loadCustomers();
    if (method === 'post') {
      const phone = normalizePhone(body.telefono || body.phone);
      const existing = phone ? customers.find((c) => normalizePhone(c.telefono || c.phone) === phone) : null;
      if (existing) {
        data = existing;
      } else {
        const cust = {
          id: `cust-${Date.now()}`,
          nombre: body.nombre || body.name || 'Cliente',
          name: body.name || body.nombre || 'Cliente',
          telefono: phone || body.telefono || body.phone || '',
          phone: phone || body.phone || body.telefono || '',
          email: body.email || '',
          direccion: body.direccion || '',
          puntos: Number(body.puntos || body.points || 0),
          points: Number(body.points || body.puntos || 0),
          puntos_totales: Number(body.puntos || body.points || 0),
          puntos_disponibles: Number(body.puntos || body.points || 0),
          total_gastado: 0,
          pedidos_count: 0,
          created_at: new Date().toISOString(),
        };
        customers.unshift(cust);
        saveCustomers(customers);
        data = cust;
      }
    } else {
      const q = (urlObj.searchParams.get('q') || '').trim().toLowerCase();
      const limit = Number(urlObj.searchParams.get('limit') || 0);
      let list = customers;
      if (q) {
        list = list.filter(
          (c) =>
            String(c.nombre || c.name || '').toLowerCase().includes(q) ||
            String(c.telefono || c.phone || '').includes(q)
        );
      }
      data = limit > 0 ? list.slice(0, limit) : list;
    }
  } else if (path.match(/^\/loyalty\/[^/]+\/points\/[^/]+$/)) {
    const customerId = decodeURIComponent(path.split('/').pop() || '');
    const norm = normalizePhone(customerId);
    const customers = loadCustomers();
    data =
      customers.find((c) => String(c.id) === customerId || normalizePhone(c.telefono || c.phone) === norm) ||
      { id: customerId, nombre: 'Cliente', telefono: customerId, puntos: 0, puntos_disponibles: 0, puntos_totales: 0 };
  } else if (path.match(/^\/loyalty\/[^/]+\/transactions\/[^/]+$/)) {
    const customerId = decodeURIComponent(path.split('/').pop() || '');
    const norm = normalizePhone(customerId);
    const txs = loadLoyaltyTx();
    data = txs.filter((t) => String(t.customer_id) === customerId || normalizePhone(t.telefono) === norm);
  } else if (path.match(/^\/loyalty\/[^/]+\/recent-transactions$/)) {
    const limit = Number(urlObj.searchParams.get('limit') || 50);
    data = loadLoyaltyTx().slice(0, limit);
  } else if (path.match(/^\/loyalty\/[^/]+\/award$/) && method === 'post') {
    const customers = loadCustomers();
    const phone = normalizePhone(body.telefono || body.phone || body.customer_phone);
    const custId = body.customer_id;
    const pts = Number(body.puntos || body.points || 0);
    let customer = customers.find(
      (c) => (custId && String(c.id) === String(custId)) || (phone && normalizePhone(c.telefono || c.phone) === phone)
    );
    if (!customer && phone) {
      customer = {
        id: `cust-${Date.now()}`,
        nombre: body.nombre || `Cliente ${phone.slice(-4)}`,
        name: body.nombre || `Cliente ${phone.slice(-4)}`,
        telefono: phone,
        phone,
        puntos: 0,
        points: 0,
        puntos_totales: 0,
        puntos_disponibles: 0,
        total_gastado: 0,
        pedidos_count: 0,
        created_at: new Date().toISOString(),
      };
      customers.unshift(customer);
    }
    if (customer) {
      const nextPts = Math.max(0, Number(customer.puntos_disponibles ?? customer.puntos ?? 0) + pts);
      customer.puntos = nextPts;
      customer.points = nextPts;
      customer.puntos_disponibles = nextPts;
      if (pts > 0) customer.puntos_totales = Number(customer.puntos_totales || 0) + pts;
      saveCustomers(customers);

      const txs = loadLoyaltyTx();
      txs.unshift({
        id: `tx-${Date.now()}`,
        customer_id: customer.id,
        telefono: customer.telefono,
        cliente_nombre: customer.nombre,
        tipo: pts >= 0 ? 'ganados' : 'canjeados',
        puntos: pts,
        descripcion: body.descripcion || body.reason || (pts >= 0 ? 'Puntos asignados manualmente' : 'Canje de puntos'),
        created_at: new Date().toISOString(),
      });
      saveLoyaltyTx(txs.slice(0, 200));
    }
    data = { ok: true, customer };
  } else if (path.match(/^\/loyalty\/[^/]+\/wheel\/config/)) {
    if (method === 'put' || method === 'post') {
      const nextCfg = { ...loadWheelConfigLocal(), ...body };
      saveWheelConfigLocal(nextCfg);
      data = nextCfg;
    } else {
      data = loadWheelConfigLocal();
    }
  } else if (path.match(/^\/loyalty\/[^/]+\/wheel\/history/)) {
    data = loadWheelHistoryLocal();
  } else if (path.match(/^\/loyalty\/[^/]+\/wheel\/status/)) {
    const cfg = loadWheelConfigLocal();
    const history = loadWheelHistoryLocal();
    const today = getTodayDateStr();
    const phone = normalizePhone(urlObj.searchParams.get('telefono') || body.telefono || '');
    const customers = loadCustomers();
    const customer = customers.find((c) => normalizePhone(c.telefono || c.phone) === phone);
    const userTodaySpins = history.filter((h) => h.telefono === phone && h.fecha_dia === today);
    const freeUsed = userTodaySpins.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userTodaySpins.filter((h) => h.modo === 'puntos').length;
    const customerPoints = customer ? Number(customer.puntos_disponibles ?? customer.puntos ?? 0) : 0;
    data = {
      telefono: phone,
      nombre: customer?.nombre || 'Cliente',
      puntos_disponibles: customerPoints,
      tiros_gratis_restantes: Math.max(0, (cfg.tiros_gratis_dia || 1) - freeUsed),
      tiros_puntos_restantes: cfg.permitir_tiro_puntos
        ? Math.max(0, (cfg.max_tiros_puntos_dia || 2) - pointsUsed)
        : 0,
      costo_tiro_puntos: cfg.costo_tiro_puntos || 30,
      permitir_tiro_puntos: !!cfg.permitir_tiro_puntos,
      historial_cliente: history.filter((h) => h.telefono === phone).slice(0, 10),
    };
  } else if (path.match(/^\/loyalty\/[^/]+\/wheel\/spin/)) {
    const cfg = loadWheelConfigLocal();
    const history = loadWheelHistoryLocal();
    const today = getTodayDateStr();
    const phone = normalizePhone(body.telefono || '') || 'preview';
    const usePoints = !!body.usar_puntos;
    const isPreview = !!body.preview;
    const customers = loadCustomers();

    let customer = customers.find((c) => normalizePhone(c.telefono || c.phone) === phone);
    if (!customer && !isPreview) {
      customer = {
        id: `cust-${Date.now()}`,
        nombre: body.nombre || `Cliente ${phone.slice(-4)}`,
        name: body.nombre || `Cliente ${phone.slice(-4)}`,
        telefono: phone,
        phone,
        puntos: 0,
        points: 0,
        puntos_totales: 0,
        puntos_disponibles: 0,
        total_gastado: 0,
        pedidos_count: 0,
        created_at: new Date().toISOString(),
      };
      customers.unshift(customer);
      saveCustomers(customers);
    }

    const userTodaySpins = history.filter((h) => h.telefono === phone && h.fecha_dia === today);
    const freeUsed = userTodaySpins.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userTodaySpins.filter((h) => h.modo === 'puntos').length;
    const freeLimit = cfg.tiros_gratis_dia ?? 1;
    const pointsLimit = cfg.max_tiros_puntos_dia ?? 2;
    const costPoints = cfg.costo_tiro_puntos ?? 30;
    const currentPoints = customer ? Number(customer.puntos_disponibles ?? customer.puntos ?? 0) : 0;

    if (!isPreview) {
      if (!usePoints && freeUsed >= freeLimit) {
        return {
          data: { detail: 'Ya usaste tu giro gratis de hoy. Puedes girar usando tus puntos o volver mañana.' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config,
        };
      }
      if (usePoints) {
        if (!cfg.permitir_tiro_puntos) {
          return {
            data: { detail: 'Los giros con puntos están desactivados por el restaurante.' },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
          };
        }
        if (pointsUsed >= pointsLimit) {
          return {
            data: { detail: `Has alcanzado el límite de ${pointsLimit} giros con puntos por hoy.` },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
          };
        }
        if (currentPoints < costPoints) {
          return {
            data: { detail: `Necesitas ${costPoints} puntos para girar (tienes ${currentPoints} pts).` },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
          };
        }
      }
    }

    const todayAllSpins = history.filter((h) => h.fecha_dia === today);
    const { segment, index } = pickWeightedSegment(cfg.segmentos, todayAllSpins);
    const couponCode = segment.tipo === 'puntos' ? null : generateCouponCode(segment);
    const expiresAt = new Date(Date.now() + (cfg.vigencia_horas || 48) * 3600 * 1000).toISOString();

    let updatedPoints = currentPoints;
    if (!isPreview && customer) {
      if (usePoints) updatedPoints = Math.max(0, updatedPoints - costPoints);
      if (segment.tipo === 'puntos') {
        updatedPoints += Number(segment.valor || 5);
        customer.puntos_totales = Number(customer.puntos_totales || 0) + Number(segment.valor || 5);
      }
      customer.puntos = updatedPoints;
      customer.points = updatedPoints;
      customer.puntos_disponibles = updatedPoints;
      saveCustomers(customers);
    }

    const spinRecord = {
      id: `spin-${Date.now()}`,
      telefono: phone,
      cliente_nombre: customer?.nombre || 'Vista Previa',
      segmento_id: segment.id,
      segmento_index: index,
      premio_label: segment.label,
      premio_emoji: segment.emoji,
      premio_tipo: segment.tipo,
      premio_valor: segment.valor,
      codigo_cupon: couponCode,
      modo: usePoints ? 'puntos' : 'gratis',
      puntos_usados: usePoints ? costPoints : 0,
      compra_minima: segment.tipo === 'puntos' ? 0 : (cfg.compra_minima_cupon || 0),
      expira_en: expiresAt,
      fecha_dia: today,
      created_at: new Date().toISOString(),
    };

    if (!isPreview) {
      history.unshift(spinRecord);
      saveWheelHistoryLocal(history);
    }

    data = {
      ...spinRecord,
      puntos_disponibles: updatedPoints,
      tiros_gratis_restantes: isPreview ? 1 : Math.max(0, freeLimit - (freeUsed + (usePoints ? 0 : 1))),
      tiros_puntos_restantes: isPreview
        ? pointsLimit
        : (cfg.permitir_tiro_puntos ? Math.max(0, pointsLimit - (pointsUsed + (usePoints ? 1 : 0))) : 0),
    };
  } else if (path.match(/^\/loyalty\/[^/]+\/config/)) {
    let cfg = loadLoyaltyConfig();
    if (method === 'put' || method === 'post') {
      cfg = { ...cfg, ...body };
      saveLoyaltyConfig(cfg);
    }
    data = cfg;
  } else if (path.match(/^\/loyalty\//)) {
    data = [];
  }

  // 9. File Upload (converts real uploaded file into persisted Data URL)
  else if (path === '/upload' && method === 'post') {
    if (body instanceof FormData) {
      const file = body.get('file');
      const dataUrl = await readFileAsDataUrl(file);
      data = { url: dataUrl };
    } else {
      data = { url: body?.url || '/images/hero-almuerzo.jpg' };
    }
  }

  // Fallback for any other GET/POST/PUT
  else {
    data = method === 'get' ? [] : { ok: true, ...(body instanceof FormData ? {} : body) };
  }

  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}
