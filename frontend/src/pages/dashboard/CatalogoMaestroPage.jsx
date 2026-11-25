import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Package, Tag, Store, BookOpen, AlertCircle, X, Check,
  RefreshCw, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Sedes fijas del negocio ──────────────────────────────────────────────────
const SEDES = [
  { slug: 'sede-norte',  label: 'Norte',  color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🔵' },
  { slug: 'sede-centro', label: 'Centro', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', emoji: '🟡' },
  { slug: 'sede-sur',    label: 'Sur',    color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', emoji: '🟢' },
];

const BRAND_SLUG = 'golden-burger';

// ─── Sede Picker ─────────────────────────────────────────────────────────────
function SedePicker({ activeSede, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Selecciona la sede a configurar
      </p>
      <div className="grid grid-cols-3 gap-3">
        {SEDES.map((sede) => {
          const isActive = activeSede?.slug === sede.slug;
          return (
            <button
              key={sede.slug}
              onClick={() => onChange(sede)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                isActive
                  ? 'shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              style={isActive ? {
                borderColor: sede.color,
                backgroundColor: sede.bg,
              } : {}}
            >
              <span className="text-2xl">{sede.emoji}</span>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sede</p>
                <p className="text-base font-black" style={isActive ? { color: sede.color } : { color: '#334155' }}>
                  {sede.label}
                </p>
              </div>
              {isActive && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full text-white"
                  style={{ backgroundColor: sede.color }}>
                  ACTIVA
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ open, onClose, product, categories, onSave, mode = 'create' }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio_base: '', imagen: '', category_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && mode === 'edit') {
      setForm({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        precio_base: product.precio_base || '',
        imagen: product.imagen || '',
        category_id: product.category_id || '',
      });
    } else {
      setForm({ nombre: '', descripcion: '', precio_base: '', imagen: '', category_id: '' });
    }
  }, [product, mode, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, precio_base: parseFloat(form.precio_base) || 0 });
      onClose();
    } catch {
      toast.error('Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-bold">{mode === 'edit' ? '✏️ Editar Producto' : '➕ Nuevo Producto Global'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre *</label>
              <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="Ej: Hamburguesa Golden Doble" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520] resize-none"
                placeholder="Descripción..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Precio Base (COP) *</label>
                <input required type="number" min="0" step="100" value={form.precio_base}
                  onChange={e => setForm({ ...form, precio_base: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                  placeholder="18000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Categoría</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520] bg-white">
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">URL de Imagen</label>
              <input value={form.imagen} onChange={e => setForm({ ...form, imagen: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]"
                placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-[#DAA520] hover:bg-[#C4941A] text-white">
                {saving ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Sede Override Modal ──────────────────────────────────────────────────────
function SedeOverrideModal({ open, onClose, product, activeSede, onSave }) {
  const [form, setForm] = useState({ precio_local: '', activo: true, disponible: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      precio_local: product?.precio_local != null ? product.precio_local : '',
      activo: product?.activo ?? true,
      disponible: product?.disponible ?? true,
    });
  }, [product, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        precio_local: form.precio_local !== '' ? parseFloat(form.precio_local) : null,
        activo: form.activo,
        disponible: form.disponible,
      });
      onClose();
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !product || !activeSede) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b" style={{ borderBottom: `3px solid ${activeSede.color}` }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: activeSede.color }}>
                {activeSede.emoji} Sede {activeSede.label}
              </p>
              <h3 className="text-lg font-bold text-slate-800">{product.nombre}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Precio Local (COP)
              </label>
              <input type="number" min="0" step="100" value={form.precio_local}
                onChange={e => setForm({ ...form, precio_local: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-[#DAA520]"
                placeholder={`Precio base: $${Number(product.precio_base || 0).toLocaleString('es-CO')} (dejar vacío para usar precio base)`} />
            </div>
            <div className="space-y-3">
              <button type="button" onClick={() => setForm({ ...form, activo: !form.activo })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${form.activo ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700">Activo en esta sede</p>
                  <p className="text-xs text-slate-400">El producto aparece en el menú de la sede</p>
                </div>
                {form.activo ? <ToggleRight className="w-7 h-7 text-green-500 flex-shrink-0" /> : <ToggleLeft className="w-7 h-7 text-slate-400 flex-shrink-0" />}
              </button>
              <button type="button" onClick={() => setForm({ ...form, disponible: !form.disponible })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${form.disponible ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700">Disponible ahora</p>
                  <p className="text-xs text-slate-400">Se puede ordenar en este momento</p>
                </div>
                {form.disponible ? <ToggleRight className="w-7 h-7 text-blue-500 flex-shrink-0" /> : <ToggleLeft className="w-7 h-7 text-slate-400 flex-shrink-0" />}
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}
                className="flex-1 text-white"
                style={{ backgroundColor: activeSede.color }}>
                {saving ? 'Guardando...' : 'Guardar Override'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CatalogoMaestroPage() {
  const { slug } = useParams();
  const { api, isSuperAdmin } = useAuth();

  // Active sede state — always shown, defaults to the slug in URL
  const initialSede = SEDES.find(s => s.slug === slug) || SEDES[0];
  const [activeSede, setActiveSede] = useState(initialSede);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sedeProducts, setSedeProducts] = useState({}); // { globalProductId: sedeProductData }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [tab, setTab] = useState(isSuperAdmin ? 'catalogo' : 'sede');

  const [productModal, setProductModal] = useState({ open: false, mode: 'create', product: null });
  const [overrideModal, setOverrideModal] = useState({ open: false, product: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, sedeRes] = await Promise.all([
        api().get(`/catalog/products/${BRAND_SLUG}`),
        api().get(`/catalog/categories/${BRAND_SLUG}`),
        api().get(`/catalog/sedes/${activeSede.slug}/products`),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);

      // Index sede products by global product id
      const indexed = {};
      (sedeRes.data || []).forEach(sp => { indexed[sp.id] = sp; });
      setSedeProducts(indexed);
    } catch (err) {
      console.error('Error loading catalog:', err);
      // Don't show error toast — the catalog may simply be empty
    } finally {
      setLoading(false);
    }
  }, [activeSede.slug, api]);

  useEffect(() => { loadData(); }, [loadData]);

  // When sede changes, reload
  const handleSedeChange = (sede) => {
    setActiveSede(sede);
    setSedeProducts({});
  };

  const handleCreateProduct = async (data) => {
    await api().post('/catalog/products', { ...data, brand_id: BRAND_SLUG });
    toast.success('✅ Producto creado en catálogo maestro');
    loadData();
  };

  const handleUpdateProduct = async (data) => {
    await api().patch(`/catalog/products/${productModal.product.id}`, data);
    toast.success('✅ Producto actualizado');
    loadData();
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Eliminar este producto del catálogo maestro? Se eliminará de todas las sedes.')) return;
    try {
      await api().delete(`/catalog/products/${productId}`);
      toast.success('Producto eliminado del catálogo');
      loadData();
    } catch {
      toast.error('Error al eliminar producto');
    }
  };

  const handleSaveOverride = async (data) => {
    if (!overrideModal.product) return;
    await api().put(`/catalog/sedes/${activeSede.slug}/products/${overrideModal.product.id}`, {
      global_product_id: overrideModal.product.id,
      ...data,
    });
    toast.success(`✅ Configuración guardada para Sede ${activeSede.label}`);
    loadData();
  };

  const handleToggleSedeProduct = async (product) => {
    const current = sedeProducts[product.id];
    const newActivo = !(current?.activo ?? false);
    try {
      await api().put(`/catalog/sedes/${activeSede.slug}/products/${product.id}`, {
        global_product_id: product.id,
        activo: newActivo,
        disponible: current?.disponible ?? true,
        precio_local: current?.precio_local ?? null,
        config_adicional: current?.config_adicional ?? {},
      });
      toast.success(newActivo ? `✅ Activado en Sede ${activeSede.label}` : `⏸ Desactivado en Sede ${activeSede.label}`);
      loadData();
    } catch {
      toast.error('Error al cambiar estado del producto');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.category_id === filterCat : true;
    return matchSearch && matchCat;
  });

  const activeSedeList = products.filter(p => sedeProducts[p.id]?.activo);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isSuperAdmin ? 'Catálogo Maestro' : `Catálogo Sede ${activeSede.label}`}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isSuperAdmin 
                ? 'Gestiona el catálogo global y los overrides de precio y disponibilidad por sede.'
                : 'Gestiona la disponibilidad y precios de tu catálogo.'}
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              onClick={() => setProductModal({ open: true, mode: 'create', product: null })}
              className="bg-[#DAA520] hover:bg-[#C4941A] text-white font-bold gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Nuevo Producto Global
            </Button>
          )}
        </div>

        {/* ── SEDE PICKER (Visible only for super admins) ── */}
        {isSuperAdmin && <SedePicker activeSede={activeSede} onChange={handleSedeChange} />}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Productos Globales', value: products.length, icon: BookOpen, color: '#6366F1' },
            { label: `Activos en Sede ${activeSede.label}`, value: activeSedeList.length, icon: Store, color: activeSede.color },
            { label: 'Categorías', value: categories.length, icon: Tag, color: '#F59E0B' },
            { label: 'Sin configurar', value: products.length - activeSedeList.length, icon: AlertCircle, color: '#EF4444' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: stat.color + '20' }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-medium leading-tight">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        {isSuperAdmin && (
          <div className="flex gap-2 border-b border-slate-200">
            {[
              { id: 'catalogo', label: '📖 Catálogo Global', count: products.length },
              { id: 'sede', label: `${activeSede.emoji} Sede ${activeSede.label}`, count: activeSedeList.length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-all ${
                  tab === t.id ? 'border-[#DAA520] text-[#DAA520]' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.label}
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#DAA520]/40 focus:border-[#DAA520]" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <button onClick={loadData} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors" title="Recargar">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520]" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold">No hay productos en el catálogo</p>
                <p className="text-slate-400 text-sm mt-1">
                  Crea el primer producto global con el botón superior.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Producto</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Categoría</th>
                    <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Precio Base</th>
                    {tab === 'sede' && (
                      <>
                        <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">
                          Precio {activeSede.label}
                        </th>
                        <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                      </>
                    )}
                    <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, idx) => {
                    const sp = sedeProducts[product.id];
                    const isActive = sp?.activo;
                    const cat = categories.find(c => c.id === product.category_id);

                    return (
                      <motion.tr key={product.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        className={`border-b border-slate-50 hover:bg-amber-50/30 transition-colors ${tab === 'sede' && !isActive ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.imagen ? (
                              <img src={product.imagen} alt={product.nombre}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#DAA520]/10 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-[#DAA520]" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-800">{product.nombre}</p>
                              {product.descripcion && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{product.descripcion}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {cat ? (
                            <Badge variant="outline" className="text-xs">{cat.nombre}</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-slate-700">
                            ${Number(product.precio_base || 0).toLocaleString('es-CO')}
                          </span>
                        </td>
                        {tab === 'sede' && (
                          <>
                            <td className="px-5 py-4 text-right hidden lg:table-cell">
                              {sp?.precio_local ? (
                                <span className="text-sm font-bold" style={{ color: activeSede.color }}>
                                  ${Number(sp.precio_local).toLocaleString('es-CO')}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Usa base</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={() => handleToggleSedeProduct(product)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 ${
                                  isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}>
                                {isActive ? <><Check className="w-3 h-3" /> Activo</> : <><X className="w-3 h-3" /> Inactivo</>}
                              </button>
                            </td>
                          </>
                        )}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {tab === 'sede' && (
                              <button
                                onClick={() => setOverrideModal({ open: true, product: { ...product, ...sp } })}
                                title={`Configurar en Sede ${activeSede.label}`}
                                className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors">
                                <Store className="w-4 h-4" />
                              </button>
                            )}
                            {tab === 'catalogo' && (
                              <>
                                <button
                                  onClick={() => setProductModal({ open: true, mode: 'edit', product })}
                                  title="Editar"
                                  className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  title="Eliminar del catálogo"
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'sede' && (
          <p className="text-xs text-slate-400 text-center">
            💡 El ícono <Store className="inline w-3 h-3 text-amber-500" /> configura el precio local y disponibilidad para Sede {activeSede.label}.
            El toggle cambia rápidamente si el producto aparece o no en el menú de esta sede.
          </p>
        )}
      </div>

      <ProductModal
        open={productModal.open}
        onClose={() => setProductModal({ open: false, mode: 'create', product: null })}
        product={productModal.product}
        categories={categories}
        onSave={productModal.mode === 'edit' ? handleUpdateProduct : handleCreateProduct}
        mode={productModal.mode}
      />
      <SedeOverrideModal
        open={overrideModal.open}
        onClose={() => setOverrideModal({ open: false, product: null })}
        product={overrideModal.product}
        activeSede={activeSede}
        onSave={handleSaveOverride}
      />
    </DashboardLayout>
  );
}
