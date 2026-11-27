// Default configuration & helpers for the Temu-style Rewards Wheel (Ruleta de Recompensas)

export const WHEEL_CONFIG_VERSION = 'vecos_wheel_v3';

export const DEFAULT_WHEEL_SEGMENTS = [
  {
    id: 1,
    label: '+5 Puntos',
    emoji: '🎁',
    tipo: 'puntos',
    valor: 5,
    probabilidad: 20,
    limite_diario: 999,
    color: '#F97316',
    textColor: '#FFFFFF',
    costo_aprox: 'Muy bajo',
    costo_unitario: 0,
  },
  {
    id: 2,
    label: 'Regalo sorpresa',
    emoji: '🎉',
    tipo: 'regalo',
    valor: 0,
    probabilidad: 10,
    limite_diario: 10,
    color: '#10B981',
    textColor: '#FFFFFF',
    costo_aprox: 'Bajo',
    costo_unitario: 3000,
  },
  {
    id: 3,
    label: 'Inténtalo mañana',
    emoji: '🥴',
    tipo: 'nada',
    valor: 0,
    probabilidad: 20,
    limite_diario: 999,
    color: '#64748B',
    textColor: '#FFFFFF',
    costo_aprox: 'Sin costo',
    costo_unitario: 0,
  },
  {
    id: 4,
    label: '10% descuento',
    emoji: '🏷️',
    tipo: 'descuento',
    valor: 10,
    probabilidad: 15,
    limite_diario: 30,
    color: '#3B82F6',
    textColor: '#FFFFFF',
    costo_aprox: 'Variable',
    costo_unitario: 0,
  },
  {
    id: 5,
    label: 'Domicilio Gratis',
    emoji: '🛵',
    tipo: 'domicilio_gratis',
    valor: 0,
    probabilidad: 10,
    limite_diario: 20,
    color: '#14B8A6',
    textColor: '#FFFFFF',
    costo_aprox: 'Bajo-medio',
    costo_unitario: 0,
  },
  {
    id: 6,
    label: '15% descuento',
    emoji: '🔥',
    tipo: 'descuento',
    valor: 15,
    probabilidad: 10,
    limite_diario: 15,
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    costo_aprox: 'Variable',
    costo_unitario: 0,
  },
  {
    id: 7,
    label: 'Un intento más',
    emoji: '🔄',
    tipo: 'reintento',
    valor: 0,
    probabilidad: 15,
    limite_diario: 999,
    color: '#EAB308',
    textColor: '#FFFFFF',
    costo_aprox: 'Sin costo',
    costo_unitario: 0,
  },
];

export const DEFAULT_WHEEL_CONFIG = {
  version: WHEEL_CONFIG_VERSION,
  activo: true,
  titulo: 'Ruleta del Día',
  subtitulo: '¡Gira y gana premios instantáneos para tu próximo pedido!',
  regalo_sorpresa_detalle: 'Postre o bebida del día (definido por Veco\'s)',
  // Opción A: Tiro diario gratis
  tiros_gratis_dia: 1,
  // Opción B: Tiros adicionales usando puntos
  permitir_tiro_puntos: true,
  costo_tiro_puntos: 30,
  max_tiros_puntos_dia: 2,
  // Reglas de presupuesto y vigencia
  compra_minima_cupon: 20000,
  vigencia_horas: 48,
  fecha_inicio: '',
  fecha_fin: '',
  segmentos: DEFAULT_WHEEL_SEGMENTS,
};

export const WHEEL_STORAGE_KEYS = {
  CONFIG: 'fogon_mesa_wheel_config',
  HISTORY: 'fogon_mesa_wheel_history',
};

export function loadWheelConfigLocal() {
  try {
    const raw = localStorage.getItem(WHEEL_STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isCurrentVersion =
        parsed.version === WHEEL_CONFIG_VERSION &&
        Array.isArray(parsed.segmentos) &&
        parsed.segmentos.length === 7;
      const rawSegs = isCurrentVersion ? parsed.segmentos : DEFAULT_WHEEL_SEGMENTS;
      return {
        ...DEFAULT_WHEEL_CONFIG,
        ...parsed,
        version: WHEEL_CONFIG_VERSION,
        segmentos: rawSegs,
      };
    }
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_WHEEL_CONFIG };
}

export function saveWheelConfigLocal(config) {
  try {
    localStorage.setItem(WHEEL_STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    // ignore
  }
}

export function loadWheelHistoryLocal() {
  try {
    const raw = localStorage.getItem(WHEEL_STORAGE_KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveWheelHistoryLocal(history) {
  try {
    localStorage.setItem(WHEEL_STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    // ignore
  }
}

export function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateCouponCode(segment) {
  if (!segment || ['puntos', 'nada', 'reintento'].includes(segment.tipo)) return null;
  const prefixMap = {
    regalo: 'REGALO',
    producto: 'REGALO',
    descuento: `DTO${segment.valor || 10}`,
    domicilio_gratis: 'ENVIO',
  };
  const prefix = prefixMap[segment.tipo] || 'VECOS';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VEC-${prefix}-${rand}`;
}

export function pickWeightedSegment(segments, todayHistory = [], excludeTypes = []) {
  // Count how many times each segment was won today
  const countsToday = {};
  for (const item of todayHistory) {
    const segId = item.segmento_id;
    countsToday[segId] = (countsToday[segId] || 0) + 1;
  }

  const excludedSet = new Set(Array.isArray(excludeTypes) ? excludeTypes : []);

  // Filter segments that haven't hit their daily cap and are not excluded
  const eligible = segments
    .map((seg, index) => {
      if (excludedSet.has(seg.tipo)) return { seg, index, weight: 0 };
      const used = countsToday[seg.id] || 0;
      const limit = Number(seg.limite_diario ?? 999);
      const prob = Number(seg.probabilidad ?? 0);
      const weight = used < limit && prob > 0 ? prob : 0;
      return { seg, index, weight };
    })
    .filter((item) => item.weight > 0);

  if (eligible.length === 0) {
    // Fallback to the last segment (+5 Puntos) so the user never loses
    const fallbackIdx = segments.length - 1;
    return { segment: segments[fallbackIdx], index: fallbackIdx };
  }

  const totalWeight = eligible.reduce((acc, item) => acc + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of eligible) {
    r -= item.weight;
    if (r <= 0) {
      return { segment: item.seg, index: item.index };
    }
  }
  const last = eligible[eligible.length - 1];
  return { segment: last.seg, index: last.index };
}

export const PENDING_COUPON_KEY = 'fogon_mesa_pending_coupon';

export function normalizePrizeLabel(label) {
  if (!label) return 'Premio Ruleta';
  return label === 'Papas o acompañ.' ? 'Papas o acompañamiento' : label;
}

export function getCouponsForUser(rawPhone = '') {
  const history = loadWheelHistoryLocal();
  const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const now = Date.now();

  return history
    .filter((item) => {
      if (!item || !item.codigo_cupon) return false;
      if (item.telefono === 'preview') return false;
      if (!last10) return true;
      const itemPhone = String(item.telefono || '').replace(/\D/g, '');
      const itemLast10 = itemPhone.length >= 10 ? itemPhone.slice(-10) : itemPhone;
      return itemLast10 === last10 || !itemLast10;
    })
    .map((item) => {
      const expMs = item.expira_en ? new Date(item.expira_en).getTime() : Infinity;
      const isExpired = now > expMs;
      const isUsed = Boolean(item.usado);
      return {
        ...item,
        premio_label: normalizePrizeLabel(item.premio_label),
        isExpired,
        isUsed,
        isActive: !isUsed && !isExpired,
      };
    });
}

export function getMinDeliveryCost() {
  try {
    const raw = localStorage.getItem('vecos_business_config');
    if (raw) {
      const cfg = JSON.parse(raw);
      const minCost = Number(cfg?.costo_minimo_domicilio);
      if (!Number.isNaN(minCost) && minCost >= 0) return minCost;
    }
  } catch {}
  return 3000;
}

export function validateCouponCode(rawCode, subtotal = 0) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Ingresa un código de cupón.' };
  }

  const history = loadWheelHistoryLocal();
  const match = history.find(
    (item) => item?.codigo_cupon && String(item.codigo_cupon).trim().toUpperCase() === code
  );

  if (!match) {
    return { valid: false, error: 'Código de cupón no encontrado. Verifica que esté bien escrito.' };
  }

  if (match.usado) {
    return { valid: false, error: 'Este cupón ya fue redimido anteriormente.' };
  }

  if (match.expira_en && Date.now() > new Date(match.expira_en).getTime()) {
    return { valid: false, error: 'Este cupón ya expiró.' };
  }

  const minPurchase = Number(match.compra_minima || 0);
  if (minPurchase > 0 && Number(subtotal) < minPurchase) {
    const formattedMin = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(minPurchase);
    return {
      valid: false,
      error: `Este cupón requiere un consumo mínimo de ${formattedMin}.`,
    };
  }

  const discountAmount =
    match.premio_tipo === 'descuento'
      ? Math.round((Number(subtotal) * Number(match.premio_valor || 0)) / 100)
      : 0;

  const isGift = match.premio_tipo === 'regalo' || match.premio_tipo === 'producto';
  let giftCost = 0;
  if (isGift) {
    const wheelCfg = loadWheelConfigLocal();
    const giftSeg = (wheelCfg.segmentos || []).find((s) => s.tipo === 'regalo' || s.tipo === 'producto');
    giftCost = Number(match.costo_unitario ?? giftSeg?.costo_unitario ?? 3000);
  }

  return {
    valid: true,
    coupon: {
      ...match,
      premio_label: normalizePrizeLabel(match.premio_label),
    },
    discountAmount,
    freeDelivery: match.premio_tipo === 'domicilio_gratis',
    isGift,
    giftCost,
    giftDetail: match.regalo_detalle || '',
  };
}

export function markCouponAsUsed(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return;
  const history = loadWheelHistoryLocal();
  const updated = history.map((item) =>
    item?.codigo_cupon && String(item.codigo_cupon).trim().toUpperCase() === code
      ? { ...item, usado: true, usado_en: new Date().toISOString() }
      : item
  );
  saveWheelHistoryLocal(updated);
  try {
    const pending = localStorage.getItem(PENDING_COUPON_KEY);
    if (pending && pending.trim().toUpperCase() === code) {
      localStorage.removeItem(PENDING_COUPON_KEY);
    }
  } catch {}
}
