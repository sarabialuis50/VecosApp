import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package, Plus, Edit2, Trash2, AlertTriangle,
  TrendingDown, ArrowUp, ArrowDown, RefreshCw,
  Boxes, X, Save, Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'unidades', label: 'Unidades' },
  { value: 'porciones', label: 'Porciones' },
  { value: 'paquetes', label: 'Paquetes' },
];

const getLocalKey = (slug) => `fogon_mesa_inventory_${slug || 'demo-restaurante'}`;

const loadLocalInventory = (slug) => {
  try {
    const raw = localStorage.getItem(getLocalKey(slug));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalInventory = (slug, items) => {
  try {
    localStorage.setItem(getLocalKey(slug), JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
};

// ─── Create / Edit Ingredient Modal ──────────────────────────────────────────
function IngredientFormModal({ open, onClose, editingItem, slug, api, onSaved, localMode, inventory, setInventory }) {
  const isEditing = Boolean(editingItem);
  const [nombre, setNombre] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setNombre(editingItem.nombre || '');
        setUnidadMedida(editingItem.unidad_medida || 'kg');
        setStockActual(String(editingItem.stock_actual ?? 0));
        setStockMinimo(String(editingItem.stock_minimo ?? 0));
        setCostoUnitario(String(editingItem.costo_unitario ?? 0));
      } else {
        setNombre('');
        setUnidadMedida('kg');
        setStockActual('');
        setStockMinimo('');
        setCostoUnitario('');
      }
    }
  }, [open, editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = nombre.trim();
    if (!cleanName) {
      toast.error('Ingresa el nombre del ingrediente');
      return;
    }

    const parsedStock = parseFloat(stockActual || '0');
    const parsedMin = parseFloat(stockMinimo || '0');
    const parsedCost = parseFloat(costoUnitario || '0');

    if (isNaN(parsedStock) || parsedStock < 0 || isNaN(parsedMin) || parsedMin < 0 || isNaN(parsedCost) || parsedCost < 0) {
      toast.error('Los valores numéricos deben ser mayores o iguales a 0');
      return;
    }

    setSaving(true);
    const saveLocally = () => {
      if (isEditing) {
        const updated = inventory.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                nombre: cleanName,
                unidad_medida: unidadMedida,
                stock_minimo: parsedMin,
                costo_unitario: parsedCost,
              }
            : item
        );
        setInventory(updated);
        saveLocalInventory(slug, updated);
        toast.success('Ingrediente actualizado');
      } else {
        const newItem = {
          id: `inv-${Date.now()}`,
          sede_id: slug || 'demo-restaurante',
          global_ingredient_id: `ing-${Date.now()}`,
          nombre: cleanName,
          unidad_medida: unidadMedida,
          stock_actual: parsedStock,
          stock_minimo: parsedMin,
          costo_unitario: parsedCost,
        };
        const updated = [newItem, ...inventory];
        setInventory(updated);
        saveLocalInventory(slug, updated);
        toast.success(`"${cleanName}" agregado al inventario`);
      }
      onClose();
    };

    if (localMode) {
      saveLocally();
      setSaving(false);
      return;
    }

    try {
      if (isEditing) {
        await api().put(`/catalog/sedes/${slug}/inventory/${editingItem.id}`, {
          nombre: cleanName,
          unidad_medida: unidadMedida,
          stock_minimo: parsedMin,
          costo_unitario: parsedCost,
        });
        toast.success('Ingrediente actualizado');
      } else {
        await api().post(`/catalog/sedes/${slug}/inventory`, {
          nombre: cleanName,
          unidad_medida: unidadMedida,
          stock_actual: parsedStock,
          stock_minimo: parsedMin,
          costo_unitario: parsedCost,
        });
        toast.success(`"${cleanName}" agregado al inventario`);
      }
      await onSaved();
      onClose();
    } catch (err) {
      console.warn('Backend inventory save failed, falling back to local storage:', err);
      saveLocally();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? 'Actualiza el nombre, unidad, alerta mínima o costo'
                  : 'Registra un insumo para controlar su stock y costo'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Nombre del Ingrediente *
              </label>
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C86414]/30 focus:border-[#C86414]"
                placeholder="Ej: Carne de Res (Churrasco), Papas, Aceite..."
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Unidad de Medida *
                </label>
                <select
                  value={unidadMedida}
                  onChange={(e) => setUnidadMedida(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#C86414]/30 focus:border-[#C86414]"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {!isEditing ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Stock Inicial ({unidadMedida})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C86414]/30 focus:border-[#C86414]"
                    placeholder="Ej: 20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Stock Actual
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${Number(stockActual).toLocaleString('es-CO')} ${unidadMedida}`}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Stock Mínimo ({unidadMedida})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C86414]/30 focus:border-[#C86414]"
                  placeholder="Ej: 5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Costo Unitario ($ COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C86414]/30 focus:border-[#C86414]"
                  placeholder="Ej: 28000"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[#C86414] hover:bg-[#A8520F] text-white font-bold gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Ingrediente'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Adjust Stock Modal ───────────────────────────────────────────────────────
function AdjustStockModal({ open, onClose, ingredient, sedeId, slug, api, onSaved, localMode, inventory, setInventory }) {
  const [tipo, setTipo] = useState('entrada'); // entrada | ajuste | merma
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setTipo('entrada'); setCantidad(''); setNotas(''); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = parseFloat(cantidad);
    if (!cantidad || isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    const delta = tipo === 'merma' ? -Math.abs(qtyNum) : Math.abs(qtyNum);

    const applyLocally = () => {
      const updated = inventory.map((item) => {
        if (item.id !== ingredient.id) return item;
        const nextStock =
          tipo === 'ajuste'
            ? qtyNum
            : Math.max(0, Number(item.stock_actual || 0) + delta);
        return { ...item, stock_actual: nextStock };
      });
      setInventory(updated);
      saveLocalInventory(slug, updated);
      toast.success('Inventario actualizado');
      onClose();
    };

    if (localMode) {
      applyLocally();
      return;
    }

    setSaving(true);
    try {
      const txCantidad =
        tipo === 'ajuste'
          ? qtyNum - Number(ingredient.stock_actual || 0)
          : delta;
      await api().post(`/catalog/sedes/inventory/transaction`, {
        sede_id: sedeId || ingredient.sede_id,
        global_ingredient_id: ingredient.global_ingredient_id,
        tipo,
        cantidad: txCantidad,
        notas,
      });
      toast.success('Inventario actualizado');
      await onSaved();
      onClose();
    } catch (err) {
      console.warn('Backend transaction failed, applying locally:', err);
      applyLocally();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !ingredient) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Ajustar Inventario</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {ingredient.nombre} • Actual: <strong>{Number(ingredient.stock_actual).toLocaleString('es-CO')} {ingredient.unidad_medida}</strong>
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Movimiento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'entrada', label: 'Entrada (+)', color: 'green', icon: ArrowUp },
                  { id: 'ajuste', label: 'Fijar Stock', color: 'blue', icon: Edit2 },
                  { id: 'merma', label: 'Merma (-)', color: 'red', icon: ArrowDown },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
                      tipo === t.id
                        ? t.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                          : t.color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                {tipo === 'ajuste'
                  ? `Nuevo stock real (${ingredient.unidad_medida})`
                  : `Cantidad (${ingredient.unidad_medida})`}
              </label>
              <input required type="number" min="0.01" step="0.01" value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="Ej: 10" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notas (opcional)</label>
              <input value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="Ej: Compra proveedor / Conteo físico / Merma" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#DAA520] hover:bg-[#C4941A] text-white font-bold">
                {saving ? '...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  const { slug = 'vecos' } = useParams();
  const { user, api } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localMode, setLocalMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustModal, setAdjustModal] = useState({ open: false, ingredient: null });
  const [formModal, setFormModal] = useState({ open: false, editingItem: null });
  const [sedeId, setSedeId] = useState(null);

  const businessName = user?.nombre || "Veco's Restaurante";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const invRes = await api().get(`/catalog/sedes/${slug}/inventory`);
      const serverItems = invRes.data || [];
      setInventory(serverItems);
      setLocalMode(false);
      if (serverItems[0]?.sede_id) setSedeId(serverItems[0].sede_id);
    } catch (err) {
      console.warn('Inventory API unavailable, using local storage mode:', err);
      setLocalMode(true);
      setInventory(loadLocalInventory(slug));
    } finally {
      setLoading(false);
    }
  }, [slug, api]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteIngredient = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}" del inventario?`)) return;

    const deleteLocally = () => {
      const updated = inventory.filter((i) => i.id !== item.id);
      setInventory(updated);
      saveLocalInventory(slug, updated);
      toast.success(`"${item.nombre}" eliminado`);
    };

    if (localMode) {
      deleteLocally();
      return;
    }

    try {
      await api().delete(`/catalog/sedes/${slug}/inventory/${item.id}`);
      toast.success(`"${item.nombre}" eliminado`);
      await loadData();
    } catch (err) {
      console.warn('Backend delete failed, deleting locally:', err);
      deleteLocally();
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.nombre?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const lowStockItems = inventory.filter(i => i.stock_actual <= i.stock_minimo && i.stock_minimo > 0);
  const totalValue = inventory.reduce((sum, i) => sum + (Number(i.stock_actual || 0) * Number(i.costo_unitario || 0)), 0);

  const getStockStatus = (item) => {
    if (Number(item.stock_actual) <= 0) return 'agotado';
    if (Number(item.stock_minimo) > 0 && Number(item.stock_actual) <= Number(item.stock_minimo)) return 'bajo';
    return 'ok';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventario de Ingredientes</h1>
            <p className="text-sm text-slate-500 mt-1">
              {businessName} — Stock en tiempo real y movimientos auditables
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
            <button
              type="button"
              onClick={() => setFormModal({ open: true, editingItem: null })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C86414] hover:bg-[#A8520F] text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuevo Ingrediente
            </button>
          </div>
        </div>

        {/* Business context indicator */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#DAA520]/20 bg-[#DAA520]/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">🍲</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#B45309]">
                Control de Stock
              </p>
              <p className="text-sm font-bold text-slate-800">{businessName}</p>
            </div>
          </div>
          {inventory.length > 0 && (
            <div className="relative w-56 hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ingrediente..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#C86414]"
              />
            </div>
          )}
        </div>

        {/* Alert for low stock */}
        {lowStockItems.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                {lowStockItems.length} ingrediente{lowStockItems.length > 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {lowStockItems.map(i => i.nombre).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Ingredientes', value: inventory.length, icon: Boxes, color: '#6366F1' },
            { label: 'Stock Bajo', value: lowStockItems.length, icon: TrendingDown, color: '#F59E0B' },
            { label: 'Agotados', value: inventory.filter(i => Number(i.stock_actual) <= 0).length, icon: AlertTriangle, color: '#EF4444' },
            { label: 'Valor Total', value: `$${Math.round(totalValue).toLocaleString('es-CO')}`, icon: Package, color: '#C86414' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: stat.color + '20' }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520]" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 px-6 text-center">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold">Sin datos de inventario</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              El inventario se descuenta automáticamente cuando los pedidos cambian a "Preparando".
              Registra tus insumos para que el sistema pueda rastrear el stock y los costos.
            </p>
            <button
              type="button"
              onClick={() => setFormModal({ open: true, editingItem: null })}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C86414] hover:bg-[#A8520F] text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear primer ingrediente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Ingrediente</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Stock Actual</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Stock Mínimo</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Costo Unit.</th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, idx) => {
                  const status = getStockStatus(item);
                  return (
                    <motion.tr key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                          <p className="text-xs text-slate-400">{item.unidad_medida}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-sm font-black ${
                          status === 'agotado' ? 'text-red-600'
                          : status === 'bajo' ? 'text-amber-600'
                          : 'text-slate-800'
                        }`}>
                          {Number(item.stock_actual).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-xs text-slate-500">
                          {item.stock_minimo > 0
                            ? Number(item.stock_minimo).toLocaleString('es-CO', { maximumFractionDigits: 2 })
                            : '—'
                          }
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {item.costo_unitario > 0
                            ? `$${Number(item.costo_unitario).toLocaleString('es-CO')}`
                            : '—'
                          }
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          status === 'agotado' ? 'bg-red-100 text-red-700'
                          : status === 'bajo' ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                          {status === 'agotado' ? '⛔ Agotado'
                           : status === 'bajo' ? '⚠️ Bajo'
                           : '✅ Normal'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdjustModal({ open: true, ingredient: item })}
                            className="p-2 rounded-xl hover:bg-amber-50 text-[#C86414] transition-colors"
                            title="Registrar entrada, ajuste o merma"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormModal({ open: true, editingItem: item })}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Editar ingrediente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(item)}
                            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center">
          💡 Los descuentos de inventario se registran automáticamente e idempotentemente cuando un pedido pasa a estado <strong>Preparando</strong>.
          Los reversos se aplican al <strong>Cancelar</strong>.
        </p>
      </div>

      <IngredientFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, editingItem: null })}
        editingItem={formModal.editingItem}
        slug={slug}
        api={api}
        onSaved={loadData}
        localMode={localMode}
        inventory={inventory}
        setInventory={setInventory}
      />

      <AdjustStockModal
        open={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, ingredient: null })}
        ingredient={adjustModal.ingredient}
        sedeId={sedeId}
        slug={slug}
        api={api}
        onSaved={loadData}
        localMode={localMode}
        inventory={inventory}
        setInventory={setInventory}
      />
    </DashboardLayout>
  );
}
