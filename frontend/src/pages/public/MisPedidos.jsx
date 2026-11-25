import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import axios from 'axios';
import { Clock, Check, ChefHat, Truck, Package, RefreshCw, Phone, ArrowLeft, Smartphone, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import GOOGLE_MAPS_API_KEY from '@/config/googleMaps';

// Backend API URL
const API = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';


export default function MisPedidos() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [business, setBusiness] = useState(null);
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/business/${slug}`);
        setBusiness(response.data);

        const orderId = searchParams.get('order');
        const token = localStorage.getItem('client_token');

        // If logged in, prioritize fetching via authenticated endpoint
        if (token) {
          try {
            const api = axios.create({
              baseURL: API || '',
              headers: { Authorization: `Bearer ${token}` }
            });
            const clientOrdersRes = await api.get('/client/orders');
            if (clientOrdersRes.data && clientOrdersRes.data.length > 0) {
              setOrders(clientOrdersRes.data);

              if (orderId) {
                const found = clientOrdersRes.data.find(o => o.id === orderId);
                if (found) setSelectedOrder(found);
              }
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Auth fetch failed", e);
          }
        }

        if (orderId) {
          const orderRes = await axios.get(`${API}/orders/${slug}/track/${orderId}`);
          setSelectedOrder(orderRes.data);
          setOrders([orderRes.data]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, searchParams]);

  // Real-time tracking polling
  useEffect(() => {
    let interval;
    if (selectedOrder && (selectedOrder.estado === 'enviado' || selectedOrder.estado === 'listo')) {
      interval = setInterval(() => {
        refreshOrder();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedOrder?.id, selectedOrder?.estado]);

  const searchOrders = async () => {
    const query = phone.trim().toUpperCase();
    if (!query) return;

    setSearching(true);
    setHasSearched(false);

    try {
      const response = await axios.get(`${API}/orders/${slug}/my-orders?query=${encodeURIComponent(query)}`);
      setOrders(response.data);
      setHasSearched(true);

      if (response.data.length > 0) {
        setSelectedOrder(response.data[0]);
      } else {
        toast.error("No encontramos ningún pedido con ese código.");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Ocurrió un error al buscar el pedido.");
    } finally {
      setSearching(false);
    }
  };

  const refreshOrder = async () => {
    if (!selectedOrder) return;
    try {
      const response = await axios.get(`${API}/orders/${slug}/track/${selectedOrder.id}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleHideOrder = (orderId) => {
    const saved = localStorage.getItem('client_hidden_orders');
    const hidden = saved ? JSON.parse(saved) : [];
    const newHidden = [...hidden, orderId];
    localStorage.setItem('client_hidden_orders', JSON.stringify(newHidden));
    toast.success("Pedido eliminado de tu vista");
    navigate(localStorage.getItem('client_token') ? `/${slug}/mi-cuenta` : `/${slug}/menu`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
      </div>
    );
  }

  return (
    <PublicLayout
      businessName={business?.nombre}
      businessLogo={business?.logo_url}
      slug={slug}
      whatsapp={business?.whatsapp}
      aiEnabled={business?.ai_habilitado}
      aiSaludo={business?.ai_saludo}
      aiUseModal={business?.ai_use_modal}
      backPath={localStorage.getItem('client_token') ? `/${slug}/mi-cuenta` : `/${slug}/menu`}
    >
      <div className="max-w-lg mx-auto px-6 py-10 min-h-[80vh]">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(localStorage.getItem('client_token') ? `/${slug}/mi-cuenta` : `/${slug}/menu`)}
              className="inline-flex items-center gap-2 p-0 h-auto text-[10px] font-black uppercase tracking-widest text-[#618972] mb-4 hover:text-[#22C55E] hover:bg-transparent transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> {localStorage.getItem('client_token') ? 'Volver a Mi Cuenta' : 'Volver al Menú'}
            </Button>
            <h1 className="text-4xl font-black text-[#111814] tracking-tighter leading-none">Mi Pedido</h1>
          </div>
          <div className="size-14 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center text-[#22C55E]">
            <Package className="w-8 h-8" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedOrder ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key="timeline"
            >
              <OrderTimeline
                order={selectedOrder}
                onRefresh={refreshOrder}
                onReset={() => { setSelectedOrder(null); setOrders([]); setHasSearched(false); }}
                onHide={handleHideOrder}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="search"
            >
              <SearchSection search_query={phone} setSearchQuery={setPhone} searchOrders={searchOrders} searching={searching} />
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedOrder && orders.length === 0 && hasSearched && !searching && <EmptyState />}
      </div>
    </PublicLayout>
  );
}

function SearchSection({ search_query, setSearchQuery, searchOrders, searching }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-black text-[#111814] tracking-tight">Rastrear mi pedido</h2>
        <p className="text-sm text-[#618972] font-medium leading-relaxed">
          Ingresa el código único de seguimiento de tu pedido (8 dígitos) para ver su estado actual.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#618972]/40" />
          <Input
            value={search_query}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchOrders();
              }
            }}
            placeholder="Código del pedido (Ej: 00123456)"
            className="h-16 pl-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-sm md:text-lg focus:ring-[#22C55E] focus:border-[#22C55E] transition-all uppercase placeholder:text-xs md:placeholder:text-base"
          />
        </div>
        <Button
          onClick={searchOrders}
          disabled={searching}
          className="w-full h-16 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#4ADE80]/20 transition-all active:scale-95"
        >
          {searching ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Rastrear Pedido</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-6">
      <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-300">
        <Smartphone className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">No hay pedidos</h3>
      <p className="text-sm text-gray-400 mt-2">Verifica tu número e intenta de nuevo.</p>
    </div>
  );
}

function OrderTimeline({ order, onRefresh, onReset, onHide }) {
  const formatCurrency = (v) => {
    if (v === undefined || v === null || isNaN(v) || Number(v) === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Number(v));
  };
  const steps = ['pendiente', 'aceptado', 'preparando', 'listo', 'enviado', 'entregado'];
  const stepData = [
    { label: 'Pendiente', Icon: Clock, desc: 'Ya recibimos tu pedido' },
    { label: 'Aceptado', Icon: Check, desc: 'Pedido confirmado' },
    { label: 'Preparando', Icon: ChefHat, desc: 'Tu comida está al fuego' },
    { label: 'Listo', Icon: Check, desc: '¡Listo para entrega!' },
    { label: 'En camino', Icon: Truck, desc: 'El repartidor va volando' },
    { label: 'Entregado', Icon: Package, desc: '¡Buen provecho!' }
  ];
  const currentIndex = steps.indexOf(order.estado);

  return (
    <div className="space-y-6">
      {/* Real-time Map Section */}
      {order.tipo === 'delivery' && (order.estado === 'enviado' || order.estado === 'entregado') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50 mb-1"
        >
          <div className="h-64 relative bg-gray-50">
            <DeliveryMap
              lat={order.repartidor_lat}
              lng={order.repartidor_lng}
              businessLat={order.business_lat}
              businessLng={order.business_lng}
              clienteLat={order.cliente_lat}
              clienteLng={order.cliente_lng}
              isDelivered={order.estado === 'entregado'}
            />
            <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
              <div className="px-3 py-1 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-sm flex items-center gap-2">
                <div className={`size-2 rounded-full ${order.estado === 'entregado' ? 'bg-gray-400' : 'bg-[#4ADE80] animate-ping'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#111814]">
                  {order.estado === 'entregado' ? 'Entrega Finalizada' : 'Seguimiento en Vivo'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50" data-testid="order-timeline">
        <div className="bg-[#4ADE80] text-[#111814] p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block size-2 rounded-full bg-white animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Estado Actual</p>
              </div>
              <p className="font-black text-3xl tracking-tighter">#{order.numero_secuencial ? String(order.numero_secuencial).padStart(8, '0') : order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onRefresh} className="size-12 rounded-2xl bg-[#111814]/10 text-[#111814] hover:bg-[#111814]/20 active:scale-90 transition-all">
              <RefreshCw className="w-6 h-6" />
            </Button>
          </div>
          {order.mesa_numero && <p className="mt-4 px-3 py-1 bg-[#111814] text-white inline-block rounded-lg text-[10px] font-black uppercase tracking-widest">Mesa {order.mesa_numero}</p>}
        </div>

        <div className="p-10 space-y-8 bg-white">
          {stepData.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const StepIcon = step.Icon;
            return (
              <div key={idx} className="flex gap-6 relative">
                <div className="flex flex-col items-center z-10">
                  <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-[#4ADE80] text-[#111814] shadow-lg shadow-[#4ADE80]/20' : 'bg-gray-100 text-gray-300'} ${isCurrent ? 'ring-8 ring-[#22C55E]/10 scale-110' : ''}`}>
                    <StepIcon className="w-7 h-7" />
                  </div>
                  {idx < steps.length - 1 && <div className={`w-1 h-12 my-1 transition-all duration-500 ${isCompleted ? 'bg-[#4ADE80]' : 'bg-gray-100'}`} />}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`text-lg font-black tracking-tight ${isCompleted ? 'text-[#111814]' : 'text-gray-300'}`}>{step.label}</p>
                  <p className={`text-sm font-medium ${isCompleted ? 'text-[#618972]' : 'text-gray-200'}`}>{step.desc}</p>
                  {isCurrent && <span className="inline-flex mt-2 px-2 py-0.5 bg-[#4ADE80]/10 text-[#22C55E] text-[8px] font-black uppercase tracking-widest rounded-md border border-[#4ADE80]/20">En Progreso</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-50 bg-gray-50/50 p-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#111814] mb-6 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#22C55E]" /> Resumen del pedido
          </h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-bold text-[#111814]">{item.nombre}</span>
                  <span className="text-[10px] font-black text-[#618972] uppercase tracking-[0.1em]">{item.cantidad} unidades</span>
                  {item.modificadores && item.modificadores.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.modificadores.map((mod, modIdx) => (
                        <span key={modIdx} className="text-[9px] font-bold text-[#22C55E]/80 bg-[#22C55E]/5 px-2 py-0.5 rounded-full border border-[#22C55E]/10">
                          {typeof mod === 'string' ? mod : `(${mod.cantidad || 1}) ${mod.nombre}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-black text-[#111814]">{formatCurrency(item.cantidad * (item.precio_unitario || item.precio || 0))}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between items-center">
            <span className="font-black text-lg text-[#111814] tracking-tighter">Total pagado</span>
            <span className="text-3xl font-black text-[#22C55E] tracking-tighter">{formatCurrency(order.total)}</span>
          </div>

          {order.estado === 'entregado' && (
            <div className="mt-8 flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-red-100 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                onClick={() => onHide(order.id)}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar de mis pedidos recientes
              </Button>
              <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">
                Esta acción solo ocultará el pedido de tu vista personal.
              </p>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onReset}
        className="w-full h-14 rounded-2xl text-[#618972] font-black uppercase text-[10px] tracking-widest hover:bg-[#4ADE80] hover:text-[#111814] transition-colors"
      >
        Buscar otro pedido
      </Button>
    </div>
  );
}

function DeliveryMap({ lat, lng, businessLat, businessLng, clienteLat, clienteLng, isDelivered }) {
  const isLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (isLoaded && !map && document.getElementById('map-container')) {
      const initialLat = lat || businessLat || clienteLat || 4.6097;
      const initialLng = lng || businessLng || clienteLng || -74.0817;

      const mapInstance = new window.google.maps.Map(document.getElementById('map-container'), {
        center: { lat: initialLat, lng: initialLng },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: false,
        styles: [
          { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#111814" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] },
          { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] }
        ]
      });
      setMap(mapInstance);
    }
  }, [isLoaded, map]);

  useEffect(() => {
    if (!map) return;

    // 1. Limpiar marcadores anteriores para evitar fugas de memoria y duplicados
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    // Marcador: Restaurante (Negocio)
    if (businessLat && businessLng) {
      const bizMarker = new window.google.maps.Marker({
        position: { lat: Number(businessLat), lng: Number(businessLng) },
        map: map,
        title: "Restaurante",
        label: { text: "🏪", fontSize: "16px" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#111814",
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: "#FFFFFF",
          scale: 12
        }
      });
      markersRef.current.push(bizMarker);
      bounds.extend({ lat: Number(businessLat), lng: Number(businessLng) });
      hasPoints = true;
    }

    // Marcador: Cliente (Destino)
    if (clienteLat && clienteLng) {
      const clientMarker = new window.google.maps.Marker({
        position: { lat: Number(clienteLat), lng: Number(clienteLng) },
        map: map,
        title: "Tu ubicación",
        label: { text: "🏠", fontSize: "16px", fontWeight: "bold" },
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: "#22C55E",
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: "#FFFFFF",
          scale: 8
        }
      });
      markersRef.current.push(clientMarker);
      bounds.extend({ lat: Number(clienteLat), lng: Number(clienteLng) });
      hasPoints = true;
    }

    // Marcador: Repartidor (Movimiento)
    if (lat && lng) {
      const courierMarker = new window.google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: map,
        title: "Repartidor en camino",
        optimized: false, // For smoother animation
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/motorcycling.png",
          scaledSize: new window.google.maps.Size(50, 50),
          anchor: new window.google.maps.Point(25, 25)
        }
      });
      markersRef.current.push(courierMarker);
      bounds.extend({ lat: Number(lat), lng: Number(lng) });
      hasPoints = true;
    }

    // Centrar mapa si hay puntos y el pedido no ha terminado
    if (hasPoints && !isDelivered) {
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setCenter(bounds.getNorthEast());
        map.setZoom(16);
      } else {
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        // Ajuste fino para evitar zoom extremo
        const listener = window.google.maps.event.addListener(map, 'idle', function () {
          if (map.getZoom() > 17) map.setZoom(17);
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, lat, lng, businessLat, businessLng, clienteLat, clienteLng, isDelivered]);

  if (!isLoaded) return <div className="p-4 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#22C55E]" /></div>;

  return <div id="map-container" className="w-full h-full z-0 overflow-hidden rounded-[2.5rem]" />;
}
