// Utilidad compartida para Acompañantes / Ingredientes del Menú (VECOS)

export const MENU_INGREDIENTS_STORAGE_KEY = 'fogon_mesa_menu_ingredients';
export const VECOS_MENU_VERSION_KEY = 'vecos_menu_version';
export const VECOS_MENU_VERSION = 'vecos_v7';

export const INGREDIENT_CATEGORIES = [
  { id: 'arroz', label: 'Arroz', emoji: '🍚', defaultRequired: false },
  { id: 'sopa', label: 'Sopa / Consomé', emoji: '🍲', defaultRequired: false },
  { id: 'grano', label: 'Granos', emoji: '🫘', defaultRequired: false },
  { id: 'ensalada', label: 'Ensalada', emoji: '🥗', defaultRequired: false },
  { id: 'acompanante', label: 'Acompañantes', emoji: '🍌', defaultRequired: false },
  { id: 'salsa', label: 'Salsas', emoji: '🥣', defaultRequired: false },
  { id: 'bebida', label: 'Bebidas', emoji: '🥤', defaultRequired: false },
  { id: 'proteina', label: 'Proteína (Control Stock)', emoji: '🥩', defaultRequired: true },
];

// Inicia en blanco para que cada categoría del menú tenga únicamente los ingredientes que cree el admin
export const DEFAULT_MENU_INGREDIENTS = [];

export function ensureVecosMenuMigration() {
  try {
    const currentVer = localStorage.getItem(VECOS_MENU_VERSION_KEY);
    if (currentVer !== VECOS_MENU_VERSION) {
      localStorage.removeItem('fogon_mesa_custom_products');
      localStorage.removeItem('fogon_mesa_custom_categories');
      localStorage.removeItem('fogon_mesa_logo');
      localStorage.setItem(MENU_INGREDIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_MENU_INGREDIENTS));
      localStorage.setItem(VECOS_MENU_VERSION_KEY, VECOS_MENU_VERSION);
    }
  } catch (e) {}
}

export function loadMenuIngredientsLocal() {
  ensureVecosMenuMigration();
  try {
    const raw = localStorage.getItem(MENU_INGREDIENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error loading menu ingredients from localStorage', e);
  }
  return DEFAULT_MENU_INGREDIENTS;
}

export function saveMenuIngredientsLocal(list) {
  try {
    localStorage.setItem(MENU_INGREDIENTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving menu ingredients to localStorage', e);
  }
}

export function getIngredientMenuCategories(ing) {
  if (!ing) return [];
  if (Array.isArray(ing.menu_categories)) return ing.menu_categories;
  if (ing.menu_category) return [ing.menu_category];
  return [];
}

export function getIngredientCategoryMeta(categoryId) {
  return (
    INGREDIENT_CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId || 'acompanante',
      label: categoryId || 'Otro',
      emoji: '🍽️',
      defaultRequired: false,
    }
  );
}

/**
 * Evalúa la disponibilidad real de un plato según sus acompañantes/ingredientes asociados.
 * - Ningún acompañante es obligatorio para el cliente (puede elegir solo los que quiera).
 * - Si un acompañante se agota, se oculta silenciosamente al cliente y solo se muestran los disponibles.
 * - Solo si un ingrediente marcado como "Base del plato" (is_required = true) se agota por completo
 *   en su categoría, el plato queda `soldOut = true` (atenuado con etiqueta "Agotado").
 */
export function evaluateProductIngredients(product, allIngredients = []) {
  const links = Array.isArray(product?.menu_item_ingredients)
    ? product.menu_item_ingredients
    : [];

  if (links.length === 0) {
    return {
      soldOut: false,
      missingNames: [],
      availableGroups: [],
      totalLinked: 0,
    };
  }

  const ingMap = new Map(allIngredients.map((i) => [String(i.id), i]));
  const grouped = new Map();

  for (const link of links) {
    const ing = ingMap.get(String(link.ingredient_id));
    if (!ing || ing.is_active === false) continue;

    const catId = ing.category || 'acompanante';
    if (!grouped.has(catId)) {
      grouped.set(catId, {
        category: catId,
        allItems: [],
        availableItems: [],
        hasRequired: false,
      });
    }

    const entry = grouped.get(catId);
    const isReq = link.is_required === true;
    if (isReq) entry.hasRequired = true;

    const itemObj = {
      ...ing,
      is_required: isReq,
      quantity: link.quantity ?? null,
      unit: link.unit ?? null,
    };
    entry.allItems.push(itemObj);

    if (ing.is_available !== false) {
      entry.availableItems.push(itemObj);
    }
  }

  let soldOut = false;
  const missingNames = [];
  const availableGroups = [];

  const orderedCatIds = [
    ...INGREDIENT_CATEGORIES.map((c) => c.id),
    ...Array.from(grouped.keys()).filter((k) => !INGREDIENT_CATEGORIES.some((c) => c.id === k)),
  ];

  for (const catId of orderedCatIds) {
    const entry = grouped.get(catId);
    if (!entry) continue;

    if (entry.hasRequired && entry.availableItems.length === 0) {
      soldOut = true;
      entry.allItems
        .filter((i) => i.is_required)
        .forEach((i) => missingNames.push(i.name));
    }

    if (entry.availableItems.length > 0) {
      const meta = getIngredientCategoryMeta(catId);
      availableGroups.push({
        category: catId,
        label: meta.label,
        emoji: meta.emoji,
        hasRequired: entry.hasRequired,
        items: entry.availableItems,
      });
    }
  }

  return {
    soldOut,
    missingNames,
    availableGroups,
    totalLinked: links.length,
  };
}
