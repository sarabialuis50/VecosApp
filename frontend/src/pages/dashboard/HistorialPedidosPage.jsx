import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Package,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Truck,
    Utensils,
    ChefHat,
    MoreHorizontal,
    Navigation as NavigationIcon,
    Trash2,
    MapPin,
    CreditCard,
    ClipboardList,
    ChevronDown
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
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
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

export default function HistorialPedidosPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { api } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal States
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchAllOrders = async () => {
            try {
                setLoading(true);
                const res = await api().get(`/orders/${slug}?limit=1000`);
                setOrders(res.data);
            } catch (error) {
                console.error("Error fetching orders history:", error);
                toast.error("Error al cargar historial");
            } finally {
                setLoading(false);
            }
        };
        fetchAllOrders();
    }, [slug, api]);

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

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pendiente': return { label: 'PENDIENTE', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock };
            case 'aceptado': return { label: 'ACEPTADO', color: 'bg-teal-50 text-teal-600 border-teal-200', icon: CheckCircle2 };
            case 'preparando': return { label: 'PREPARANDO', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: ChefHat };
            case 'listo': return { label: 'LISTO', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2 };
            case 'enviado': return { label: 'ENVIADO', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck };
            case 'entregado': return { label: 'ENTREGADO', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Utensils };
            case 'cancelado': return { label: 'CANCELADO', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle };
            default: return { label: status.toUpperCase(), color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock };
        }
    };

    const filteredOrders = orders.filter(order => {
        const statusMatch = filterStatus === 'TODOS' || order.estado === filterStatus.toLowerCase();
        const searchMatch =
            (order.cliente_nombre && order.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.mesa_numero && order.mesa_numero.toString().includes(searchTerm));

        let dateMatch = true;
        if (dateFrom || dateTo) {
            try {
                const orderDate = parseISO(order.created_at);
                const start = dateFrom ? startOfDay(parseISO(dateFrom)) : new Date(0);
                const end = dateTo ? endOfDay(parseISO(dateTo)) : new Date();
                dateMatch = isWithinInterval(orderDate, { start, end });
            } catch (e) {
                console.error("Date filter error:", e);
            }
        }

        return statusMatch && searchMatch && dateMatch;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const exportToExcel = () => {
        if (filteredOrders.length === 0) {
            toast.error("No hay datos para exportar");
            return;
        }

        const data = filteredOrders.map(order => ({
            'ID PEDIDO': order.numero_secuencial || order.id.slice(0, 8).toUpperCase(),
            'FECHA': format(new Date(order.created_at), 'dd/MM/yyyy'),
            'HORA': format(new Date(order.created_at), 'HH:mm:ss'),
            'CLIENTE': order.cliente_nombre || (order.mesa_numero ? `Mesa ${order.mesa_numero}` : 'N/A'),
            'TIPO': order.mesa_numero ? 'Mesa' : (order.tipo === 'delivery' ? 'Domicilio' : 'Para Recoger'),
            'ESTADO': order.estado.toUpperCase(),
            'ITEMS': order.items?.map(i => `${i.cantidad}x ${i.nombre}`).join('; ') || 'Sin items',
            'TOTAL': order.total,
            'METODO PAGO': order.metodo_pago || 'N/A',
            'NOTAS': order.notas || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

        const wscols = [
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
            { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, `Reporte_Pedidos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        toast.success("Excel generado correctamente");
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-2xl bg-white border border-gray-100 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Historial de Pedidos</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Control de registros anteriores</p>
                        </div>
                    </div>
                </div>

                {/* Filters Board */}
                <Card className="p-6 border-2 border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        {/* Date From */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Desde</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                    className="pl-10 h-12 bg-gray-100/30 border-gray-100 rounded-2xl text-[11px] font-bold focus:ring-[#22C55E]"
                                />
                            </div>
                        </div>

                        {/* Date To */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hasta</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                                    className="pl-10 h-12 bg-gray-100/30 border-gray-100 rounded-2xl text-[11px] font-bold focus:ring-[#22C55E]"
                                />
                            </div>
                        </div>

                        {/* Filtrar Button */}
                        <div className="lg:col-span-2">
                            <Button
                                variant="outline"
                                className="w-full border-2 border-[#4ADE80] text-[#22C55E] hover:bg-[#4ADE80]/5 rounded-2xl h-12 font-black text-[11px] uppercase tracking-widest gap-2 transition-all active:scale-95"
                            >
                                <Search className="w-4 h-4" />
                                Filtrar
                            </Button>
                        </div>

                        {/* Export Button */}
                        <div className="lg:col-span-3">
                            <Button
                                onClick={exportToExcel}
                                className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] rounded-2xl h-12 font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Table Card */}
                <Card className="border-2 border-gray-100 rounded-3xl bg-white shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search on the left */}
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por cliente, ID o mesa..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-11 h-11 bg-white border-gray-100 rounded-2xl text-sm font-bold focus:ring-[#22C55E] transition-all shadow-sm"
                            />
                        </div>

                        {/* Pedidos Count and Filter on the right */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
                                <ShoppingBag className="w-4 h-4 text-[#22C55E]" />
                                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Pedidos</h2>
                                <span className="px-2.5 py-0.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-[#22C55E] shadow-sm">
                                    {filteredOrders.length}
                                </span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-10 px-4 rounded-xl border border-gray-100 font-black text-[9px] tracking-widest gap-2 bg-white hover:bg-gray-50 transition-all text-gray-500 uppercase">
                                        <Filter className="w-3.5 h-3.5 text-[#22C55E]" />
                                        <span>Filtrar: {filterStatus}</span>
                                        <ChevronDown className="w-3 h-3 text-gray-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-2 min-w-[200px]">
                                    {['TODOS', 'PENDIENTE', 'ACEPTADO', 'PREPARANDO', 'LISTO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].map((status) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status);
                                                setCurrentPage(1);
                                            }}
                                            className={`rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer mb-1 last:mb-0 ${filterStatus === status ? 'bg-[#4ADE80]/10 text-[#22C55E]' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status}
                                            {filterStatus === status && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/20 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Cliente / Método</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Items</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Fecha/Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">ID Pedido</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Total</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-gray-400">Cargando registros...</td></tr>
                                ) : paginatedOrders.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-bold text-gray-400">No hay pedidos registrados con estos filtros.</td></tr>
                                ) : (
                                    paginatedOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.estado);
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-black text-gray-900">{order.cliente_nombre || (order.mesa_numero ? `Mesa ${order.mesa_numero}` : 'Cliente')}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{order.mesa_numero ? `Mesa ${order.mesa_numero}` : (order.tipo === 'delivery' ? 'Domicilio' : 'Para Recoger')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">
                                                            {order.items?.length > 1 ? `${order.items[0].cantidad}x ${order.items[0].nombre}, ...` : (order.items?.length === 1 ? `${order.items[0].cantidad}x ${order.items[0].nombre}` : 'Sin items')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 lowercase">{order.items?.length || 0} items</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[11px] font-bold text-gray-400">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">{format(new Date(order.created_at), 'HH:mm')}</span>
                                                        <span className="uppercase tracking-widest">{format(new Date(order.created_at), 'dd MMM')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-indigo-600 font-bold">{order.numero_secuencial || order.id.slice(0, 8).toUpperCase()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <span className="text-lg font-black text-gray-900 block">{formatCurrency(order.total)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                                                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-2 min-w-[180px]">
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

                                                            <DropdownMenuSeparator className="bg-gray-50 my-1" />

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

                    {/* Simple Pagination */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Mostrando {Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredOrders.length, currentPage * itemsPerPage)} de {filteredOrders.length} pedidos
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-10 px-4 rounded-xl border-2 font-black text-[10px] tracking-widest hover:bg-white transition-all disabled:opacity-30"
                            >
                                ANTERIOR
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-10 px-4 rounded-xl border-2 border-[#22C55E] text-[#22C55E] bg-white font-black text-[10px] tracking-widest hover:bg-green-50 shadow-sm transition-all disabled:opacity-30"
                            >
                                SIGUIENTE
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal para Ver Pedido (DETALLES DEL PEDIDO) */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-2xl rounded-[2rem] border-none p-0 overflow-hidden bg-[#F8F9FA] shadow-2xl">
                    <DialogHeader className="hidden">
                        <DialogTitle>Detalles del Pedido</DialogTitle>
                        <DialogDescription>Vista detallada de la información del pedido y del cliente.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-4 p-6 bg-white border-b border-gray-100">
                        <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <DialogTitle className="text-xl font-black text-gray-900">Detalles del Pedido</DialogTitle>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-[#FF6B00]">Burger Full</h2>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID del Pedido: {selectedOrder?.numero_secuencial || selectedOrder?.id?.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[11px] font-bold text-gray-400">Realizado: {selectedOrder ? format(new Date(selectedOrder.created_at), 'dd/MM/yyyy, HH:mm:ss') : ''}</p>
                        </div>

                        {/* 1. Datos del Cliente */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#6366F1]">
                                <User className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Datos del Cliente</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold">Nombre:</span>
                                    <span className="text-gray-900 font-black">{selectedOrder?.cliente_nombre || 'No registrado'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Entrega a Domicilio */}
                        {selectedOrder?.tipo !== 'mesa' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#E11D48]">
                                    <MapPin className="w-5 h-5" />
                                    <h3 className="text-[13px] font-black uppercase tracking-wider">Entrega a Domicilio</h3>
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-bold">Dirección:</span>
                                        <span className="text-gray-900 font-black">{selectedOrder?.direccion || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Detalle del Pedido */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#F59E0B]">
                                <ClipboardList className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Detalle del Pedido</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 divide-y divide-gray-50">
                                {selectedOrder?.items.map((item, idx) => (
                                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-black text-gray-900">{idx + 1}. {item.nombre}</span>
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
                                            {item.modificadores && item.modificadores.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {item.modificadores.map((mod, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-black border border-orange-100 uppercase">
                                                            + {typeof mod === 'string' ? mod : `(${mod.cantidad || 1}) ${mod.nombre}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Resumen de Pago */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#10B981]">
                                <CreditCard className="w-5 h-5" />
                                <h3 className="text-[13px] font-black uppercase tracking-wider">Resumen de Pago</h3>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-lg pt-3">
                                    <span className="text-gray-900 font-black uppercase tracking-wider">TOTAL:</span>
                                    <span className="text-[#FF6B00] font-black">{selectedOrder ? formatCurrency(selectedOrder.total) : '$0'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Seguimiento de Pedido (Tracking) */}
            <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
                <DialogContent className="max-w-xl rounded-[2rem] border-none p-0 overflow-hidden bg-[#F8F9FA] shadow-2xl">
                    <DialogHeader className="hidden">
                        <DialogTitle>Seguimiento a Pedido</DialogTitle>
                        <DialogDescription>Actualización del estado del flujo del pedido.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-4 p-6 bg-white border-b border-gray-100">
                        <Button variant="ghost" size="icon" onClick={() => setShowTrackingModal(false)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <DialogTitle className="text-xl font-black text-gray-900">Seguimiento a Pedido</DialogTitle>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
                        <Card className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-black text-gray-900">Orden {selectedOrder?.numero_secuencial || selectedOrder?.id?.slice(0, 8).toUpperCase()}</h4>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-500">Cliente: <span className="text-gray-900">{selectedOrder?.cliente_nombre || 'No registrado'}</span></p>
                                <p className="text-sm font-bold text-gray-900">Total: {selectedOrder ? formatCurrency(selectedOrder.total) : '$0'}</p>
                            </div>
                        </Card>

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

                        <div className="sticky bottom-0 bg-[#F8F9FA] pt-4 pb-2">
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
        </DashboardLayout>
    );
}
