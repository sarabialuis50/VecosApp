import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart, CartProvider } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  QrCode,
  LogOut,
  ShoppingCart,
  Plus,
  Minus,
  Send,
  X,
  Check,
  Loader2,
  ChevronRight,
  User,
  ScanLine,
  ArrowLeft,
  Clock,
  Pencil
} from 'lucide-react';
import PublicTrialLocked from '@/components/PublicTrialLocked';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_BASE = (import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';


// PIN Login Component
const PinLogin = ({ slug, onLogin }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('El PIN debe tener 4 dígitos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/employee/login/${slug}`, { pin });
      localStorage.setItem('menu.ia_employee_token', response.data.access_token);
      localStorage.setItem('menu.ia_employee', JSON.stringify(response.data.employee));
      onLogin(response.data.employee);
      toast.success(`¡Hola, ${response.data.employee.nombre}!`);
    } catch (error) {
      console.error('Employee login error:', error.response?.status, error.response?.data, error.message);
      const detail = error.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else if (error.response?.status === 404) {
        toast.error('Negocio no encontrado');
      } else {
        toast.error('Error de conexión. Verifica tu red.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4ADE80] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Acceso Mesero</h1>
          <p className="text-gray-400 mt-2">Ingresa tu PIN de 4 dígitos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${pin.length > index
                  ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814]'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
              >
                {pin[index] || '•'}
              </div>
            ))}
          </div>

          <Input
            type="tel"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="sr-only"
            autoFocus
            data-testid="pin-input"
          />

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (num === 'del') {
                    setPin(pin.slice(0, -1));
                  } else if (num !== null && pin.length < 4) {
                    setPin(pin + num);
                  }
                }}
                className={`
                  h-14 rounded-xl font-semibold text-xl transition-colors
                  ${num === null ? 'invisible' : ''}
                  ${num === 'del'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                  }
                `}
                data-testid={`numpad-${num}`}
              >
                {num === 'del' ? <X className="w-5 h-5 mx-auto" /> : num}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={pin.length !== 4 || loading}
            className="w-full h-14 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-lg"
            data-testid="pin-submit-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

// Main Waiter App Component
const WaiterAppContent = ({ employee, slug, onLogout }) => {
  const { items, addItem, removeItem, updateQuantity, updateItem, clearCart, total, itemCount } = useCart();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [tableSelectOpen, setTableSelectOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lockedMessage, setLockedMessage] = useState(null);

  // Modal de opciones extra
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [productNotes, setProductNotes] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const [businessRes, productsRes, tablesRes] = await Promise.all([
        axios.get(`${API_BASE}/business/${slug}`),
        axios.get(`${API_BASE}/menu-items/${slug}`),
        axios.get(`${API_BASE}/tables/${slug}`)
      ]);

      setBusiness(businessRes.data);

      const mappedProducts = productsRes.data.map(p => ({
        ...p,
        id: p.id,
        nombre: p.name || p.nombre || 'Producto sin nombre',
        descripcion: p.description || p.descripcion,
        precio: p.base_price !== undefined ? p.base_price : p.precio,
        categoria: p.category || p.categoria || 'Menú',
        disponible: p.available !== undefined ? p.available : p.disponible,
        imagen_url: p.image_url || p.imagen,
        imagen: p.image_url || p.imagen
      }));

      const availableProducts = mappedProducts.filter(p => p.disponible !== false);
      setProducts(availableProducts);
      setTables(tablesRes.data);

      const cats = [...new Set(availableProducts.map(p => p.categoria).filter(Boolean))];
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response && error.response.status === 403) {
        setLockedMessage(error.response.data?.detail || "Servicio no disponible.");
      } else {
        toast.error('Error al cargar datos');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Number(value));
  };

  const handleProductClick = (product) => {
    if (!product.disponible) return;
    setSelectedProduct(product);
    setQty(1);
    setSelectedModifiers([]);
    setProductNotes('');
    setEditIndex(null);
  };

  const handleEditItem = (index, item) => {
    const originalProduct = products.find(p => p.id === item.producto_id);
    if (!originalProduct) return;

    // Parse the item's saved modifiers to re-populate state
    const parsedModNames = item.modificadores ? item.modificadores.map(mStr => mStr.replace(/^\(\d+\)\s/, '')) : [];
    const foundMods = [];
    ['tamanos', 'modificadores', 'opciones'].forEach(key => {
      if (originalProduct[key]) {
        originalProduct[key].forEach(group => {
          group.opciones.forEach(opt => {
            if (parsedModNames.includes(opt.nombre)) foundMods.push(opt);
          })
        })
      }
    });

    setSelectedProduct(originalProduct);
    setQty(item.cantidad);
    setProductNotes(item.notas || '');
    setSelectedModifiers(foundMods);
    setEditIndex(index);
  };

  const addToCartAndConfirm = () => {
    if (!selectedProduct) return;

    if (selectedProduct.modificadores) {
      const missingRequired = selectedProduct.modificadores.find(group =>
        group.obligatorio && !selectedModifiers.some(m => group.opciones.some(opt => opt.nombre === m.nombre))
      );
      if (missingRequired) {
        toast.error(`Por favor selecciona: ${missingRequired.nombre}`);
        return;
      }
    }

    if (editIndex !== null) {
      updateItem(editIndex, selectedProduct, qty, productNotes, selectedModifiers);
      toast.success(`Pedido actualizado`, { duration: 1000 });
    } else {
      addItem(selectedProduct, qty, productNotes, selectedModifiers);
      toast.success(`${selectedProduct.nombre} agregado`, { duration: 1000 });
    }

    setSelectedProduct(null);
    setEditIndex(null);
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      toast.error('Selecciona una mesa');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega productos al pedido');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        mesa_id: selectedTable.id,
        mesa_numero: selectedTable.numero,
        items: items.map(item => ({
          producto_id: item.producto_id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          notas: item.notas,
          modificadores: item.modificadores
        })),
        mesero_id: employee.id,
        tipo: 'mesa'
      };

      await axios.post(`${API_BASE}/orders/${slug}`, orderData);
      clearCart();
      setCartOpen(false);
      setSelectedTable(null);
      setTableSelectOpen(true);
      toast.success('¡Pedido enviado a cocina!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al enviar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = activeCategory
    ? products.filter(p => p.categoria === activeCategory)
    : products;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
      </div>
    );
  }

  if (lockedMessage) {
    return <PublicTrialLocked message={lockedMessage} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24" data-testid="waiter-app-container">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Hola, {employee.nombre}</p>
            <h1 className="font-heading font-bold text-lg">
              {selectedTable ? `Mesa ${selectedTable.numero}` : 'Selecciona mesa'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedTable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTable(null);
                  setTableSelectOpen(true);
                  clearCart();
                }}
              >
                Cambiar mesa
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-gray-500"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Table Selection */}
      <AnimatePresence>
        {tableSelectOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#FAFAF9] w-full rounded-t-[2.5rem] h-[85vh] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md p-5 md:p-6 border-b z-20 flex justify-between items-center shrink-0">
                <h2 className="font-heading font-black text-2xl text-[#111814] tracking-tight">Selecciona una mesa</h2>
                <button
                  onClick={() => setTableSelectOpen(false)}
                  className="size-10 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {tables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table);
                        setTableSelectOpen(false);
                      }}
                      className={`
                        group relative overflow-hidden rounded-2xl border-2 flex flex-col p-4
                        text-left transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md
                        ${table.estado === 'libre'
                          ? 'bg-white border-[#4ADE80]/30 hover:border-[#4ADE80] text-[#111814]'
                          : 'bg-white border-amber-300/30 hover:border-amber-400 text-amber-900 opacity-90'
                        }
                      `}
                      data-testid={`select-table-${table.numero}`}
                    >
                      {table.estado === 'libre' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4ADE80]/5 to-transparent pointer-events-none opacity-50"></div>
                      )}

                      <div className="flex justify-between items-start w-full mb-3 relative z-10">
                        <span className="font-black text-3xl md:text-4xl tracking-tighter leading-none">
                          {table.numero}
                        </span>
                        <div className={`
                          px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest
                          ${table.estado === 'libre' ? 'bg-[#4ADE80] text-[#111814]' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {table.estado === 'libre' ? 'Libre' : 'Ocupada'}
                        </div>
                      </div>

                      <div className="space-y-1 w-full relative z-10">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span>Capacidad: {table.capacidad || 4} px</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-bold truncate">
                          <ScanLine className="w-3 h-3 shrink-0" />
                          <span className="truncate">Ubicación: {table.ubicacion || table.seccion || 'Principal'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Navigation */}
      {selectedTable && (
        <>
          <nav className="sticky top-[65px] z-30 bg-white/80 backdrop-blur-md border-b">
            <div className="px-4">
              <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                      ? 'bg-[#4ADE80] text-[#111814]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    data-testid={`waiter-category-${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Products Grid */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleProductClick(product)}
                  className={`group bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-[#f0f4f2] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-row h-auto cursor-pointer ${!product.disponible ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="flex flex-col shrink-0">
                    <div className="relative w-32 h-32 md:w-36 md:h-36 overflow-hidden m-2 md:m-3 rounded-2xl md:rounded-[2rem]">
                      <img
                        src={product.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"}
                        alt={product.nombre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 z-20">
                        {product.etiqueta && (
                          <div className="bg-[#4ADE80] text-[#111814] text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg shadow-md border border-white/10 flex items-center gap-1">
                            {product.etiqueta}
                          </div>
                        )}
                      </div>
                      {!product.disponible && (
                        <div className="absolute inset-0 bg-[#618972]/80 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-white/20 backdrop-blur text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>
                    {product.prep_time_minutes > 0 && (
                      <div className="flex justify-center -mt-1 mb-2">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-blue-50/50 text-blue-600 text-[8px] font-black border border-blue-100">
                          <Clock className="w-2.5 h-2.5" />
                          {product.prep_time_minutes} MIN
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="inline-flex px-2 py-0.5 rounded-full bg-[#4ADE80]/10 text-[8px] font-black text-[#22C55E] uppercase tracking-wider">
                        {product.categoria}
                      </div>
                      {(product.oferta_porcentaje || (product.precio_original > product.precio)) && (
                        <div className="bg-[#ff4b4b] text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">
                          OFERTA
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm md:text-lg font-black text-[#111814] line-clamp-2 md:line-clamp-2 mb-1">
                      {product.nombre}
                    </h3>
                    <p className="text-xs text-[#618972] font-medium leading-tight line-clamp-2 mb-2">
                      {product.descripcion || ""}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-base md:text-xl font-black text-[#111814]">
                        {formatCurrency(product.precio)}
                      </span>
                      <div className="size-8 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-md">
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Cart Bar */}
      {selectedTable && itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40"
        >
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button
                className="w-full bg-[#4ADE80] text-[#111814] rounded-xl px-4 py-4 flex items-center justify-between hover:bg-[#22C55E] transition-colors"
                data-testid="waiter-cart-btn"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-semibold">{itemCount} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(total)}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] p-4 flex flex-col">
              <SheetHeader className="shrink-0 mb-4">
                <SheetTitle>Pedido Mesa {selectedTable?.numero}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded-2xl border-2 border-t border-l border-[#4ADE80]/60 border-b-[4px] border-r-[3px] shadow-sm mb-1 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#4ADE80]/5 to-transparent pointer-events-none opacity-50"></div>
                      <div className="flex justify-between items-start gap-3 relative z-10">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.nombre}</h4>
                          <p className="text-sm text-gray-500">{formatCurrency(item.precio_unitario)}</p>
                          {item.modificadores && item.modificadores.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.modificadores.map((mod, midx) => (
                                <span key={midx} className="text-[9px] bg-[#4ADE80]/10 text-[#22C55E] px-1.5 py-0.5 rounded-lg border border-[#4ADE80]/20 font-bold uppercase">
                                  + {mod}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notas && (
                            <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 border border-amber-200 truncate">
                              {item.notas}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 shrink-0"
                          onClick={() => handleEditItem(index, item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateQuantity(index, item.cantidad - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{item.cantidad}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateQuantity(index, item.cantidad + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="shrink-0 pt-4 mt-auto border-t space-y-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-[#22C55E]">{formatCurrency(total)}</span>
                  </div>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full h-14 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-lg"
                    data-testid="send-order-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Enviar a cocina
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      )}

      {/* Product Detail Modal para el Mesero */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full p-0 overflow-hidden rounded-[2rem] bg-white border-none shadow-2xl [&>button]:hidden outline-none h-[90vh] flex flex-col" aria-describedby="product-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription id="product-description">Opciones de personalización.</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <>
              {/* Product Image Mobile Context */}
              <div className="relative w-full h-48 sm:h-56 overflow-hidden shrink-0 bg-gray-50">
                <img
                  src={selectedProduct.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
                  alt={selectedProduct.nombre}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 size-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-black" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24">
                {/* General Info */}
                <div>
                  <h2 className="text-2xl font-black text-[#111814]">{selectedProduct.nombre}</h2>
                  <p className="text-[#618972] text-sm mt-1">{selectedProduct.descripcion}</p>
                  <p className="text-2xl font-black text-[#22C55E] mt-3">{formatCurrency(selectedProduct.precio)}</p>
                </div>

                {/* Modifiers (Tamanos, Modificadores, Opciones) */}
                {['tamanos', 'modificadores', 'opciones'].map((categoryKey) => {
                  const groups = selectedProduct[categoryKey];
                  if (!groups || !Array.isArray(groups)) return null;

                  return groups.map((group, groupIdx) => (
                    <div key={`${categoryKey}-${groupIdx}`} className="space-y-3 pb-3 border-b border-gray-100">
                      <div className="flex justify-between items-center bg-white sticky top-0 py-1">
                        <h3 className="text-base font-black text-[#111814]">{group.nombre}</h3>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${group.obligatorio ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                          {group.obligatorio ? 'Requerido' : 'Opcional'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.opciones.map((opcion, opcIdx) => {
                          const isSelected = selectedModifiers.some(m => m.nombre === opcion.nombre);

                          return (
                            <label key={opcIdx} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center size-5 rounded-md border-2 ${isSelected ? 'border-[#4ADE80] bg-[#4ADE80]' : 'border-gray-300'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                </div>
                                <span className="text-sm font-bold text-[#111814]">{opcion.nombre}</span>
                              </div>
                              {opcion.precio > 0 && (
                                <span className="text-sm font-black text-[#618972]">+{formatCurrency(opcion.precio)}</span>
                              )}

                              <input
                                type={group.seleccion_multiple ? "checkbox" : "radio"}
                                name={`group-${groupIdx}`}
                                className="hidden"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    if (group.seleccion_multiple) {
                                      setSelectedModifiers(prev => prev.filter(m => m.nombre !== opcion.nombre));
                                    } else if (!group.obligatorio) {
                                      setSelectedModifiers(prev => prev.filter(m => m.nombre !== opcion.nombre));
                                    }
                                  } else {
                                    if (!group.seleccion_multiple) {
                                      setSelectedModifiers(prev => [
                                        ...prev.filter(m => !group.opciones.some(opt => opt.nombre === m.nombre)),
                                        opcion
                                      ]);
                                    } else {
                                      const currentSelectedInGroup = selectedModifiers.filter(m => group.opciones.some(opt => opt.nombre === m.nombre));
                                      if (group.max_opciones && currentSelectedInGroup.length >= group.max_opciones) {
                                        toast.error(`Máximo ${group.max_opciones} opciones en ${group.nombre}`);
                                        return;
                                      }
                                      setSelectedModifiers(prev => [...prev, opcion]);
                                    }
                                  }
                                }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ));
                })}

                {/* Notes Input */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aclaraciones adicionales</h3>
                  <textarea
                    value={productNotes}
                    onChange={(e) => setProductNotes(e.target.value)}
                    placeholder="Ej: Sin cebolla, extra salsa..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/30 min-h-[80px]"
                  />
                </div>
              </div>

              {/* Bottom Fixed Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t rounded-b-[2rem] z-20">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-10 flex items-center justify-center text-[#111814] active:scale-90">
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    <span className="w-6 text-center text-lg font-black">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="size-10 flex items-center justify-center text-[#111814] active:scale-90">
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>

                  <button
                    onClick={addToCartAndConfirm}
                    className="flex-1 bg-[#4ADE80] border-2 border-[#4ADE80] shadow-sm hover:bg-[#22C55E] hover:border-[#22C55E] h-12 rounded-xl text-[#111814] font-black text-sm flex items-center justify-between px-5 active:scale-[0.98] transition-all"
                  >
                    <span>{editIndex !== null ? 'Actualizar pedido' : 'Agregar al pedido'}</span>
                    <span>
                      {formatCurrency((selectedProduct.precio + selectedModifiers.reduce((acc, m) => acc + (m.precio || 0), 0)) * qty)}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main Export
export default function MeseroApp() {
  const { slug } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    // Check for existing session
    const savedEmployee = localStorage.getItem('menu.ia_employee');
    if (savedEmployee) {
      setEmployee(JSON.parse(savedEmployee));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('menu.ia_employee_token');
    localStorage.removeItem('menu.ia_employee');
    setEmployee(null);
  };

  if (!employee) {
    return <PinLogin slug={slug} onLogin={setEmployee} />;
  }

  return (
    <CartProvider>
      <WaiterAppContent employee={employee} slug={slug} onLogout={handleLogout} />
    </CartProvider>
  );
}
