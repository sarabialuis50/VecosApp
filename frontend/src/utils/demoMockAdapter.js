// In-memory mock data store for universal test credentials (local preview without Supabase)
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

const demoStore = {
  business: {
    id: 'vecos-restaurante-id',
    nombre: "Veco's Restaurante",
    slug: 'demo-restaurante',
    email: 'admin@vecosrestaurante.com',
    plan: 'pro',
    parent_id: null,
    telefono: '3017810256',
    direccion: 'Zona Gastronómica — Veco\'s Restaurante',
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
  },
  tables: [
    { id: 't-1', numero: '1', nombre: 'Mesa 1', capacidad: 4, estado: 'libre', ubicacion: 'Salón Principal' },
    { id: 't-2', numero: '2', nombre: 'Mesa 2', capacidad: 4, estado: 'ocupada', ubicacion: 'Salón Principal' },
    { id: 't-3', numero: '3', nombre: 'Mesa 3', capacidad: 2, estado: 'libre', ubicacion: 'Ventana' },
    { id: 't-4', numero: '4', nombre: 'Mesa 4', capacidad: 6, estado: 'ocupada', ubicacion: 'Terraza' },
    { id: 't-5', numero: '5', nombre: 'Mesa 5', capacidad: 4, estado: 'reservada', ubicacion: 'Terraza' },
    { id: 't-6', numero: '6', nombre: 'Mesa 6', capacidad: 2, estado: 'libre', ubicacion: 'Barra' },
  ],
  employees: [
    { id: 'emp-1', nombre: 'Carlos Gómez', rol: 'mesero', pin: '1234', activo: true, telefono: '3001112233' },
    { id: 'emp-2', nombre: 'Ana Martínez', rol: 'cocina', pin: '5678', activo: true, telefono: '3004445566' },
    { id: 'emp-3', nombre: 'Mateo Díaz', rol: 'repartidor', pin: '9012', activo: true, telefono: '3007778899' },
  ],
  orders: [
    {
      id: '10420001',
      numero_orden: '10420001',
      cliente_nombre: 'Laura Martínez',
      cliente_telefono: '3001234567',
      tipo_servicio: 'domicilio',
      direccion: 'Calle 84 # 45 - 22, Piso 3',
      mesa_numero: null,
      estado: 'nuevo',
      total: 40500,
      metodo_pago: 'transferencia',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      items: [
        { nombre: 'Churrasco a la Brasa (250g)', cantidad: 1, precio_unitario: 22000 },
        { nombre: 'Almuerzo Ejecutivo: Pechuga al Romero', cantidad: 1, precio_unitario: 18500 },
      ],
    },
    {
      id: '10420002',
      numero_orden: '10420002',
      cliente_nombre: 'Mesa 2',
      cliente_telefono: '3015556677',
      tipo_servicio: 'mesa',
      mesa_numero: '2',
      estado: 'preparando',
      total: 24000,
      metodo_pago: 'efectivo',
      created_at: new Date(Date.now() - 12 * 60000).toISOString(),
      items: [
        { nombre: 'Cazuela de Frijoles de la Casa', cantidad: 1, precio_unitario: 24000 },
      ],
    },
    {
      id: '10420003',
      numero_orden: '10420003',
      cliente_nombre: 'Andrés Rojas',
      cliente_telefono: '3109876543',
      tipo_servicio: 'recoger',
      mesa_numero: null,
      estado: 'listo',
      total: 18500,
      metodo_pago: 'efectivo',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      items: [
        { nombre: 'Almuerzo Ejecutivo: Carne Asada', cantidad: 1, precio_unitario: 18500 },
      ],
    },
  ],
  categories: [...VECOS_CATEGORIES],
  products: JSON.parse(JSON.stringify(VECOS_PRODUCTS)),
  customers: [
    { id: 'cust-1', nombre: 'Laura Martínez', name: 'Laura Martínez', telefono: '3001234567', phone: '3001234567', puntos: 1420, points: 1420, puntos_totales: 1420, puntos_disponibles: 1420, total_gastado: 385000, pedidos_count: 14 },
    { id: 'cust-2', nombre: 'Andrés Rojas', name: 'Andrés Rojas', telefono: '3109876543', phone: '3109876543', puntos: 780, points: 780, puntos_totales: 780, puntos_disponibles: 780, total_gastado: 215000, pedidos_count: 9 },
    { id: 'cust-3', nombre: 'Camila Torres', name: 'Camila Torres', telefono: '3152223344', phone: '3152223344', puntos: 350, points: 350, puntos_totales: 350, puntos_disponibles: 350, total_gastado: 112000, pedidos_count: 5 },
    { id: 'cust-4', nombre: 'Juan David Vélez', name: 'Juan David Vélez', telefono: '3205556677', phone: '3205556677', puntos: 180, points: 180, puntos_totales: 180, puntos_disponibles: 180, total_gastado: 64000, pedidos_count: 3 },
  ],
  loyaltyConfig: {
    activo: true,
    pesos_por_punto: 1000,
    puntos_minimo_canje: 100,
    valor_punto_descuento: 50,
    nivel_bronce_min: 0,
    nivel_plata_min: 300,
    nivel_oro_min: 1000,
  },
};

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
  if (/pollo|pechuga|alita/.test(nameLower)) {
    return '/images/plato-pollo.jpg';
  }
  if (/sancocho|cazuela|sopa|ajiaco|frijol|caldo|mondongo/.test(nameLower)) {
    return '/images/plato-cazuela.jpg';
  }
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
    try {
      localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(repaired));
    } catch (e) {}
  }
  return repaired;
}

function loadDemoProductsFromStorage() {
  ensureVecosMenuMigration();
  try {
    const saved = localStorage.getItem('fogon_mesa_custom_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        demoStore.products = repairProductImages(parsed);
        return demoStore.products;
      }
    }
  } catch (e) {}
  demoStore.products = repairProductImages(JSON.parse(JSON.stringify(VECOS_PRODUCTS)));
  return demoStore.products;
}

export async function demoMockAdapter(config) {
  const method = (config.method || 'get').toLowerCase();
  const rawUrl = config.url || '';
  const path = rawUrl.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?')[0];
  const body = parseBody(config.data);

  let data = null;

  // Business & Analytics
  if (path.match(/^\/business\/[^/]+\/analytics\/month$/)) {
    data = {
      ventas_mes: 32450000,
      pedidos_mes: 1380,
      ticket_promedio: 23514,
      daily_stats: [
        { date: 'Lun', ventas: 980000, pedidos: 42 },
        { date: 'Mar', ventas: 1120000, pedidos: 48 },
        { date: 'Mié', ventas: 1250000, pedidos: 54 },
        { date: 'Jue', ventas: 1390000, pedidos: 59 },
        { date: 'Vie', ventas: 1680000, pedidos: 71 },
        { date: 'Sáb', ventas: 1520000, pedidos: 64 },
        { date: 'Dom', ventas: 1480000, pedidos: 62 },
      ],
    };
  } else if (path.match(/^\/business\/[^/]+\/analytics$/)) {
    const totalVentas = 18450000;
    const totalPedidos = 742;
    const totalDomicilios = 485;
    data = {
      ventas_total: totalVentas,
      pedidos_total: totalPedidos,
      domicilios_total: totalDomicilios,
      mesas_ocupadas: 6,
      mesas_totales: 12,
      clientes_total: demoStore.customers.length,
      puntos_total: 2730,
      mensajes_total: 1280,
      ticket_promedio_total: Math.round(totalVentas / totalPedidos),
      productos_agotados: 0,
      ventas_hoy: 1480000,
      pedidos_hoy: 62,
      pedidos_activos: demoStore.orders.filter((o) => o.estado !== 'entregado').length,
      ticket_promedio: 23870,
      clientes_activos: demoStore.customers.length,
      ultimos_7_dias: [
        { fecha: new Date(Date.now() - 6 * 86400000).toISOString(), total_ventas: 1680000, total_pedidos: 68 },
        { fecha: new Date(Date.now() - 5 * 86400000).toISOString(), total_ventas: 1950000, total_pedidos: 79 },
        { fecha: new Date(Date.now() - 4 * 86400000).toISOString(), total_ventas: 2100000, total_pedidos: 84 },
        { fecha: new Date(Date.now() - 3 * 86400000).toISOString(), total_ventas: 2420000, total_pedidos: 96 },
        { fecha: new Date(Date.now() - 2 * 86400000).toISOString(), total_ventas: 2850000, total_pedidos: 112 },
        { fecha: new Date(Date.now() - 1 * 86400000).toISOString(), total_ventas: 3100000, total_pedidos: 124 },
        { fecha: new Date().toISOString(), total_ventas: 1480000, total_pedidos: 62 },
      ],
      daily_stats: [
        { date: 'Lun', ventas: 1680000, pedidos: 68 },
        { date: 'Mar', ventas: 1950000, pedidos: 79 },
        { date: 'Mié', ventas: 2100000, pedidos: 84 },
        { date: 'Jue', ventas: 2420000, pedidos: 96 },
        { date: 'Vie', ventas: 2850000, pedidos: 112 },
        { date: 'Sáb', ventas: 3100000, pedidos: 124 },
        { date: 'Dom', ventas: 1480000, pedidos: 62 },
      ],
    };
  } else if (path.match(/^\/business\/[^/]+$/)) {
    if (method === 'put' || method === 'patch') {
      demoStore.business = { ...demoStore.business, ...body };
    }
    data = demoStore.business;
  }

  // Tables
  else if (path.match(/^\/tables\/[^/]+$/)) {
    if (method === 'post') {
      const newTable = { id: `t-${Date.now()}`, estado: 'libre', ...body };
      demoStore.tables.push(newTable);
      data = newTable;
    } else {
      data = demoStore.tables;
    }
  } else if (path.match(/^\/tables\/[^/]+\/[^/]+$/)) {
    const tableId = path.split('/').pop();
    if (method === 'put' || method === 'patch') {
      demoStore.tables = demoStore.tables.map((t) => (t.id === tableId ? { ...t, ...body } : t));
      data = demoStore.tables.find((t) => t.id === tableId) || { ok: true };
    } else if (method === 'delete') {
      demoStore.tables = demoStore.tables.filter((t) => t.id !== tableId);
      data = { deleted: true };
    }
  }

  // Orders
  else if (path.match(/^\/orders\/[^/]+\/active$/)) {
    data = demoStore.orders.filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado');
  } else if (path.match(/^\/orders\/[^/]+$/)) {
    if (method === 'post') {
      const newOrder = { id: `${Date.now()}`, estado: 'nuevo', created_at: new Date().toISOString(), ...body };
      demoStore.orders.unshift(newOrder);
      data = newOrder;
    } else {
      data = demoStore.orders;
    }
  } else if (path.match(/^\/orders\/[^/]+\/[^/]+$/)) {
    const orderId = path.split('/').pop();
    if (method === 'put' || method === 'patch') {
      demoStore.orders = demoStore.orders.map((o) => (o.id === orderId ? { ...o, ...body } : o));
      data = demoStore.orders.find((o) => o.id === orderId) || { ok: true };
    } else if (method === 'delete') {
      demoStore.orders = demoStore.orders.filter((o) => o.id !== orderId);
      data = { deleted: true };
    }
  }

  // Employees
  else if (path.match(/^\/employees\/[^/]+$/)) {
    if (method === 'post') {
      const emp = { id: `emp-${Date.now()}`, activo: true, ...body };
      demoStore.employees.push(emp);
      data = emp;
    } else {
      data = demoStore.employees;
    }
  }

  // Products / Menu Items / Categories
  else if (path.match(/^\/(menu-items|products)\/[^/]+$/)) {
    loadDemoProductsFromStorage();
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
      demoStore.products.push(prod);
      try { localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(demoStore.products)); } catch (e) {}
      data = prod;
    } else {
      data = demoStore.products;
    }
  } else if (path.match(/^\/(menu-items|products)\/[^/]+\/[^/]+$/)) {
    loadDemoProductsFromStorage();
    const prodId = path.split('/').pop();
    if (method === 'put' || method === 'patch') {
      const imgPatch = body.imagen_url !== undefined || body.imagen !== undefined
        ? { imagen: body.imagen_url ?? body.imagen, imagen_url: body.imagen_url ?? body.imagen }
        : {};
      demoStore.products = demoStore.products.map((p) =>
        (p.id === prodId || String(p.id) === String(prodId) ? { ...p, ...body, ...imgPatch } : p)
      );
      try { localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(demoStore.products)); } catch (e) {}
      data = demoStore.products.find((p) => p.id === prodId || String(p.id) === String(prodId)) || { ok: true };
    } else if (method === 'delete') {
      demoStore.products = demoStore.products.filter((p) => p.id !== prodId && String(p.id) !== String(prodId));
      try { localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(demoStore.products)); } catch (e) {}
      data = { deleted: true };
    }
  } else if (path.match(/^\/categories\/[^/]+$/)) {
    ensureVecosMenuMigration();
    try {
      const savedCats = localStorage.getItem('fogon_mesa_custom_categories');
      if (savedCats) {
        demoStore.categories = JSON.parse(savedCats);
      } else {
        demoStore.categories = [...VECOS_CATEGORIES];
      }
    } catch (e) {
      demoStore.categories = [...VECOS_CATEGORIES];
    }
    if (method === 'post') {
      const cat = { id: `cat-${Date.now()}`, nombre: body.nombre || 'Nueva Categoría', icono: body.icono || '🍽️' };
      demoStore.categories.push(cat);
      try { localStorage.setItem('fogon_mesa_custom_categories', JSON.stringify(demoStore.categories)); } catch (e) {}
      data = cat;
    } else if (method === 'put' || method === 'patch') {
      const oldName = body.old_name || body.original_nombre;
      demoStore.categories = demoStore.categories.map(c =>
        c.nombre === oldName ? { ...c, nombre: body.nombre || c.nombre, icono: body.icono || c.icono } : c
      );
      try { localStorage.setItem('fogon_mesa_custom_categories', JSON.stringify(demoStore.categories)); } catch (e) {}
      data = { ok: true };
    } else if (method === 'delete') {
      const urlObj = new URL(url, 'http://localhost');
      const catName = urlObj.searchParams.get('nombre');
      if (catName) {
        demoStore.categories = demoStore.categories.filter(c => c.nombre !== catName);
        try { localStorage.setItem('fogon_mesa_custom_categories', JSON.stringify(demoStore.categories)); } catch (e) {}
      }
      data = { ok: true };
    } else {
      data = demoStore.categories;
    }
  } else if (path === '/menu-ingredients/bulk-assign-category' && method === 'post') {
    const targetCat = String(body.category || '').trim();
    const ingId = String(body.ingredient_id || '').trim();
    const action = body.action || 'add';
    const isReq = body.is_required === true;
    loadDemoProductsFromStorage();
    let affected = 0;
    demoStore.products = demoStore.products.map((p) => {
      if (p.categoria !== targetCat) return p;
      const current = Array.isArray(p.menu_item_ingredients) ? p.menu_item_ingredients : [];
      if (action === 'remove') {
        const next = current.filter((l) => String(l.ingredient_id) !== ingId);
        if (next.length !== current.length) affected += 1;
        return { ...p, menu_item_ingredients: next };
      }
      const already = current.some((l) => String(l.ingredient_id) === ingId);
      if (already) return p;
      affected += 1;
      return {
        ...p,
        menu_item_ingredients: [...current, { ingredient_id: ingId, is_required: isReq }],
      };
    });
    try { localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(demoStore.products)); } catch (e) {}
    data = { ok: true, affected };
  } else if (path === '/menu-ingredients') {
    const list = loadMenuIngredientsLocal();
    if (method === 'post') {
      const nameTrim = String(body.name || '').trim();
      const exists = list.some((i) => i.name.toLowerCase() === nameTrim.toLowerCase());
      if (exists) {
        data = { error: 'Ya existe un ingrediente con ese nombre', ingredients: list };
      } else {
        const newIng = {
          id: `ing-${Date.now()}`,
          name: nameTrim || 'Nuevo ingrediente',
          category: body.category || 'acompanante',
          is_available: body.is_available !== false,
          is_active: true,
        };
        const updated = [...list, newIng];
        saveMenuIngredientsLocal(updated);
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
      const updated = list.filter((i) => String(i.id) !== String(ingId));
      saveMenuIngredientsLocal(updated);
      // También limpiar referencias en productos
      loadDemoProductsFromStorage();
      demoStore.products = demoStore.products.map((p) => {
        if (!Array.isArray(p.menu_item_ingredients)) return p;
        return {
          ...p,
          menu_item_ingredients: p.menu_item_ingredients.filter(
            (link) => String(link.ingredient_id) !== String(ingId)
          ),
        };
      });
      try { localStorage.setItem('fogon_mesa_custom_products', JSON.stringify(demoStore.products)); } catch (e) {}
      data = { deleted: true };
    }
  } else if (path.match(/^\/tags\/[^/]+$/)) {
    let tagsList = ['Recomendado', 'Más Vendido', 'Nuevo', 'Oferta', 'Picante'];
    try {
      const savedTags = localStorage.getItem('fogon_mesa_custom_tags');
      if (savedTags) tagsList = JSON.parse(savedTags);
    } catch (e) {}
    if (method === 'post') {
      if (body.nombre && !tagsList.includes(body.nombre)) {
        tagsList.push(body.nombre);
        try { localStorage.setItem('fogon_mesa_custom_tags', JSON.stringify(tagsList)); } catch (e) {}
      }
      data = tagsList;
    } else if (method === 'put' || method === 'patch') {
      const oldTag = body.old_name || body.original_nombre;
      tagsList = tagsList.map(t => (t === oldTag ? (body.nombre || t) : t));
      try { localStorage.setItem('fogon_mesa_custom_tags', JSON.stringify(tagsList)); } catch (e) {}
      data = tagsList;
    } else if (method === 'delete') {
      const urlObj = new URL(url, 'http://localhost');
      const tagName = urlObj.searchParams.get('nombre');
      if (tagName) {
        tagsList = tagsList.filter(t => t !== tagName);
        try { localStorage.setItem('fogon_mesa_custom_tags', JSON.stringify(tagsList)); } catch (e) {}
      }
      data = tagsList;
    } else {
      data = tagsList;
    }
  } else if ((path === '/ai/nutrition' || path === '/gemini/nutrition') && method === 'post') {
    const nameLower = String(body.name || body.nombre || '').toLowerCase();
    const isDrinkOrDessert = /jugo|limonada|agua|bebida|coca|postre|flan|torta|helado/.test(nameLower);
    data = isDrinkOrDessert
      ? { kcal: 195, proteina: '3g', carbohidratos: '34g', grasa: '5g' }
      : { kcal: 680, proteina: '42g', carbohidratos: '48g', grasa: '28g' };
  } else if (path === '/ai/generate-product-description' && method === 'post') {
    const dishName = body.nombre || 'Especialidad de la casa';
    data = {
      description: `${dishName} preparado al momento con ingredientes frescos seleccionados, sazón artesanal de la casa y guarnición tradicional.`
    };
  } else if (path === '/ai/generate-product-image' && method === 'post') {
    let generatedUrl = null;
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
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.url) generatedUrl = json.url;
      }
    } catch (err) {
      console.warn('Backend AI image generation unavailable, using curated fallback:', err);
    }
    data = { url: generatedUrl || pickFallbackFoodImage(body.nombre) };
  }

  // Loyalty & Customers
  else if (path.match(/^\/loyalty\/[^/]+\/customers/)) {
    if (method === 'post') {
      const cust = { id: `cust-${Date.now()}`, puntos: 0, points: 0, ...body };
      demoStore.customers.push(cust);
      data = cust;
    } else {
      data = demoStore.customers;
    }
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
    const urlObj = new URL(url, 'http://localhost');
    const phone = (urlObj.searchParams.get('telefono') || body.telefono || '').replace(/\D/g, '');
    const customer = demoStore.customers.find(
      (c) => String(c.telefono || c.phone || '').replace(/\D/g, '') === phone
    );
    const userTodaySpins = history.filter((h) => h.telefono === phone && h.fecha_dia === today);
    const freeUsed = userTodaySpins.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userTodaySpins.filter((h) => h.modo === 'puntos').length;
    const customerPoints = customer ? Number(customer.puntos_disponibles ?? customer.puntos ?? 0) : 50;
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
    const phone = String(body.telefono || 'demo-preview').replace(/\D/g, '') || 'demo-preview';
    const usePoints = !!body.usar_puntos;
    const isPreview = !!body.preview;

    let customer = demoStore.customers.find(
      (c) => String(c.telefono || c.phone || '').replace(/\D/g, '') === phone
    );
    if (!customer && !isPreview) {
      customer = {
        id: `cust-${Date.now()}`,
        nombre: body.nombre || `Cliente ${phone.slice(-4)}`,
        name: body.nombre || `Cliente ${phone.slice(-4)}`,
        telefono: phone,
        phone,
        puntos: 50,
        points: 50,
        puntos_totales: 50,
        puntos_disponibles: 50,
        total_gastado: 0,
        pedidos_count: 0,
      };
      demoStore.customers.push(customer);
    }

    const userTodaySpins = history.filter((h) => h.telefono === phone && h.fecha_dia === today);
    const freeUsed = userTodaySpins.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userTodaySpins.filter((h) => h.modo === 'puntos').length;
    const freeLimit = cfg.tiros_gratis_dia ?? 1;
    const pointsLimit = cfg.max_tiros_puntos_dia ?? 2;
    const costPoints = cfg.costo_tiro_puntos ?? 30;
    const currentPoints = customer ? Number(customer.puntos_disponibles ?? customer.puntos ?? 0) : 50;

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
      if (usePoints) {
        updatedPoints = Math.max(0, updatedPoints - costPoints);
      }
      if (segment.tipo === 'puntos') {
        updatedPoints += Number(segment.valor || 5);
        customer.puntos_totales = Number(customer.puntos_totales || 0) + Number(segment.valor || 5);
      }
      customer.puntos = updatedPoints;
      customer.points = updatedPoints;
      customer.puntos_disponibles = updatedPoints;
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
    if (method === 'put' || method === 'post') {
      demoStore.loyaltyConfig = { ...demoStore.loyaltyConfig, ...body };
    }
    data = demoStore.loyaltyConfig;
  } else if (path.match(/^\/loyalty\//)) {
    data = [];
  } else if (path === '/upload') {
    data = { url: '/images/hero-almuerzo.jpg' };
  }

  // Fallback for any other GET/POST/PUT
  else {
    data = method === 'get' ? [] : { ok: true, ...body };
  }

  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}
