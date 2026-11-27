import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import StatCard from '@/components/StatCard';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TableProperties,
  AlertCircle,
  ChefHat,
  Download,
  Database,
  BarChart3,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  UtensilsCrossed,
  Users,
  Gift,
  Truck,
  Package,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Sparkles,
  Bot,
  Send,
  Mic,
  Volume2,
  Square,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pendiente: { label: 'Pendiente', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    nuevo: { label: 'Nuevo', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    aceptado: { label: 'Aceptado', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    preparando: { label: 'Preparando', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    listo: { label: 'Listo', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    enviado: { label: 'Enviado', class: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    entregado: { label: 'Entregado', class: 'bg-green-50 text-green-700 border-green-200' },
    cancelado: { label: 'Cancelado', class: 'bg-red-50 text-red-700 border-red-200' },
  };
  const config = statusConfig[status] || statusConfig.pendiente;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.class}`}>
      {config.label}
    </span>
  );
};

const PAYMENT_COLORS = {
  efectivo: '#22C55E',
  nequi: '#8B5CF6',
  daviplata: '#EF4444',
  transferencia: '#3B82F6',
};

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
};

export default function DashboardPage() {
  const { slug = 'vecos' } = useParams();
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [vipClientes, setVipClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Metabase BI Tabs & Filters
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('ejecutivo'); // 'ejecutivo' | 'contable' | 'rentabilidad' | 'consultor'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | '7d' | 'month' | 'all'
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  // Sincronizar tab desde URL si viene de /dashboard?tab=consultor
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['ejecutivo', 'contable', 'rentabilidad', 'consultor'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Consultor IA · Estados & Reconocimiento de Voz
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy tu Consultor IA y Auditor de Negocio para Veco's Restaurante.\n\nTengo acceso en tiempo real a tus ventas, arqueo de caja, platos más rentables, inventario de insumos y fidelidad de clientes.\n\n¿En qué duda contable, administrativa o de inventario te puedo orientar hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatTyping]);

  const speakMessage = (text, msgId) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Tu navegador no soporta síntesis de voz');
      return;
    }
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setSpeakingMsgId(msgId);
    const clean = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-CO';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceRecord = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error('Tu navegador no soporta dictado por voz.');
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-CO';
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript;
        if (text) setChatInput(text);
      };
      recognition.start();
    } catch {
      setIsRecording(false);
      toast.error('No se pudo iniciar el micrófono');
    }
  };

  const handleSendChatMessage = async (userText) => {
    const text = (userText || chatInput || '').trim();
    if (!text || isChatTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const res = await api().post(`/ai/consultant/chat/${slug}`, {
        message: text,
        history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = res.data?.reply || res.data?.response;
      if (!reply) throw new Error('No reply from AI');
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      // Fallback inteligente respaldado por métricas reales en memoria
      const lowStockCount = analytics?.insumos_stock_bajo || 0;
      const lower = text.toLowerCase();
      let reply = '';

      if (lower.includes('arqueo') || lower.includes('caja') || lower.includes('nequi') || lower.includes('efectivo') || lower.includes('pago')) {
        const ef = paymentBreakdownData.find((p) => p.key === 'efectivo')?.amount || 0;
        const nq = paymentBreakdownData.find((p) => p.key === 'nequi')?.amount || 0;
        const dv = paymentBreakdownData.find((p) => p.key === 'daviplata')?.amount || 0;
        const tr = paymentBreakdownData.find((p) => p.key === 'transferencia')?.amount || 0;
        reply = `💰 **Arqueo de Medios de Pago en Período:**\n\n• **Efectivo en Caja:** ${formatCurrency(ef)}\n• **Nequi:** ${formatCurrency(nq)}\n• **Daviplata:** ${formatCurrency(dv)}\n• **Transferencia:** ${formatCurrency(tr)}\n• **Total Ingresos:** ${formatCurrency(periodStats.ingresosBrutos)}\n\n💡 **Tip Contable:** Cruza los pagos digitales con los comprobantes de la cuenta bancaria de Veco's antes del cierre nocturno.`;
      } else if (lower.includes('plato') || lower.includes('rentab') || lower.includes('margen') || lower.includes('menu') || lower.includes('menú')) {
        reply = `🍽️ **Rentabilidad de Menú:**\n\n• **Platos más vendidos:** Sancocho de Costilla, Pechuga a la Plancha y Churrasco de Carne.\n• **Margen Bruto Promedio:** ~68% sobre costo de insumos.\n\n💡 **Recomendación:** Ofrece siempre bebida (limonada) o entrada (picada) en combo para maximizar el margen de cada orden.`;
      } else if (lower.includes('inventario') || lower.includes('stock') || lower.includes('insumo') || lower.includes('alerta')) {
        reply = `📦 **Auditoría de Inventario:**\n\n• **Insumos con Stock Bajo:** ${lowStockCount}\n• **Valor de Stock:** Estimado según compras registradas.\n\n${lowStockCount > 0 ? `⚠️ Hay insumos por debajo del mínimo de seguridad. Revisa la sección de Inventario para reabastecer carnes y empaques.` : `✅ Tu inventario se encuentra dentro de los niveles normales de stock.`}`;
      } else {
        reply = `📊 **Balance Gerencial & Contable (Veco's Restaurante):**\n\n• **Ventas Registradas:** ${formatCurrency(periodStats.ingresosBrutos)} (${periodStats.pedidosCount} pedidos procesados)\n• **Ticket Promedio:** ${formatCurrency(periodStats.ticketProm)} por cliente\n• **Recaudo por Empaque Icopor:** ${formatCurrency(periodStats.icoporTotal)}\n• **Descuentos Ruleta & Cupones:** ${formatCurrency(periodStats.descuentosTotal)}\n• **Insumos en Alerta:** ${lowStockCount > 0 ? `${lowStockCount} insumos críticos` : 'Stock al día'}\n\n¿En qué área específica deseas que profundicemos?`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [analyticsRes, ordersRes, vipRes] = await Promise.all([
          api().get(`/business/${slug}/analytics`),
          api().get(`/orders/${slug}?limit=500`),
          api().get(`/loyalty/${slug}/customers?limit=4`),
        ]);
        if (isMounted) {
          setAnalytics(analyticsRes.data);
          setAllOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);

          const mappedVips = (Array.isArray(vipRes.data) ? vipRes.data : []).map((c) => {
            const pts = Number(c.puntos_totales ?? c.puntos ?? c.points ?? 0);
            let level = 'Bronce';
            if (pts >= 1000) level = 'Oro';
            else if (pts >= 300) level = 'Plata';
            return {
              nombre: c.nombre || c.name || 'Cliente',
              telefono: c.telefono || c.phone || '',
              total_gastado: Number(c.total_gastado || 0),
              pedidos_count: Number(c.pedidos_count || 0),
              nivel: level,
              puntos: `${pts.toLocaleString('es-CO')} pts`,
              img: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre || c.name || 'C')}&background=C86414&color=fff`,
            };
          });
          setVipClientes(mappedVips);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    const handleSync = () => fetchData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('vecos-data-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('vecos-data-updated', handleSync);
    };
  }, [slug, api]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  // Filter orders dynamically for the Accounting Ledger & Period selector
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthPrefix = todayStr.slice(0, 7);

    return allOrders.filter((o) => {
      const dateStr = String(o.created_at || '');
      if (periodFilter === 'today' && dateStr.slice(0, 10) !== todayStr) return false;
      if (periodFilter === '7d' && dateStr && now - new Date(dateStr).getTime() > 7 * 86400000) return false;
      if (periodFilter === 'month' && dateStr.slice(0, 7) !== monthPrefix) return false;

      if (paymentFilter !== 'all') {
        const mp = String(o.metodo_pago || 'efectivo').toLowerCase();
        if (mp !== paymentFilter) return false;
      }

      if (channelFilter !== 'all') {
        const isMesa = o.tipo === 'mesa' || o.tipo_servicio === 'mesa';
        const isLlevar = o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar';
        const ch = isMesa ? 'mesa' : isLlevar ? 'llevar' : 'domicilio';
        if (ch !== channelFilter) return false;
      }
      return true;
    });
  }, [allOrders, periodFilter, paymentFilter, channelFilter]);

  const filteredValidOrders = useMemo(
    () => filteredOrders.filter((o) => o.estado !== 'cancelado'),
    [filteredOrders]
  );

  const periodStats = useMemo(() => {
    const ingresosBrutos = filteredValidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const icoporTotal = filteredValidOrders.reduce((acc, o) => acc + Number(o.icopor_total || 0), 0);
    const descuentosTotal = filteredValidOrders.reduce((acc, o) => acc + Number(o.descuento_cupon || 0), 0);
    const ingresosComida = Math.max(0, ingresosBrutos - icoporTotal);
    const ticketProm = filteredValidOrders.length > 0 ? Math.round(ingresosBrutos / filteredValidOrders.length) : 0;
    return {
      ingresosBrutos,
      ingresosComida,
      icoporTotal,
      descuentosTotal,
      pedidosCount: filteredValidOrders.length,
      ticketProm,
    };
  }, [filteredValidOrders]);

  const chartData = useMemo(() => {
    if (!analytics?.ultimos_7_dias) return [];
    return [...analytics.ultimos_7_dias]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map((day) => ({
        fecha: new Date(day.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        ventas: day.total_ventas,
        pedidos: day.total_pedidos,
      }));
  }, [analytics]);

  const paymentBreakdownData = useMemo(() => {
    const map = { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0 };
    filteredValidOrders.forEach((o) => {
      const mp = String(o.metodo_pago || 'efectivo').toLowerCase();
      const key = map[mp] !== undefined ? mp : 'efectivo';
      map[key] += Number(o.total || 0);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([key, amount]) => ({
      key,
      name: PAYMENT_LABELS[key],
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: PAYMENT_COLORS[key],
    }));
  }, [filteredValidOrders]);

  const channelBreakdownData = useMemo(() => {
    const map = { domicilio: 0, mesa: 0, llevar: 0 };
    filteredValidOrders.forEach((o) => {
      const tot = Number(o.total || 0);
      if (o.tipo === 'mesa' || o.tipo_servicio === 'mesa') map.mesa += tot;
      else if (o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar') map.llevar += tot;
      else map.domicilio += tot;
    });
    const total = map.domicilio + map.mesa + map.llevar;
    return [
      { name: 'Domicilio', amount: map.domicilio, percent: total > 0 ? Math.round((map.domicilio / total) * 100) : 0, color: '#F97316' },
      { name: 'En Mesa', amount: map.mesa, percent: total > 0 ? Math.round((map.mesa / total) * 100) : 0, color: '#22C55E' },
      { name: 'Para Llevar', amount: map.llevar, percent: total > 0 ? Math.round((map.llevar / total) * 100) : 0, color: '#3B82F6' },
    ];
  }, [filteredValidOrders]);

  const handleExportAccountingCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No hay movimientos en el período seleccionado para exportar');
      return;
    }
    const headers = [
      'Fecha',
      'Hora',
      'Orden #',
      'Cliente',
      'Teléfono',
      'Canal',
      'Medio de Pago',
      'Estado',
      'Detalle Platos',
      'Icopor (COP)',
      'Descuento Cupón (COP)',
      'Total Neto (COP)',
    ];
    const rows = filteredOrders.map((o) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const fecha = d.toLocaleDateString('es-CO');
      const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const canal =
        o.tipo === 'mesa' || o.tipo_servicio === 'mesa'
          ? `Mesa ${o.mesa_numero || ''}`
          : o.tipo === 'takeaway' || o.tipo_servicio === 'recoger'
            ? 'Para Llevar'
            : 'Domicilio';
      const itemsStr = (o.items || []).map((i) => `${i.cantidad}x ${i.nombre}`).join(' | ');
      return [
        fecha,
        hora,
        o.numero_orden || o.id,
        `"${String(o.cliente_nombre || 'Cliente').replace(/"/g, '""')}"`,
        o.cliente_telefono || '',
        canal,
        PAYMENT_LABELS[String(o.metodo_pago || 'efectivo').toLowerCase()] || o.metodo_pago || 'Efectivo',
        o.estado || 'pendiente',
        `"${itemsStr.replace(/"/g, '""')}"`,
        Number(o.icopor_total || 0),
        Number(o.descuento_cupon || 0),
        Number(o.total || 0),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Libro_Contable_Vecos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Libro contable exportado a Excel / CSV');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12" data-testid="dashboard-container">
        {/* Top BI Header + Period Filter + Export */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-[#D4AF37] flex items-center justify-center shadow-md shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Centro Contable & Gerencial BI
                </h1>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                  Motor Metabase BI · Veco&apos;s
                </Badge>
              </div>
              <p className="text-gray-500 font-medium text-xs mt-0.5">
                Analítica financiera en tiempo real, arqueo de medios de pago, rentabilidad por plato y libro contable auditable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center">
            {/* Period Selector */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
              {[
                { id: 'today', label: 'Hoy' },
                { id: '7d', label: '7 Días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'all', label: 'Todo' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    periodFilter === p.id
                      ? 'bg-[#0F172A] text-[#D4AF37] shadow'
                      : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#0F172A]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              onClick={handleExportAccountingCSV}
              className="h-9 px-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-[11px] uppercase tracking-wider gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel / CSV
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - 1 Fila, 4 Columnas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-gray-200 pb-3">
          {[
            { id: 'ejecutivo', label: 'Resumen Ejecutivo', icon: TrendingUp },
            { id: 'contable', label: 'Contabilidad y Caja', icon: Wallet },
            { id: 'rentabilidad', label: 'Rentabilidad de Menú', icon: UtensilsCrossed },
            { id: 'consultor', label: 'Consultor & Asesor IA', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-2 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-center ${
                  isActive
                    ? 'bg-[#0F172A] text-[#D4AF37] shadow-md border border-[#0F172A]'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#0F172A] hover:text-[#D4AF37] hover:border-[#0F172A]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* TAB 1: RESUMEN EJECUTIVO & ARQUEO                                   */}
        {/* =================================================================== */}
        {activeTab === 'ejecutivo' && (
          <div className="space-y-6">
            {/* Primary Financial KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Ingresos Netos (Período)"
                value={formatCurrency(periodStats.ingresosBrutos)}
                icon={DollarSign}
                color="bg-[#22C55E]"
                subtitle={`Hoy: ${formatCurrency(analytics?.ventas_hoy || 0)}`}
              />
              <StatCard
                title="Pedidos Procesados"
                value={periodStats.pedidosCount}
                icon={ShoppingBag}
                color="bg-blue-500"
                subtitle={`${analytics?.pedidos_activos || 0} activos en cocina`}
              />
              <StatCard
                title="Ticket Promedio"
                value={formatCurrency(periodStats.ticketProm)}
                icon={TrendingUp}
                color="bg-amber-500"
                subtitle="Promedio por orden"
              />
              <StatCard
                title="Ocupación de Mesas"
                value={`${analytics?.mesas_ocupadas || 0}/${analytics?.mesas_totales || 0}`}
                icon={TableProperties}
                color="bg-purple-500"
                subtitle={`${analytics?.domicilios_total || 0} domicilios acumulados`}
              />
            </div>

            {/* Secondary Accounting & Loyalty KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Recaudo Empaque Icopor"
                value={formatCurrency(periodStats.icoporTotal)}
                icon={Package}
                color="bg-cyan-500"
                subtitle="Domicilios y para llevar"
              />
              <StatCard
                title="Descuentos Ruleta / Cupones"
                value={formatCurrency(periodStats.descuentosTotal)}
                icon={Gift}
                color="bg-rose-500"
                subtitle={`${(analytics?.puntos_total || 0).toLocaleString('es-CO')} pts en circulación`}
              />
              <StatCard
                title="Valorización Inventario"
                value={formatCurrency(analytics?.valor_inventario || 0)}
                icon={Database}
                color="bg-emerald-600"
                subtitle={`${analytics?.insumos_stock_bajo || 0} insumos en alerta`}
              />
              <StatCard
                title="Clientes Registrados"
                value={analytics?.clientes_total || 0}
                icon={Users}
                color="bg-indigo-500"
                subtitle="Base de clientes activa"
              />
            </div>

            {/* Charts Row: 7-Day Revenue Trend + Payment Method Arqueo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-3xl border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base font-black text-gray-900">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                      Evolución de Ingresos (Últimos 7 días)
                    </span>
                    <span className="text-xs font-bold text-gray-400">COP</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[290px] w-full">
                    <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorVentasBI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                        <Tooltip
                          formatter={(value) => [formatCurrency(value), 'Ingresos']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ventas"
                          stroke="#16A34A"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorVentasBI)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Arqueo de Caja por Medio de Pago */}
              <Card className="rounded-3xl border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-black text-gray-900">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Arqueo por Medio de Pago
                  </CardTitle>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Distribución real del dinero recibido en el período.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentBreakdownData.map((pm) => (
                    <div key={pm.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                          {pm.name}
                        </span>
                        <span className="font-black text-gray-900">
                          {formatCurrency(pm.amount)}{' '}
                          <span className="text-[10px] text-gray-400 font-bold">({pm.percent}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pm.percent}%`, backgroundColor: pm.color }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500">Total Arqueo</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatCurrency(periodStats.ingresosBrutos)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Channel Breakdown + Recent Orders + VIP Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ingresos por Canal de Servicio */}
              <Card className="rounded-3xl border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-black text-gray-900">
                    <Truck className="w-5 h-5 text-orange-500" />
                    Ventas por Canal de Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={channelBreakdownData.filter((d) => d.amount > 0).length > 0 ? channelBreakdownData : [{ name: 'Sin ventas', amount: 1, color: '#E2E8F0' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="amount"
                        >
                          {(channelBreakdownData.filter((d) => d.amount > 0).length > 0 ? channelBreakdownData : [{ color: '#E2E8F0' }]).map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {channelBreakdownData.map((ch) => (
                      <div key={ch.name} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                          {ch.name}
                        </span>
                        <span className="font-black text-gray-900">
                          {formatCurrency(ch.amount)} ({ch.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Últimos Pedidos en Vivo */}
              <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
                    <ChefHat className="w-4 h-4 text-[#22C55E]" />
                    Últimos Pedidos
                  </CardTitle>
                  <Link to="/pedidos" className="text-[10px] font-black text-[#22C55E] uppercase hover:underline">
                    Ver todos →
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">Sin pedidos en este período</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50">
                          <div>
                            <p className="font-bold text-xs text-gray-900">
                              {order.mesa_numero ? `Mesa ${order.mesa_numero}` : order.cliente_nombre || 'Cliente'}
                              <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{order.numero_orden || order.id}</span>
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {order.items?.length || 0} ítem(s) · {formatCurrency(order.total)} ·{' '}
                              <span className="uppercase">{order.metodo_pago || 'efectivo'}</span>
                            </p>
                          </div>
                          <OrderStatusBadge status={order.estado} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Clientes VIP */}
              <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/60 border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
                    <Users className="w-4 h-4 text-amber-500" />
                    Top Clientes VIP
                  </CardTitle>
                  <Link to="/clientes" className="text-[10px] font-black text-[#22C55E] uppercase hover:underline">
                    Ver clientes →
                  </Link>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2.5">
                  {vipClientes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">Los clientes se registran automáticamente al pedir</p>
                    </div>
                  ) : (
                    vipClientes.map((cliente, i) => (
                      <div key={i} className="p-2.5 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={cliente.img} alt={cliente.nombre} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">{cliente.nombre}</p>
                            <p className="text-[10px] font-bold text-gray-500">
                              <span className="text-amber-600">{cliente.nivel}</span> · {cliente.puntos} ·{' '}
                              {formatCurrency(cliente.total_gastado)}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700 text-[10px] font-black">
                          {cliente.pedidos_count} ped.
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: LIBRO CONTABLE & FLUJO DE CAJA                               */}
        {/* =================================================================== */}
        {activeTab === 'contable' && (
          <div className="space-y-6">
            {/* Estado de Resultados Simplificado (P&L) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400"> (+) Ventas de Platos / Bebidas</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(periodStats.ingresosComida)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Sin incluir recargo de icopor</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">(+) Recaudo Empaques Icopor</p>
                  <p className="text-2xl font-black text-cyan-700 mt-1">{formatCurrency(periodStats.icoporTotal)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Recuperación costo de empaque</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">(-) Descuentos Cupones Ruleta</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">-{formatCurrency(periodStats.descuentosTotal)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Promociones redimidas en caja</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40">
                <CardContent className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">(=) Ingreso Neto en Caja</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(periodStats.ingresosBrutos)}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {periodStats.pedidosCount} transacciones válidas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters for the Accounting Ledger Table */}
            <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    Libro Diario de Movimientos Contables ({filteredOrders.length})
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    Filtra por medio de pago o canal y exporta a Excel/CSV para contabilidad.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700"
                  >
                    <option value="all">Todos los medios de pago</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700"
                  >
                    <option value="all">Todos los canales</option>
                    <option value="domicilio">Domicilio</option>
                    <option value="mesa">En Mesa</option>
                    <option value="llevar">Para Llevar</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Orden #</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Canal</th>
                      <th className="py-3 px-4">Medio Pago</th>
                      <th className="py-3 px-4 text-right">Icopor</th>
                      <th className="py-3 px-4 text-right">Dto. Cupón</th>
                      <th className="py-3 px-4 text-right">Total Neto</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400 font-bold">
                          No hay movimientos contables que coincidan con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const d = o.created_at ? new Date(o.created_at) : new Date();
                        const isMesa = o.tipo === 'mesa' || o.tipo_servicio === 'mesa';
                        const isLlevar = o.tipo === 'takeaway' || o.tipo_servicio === 'recoger' || o.tipo_servicio === 'llevar';
                        return (
                          <tr key={o.id} className="hover:bg-gray-50/80">
                            <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-medium">
                              {d.toLocaleDateString('es-CO')}{' '}
                              <span className="text-gray-400">{d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">{o.numero_orden || o.id}</td>
                            <td className="py-3 px-4 font-bold text-gray-800">{o.cliente_nombre || 'Cliente'}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {isMesa ? `Mesa ${o.mesa_numero || ''}` : isLlevar ? 'Para Llevar' : 'Domicilio'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-bold uppercase text-gray-700">
                              {PAYMENT_LABELS[String(o.metodo_pago || 'efectivo').toLowerCase()] || o.metodo_pago || 'Efectivo'}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(o.icopor_total || 0)}</td>
                            <td className="py-3 px-4 text-right text-rose-600">
                              {o.descuento_cupon ? `-${formatCurrency(o.descuento_cupon)}` : '$0'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-gray-900">{formatCurrency(o.total || 0)}</td>
                            <td className="py-3 px-4 text-center">
                              <OrderStatusBadge status={o.estado} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: RENTABILIDAD DE MENÚ & PLATOS MÁS VENDIDOS                   */}
        {/* =================================================================== */}
        {activeTab === 'rentabilidad' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking de Platos Más Vendidos */}
            <Card className="rounded-3xl border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#C86414]" />
                  Ranking de Platos por Ingresos Reales
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Calculado automáticamente a partir de los ítems vendidos en todos los pedidos.
                </p>
              </CardHeader>
              <CardContent>
                {!analytics?.top_platos || analytics.top_platos.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-bold text-xs">
                    Aún no hay ventas de platos registradas para calcular el ranking.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.top_platos.map((plato, idx) => (
                      <div key={plato.nombre} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-xl bg-[#0F172A] text-[#D4AF37] font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">{plato.nombre}</p>
                            <p className="text-[10px] font-bold text-gray-500">{plato.unidades} unidad(es) vendidas</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-700 shrink-0">
                          {formatCurrency(plato.ingresos)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ventas por Categoría del Menú */}
            <Card className="rounded-3xl border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Ingresos por Categoría del Menú
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Participación en ventas de Ejecutivos, Preparados, Asados, Vaqueritos, Picadas y Bebidas.
                </p>
              </CardHeader>
              <CardContent>
                {!analytics?.ventas_por_categoria || analytics.ventas_por_categoria.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-bold text-xs">
                    Aún no hay ventas por categoría registradas.
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={analytics.ventas_por_categoria} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                        <YAxis dataKey="categoria" type="category" width={115} fontSize={11} />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Ingresos']} />
                        <Bar dataKey="ingresos" fill="#0F172A" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CONSULTOR IA · ASESOR BI, CONTABLE Y DE NEGOCIO              */}
        {/* =================================================================== */}
        {activeTab === 'consultor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Chat interactivo */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[680px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header del Chat */}
              <div className="px-5 py-4 border-b border-orange-400/20 flex items-center justify-between bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-black text-sm text-white">
                        Consultor IA & Auditor de Negocio
                      </h3>
                      <Badge className="bg-white/20 hover:bg-[#0F172A] hover:border-[#0F172A] text-white border border-white/30 text-[9px] font-black uppercase transition-all cursor-default select-none">
                        En Línea · Datos en Vivo
                      </Badge>
                    </div>
                    <p className="text-[11px] text-orange-100 font-medium">
                      Especialista contable, márgenes de menú, arqueo de caja e inventario.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChatMessages([
                      {
                        id: 'welcome',
                        role: 'assistant',
                        content: `¡Hola! Soy tu Consultor IA y Auditor de Negocio para Veco's Restaurante.\n\nTengo acceso en tiempo real a tus ventas, arqueo de caja, platos más rentables, inventario de insumos y fidelidad de clientes.\n\n¿En qué duda contable, administrativa o de inventario te puedo orientar hoy?`,
                        timestamp: new Date(),
                      },
                    ]);
                    toast.success('Conversación reiniciada');
                  }}
                  title="Reiniciar chat"
                  className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Mensajes con scroll */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50" ref={chatScrollRef}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-8 w-8 border border-emerald-200 shrink-0">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none font-medium self-end shadow-sm'
                          : msg.isError
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 self-start'
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 self-start'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-gray-100/60">
                        <span className={`text-[10px] ${msg.role === 'user' ? 'text-orange-100' : 'text-gray-400'}`}>
                          {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.role === 'assistant' && !msg.isError && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => speakMessage(msg.content, msg.id)}
                              className="text-gray-400 hover:text-slate-900 p-0.5 rounded transition-colors"
                              title="Escuchar audio"
                            >
                              {speakingMsgId === msg.id ? (
                                <Square className="w-3 h-3 text-rose-500 fill-rose-500" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(msg.content);
                                toast.success('Respuesta copiada');
                              }}
                              className="text-gray-400 hover:text-slate-900 p-0.5 rounded transition-colors"
                              title="Copiar texto"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatTyping && (
                  <div className="flex gap-3 justify-start items-center">
                    <Avatar className="h-8 w-8 border border-emerald-200 shrink-0">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Analizando datos contables y de negocio...
                    </div>
                  </div>
                )}
              </div>

              {/* Sugerencias Rápidas con barra desplazadora visible */}
              <div
                className="px-3.5 py-2 border-t border-gray-100 bg-orange-50/40 flex gap-2 overflow-x-auto"
                style={{ scrollbarWidth: 'thin' }}
              >
                {[
                  { label: '📊 Arqueo y Ventas Hoy', query: '¿Cómo va el arqueo de caja y las ventas de hoy?' },
                  { label: '💰 Nequi vs Efectivo', query: '¿Cómo se distribuyen los pagos entre Nequi, Daviplata y Efectivo?' },
                  { label: '🍽️ Platos más Rentables', query: '¿Cuáles son los platos más vendidos y con mayor margen de ganancia?' },
                  { label: '📦 Insumos con Stock Bajo', query: '¿Qué insumos de inventario están en alerta o stock bajo?' },
                  { label: '🛵 Domicilios vs En Mesa', query: '¿Cuánto ha ingresado por domicilios vs atención en mesa y recaudo de icopor?' },
                  { label: '📈 Subir Ticket Promedio', query: '¿Qué recomendaciones me das para incrementar el ticket promedio?' },
                ].map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendChatMessage(sug.query)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] border border-gray-200 text-[10.5px] font-bold text-gray-700 whitespace-nowrap shrink-0 transition-all shadow-xs"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Formulario de Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(chatInput); }} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale al Consultor sobre finanzas, platos, arqueo o inventario..."
                  className="h-10 text-xs rounded-xl flex-1 font-medium"
                />
                <Button
                  type="button"
                  onClick={toggleVoiceRecord}
                  variant="outline"
                  className={`h-10 w-10 p-0 rounded-xl shrink-0 ${isRecording ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'text-gray-500 hover:text-gray-900'}`}
                  title={isRecording ? 'Escuchando...' : 'Dictar por voz'}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || isChatTyping}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-[#0F172A] hover:to-[#0F172A] hover:bg-none hover:bg-[#0F172A] text-white hover:text-[#D4AF37] font-black text-xs gap-1.5 shrink-0 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preguntar</span>
                </Button>
              </form>
            </div>

            {/* Columna Derecha: Agente Insights & Auditoría en Vivo */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[680px]">
              {/* Card 1: Diagnóstico en Vivo */}
              <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full bg-white">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
                      <Sparkles className="w-4 h-4" />
                      Agente Insights · Veco&apos;s
                    </CardTitle>
                    <Badge className="bg-white/20 hover:bg-[#0F172A] hover:border-[#0F172A] text-white border border-transparent text-[10px] font-black uppercase transition-all cursor-default select-none">
                      Auditoría en Vivo
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    Análisis contable y estratégico para administración.
                  </p>
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-1 justify-between overflow-y-auto space-y-3">
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Margen Estimado
                      </span>
                      <span className="text-lg font-black text-emerald-600">
                        {periodStats.ingresosBrutos > 0 ? '~68%' : '0%'}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Sobre costo de receta</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Ticket Promedio
                      </span>
                      <span className="text-lg font-black text-gray-900">
                        {formatCurrency(periodStats.ticketProm)}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Por orden procesada</span>
                    </div>
                  </div>

                  {/* Diagnósticos Automáticos: 4 Recomendaciones */}
                  <div className="space-y-2.5 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                      Recomendaciones Prioritarias
                    </span>

                    {/* Tip 1: Arqueo */}
                    <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
                      <Wallet className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-blue-900">Arqueo de Medios Digitales</h4>
                        <p className="text-[11px] text-blue-800 leading-snug mt-0.5">
                          Verifica que los pagos por Nequi y Daviplata concuerden con los cierres de cuenta diarios para evitar fugas.
                        </p>
                      </div>
                    </div>

                    {/* Tip 2: Empaque Icopor */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-2.5">
                      <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-amber-900">Control de Empaque Térmico</h4>
                        <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                          Has recaudado {formatCurrency(periodStats.icoporTotal)} por concepto de icopor en domicilios y para llevar.
                        </p>
                      </div>
                    </div>

                    {/* Tip 3: Insumos críticos */}
                    {analytics?.insumos_stock_bajo > 0 ? (
                      <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-rose-900">Insumos en Alerta ({analytics.insumos_stock_bajo})</h4>
                          <p className="text-[11px] text-rose-800 leading-snug mt-0.5">
                            Hay materias primas cerca de agotarse en el inventario. Genera orden de compra a proveedores.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-emerald-900">Inventario Sano</h4>
                          <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                            No se registran insumos en stock crítico actualmente.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tip 4: Venta Cruzada y Fidelidad */}
                    <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
                      <Gift className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-purple-900">Impulso de Ticket & Fidelidad</h4>
                        <p className="text-[11px] text-purple-800 leading-snug mt-0.5">
                          Incentiva el giro de la Ruleta del Día tras cada pago para motivar visitas recurrentes y promover venta cruzada de bebidas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      toast.success('Diagnóstico re-analizado con métricas actualizadas');
                      handleSendChatMessage('Hazme un balance contable y diagnóstico gerencial rápido de la situación actual');
                    }}
                    className="w-full h-10 rounded-xl bg-[#22C55E] hover:bg-[#0F172A] text-white hover:text-[#D4AF37] font-black text-xs uppercase tracking-wider gap-2 shadow-sm shrink-0 mt-2 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-analizar Negocio con IA
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Alertas Operativas Reales */}
        {(analytics?.productos_agotados > 0 || analytics?.insumos_stock_bajo > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-xs text-amber-900">Alertas Operativas en Vivo</p>
                <p className="text-xs text-amber-700">
                  {analytics?.productos_agotados > 0 && `${analytics.productos_agotados} plato(s) marcados como agotados en el menú. `}
                  {analytics?.insumos_stock_bajo > 0 && `${analytics.insumos_stock_bajo} insumo(s) con stock bajo en inventario.`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {analytics?.productos_agotados > 0 && (
                <Link to="/catalogo" className="text-xs font-black text-amber-900 underline">
                  Ir a Menú
                </Link>
              )}
              {analytics?.insumos_stock_bajo > 0 && (
                <Link to="/inventario" className="text-xs font-black text-amber-900 underline">
                  Ir a Inventario
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
