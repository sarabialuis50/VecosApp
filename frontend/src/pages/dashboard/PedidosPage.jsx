import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ClipboardList,
    Search,
    Filter,
    ChevronDown,
    Calendar,
    CheckCircle2,
    Clock,
    ChefHat,
    Utensils,
    Truck,
    XCircle,
    X,
    MoreHorizontal,
    Eye,
    Trash2,
    Navigation as NavigationIcon,
    ShoppingBag,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    ArrowLeft,
    Package,
    History,
    ArrowUpRight,
    Users,
    DollarSign,
    TrendingUp,
    Gift,
    MessageCircle
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { playOrderSound, notifyNewOrder, unlockAudioAndNotifications } from '@/utils/sound';

export default function PedidosPage() {
    const { slug } = useParams();
    const { api, user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [repartidores, setRepartidores] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const previousOrdersRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);
    const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
    const [loadingMonthly, setLoadingMonthly] = useState(true);

    const ORDER_LIMITS = {
        'trial': 50,
        'impulso': 150,
        'basic': 150,
        'pro': 450,
        'elite': null,
        'premium': null,
        'free': 0
    };

    const orderLimit = ORDER_LIMITS[user?.plan?.toLowerCase()] ?? 50;
    const currentOrders = monthlyAnalytics?.pedidos_mes || 0;
    const orderCounter = orderLimit === null ? `${currentOrders} / ILIMITADO` : `${currentOrders} / ${orderLimit}`;

    // Fetch Orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                if (isFirstLoadRef.current) setLoading(true);
                const res = await api().get(`/orders/${slug}?limit=100`);

                // Diff incoming orders to find new ones
                const incomingOrders = res.data || [];
                const incomingIds = new Set(incomingOrders.map(o => o.id));

                if (!isFirstLoadRef.current) {
                    const newPendingOrders = incomingOrders.filter(o =>
                        !previousOrdersRef.current.has(o.id) && o.estado === 'pendiente'
                    );

                    if (newPendingOrders.length > 0) {
                        toast.success(`¡Tienes ${newPendingOrders.length} pedido(s) nuevo(s)!`, {
                            duration: 5000,
                            position: 'top-center',
                        });
                        playOrderSound();
                        notifyNewOrder(
                            '¡Nuevo Pedido!',
                            `Tienes ${newPendingOrders.length} pedido(s) nuevo(s) por revisar.`
                        );
                    }
                }

                previousOrdersRef.current = incomingIds;
                isFirstLoadRef.current = false;

                setOrders(incomingOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
                toast.error("Error al cargar pedidos");
            } finally {
                setLoading(false);
            }
        };

        const fetchMonthlyAnalytics = async () => {
            try {
                const res = await api().get(`/business/${slug}/analytics/month`);
                setMonthlyAnalytics(res.data);
            } catch (error) {
                console.error("Error fetching monthly analytics:", error);
            } finally {
                setLoadingMonthly(false);
            }
        };

        fetchOrders();
        fetchRepartidores();
        fetchMonthlyAnalytics();
        const interval = setInterval(() => {
            fetchOrders();
            fetchMonthlyAnalytics();
        }, 30000);
        return () => clearInterval(interval);
    }, [slug, api]);

    const fetchRepartidores = async () => {
        try {
            const res = await api().get(`/employees/${slug}`);
            setRepartidores(res.data.filter(e => e.rol === 'repartidor'));
        } catch (error) {
            console.error("Error fetching repartidores:", error);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pendiente': return { label: 'PENDIENTE', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock };
            case 'aceptado': return { label: 'ACEPTADO', color: 'bg-teal-50 text-teal-600 border-teal-200', icon: CheckCircle2 };
            case 'preparando': return { label: 'PREPARANDO', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: ChefHat };
            case 'listo': return { label: 'LISTO', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2 };
            case 'enviado': return { label: 'ENVIADO', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck };
            case 'entregado': return { label: 'ENTREGADO', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Utensils };
            case 'cancelado': return { label: 'CANCELADO', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle };
            default: return { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock };
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(Number(value));
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api().put(`/orders/${slug}/${orderId}`, { estado: newStatus });
            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, estado: newStatus } : order
            ));
            toast.success(`Pedido actualizado a ${newStatus}`);
        } catch (error) {
            console.error("Error updating order:", error);
            const errorMsg = error.response?.data?.detail || "Error al actualizar estado";
            toast.error(errorMsg);
        }
    };

    const handleDeleteOrder = async () => {
        if (!selectedOrder) return;
        try {
            await api().delete(`/orders/${slug}/${selectedOrder.id}`);
            setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
            toast.success("Pedido eliminado correctamente");
            setShowDeleteModal(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Error al eliminar el pedido");
        }
    };

    const handleAssignMessenger = async (messengerId) => {
        if (!selectedOrder || !messengerId) return;
        try {
            setAssigning(true);
            await api().put(`/orders/${slug}/${selectedOrder.id}`, { repartidor_id: messengerId });
            setOrders(prev => prev.map(order =>
                order.id === selectedOrder.id ? { ...order, repartidor_id: messengerId, estado: 'enviado' } : order
            ));
            toast.success("Mensajero asignado y pedido enviado");
            setShowAssignModal(false);

            // Note: Here we could trigger a WhatsApp to the messenger automatically if needed
        } catch (error) {
            console.error("Error assigning messenger:", error);
            toast.error("Error al asignar mensajero");
        } finally {
            setAssigning(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const statusMatch = filterStatus === 'TODOS' || order.estado === filterStatus.toLowerCase();
        const cleanSearch = searchTerm.trim().replace(/^0+/, ''); // Remove leading zeros for numeric search
        const searchMatch =
            (order.cliente_nombre && order.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.numero_secuencial && order.numero_secuencial.toString().includes(cleanSearch)) ||
            (order.mesa_numero && order.mesa_numero.toString().includes(searchTerm));

        return statusMatch && searchMatch;
    });

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const isToday = (dateString) => {
        if (!dateString) return false;
        const offsetDate = new Date(new Date(dateString).getTime() - (5 * 60 * 60 * 1000));
        const todayDate = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
        return offsetDate.toDateString() === todayDate.toDateString();
    };

    const todayOrders = orders.filter(o => isToday(o.created_at));
    const totalOrdersToday = todayOrders.length;
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    return (
        <DashboardLayout>
            <div className="max-w-[98%] mx-auto space-y-8 pb-10" onClick={unlockAudioAndNotifications}>
                {/* Header with History Link */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Pedidos</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Control en tiempo real</p>
                    </div>
                </div>

                {/* Monthly Stats Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Rendimiento Mensual</h2>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">Últimos 30 días</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Ventas Mes"
                            value={formatCurrency(monthlyAnalytics?.ventas_mes || 0)}
                            icon={DollarSign}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            title="Pedidos Mes"
                            value={orderCounter}
                            icon={ShoppingBag}
                            color="bg-blue-600"
                        />
                        <StatCard
                            title="Domicilios Mes"
                            value={monthlyAnalytics?.domicilios_mes || 0}
                            icon={Truck}
                            color="bg-teal-500"
                            subtitle="Entregas a domicilio"
                        />
                        <StatCard
                            title="Mesas"
                            value={`${monthlyAnalytics?.mesas_ocupadas || 0}/${monthlyAnalytics?.mesas_totales || 0}`}
                            icon={Utensils}
                            color="bg-violet-600"
                            subtitle="Ocupación actual"
                        />
                    </div>
                </div>

                {/* Daily Status Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Estado de Pedidos Hoy</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {
                            [
                                { title: 'Totales del Día', count: totalOrdersToday, colorClasses: 'bg-indigo-50 text-indigo-600', Icon: ClipboardList },
                                { title: 'Pendientes', count: todayOrders.filter(o => o.estado === 'pendiente').length, colorClasses: 'bg-blue-50 text-blue-600', Icon: Clock },
                                { title: 'Aceptados', count: todayOrders.filter(o => o.estado === 'aceptado').length, colorClasses: 'bg-teal-50 text-teal-600', Icon: CheckCircle2 },
                                { title: 'Preparando', count: todayOrders.filter(o => o.estado === 'preparando').length, colorClasses: 'bg-yellow-50 text-yellow-600', Icon: ChefHat },
                                { title: 'Listos', count: todayOrders.filter(o => o.estado === 'listo').length, colorClasses: 'bg-green-50 text-green-600', Icon: CheckCircle2 },
                                { title: 'Enviados', count: todayOrders.filter(o => o.estado === 'enviado').length, colorClasses: 'bg-purple-50 text-purple-600', Icon: Truck },
                                { title: 'Entregados', count: todayOrders.filter(o => o.estado === 'entregado').length, colorClasses: 'bg-slate-100 text-slate-600', Icon: Utensils },
                                { title: 'Cancelados', count: todayOrders.filter(o => o.estado === 'cancelado').length, colorClasses: 'bg-red-50 text-red-600', Icon: XCircle }
                            ].map((stat, idx) => (
                                <Card key={idx} className="p-3 sm:p-4 md:p-5 border-2 border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-0">
                                    <div className={`size-10 sm:size-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.colorClasses.split(' ')[0]} mb-1 sm:mb-0`}>
                                        <stat.Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.colorClasses.split(' ')[1]}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-none mb-1.5">{stat.count}</h3>
                                        <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest leading-tight break-words px-1 min-h-[1.2em]">{stat.title}</p>
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                </div>

                {/* Main Content */}
                <Card className="border-2 border-gray-100 shadow-xl shadow-gray-100/50 rounded-[2rem] overflow-hidden bg-white">
                    {/* Controls */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por cliente, ID o mesa..."
                                className="pl-11 h-12 rounded-2xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-medium text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-row gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full h-12 px-3 sm:px-4 rounded-2xl border-2 font-black text-[9px] md:text-[10px] tracking-widest gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 transition-all border-gray-100 md:min-w-[180px] justify-between group">
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 uppercase overflow-hidden">
                                                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                                                <span className="truncate">Filtrar: {filterStatus}</span>
                                            </div>
                                            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 shrink-0 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-2 min-w-[200px] animate-in slide-in-from-top-2 duration-200">
                                        <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Estado del Pedido</p>
                                        {['TODOS', 'PENDIENTE', 'ACEPTADO', 'PREPARANDO', 'LISTO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].map((status) => (
                                            <DropdownMenuItem
                                                key={status}
                                                onClick={() => {
                                                    setFilterStatus(status);
                                                    setCurrentPage(1);
                                                }}
                                                className={`rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer mb-1 last:mb-0 transition-colors ${filterStatus === status ? 'bg-[#4ADE80]/10 text-[#22C55E]' : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {status}
                                                {filterStatus === status && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex-1 md:flex-none overflow-hidden">
                                <Link
                                    to={`/dashboard/${slug}/pedidos/historial`}
                                    className="w-full h-12 px-3 sm:px-4 rounded-2xl border-2 border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-between gap-1.5 sm:gap-2 transition-all shadow-sm group md:min-w-[180px]"
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 uppercase overflow-hidden">
                                        <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 group-hover:rotate-12 transition-transform shrink-0" />
                                        <span className="text-[9px] md:text-[10px] font-black tracking-widest truncate">Ver Historial</span>
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Cliente / Método</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Items</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Fecha/Hora</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">ID Pedido</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Total</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Estado</th>
                                    <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm">
                                            Cargando pedidos...
                                        </td>
                                    </tr>
                                ) : paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm">
                                            No se encontraron pedidos.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.estado);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-3 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {order.mesa_numero ? `Mesa ${order.mesa_numero}` : (order.tipo === 'delivery' || order.tipo_pedido === 'delivery' ? 'Domicilio' : 'Para Recoger')}
                                                        </span>
                                                        {order.cliente_nombre && (
                                                            <span className="text-[10px] font-medium text-gray-500">
                                                                {order.cliente_nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="text-xs text-gray-600 max-w-[200px] truncate">
                                                        {order.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {format(new Date(order.created_at), 'HH:mm', { locale: es })}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase">
                                                            {format(new Date(order.created_at), 'dd MMM', { locale: es })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span className="font-mono text-[11px] font-bold text-[#6366F1]">
                                                        {order.numero_secuencial ? String(order.numero_secuencial).padStart(8, '0') : order.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 text-left">
                                                    <span className="font-heading font-black text-gray-900 block">
                                                        {formatCurrency(order.total)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <Badge className={`rounded-lg px-2.5 py-1 text-[10px] font-black border uppercase tracking-wide gap-1.5 shadow-sm ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-2 min-w-[200px] animate-in slide-in-from-top-2 duration-200">
                                                            <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Acciones del Pedido</p>

                                                            {/* 1. Seguimiento Pedido */}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setSelectedStatus(order.estado);
                                                                    setShowTrackingModal(true);
                                                                }}
                                                                className="rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer mb-1 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <NavigationIcon className="w-4 h-4 text-indigo-500" />
                                                                Seguimiento pedido
                                                            </DropdownMenuItem>

                                                            {/* 2. Ver pedido */}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowViewModal(true);
                                                                }}
                                                                className="rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer mb-1 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-500" />
                                                                Ver pedido
                                                            </DropdownMenuItem>

                                                            {/* 3. Asignar Mensajero (Solo para domicilios en estado listo) */}
                                                            {order.tipo === 'delivery' && order.estado === 'listo' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setShowAssignModal(true);
                                                                    }}
                                                                    className="rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer mb-1 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Truck className="w-4 h-4 text-[#22C55E]" />
                                                                    Asignar Mensajero
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator className="bg-gray-50 my-1" />

                                                            {/* 3. Borrar pedido */}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                                className="rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Borrar pedido
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Pagination */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Mostrando {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
                            </p>
                            {filteredOrders.length > 10 && (
                                <Link to={`/dashboard/${slug}/pedidos/historial`} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                                    Ver más en historial <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="h-10 px-4 rounded-xl border-2 font-black text-[10px] tracking-widest disabled:opacity-30"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                ANTERIOR
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 px-4 rounded-xl border-2 font-black text-[10px] tracking-widest bg-white shadow-sm border-[#22C55E] text-[#22C55E] disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                            >
                                SIGUIENTE
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal para Ver Pedido (DETALLES DEL PEDIDO) */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-2xl rounded-[2rem] border-none p-0 overflow-hidden bg-[#F8F9FA] shadow-2xl flex flex-col max-h-[90vh]" aria-describedby="order-details-description">
                    <DialogHeader className="hidden">
                        <DialogTitle>Detalles del Pedido</DialogTitle>
                        <DialogDescription id="order-details-description">Vista detallada de la información del pedido y del cliente.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-shrink-0 flex items-center gap-4 p-6 bg-white border-b border-gray-100">
                        <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <DialogTitle className="text-xl font-black text-gray-900">Detalles del Pedido</DialogTitle>
                    </div>

                    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                        {/* Header Info */}
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-[#FF6B00]">{user?.nombre || 'Mi Negocio'}</h2>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID del Pedido: {selectedOrder?.numero_secuencial ? String(selectedOrder.numero_secuencial).padStart(8, '0') : selectedOrder?.id?.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[11px] font-bold text-gray-400">Realizado: {selectedOrder ? format(new Date(selectedOrder.created_at), 'dd/MM/yyyy, HH:mm:ss') : ''}</p>
                        </div>

                        {/* 1. Datos del Cliente */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#22C55E]">
                                <User className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Datos del Cliente</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Nombre:</span>
                                    <span className="text-gray-900 font-black">{selectedOrder?.cliente_nombre || 'No registrado'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Teléfono:</span>
                                    <span className="text-gray-900 font-black">{selectedOrder?.cliente_telefono || 'No registrado'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Entrega a Domicilio */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#E11D48]">
                                <MapPin className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Entrega a Domicilio</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Dirección:</span>
                                    <span className="text-gray-900 font-black">{selectedOrder?.direccion || 'No registrada'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Costo de envío:</span>
                                    <span className="text-gray-900 font-black">{formatCurrency(selectedOrder?.costo_envio || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Detalle del Pedido */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#F59E0B]">
                                <ClipboardList className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Detalle del Pedido</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 divide-y divide-gray-50">
                                {selectedOrder?.items.map((item, idx) => (
                                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">{idx + 1}. {item.nombre}</span>
                                                {item.descripcion && (
                                                    <p className="text-[11px] font-bold text-gray-600 line-clamp-2 leading-tight">
                                                        {item.descripcion}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(item.precio * item.cantidad)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] font-bold text-gray-400 italic">
                                                <span>Cantidad:</span>
                                                <span>{item.cantidad}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-gray-400 italic">
                                                <span>Precio Unit.:</span>
                                                <span>{formatCurrency(item.precio)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-gray-400 italic">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(item.precio * item.cantidad)}</span>
                                            </div>
                                            {item.modificadores && item.modificadores.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {item.modificadores.map((mod, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-black border border-orange-100 uppercase">
                                                            + {typeof mod === 'string' ? mod : `(${mod.cantidad || 1}) ${mod.nombre}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {item.notas && (
                                                <p className="mt-1 text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-1 rounded-lg">
                                                    📝 {item.notas}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Información Adicional */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#B45309]">
                                <Package className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Información Adicional</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Método de Pago:</span>
                                    <span className="text-gray-900 font-black">Efectivo</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Método de Entrega:</span>
                                    <span className="text-gray-900 font-black">Domicilio</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. Resumen de Pago */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#10B981]">
                                <CreditCard className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Resumen de Pago</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Subtotal productos:</span>
                                    <span className="text-gray-900 font-black">{selectedOrder ? formatCurrency(selectedOrder.total) : '$0'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Costo de envío:</span>
                                    <span className="text-gray-900 font-black">{formatCurrency(28562)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg pt-3 border-t border-gray-50">
                                    <span className="text-gray-900 font-black uppercase tracking-wider">TOTAL:</span>
                                    <span className="text-[#FF6B00] font-black">{selectedOrder ? formatCurrency(selectedOrder.total + 28562) : '$0'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Seguimiento de Pedido (Tracking) */}
            <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
                <DialogContent className="max-w-xl rounded-[2rem] border-none p-0 overflow-hidden bg-[#F8F9FA] shadow-2xl flex flex-col max-h-[90vh]" aria-describedby="tracking-modal-description">
                    <DialogHeader className="hidden">
                        <DialogTitle>Seguimiento a Pedido</DialogTitle>
                        <DialogDescription id="tracking-modal-description">Actualización del estado del flujo del pedido.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-shrink-0 flex items-center gap-4 p-6 bg-white border-b border-gray-100">
                        <Button variant="ghost" size="icon" onClick={() => setShowTrackingModal(false)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <DialogTitle className="text-xl font-black text-gray-900">Seguimiento a Pedido</DialogTitle>
                    </div>

                    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                        {/* Order Summary Card */}
                        <Card className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-black text-gray-900">Orden {selectedOrder?.numero_secuencial ? String(selectedOrder.numero_secuencial).padStart(8, '0') : selectedOrder?.id?.slice(0, 8).toUpperCase()}</h4>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-500">Cliente: <span className="text-gray-900">{selectedOrder?.cliente_nombre || 'Usuario de Prueba'}</span></p>
                                <p className="text-sm font-bold text-gray-500">Teléfono: <span className="text-gray-900">123456789</span></p>
                                <p className="text-sm font-bold text-gray-900">Total: {selectedOrder ? formatCurrency(selectedOrder.total + 28562) : '$0'}</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Productos:</p>
                                <div className="space-y-1">
                                    {selectedOrder?.items.map((item, idx) => (
                                        <p key={idx} className="text-xs font-bold text-gray-600">- {item.cantidad}x {item.nombre}</p>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Status Selection */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Actualizar Estado del Pedido</h3>
                            <div className="space-y-2 pb-4">
                                {[
                                    { id: 'pendiente', label: 'Pendiente' },
                                    { id: 'aceptado', label: 'Aceptado' },
                                    { id: 'preparando', label: 'Preparando' },
                                    { id: 'listo', label: 'Listo para Entrega' },
                                    { id: 'enviado', label: 'Enviado' },
                                    { id: 'entregado', label: 'Entregado' },
                                    { id: 'cancelado', label: 'Cancelado' }
                                ].map((status) => (
                                    <button
                                        key={status.id}
                                        onClick={() => setSelectedStatus(status.id)}
                                        className={`w-full p-4 rounded-xl text-left font-bold transition-all border-2 ${selectedStatus === status.id
                                            ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814] shadow-lg shadow-green-100 scale-[1.01]'
                                            : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'
                                            }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        </div>

                    <div className="flex-shrink-0 p-6 bg-white border-t border-gray-100">
                        <Button
                            disabled={!selectedStatus || selectedStatus === selectedOrder?.estado}
                            onClick={() => {
                                handleUpdateStatus(selectedOrder.id, selectedStatus);
                                setShowTrackingModal(false);
                            }}
                            className={`w-full h-14 rounded-2xl font-black text-sm tracking-widest transition-all shadow-lg ${selectedStatus && selectedStatus !== selectedOrder?.estado
                                ? 'bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]'
                                : 'bg-[#94A3B8] text-white opacity-50'
                                }`}
                        >
                            ACTUALIZAR ESTADO
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Borrar Pedido */}
            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent className="rounded-[2rem] border-2 border-gray-100 p-8 bg-white shadow-2xl max-w-sm">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="size-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
                            <Trash2 className="w-10 h-10 text-red-500 animate-bounce" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 mb-2">
                            ¿Borrar pedido?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-gray-500 leading-relaxed">
                            Esta acción no se puede deshacer. Se perderá toda la información del pedido de forma permanente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-3 mt-8 sm:flex-col">
                        <AlertDialogAction
                            onClick={handleDeleteOrder}
                            className="w-full h-14 rounded-2xl bg-red-600 text-white font-black text-xs tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-200"
                        >
                            SÍ, BORRAR PEDIDO
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-14 rounded-2xl border-2 border-gray-100 font-black text-xs tracking-widest hover:bg-gray-50 transition-all">
                            CANCELAR
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal para Asignar Mensajero */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="sm:max-w-md rounded-[3rem] border-none p-8 bg-white shadow-2xl overflow-hidden" aria-describedby="assign-messenger-description">
                    <div className="absolute top-0 right-0 p-8">
                        <Button variant="ghost" size="icon" onClick={() => setShowAssignModal(false)} className="rounded-full">
                            <X className="w-5 h-5 text-gray-400" />
                        </Button>
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-gray-900 flex items-center gap-4">
                            <div className="size-14 rounded-[1.5rem] bg-[#E8FBF0] flex items-center justify-center text-[#22C55E]">
                                <Truck className="w-8 h-8" />
                            </div>
                            Despachar Pedido
                        </DialogTitle>
                        <DialogDescription id="assign-messenger-description" className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4">
                            Asignar mensajero al pedido #{selectedOrder?.id?.slice(0, 8).toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-8">
                        {repartidores.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 p-8">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-xs text-gray-500 font-black">NO HAY REPARTIDORES</p>
                                <p className="text-[10px] text-gray-400 mt-1 mb-6">Primero debes registrar empleados con el rol de Repartidor.</p>
                                <Link
                                    to={`/dashboard/${slug}/empleados`}
                                    className="inline-flex items-center px-6 py-3 bg-[#111814] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                                >
                                    Ir a Empleados
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                {repartidores.map((rep) => (
                                    <button
                                        key={rep.id}
                                        onClick={() => handleAssignMessenger(rep.id)}
                                        disabled={assigning}
                                        className="flex items-center justify-between p-6 bg-white rounded-[2rem] border-2 border-gray-50 hover:border-[#22C55E]/30 hover:bg-[#F0FFF4]/30 transition-all group relative active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#22C55E] group-hover:border-[#22C55E]/20 transition-all">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-[#111814] text-base leading-none mb-1">{rep.nombre}</p>
                                                <p className="text-[10px] font-bold text-[#618972] uppercase tracking-[0.2em]">{rep.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#4ADE80] group-hover:text-[#111814] transition-all shadow-sm">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
