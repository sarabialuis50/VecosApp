import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package, Plus, Edit2, Trash2, AlertTriangle,
  TrendingDown, ArrowUp, ArrowDown, RefreshCw,
  ChevronRight, Boxes, X, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Adjust Stock Modal ───────────────────────────────────────────────────────
function AdjustStockModal({ open, onClose, ingredient, sedeId, api, onSaved }) {
  const [tipo, setTipo] = useState('entrada'); // entrada | ajuste | merma
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setTipo('entrada'); setCantidad(''); setNotas(''); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cantidad || parseFloat(cantidad) <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    setSaving(true);
    try {
      // POST to inventory_transactions, backend updates sede_inventory via trigger or direct call
      await api().post(`/catalog/sedes/inventory/transaction`, {
        sede_id: sedeId,
        global_ingredient_id: ingredient.global_ingredient_id,
        tipo,
        cantidad: tipo === 'merma' ? -Math.abs(parseFloat(cantidad)) : Math.abs(parseFloat(cantidad)),
        notas,
      });
      toast.success('Inventario actualizado');
      onSaved();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al actualizar inventario';
      toast.error(msg);
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
              <p className="text-sm text-slate-500 mt-0.5">{ingredient.nombre}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Movimiento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'entrada', label: 'Entrada', color: 'green', icon: ArrowUp },
                  { id: 'ajuste', label: 'Ajuste', color: 'blue', icon: Edit2 },
                  { id: 'merma', label: 'Merma', color: 'red', icon: ArrowDown },
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
                Cantidad ({ingredient.unidad_medida})
              </label>
              <input required type="number" min="0.01" step="0.01" value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="Ej: 500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notas (opcional)</label>
              <input value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="Ej: Compra proveedor X" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-[#DAA520] hover:bg-[#C4941A] text-white">
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
  const { slug } = useParams();
  const { user, api } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState({ open: false, ingredient: null });
  const [sedeId, setSedeId] = useState(null);

  const businessName = user?.nombre || 'Fogón & Mesa';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sede ID
      const sedeRes = await api().get(`/menu-items/${slug}`); // Uses existing slug resolution
      // Get inventory for this sede
      const invRes = await api().get(`/catalog/sedes/${slug}/inventory`);
      setInventory(invRes.data || []);
      if (invRes.data?.[0]?.sede_id) setSedeId(invRes.data[0].sede_id);
    } catch (err) {
      console.error('Error loading inventory:', err);
      // Graceful fallback — show empty state
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [slug, api]);

  useEffect(() => { loadData(); }, [loadData]);

  const lowStockItems = inventory.filter(i => i.stock_actual <= i.stock_minimo && i.stock_minimo > 0);
  const totalValue = inventory.reduce((sum, i) => sum + (i.stock_actual * i.costo_unitario), 0);

  const getStockStatus = (item) => {
    if (item.stock_minimo > 0 && item.stock_actual <= 0) return 'agotado';
    if (item.stock_minimo > 0 && item.stock_actual <= item.stock_minimo) return 'bajo';
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
          <button onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* Business context indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#DAA520]/20 bg-[#DAA520]/5">
          <span className="text-xl">🍲</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#B45309]">
              Control de Stock
            </p>
            <p className="text-sm font-bold text-slate-800">{businessName}</p>
          </div>
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
            { label: 'Agotados', value: inventory.filter(i => i.stock_actual <= 0).length, icon: AlertTriangle, color: '#EF4444' },
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Sin datos de inventario</p>
            <p className="text-slate-400 text-sm mt-1">
              El inventario se descuenta automáticamente cuando los pedidos cambian a "Preparando".
              Registra las entradas de ingredientes para que el sistema pueda rastrear el stock.
            </p>
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
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Ajustar</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => {
                  const status = getStockStatus(item);
                  return (
                    <motion.tr key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
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
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setAdjustModal({ open: true, ingredient: item })}
                          className="p-2 rounded-xl hover:bg-[#DAA520]/10 text-[#DAA520] transition-colors"
                          title="Registrar movimiento">
                          <Plus className="w-4 h-4" />
                        </button>
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

      <AdjustStockModal
        open={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, ingredient: null })}
        ingredient={adjustModal.ingredient}
        sedeId={sedeId}
        api={api}
        onSaved={loadData}
      />
    </DashboardLayout>
  );
}
