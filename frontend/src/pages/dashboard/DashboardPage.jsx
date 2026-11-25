import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TableProperties,
  AlertCircle,
  ChefHat,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  Users,
  MessageCircle,
  UserPlus,
  Gift,
  Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';


const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pendiente: { label: 'Pendiente', class: 'status-pendiente' },
    aceptado: { label: 'Aceptado', class: 'status-aceptado' },
    preparando: { label: 'Preparando', class: 'status-preparando' },
    listo: { label: 'Listo', class: 'status-listo' },
    enviado: { label: 'Enviado', class: 'status-enviado' },
    entregado: { label: 'Entregado', class: 'status-entregado' },
    cancelado: { label: 'Cancelado', class: 'status-cancelado' },
  };

  const config = statusConfig[status] || statusConfig.pendiente;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
      {config.label}
    </span>
  );
};

export default function DashboardPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [vipClientes, setVipClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const handlePurchaseSupportPack = async (amount) => {
    try {
      setIsCreatingLink(true);
      const response = await api().post('/payments/create-support-pack-link', { amount });
      if (response.data.init_point) {
        window.location.href = response.data.init_point;
      } else {
        toast.error("No se pudo generar el link de pago");
      }
    } catch (error) {
      console.error("Error creating support pack payment:", error);
      toast.error("Error al procesar la compra");
    } finally {
      setIsCreatingLink(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [analyticsRes, ordersRes, vipRes] = await Promise.all([
          api().get(`/business/${slug}/analytics`),
          api().get(`/orders/${slug}?limit=5`),
          api().get(`/loyalty/${slug}/customers?limit=4`)
        ]);
        if (isMounted) {
          setAnalytics(analyticsRes.data);
          setRecentOrders(ordersRes.data);
          
          // Map VIP Clients
          const mappedVips = (Array.isArray(vipRes.data) ? vipRes.data : []).map(c => {
            const pts = Number(c.puntos_totales ?? c.puntos ?? c.points ?? 0);
            let level = 'Bronce';
            if (pts > 1000) level = 'Oro';
            else if (pts > 300) level = 'Plata';
            
            return {
              nombre: c.nombre || c.name || 'Sin Nombre',
              telefono: c.telefono || c.phone || '',
              nivel: level,
              puntos: `${pts.toLocaleString()} pts`,
              img: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre || c.name || 'C')}&background=C86414&color=fff`
            };
          });
          setVipClientes(mappedVips);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (isMounted) toast.error('Error al cargar datos del dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [slug, api]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value));
  };

  const chartData = analytics?.ultimos_7_dias?.slice().reverse().map(day => ({
    fecha: new Date(day.fecha).toLocaleDateString('es-CO', { weekday: 'short' }),
    ventas: day.total_ventas,
    pedidos: day.total_pedidos
  })) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]" />
        </div>
      </DashboardLayout>
    );
  }

  const segmentationData = [
    { name: 'ALTA PARTICIPACIÓN', value: 45, color: '#22C55E' },
    { name: 'PARTICIPACIÓN MEDIA', value: 25, color: '#3B82F6' },
    { name: 'CLIENTES NUEVOS', value: 20, color: '#EAB308' },
    { name: 'SIN ACTIVIDAD', value: 10, color: '#EF4444' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="dashboard-container">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest mt-1">Resumen Histórico de Operaciones</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ventas Totales"
            value={formatCurrency(analytics?.ventas_total || 0)}
            icon={DollarSign}
            color="bg-[#4ADE80]"
            subtitle="Ventas acumuladas"
          />
          <StatCard
            title="Pedidos Totales"
            value={analytics?.pedidos_total || 0}
            icon={ShoppingBag}
            color="bg-blue-500"
            subtitle="Órdenes procesadas"
          />
          <StatCard
            title="Domicilios Totales"
            value={analytics?.domicilios_total || 0}
            icon={Truck}
            color="bg-cyan-500"
            subtitle="Entrega a domicilio total"
          />
          <StatCard
            title="Mesas"
            value={`${analytics?.mesas_ocupadas || 0}/${analytics?.mesas_totales || 0}`}
            icon={TableProperties}
            color="bg-purple-500"
            subtitle="Ocupación actual"
          />
          <StatCard
            title="Clientes Totales"
            value={analytics?.clientes_total || 0}
            icon={UserPlus}
            color="bg-indigo-500"
            subtitle="Total base de datos"
          />
          <StatCard
            title="Puntos Fidelidad"
            value={(analytics?.puntos_total || 0).toLocaleString()}
            icon={Gift}
            color="bg-rose-500"
            subtitle="Puntos otorgados total"
          />
          <StatCard
            title="Mensajes"
            value={(analytics?.mensajes_total || 0).toLocaleString()}
            icon={MessageCircle}
            color="bg-emerald-500"
            subtitle="Total campaña/soporte"
          />
          <StatCard
            title="Ticket Promedio"
            value={formatCurrency(analytics?.ticket_promedio_total || 0)}
            icon={TrendingUp}
            color="bg-amber-500"
            subtitle="Promedio histórico"
          />
        </div>

        {/* SECTION: TOP CLIENTES VIP */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Top Clientes VIP</h2>
            <Link to={`/dashboard/${slug}/clientes`} className="text-[10px] font-black text-[#22C55E] uppercase tracking-widest hover:underline whitespace-nowrap">
              Ver Todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vipClientes.length > 0 ? (
              vipClientes.map((cliente, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 overflow-hidden border border-gray-100 shrink-0">
                      <img src={cliente.img} alt={cliente.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{cliente.nombre}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        <span className={cliente.nivel === 'Oro' ? 'text-amber-500' : 'text-blue-400'}>{cliente.nivel}</span> • {cliente.puntos}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                        toast.success(`Abriendo chat con ${cliente.nombre}`);
                        window.open(`https://wa.me/${cliente.telefono.replace(/\s+/g, '')}`, '_blank');
                    }}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#4ADE80]/10 hover:text-[#22C55E] transition-all shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                <Users className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay clientes VIP aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                Ventas últimos 7 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Ventas']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#22C55E]" />
                <span className="text-sm font-black uppercase tracking-widest text-gray-900">Últimos pedidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay pedidos aún</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-xs text-gray-900">
                          {order.mesa_numero ? `Mesa ${order.mesa_numero}` : order.cliente_nombre || 'Para Recoger'}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {order.items?.length} items · {formatCurrency(order.total)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.estado} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SECTION: SEGMENTACIÓN Y WHATSAPP HUB */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">

          {/* Análisis de Participación */}
          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Análisis de Participación</CardTitle>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">
                Distribución de clientes según su actividad y acumulación de puntos.
              </p>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex flex-col">
              <div className="flex flex-col sm:flex-row items-center gap-10">
                <div className="relative w-48 h-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={segmentationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {segmentationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Retención</p>
                    <p className="text-sm font-black text-[#22C55E] uppercase tracking-tighter">Óptima</p>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {segmentationData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart Section below */}
              <div className="w-full mt-8 space-y-4 border-t border-gray-100 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                  {segmentationData.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.name}</span>
                        <span className="text-[10px] font-black text-gray-900">{item.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor: item.color,
                            boxShadow: `0 0 12px ${item.color}40`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Hub */}
          <Card className="rounded-[2rem] border-none shadow-2xl bg-[#4ADE80] overflow-hidden text-[#111814] group">
            <CardContent className="p-8 flex flex-col h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest whitespace-nowrap">WhatsApp Hub</CardTitle>
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-white/60">
                      <div className="w-1 h-1 rounded-full bg-white opacity-40" />
                      SINCRONIZACIÓN ACTIVA
                    </div>
                  </div>
                </div>
                <AlertCircle className="w-4 h-4 text-white/40" />
              </div>

              <div className="space-y-4 py-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-4xl font-black leading-none tracking-tight">
                    {`${user?.whatsapp_usados || 0}/${user?.whatsapp_incluidos || 0}`}
                  </h3>
                  <Badge className="bg-white/20 text-white text-[7px] md:text-[8px] font-black tracking-widest border-white border-2 px-2 py-0.5 shrink-0 mt-1 uppercase">
                    PLAN {user?.plan?.toUpperCase() || 'GRATUITO'}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest px-1 whitespace-nowrap mt-1">
                  Mensajes Venta/Soporte
                </p>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-1000"
                    style={{ width: `${user?.whatsapp_incluidos > 0 ? Math.min(100, ((user?.whatsapp_usados || 0) / user.whatsapp_incluidos) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-white/80 italic text-center">
                  ✨ Has usado el {user?.whatsapp_incluidos > 0 ? (((user?.whatsapp_usados || 0) / user.whatsapp_incluidos) * 100).toFixed(1) : '0.0'}% de tu cupo incluido.
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-wider">Reporte Programado</p>
                    <p className="text-[8px] font-bold text-white/60">Próximo reset: 01/3/2026</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={() => setIsSupportModalOpen(true)}
                  className="bg-white text-[#22C55E] border-2 border-transparent hover:bg-transparent hover:text-white hover:border-white font-black text-[8px] uppercase h-12 rounded-xl tracking-widest shadow-xl shadow-green-900/10 transition-all px-1"
                >
                  Comprar Mensajes
                </Button>
                <Button
                  onClick={() => navigate('/precios')}
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#22C55E] font-black text-[8px] uppercase h-12 rounded-xl tracking-widest transition-all px-1"
                >
                  Mejorar Plan
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Alerts */}
        {analytics?.productos_agotados > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Productos agotados</p>
              <p className="text-sm text-amber-600">
                Tienes {analytics.productos_agotados} producto(s) marcados como no disponibles.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col" aria-describedby="support-modal-description">
          <div className="bg-[#4ADE80] p-6 text-[#111814] relative shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageSquare className="w-16 h-16" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Packs de Venta/Soporte</DialogTitle>
              <DialogDescription id="support-modal-description" className="text-white/80 font-bold text-[10px] uppercase tracking-widest mt-1">
                Recarga interacciones para tu servicio
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-3 bg-[#FAFAF9] overflow-y-auto">
            {[
              { amount: 1500, price: "$45.000", desc: "Plan Estándar - Ideal mensual" },
              { amount: 4500, price: "$130.500", desc: "Plan Ultra - Frecuentes", popular: true },
              { amount: 9000, price: "$252.000", desc: "Plan Extremo - Alto volumen" }
            ].map((pack) => (
              <button
                key={pack.amount}
                onClick={() => handlePurchaseSupportPack(pack.amount)}
                disabled={isCreatingLink}
                className={`w-full p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left group
                              ${pack.popular ? 'bg-white border-[#22C55E] shadow-lg shadow-green-100' : 'bg-white border-gray-100 hover:border-gray-200'}
                              ${isCreatingLink ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 text-base">{pack.amount.toLocaleString('es-CO')}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">MSJS</span>
                    {pack.popular && <Badge className="bg-[#4ADE80] text-[#111814] text-[6px] font-black px-1.5 border-none h-4">TOP</Badge>}
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none">{pack.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#22C55E] text-lg leading-none">{pack.price}</p>
                  <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">COP</p>
                </div>
              </button>
            ))}
          </div>

          <div className="px-6 pb-6 bg-[#FAFAF9] shrink-0">
            <p className="text-[8px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed">
              🔒 Pago seguro vía MercadoPago. <br />
              Mensajes inmediatos en tu cuenta.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
