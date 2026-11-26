import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import useWebSocket from '@/hooks/useWebSocket';
import { ChefHat, Clock, Volume2, VolumeX, RefreshCw, X, Truck, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playOrderSound, notifyNewOrder, unlockAudioAndNotifications } from '@/utils/sound';

export default function CocinaPage() {
  const { slug = 'vecos' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user, isSuperAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sedeFilter, setSedeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cocinasDualesActivo, setCocinasDualesActivo] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const kitchenType = location.pathname.endsWith('/domicilios')
    ? 'delivery'
    : location.pathname.endsWith('/salon')
      ? 'salon'
      : null;

  const wsIds = isSuperAdmin && orders.length > 0
    ? [...new Set([user?.id, ...orders.map(o => o.negocio_id)].filter(Boolean))]
    : user?.id;

  const { lastMessage, isConnected } = useWebSocket(wsIds);

  const previousOrdersRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isSuperAdmin) { setConfigLoading(false); return; }
    api().get(`/business/${slug}`).then(res => {
      setCocinasDualesActivo(res.data?.cocinas_duales_activo || false);
    }).catch(() => {
      setCocinasDualesActivo(false);
    }).finally(() => { setConfigLoading(false); });
  }, [slug, api, isSuperAdmin]);

  const fetchOrders = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) setLoading(true);
      const params = kitchenType ? { kitchen_type: kitchenType } : {};
      const response = await api().get(`/orders/${slug}/active`, { params });
      const incomingOrders = response.data || [];
      const incomingIds = new Set(incomingOrders.map(o => o.id));
      if (!isFirstLoadRef.current) {
        const newPendingOrders = incomingOrders.filter(o =>
          !previousOrdersRef.current.has(o.id) && o.estado === 'pendiente'
        );
        if (newPendingOrders.length > 0) {
          toast.success(`¡Tienes ${newPendingOrders.length} pedido(s) nuevo(s)!`, { duration: 5000, position: 'top-center' });
          if (soundEnabled) playOrderSound();
          notifyNewOrder('¡Nuevo Pedido!', `Tienes ${newPendingOrders.length} pedido(s) nuevo(s) en la cocina por preparar.`);
        }
      }
      previousOrdersRef.current = incomingIds;
      isFirstLoadRef.current = false;
      setOrders(incomingOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, api, soundEnabled, kitchenType]);

  useEffect(() => {
    if (isSuperAdmin || kitchenType || !cocinasDualesActivo) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, isSuperAdmin, kitchenType, cocinasDualesActivo]);

  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'new_order' || lastMessage.type === 'order_updated')) {
      if (isSuperAdmin || kitchenType || !cocinasDualesActivo) fetchOrders();
    }
  }, [lastMessage, fetchOrders, isSuperAdmin, kitchenType, cocinasDualesActivo]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api().put(`/orders/${slug}/${orderId}`, { estado: newStatus });
      toast.success('Estado actualizado');
      fetchOrders();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const sedesPresentes = [];

  const sedeFiltered = orders;

  const filteredOrders = typeFilter === 'all'
    ? sedeFiltered
    : typeFilter === 'delivery'
      ? sedeFiltered.filter(o => o.tipo === 'delivery')
      : sedeFiltered.filter(o => ['mesa', 'takeaway'].includes(o.tipo));

  const PALETTE = [
    { bg: 'bg-blue-500',   text: 'text-blue-100',   label: '🔵' },
    { bg: 'bg-yellow-500', text: 'text-yellow-900',  label: '🟡' },
    { bg: 'bg-green-500',  text: 'text-green-100',   label: '🟢' },
    { bg: 'bg-red-500',    text: 'text-red-100',     label: '🔴' },
    { bg: 'bg-purple-500', text: 'text-purple-100',  label: '🟣' },
  ];
  const sedeColorMap = {};
  sedesPresentes.forEach((sede, i) => {
    sedeColorMap[sede.slug] = { ...PALETTE[i % PALETTE.length], nombre: sede.nombre };
  });

  const kitchenBadge = kitchenType === 'delivery'
    ? { icon: <Truck className="w-4 h-4" />, label: 'Cocina Domicilios', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' }
    : kitchenType === 'salon'
      ? { icon: <UtensilsCrossed className="w-4 h-4" />, label: 'Cocina Salón', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' }
      : null;

  if (configLoading || (loading && orders.length === 0 && (isSuperAdmin || kitchenType || !cocinasDualesActivo))) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
      </div>
    );
  }

  if (!isSuperAdmin && cocinasDualesActivo && !kitchenType) {
    return <KitchenSelectionScreen slug={slug} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="cocina-container" onClick={unlockAudioAndNotifications}>
      <header className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {kitchenType && (
              <button
                onClick={() => navigate(`/dashboard/${slug}`)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Salir al Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
              <img src="/logos/logo-icon-transparent.png" alt="Menu.IA" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg">Cocina</h1>
                {kitchenBadge && (
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${kitchenBadge.color}`}>
                    {kitchenBadge.icon}
                    {kitchenBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {filteredOrders.length} pedidos activos
                {typeFilter !== 'all' ? ` · ${typeFilter === 'delivery' ? 'Domicilios' : 'Salón'}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionBadge isConnected={isConnected} />
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-gray-400 hover:text-white" data-testid="toggle-sound-btn">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchOrders} className="text-gray-400 hover:text-white" data-testid="refresh-orders-btn">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              onClick={() => kitchenType ? navigate(`/dashboard/${slug}/cocina`) : navigate(`/dashboard/${slug}`)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 ml-2"
              data-testid="exit-kitchen-btn"
              title={kitchenType ? 'Cambiar cocina' : 'Salir al Dashboard'}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {isSuperAdmin && sedesPresentes.length > 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSedeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${sedeFilter === 'all' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >Todas</button>
            {sedesPresentes.map(sede => {
              const info = sedeColorMap[sede.slug] || { bg: 'bg-gray-500', text: 'text-white', label: '⚫' };
              return (
                <button key={sede.slug} onClick={() => setSedeFilter(sede.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${sedeFilter === sede.slug ? `${info.bg} text-white shadow` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {info.label} {sede.nombre}
                </button>
              );
            })}
          </div>
        )}

        {isSuperAdmin && (
          <div className="px-4 pb-2 flex gap-2 border-t border-gray-700/50 pt-2">
            <button onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-gray-400 text-gray-900' : 'bg-gray-700/60 text-gray-400 hover:bg-gray-700'}`}
            >Todos los pedidos</button>
            <button onClick={() => setTypeFilter('delivery')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${typeFilter === 'delivery' ? 'bg-orange-500 text-white shadow' : 'bg-gray-700/60 text-gray-400 hover:bg-gray-700'}`}
            ><Truck className="w-3.5 h-3.5" />Domicilios</button>
            <button onClick={() => setTypeFilter('salon')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${typeFilter === 'salon' ? 'bg-emerald-500 text-white shadow' : 'bg-gray-700/60 text-gray-400 hover:bg-gray-700'}`}
            ><UtensilsCrossed className="w-3.5 h-3.5" />Salón</button>
          </div>
        )}
      </header>

      <main className="p-4">
        {filteredOrders.length === 0 ? (
          <EmptyState kitchenType={kitchenType} typeFilter={typeFilter} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredOrders
              .filter(order => !(order.tipo === 'delivery' && order.estado === 'listo'))
              .map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} sedeColorMap={sedeColorMap} isSuperAdmin={isSuperAdmin} />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function KitchenSelectionScreen({ slug, navigate }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
          <img src="/logos/logo-icon-transparent.png" alt="Menu.IA" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-white font-heading font-bold text-2xl">Cocina</h1>
          <p className="text-gray-400 text-sm mt-1">Selecciona la cocina a gestionar</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        <button
          onClick={() => navigate(`/dashboard/${slug}/cocina/domicilios`)}
          className="group relative bg-gray-800 border border-gray-700 hover:border-orange-500/60 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-200 hover:bg-gray-800/80 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
        >
          <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40 flex items-center justify-center transition-all duration-200">
            <Truck className="w-10 h-10 text-orange-400 group-hover:text-orange-300 transition-colors" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-heading font-bold text-xl">Cocina Domicilios</h2>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">Pedidos enviados a domicilio</p>
          </div>
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500/50 group-hover:bg-orange-400 transition-colors" />
        </button>
        <button
          onClick={() => navigate(`/dashboard/${slug}/cocina/salon`)}
          className="group relative bg-gray-800 border border-gray-700 hover:border-emerald-500/60 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-200 hover:bg-gray-800/80 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-all duration-200">
            <UtensilsCrossed className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-heading font-bold text-xl">Cocina Salón</h2>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">Pedidos de mesa y para llevar</p>
          </div>
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" />
        </button>
      </div>
      <button
        onClick={() => navigate(`/dashboard/${slug}`)}
        className="mt-10 text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Salir al Dashboard
      </button>
    </div>
  );
}

function ConnectionBadge({ isConnected }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      {isConnected ? 'Conectado' : 'Desconectado'}
    </div>
  );
}

function EmptyState({ kitchenType, typeFilter }) {
  const icon = kitchenType === 'delivery' || typeFilter === 'delivery'
    ? <Truck className="w-20 h-20 mb-4 opacity-30" />
    : kitchenType === 'salon' || typeFilter === 'salon'
      ? <UtensilsCrossed className="w-20 h-20 mb-4 opacity-30" />
      : <ChefHat className="w-20 h-20 mb-4 opacity-30" />;
  const message = kitchenType === 'delivery' || typeFilter === 'delivery'
    ? 'No hay domicilios activos'
    : kitchenType === 'salon' || typeFilter === 'salon'
      ? 'No hay pedidos de salón activos'
      : 'No hay pedidos activos';
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
      {icon}
      <p className="text-xl font-medium">{message}</p>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus, sedeColorMap = {}, isSuperAdmin }) {
  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v));
  const getTimeSince = (d) => { const diff = Math.floor((new Date() - new Date(d)) / 60000); return diff < 1 ? 'Ahora' : diff < 60 ? diff + ' min' : Math.floor(diff / 60) + 'h'; };
  const sedeInfo = order.sede_slug ? sedeColorMap[order.sede_slug] : null;

  let config;
  if (order.estado === 'pendiente' || order.estado === 'aceptado') {
    config = { label: 'Nuevo', color: 'border-blue-400 bg-blue-50', headerColor: 'bg-blue-500', nextAction: 'ACEPTAR', nextStatus: 'preparando', btnColor: 'bg-blue-500 hover:bg-blue-600 font-black' };
  } else if (order.estado === 'preparando') {
    config = { label: 'Preparando', color: 'border-yellow-400 bg-yellow-50', headerColor: 'bg-yellow-500', nextAction: 'LISTO', nextStatus: 'listo', btnColor: 'bg-green-500 hover:bg-green-600 font-black' };
  } else if (order.estado === 'listo') {
    const isDelivery = order.tipo === 'delivery';
    config = { label: 'Listo', color: 'border-emerald-400 bg-emerald-50', headerColor: 'bg-emerald-500', nextAction: isDelivery ? 'ENVIADO' : 'ENTREGADO', nextStatus: isDelivery ? 'enviado' : 'entregado', btnColor: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white font-black' };
  } else if (order.estado === 'enviado') {
    config = { label: 'Enviado', color: 'border-purple-400 bg-purple-50', headerColor: 'bg-purple-500', nextAction: 'ENTREGADO', nextStatus: 'entregado', btnColor: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white font-black' };
  } else {
    config = { label: 'Entregado', color: 'border-gray-400 bg-gray-50', headerColor: 'bg-gray-500', nextAction: null, nextStatus: null, btnColor: '' };
  }

  return (
    <div className={`rounded-xl border-2 overflow-hidden flex flex-col h-full ${config.color}`} data-testid={`order-ticket-${order.id}`}>
      <div className={`${config.headerColor} text-white px-4 py-2 flex items-center justify-center relative`}>
        <span className="font-bold text-center text-lg uppercase tracking-wider">{config.label}</span>
        {isSuperAdmin && sedeInfo && (
          <span className={`absolute left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${sedeInfo.bg} ${sedeInfo.text}`}>
            {sedeInfo.label} {sedeInfo.nombre}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm('¿Deseas rechazar/cancelar este pedido?')) { onUpdateStatus(order.id, 'cancelado'); } }}
          className="absolute right-4 w-6 h-6 flex items-center justify-center rounded-full border-2 border-white hover:bg-white/20 transition-colors"
          title="Rechazar Pedido"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-bold text-xl text-gray-900 leading-tight">
              {order.mesa_numero ? `Mesa ${order.mesa_numero}` : (order.tipo === 'delivery' || order.tipo_pedido === 'delivery' ? '🛵 Domicilio' : '🛍️ Para Recoger')}
            </h3>
            <p className="text-xs font-bold text-gray-500 line-clamp-1">Cliente: {order.cliente_nombre || 'N/A'}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 ml-2">
            <span className="text-[11px] font-black text-blue-700 leading-tight">ID: {order.numero_secuencial ? String(order.numero_secuencial).padStart(8, '0') : order.id?.slice(0, 8).toUpperCase()}</span>
            <div className="flex items-center gap-1 mt-1 text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="text-[10px] font-bold shrink-0">{getTimeSince(order.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 overflow-visible flex-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1 border-b border-gray-100 last:border-0 pb-2 mb-2">
              <div className="flex gap-2">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-sm font-bold h-fit shrink-0">{item.cantidad}</span>
                <span className="font-medium text-gray-900 uppercase tracking-tight">{item.nombre}</span>
              </div>
              {item.descripcion && (
                <div className="ml-8 text-[11px] font-bold text-gray-600 leading-tight mt-0.5">{item.descripcion}</div>
              )}
              {item.notas && (
                <div className="ml-8 text-sm font-black text-amber-600 leading-tight mt-1 bg-amber-50 px-2 py-1 rounded border-l-2 border-amber-400">
                  Nota: {item.notas}
                </div>
              )}
              {item.modificadores && item.modificadores.length > 0 && (
                <div className="ml-8 mt-1.5 grid grid-cols-3 w-full pr-4 gap-x-1">
                  {(() => {
                    let grouped = {};
                    if (typeof item.modificadores[0] === 'string') {
                      grouped = { 'TAMAÑOS': [], 'ADICIONALES': [], 'OPCIONES': [] };
                      item.modificadores.forEach(mod => {
                        const lower = mod.toLowerCase();
                        let cat = 'ADICIONALES';
                        if (/small|medium|grande|personal|mediana|familiar|mitad|entera|porcion/i.test(lower)) cat = 'TAMAÑOS';
                        else if (/sin |con |oregano|orégano|salsa|picante|normal/i.test(lower)) cat = 'OPCIONES';
                        grouped[cat].push(mod.startsWith('(') ? mod : `(1) ${mod}`);
                      });
                    } else {
                      grouped = item.modificadores.reduce((acc, mod) => {
                        const cat = (mod.categoria || 'Adicionales').toUpperCase();
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(`(${mod.cantidad || 1}) ${mod.nombre}`);
                        return acc;
                      }, {});
                    }
                    return Object.entries(grouped).filter(([_, mods]) => mods.length > 0).map(([cat, mods], i) => (
                      <div key={i} className={`flex flex-col min-w-0 ${cat === 'ADICIONALES' ? '-ml-[4%]' : ''}`}>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 leading-none whitespace-nowrap" title={cat}>
                          {cat === 'OPCIONES' ? 'OPCIONES:' : cat}
                        </span>
                        <div className="flex flex-col gap-[1px]">
                          {mods.map((m, j) => (
                            <span key={j} className="text-[9px] text-blue-600 font-black uppercase leading-tight whitespace-nowrap overflow-visible z-10 relative" title={m}>{m}</span>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 shrink-0">
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-lg text-gray-900">{formatCurrency(order.total)}</span>
        </div>
        {config.nextStatus && (
          <Button onClick={() => onUpdateStatus(order.id, config.nextStatus)} className={`w-full mt-4 h-12 text-base font-bold shrink-0 ${config.btnColor} text-white`} data-testid={`action-btn-${order.id}`}>
            {config.nextAction}
          </Button>
        )}
      </div>
    </div>
  );
}
