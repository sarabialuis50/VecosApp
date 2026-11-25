import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    User,
    UserPlus,
    Upload,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpRight,
    TrendingUp,
    BadgeCheck,
    Smartphone,
    Mail,
    MessageSquareMore,
    Download,
    Pencil,
    Trash2,
    ChevronDown,
    CheckCircle2,
    BarChart3,
    Calendar,
    Check,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function AllCustomersPage() {
    const { slug } = useParams();
    const { api } = useAuth();
    const navigate = useNavigate();

    // State
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('TODOS');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', birthday: '' });
    const [phoneError, setPhoneError] = useState('');
    const fileInputRef = useRef(null);

    // Fetch Customers
    useEffect(() => {
        fetchCustomers();
    }, [slug]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const [res, configRes] = await Promise.all([
                api().get(`/loyalty/${slug}/customers?limit=1000`),
                api().get(`/loyalty/${slug}/config`).catch(() => ({ data: {} }))
            ]);

            let savedTiers = { nivel_bronce_min: 0, nivel_plata_min: 300, nivel_oro_min: 1000 };
            try {
                const raw = localStorage.getItem('fogon_mesa_loyalty_tiers');
                if (raw) savedTiers = { ...savedTiers, ...JSON.parse(raw) };
            } catch (e) {}

            const bronceMin = Number(configRes.data?.nivel_bronce_min ?? savedTiers.nivel_bronce_min ?? 0);
            const plataMin = Number(configRes.data?.nivel_plata_min ?? savedTiers.nivel_plata_min ?? 300);
            const oroMin = Number(configRes.data?.nivel_oro_min ?? savedTiers.nivel_oro_min ?? 1000);

            // Map API response to UI model
            const mappedCustomers = (res.data || []).map((c, index) => {
                const totalPoints = Number(c.puntos_totales ?? c.puntos ?? c.points ?? 0);
                const availablePoints = Number(c.puntos_disponibles ?? c.puntos ?? c.points ?? 0);

                // Logic to determine level and segment based on dynamic points
                let level = 'BRONCE';
                if (totalPoints >= oroMin) level = 'ORO';
                else if (totalPoints >= plataMin) level = 'PLATA';
                else if (totalPoints >= bronceMin) level = 'BRONCE';

                let segment = 'NUEVO';
                if (totalPoints >= oroMin) segment = 'LEALTAD VERDADERA';
                else if (totalPoints >= plataMin) segment = 'LEALTAD POTENCIAL';

                return {
                    id: c.telefono || c.id || `cust-${index}`, // Use phone as ID
                    name: c.nombre || c.name || 'Sin Nombre',
                    email: c.email || 'Sin Email',
                    phone: c.telefono || c.phone || '',
                    level: level,
                    segment: segment,
                    points: availablePoints,
                    status: 'ACTIVO',
                    createdAt: c.created_at,
                    avatar: (c.nombre || c.name || 'C').substring(0, 2).toUpperCase()
                };
            });

            setCustomers(mappedCustomers);
        } catch (error) {
            console.error("Error fetching customers:", error);
            // toast.error("Error al cargar clientes"); // Optional: don't spam errors on first load if empty
        } finally {
            setLoading(false);
        }
    };

    const getSegmentStyles = (segment) => {
        switch (segment) {
            case 'LEALTAD VERDADERA': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'LEALTAD POTENCIAL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'LEALTAD FALSA': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'LEALTAD NULA': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusStyles = (status) => {
        return status === 'ACTIVO'
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20';
    };

    const getLevelStyles = (level) => {
        switch (level) {
            case 'ORO': return 'bg-yellow-400/20 text-yellow-700 border-yellow-200';
            case 'PLATA': return 'bg-gray-300/20 text-gray-600 border-gray-200';
            case 'BRONCE': return 'bg-orange-600/10 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-400 border-gray-100';
        }
    };

    const handleExport = () => {
        const headers = ["Nombre", "WhatsApp", "Email", "Nivel", "Puntos", "Estado"];
        const rows = customers.map(c => [
            c.name,
            c.phone,
            c.email,
            c.level,
            c.points.toString().replace('.', ''), // Ensure points are clean of formatting for Excel
            c.status
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        // UTF-8 BOM for Excel support
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes_menupro_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Listado exportado correctamente para Excel');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                loading: 'Procesando archivo...',
                success: `Importados correctamente datos de: ${file.name}`,
                error: 'Error al importar archivo'
            });
        }
    };

    const handleDelete = async (customer) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${customer.name}?`)) return;

        try {
            const loadingToast = toast.loading(`Eliminando a ${customer.name}...`);
            await api().delete(`/loyalty/${slug}/customers/${customer.phone}`);
            toast.dismiss(loadingToast);
            toast.success('Cliente eliminado correctamente');
            fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Error al eliminar cliente");
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();

        if (newCustomerData.phone.length !== 10) {
            setPhoneError('El número debe tener exactamente 10 dígitos');
            toast.error('Número de teléfono inválido');
            return;
        }

        try {
            const loadingToast = toast.loading('Registrando cliente...');

            // Prepare payload
            const payload = {
                nombre: newCustomerData.name,
                telefono: newCustomerData.phone,
                email: newCustomerData.email,
                fecha_nacimiento: newCustomerData.birthday ? newCustomerData.birthday : null
            };

            await api().post(`/loyalty/${slug}/customers`, payload);

            toast.dismiss(loadingToast);
            toast.success('Cliente registrado correctamente');

            setIsAddModalOpen(false);
            setNewCustomerData({ name: '', phone: '', email: '', birthday: '' });
            setPhoneError('');

            // Refresh list
            fetchCustomers();

        } catch (error) {
            console.error("Error creating customer:", error);
            const msg = error.response?.data?.detail || 'Error al registrar cliente';
            toast.error(msg);
        }
    };

    const handlePhoneChange = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 10);
        setNewCustomerData({ ...newCustomerData, phone: digits });

        if (digits.length > 0 && digits.length < 10) {
            setPhoneError('Faltan dígitos (se requieren 10)');
        } else {
            setPhoneError('');
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'TODOS' || customer.level === filterLevel;
        const matchesStatus = filterStatus === 'TODOS' || customer.status === filterStatus;
        return matchesSearch && matchesLevel && matchesStatus;
    });

    // Calculate dynamic stats
    const newCustomersThisMonth = customers.filter(c => {
        if (!c.createdAt) return false;
        const date = new Date(c.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const totalCustomers = customers.length;
    const activeMembers = customers.filter(c => c.points > 0).length; // Simple heuristic for active

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">TODOS LOS CLIENTES</h1>
                        <p className="text-sm text-gray-500 font-medium">Gestiona tu base de clientes y analiza sus comportamientos.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/${slug}/clientes`)}
                        className="h-11 px-6 rounded-xl border-2 font-black text-[11px] tracking-widest gap-2 hover:bg-gray-50 transition-all active:scale-95 text-gray-700 border-gray-200 bg-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        VOLVER
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="h-11 px-6 rounded-xl border-2 font-black text-[11px] tracking-widest gap-2 hover:bg-gray-50 transition-all active:scale-95 text-blue-600 border-blue-100 bg-blue-50/30"
                    >
                        <Download className="w-4 h-4" />
                        EXPORTAR
                    </Button>
                </div>
            </div>



            {/* Table Container */}
            <Card className="border-2 border-gray-100 shadow-2xl shadow-gray-200/50 rounded-[2rem] overflow-hidden bg-white">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre o descripción..."
                            className="pl-11 h-12 rounded-2xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black text-[10px] tracking-widest gap-2 bg-white hover:bg-gray-50 transition-all border-gray-100 min-w-[140px] justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Filter className="w-3.5 h-3.5" />
                                        <span>FILTRAR</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-300" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-3 min-w-[220px] space-y-1">
                                <div className="px-3 py-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filtrar por Nivel</p>
                                </div>
                                {['TODOS', 'ORO', 'PLATA', 'BRONCE'].map((level) => (
                                    <DropdownMenuItem
                                        key={level}
                                        onClick={() => setFilterLevel(level)}
                                        className={`rounded-xl px-4 py-2.5 text-[11px] font-bold gap-3 cursor-pointer transition-colors ${filterLevel === level ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${level === 'ORO' ? 'bg-yellow-400' :
                                            level === 'PLATA' ? 'bg-gray-400' :
                                                level === 'BRONCE' ? 'bg-orange-600' : 'bg-gray-200'
                                            }`} />
                                        {level}
                                        {filterLevel === level && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                    </DropdownMenuItem>
                                ))}

                                <div className="h-px bg-gray-100 my-2" />

                                <div className="px-3 py-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filtrar por Estado</p>
                                </div>
                                {['TODOS', 'ACTIVO', 'INACTIVO'].map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`rounded-xl px-4 py-2.5 text-[11px] font-bold gap-3 cursor-pointer transition-colors ${filterStatus === status ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${status === 'ACTIVO' ? 'bg-green-500' :
                                            status === 'INACTIVO' ? 'bg-red-500' : 'bg-gray-200'
                                            }`} />
                                        {status}
                                        {filterStatus === status && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                    </DropdownMenuItem>
                                ))}

                                {(filterLevel !== 'TODOS' || filterStatus !== 'TODOS') && (
                                    <>
                                        <div className="h-px bg-gray-100 my-2" />
                                        <DropdownMenuItem
                                            onClick={() => { setFilterLevel('TODOS'); setFilterStatus('TODOS'); }}
                                            className="rounded-xl px-4 py-2.5 text-[10px] font-black gap-3 cursor-pointer text-red-500 hover:bg-red-50 justify-center uppercase tracking-widest"
                                        >
                                            Limpiar Filtros
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-2 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</th>
                                <th className="px-2 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                <th className="px-2 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nivel</th>
                                <th className="px-2 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Puntos</th>
                                <th className="px-2 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-3 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-3 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 font-black text-xs">
                                                {customer.avatar}
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-gray-900 leading-none mb-1 group-hover:text-[#22C55E] transition-colors">{customer.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Cliente Registrado</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-700">{customer.phone}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\s+/g, '')}`, '_blank')}
                                                className="h-6 w-6 rounded-full text-[#22C55E] hover:bg-green-50 transition-all"
                                            >
                                                <MessageSquareMore className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-gray-600">{customer.email}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.location.href = `mailto:${customer.email}`}
                                                className="h-6 w-6 rounded-full text-blue-500 hover:bg-blue-50 transition-all"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4">
                                        <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[8px] font-black border-2 flex items-center gap-2 w-fit ${getLevelStyles(customer.level)}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${customer.level === 'ORO' ? 'bg-yellow-600' :
                                                customer.level === 'PLATA' ? 'bg-gray-500' : 'bg-orange-800'
                                                }`} />
                                            {customer.level}
                                        </Badge>
                                    </td>
                                    <td className="px-2 py-4">
                                        <p className="text-xs font-black text-gray-900 tracking-tight">{(Number(customer.points) || 0).toLocaleString()}</p>
                                    </td>
                                    <td className="px-2 py-4">
                                        <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[8px] font-black border-2 ${getStatusStyles(customer.status)}`}>
                                            {customer.status}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white hover:shadow-md rounded-full transition-all">
                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-2 min-w-[180px]">
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/dashboard/${slug}/clientes/${customer.id}`)}
                                                    className="rounded-xl px-4 py-3 text-xs font-bold gap-3 focus:bg-green-50 focus:text-[#22C55E] cursor-pointer"
                                                >
                                                    <BarChart3 className="w-4 h-4" /> Análisis Táctico
                                                </DropdownMenuItem>
                                                <div className="h-px bg-gray-100 my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(customer)}
                                                    className="rounded-xl px-4 py-3 text-xs font-bold gap-3 focus:bg-red-50 focus:text-red-500 cursor-pointer text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Mostrando {Math.min(filteredCustomers.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredCustomers.length, currentPage * itemsPerPage)} de {filteredCustomers.length} clientes
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === 1}
                            className="h-10 px-4 rounded-xl border-2 font-black text-[10px] tracking-widest hover:bg-white transition-all disabled:opacity-30"
                        >
                            ANTERIOR
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentPage(p => Math.min(Math.ceil(filteredCustomers.length / itemsPerPage), p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage >= Math.ceil(filteredCustomers.length / itemsPerPage)}
                            className="h-10 px-4 rounded-xl border-2 border-[#22C55E] text-[#22C55E] bg-white font-black text-[10px] tracking-widest hover:bg-green-50 shadow-sm transition-all disabled:opacity-30"
                        >
                            SIGUIENTE
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Add Customer Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden" aria-describedby="add-customer-description">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Nuevo Cliente</DialogTitle>
                        <DialogDescription id="add-customer-description" className="text-sm text-gray-500 font-medium">
                            Registra los datos básicos para fidelizar un nuevo cliente.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        required
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                        className="h-12 pl-11 rounded-xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Número de WhatsApp</Label>
                                    <AnimatePresence mode="wait">
                                        {phoneError && (
                                            <motion.span
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-tighter"
                                            >
                                                {phoneError}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                                        <Smartphone className={`w-4 h-4 transition-colors ${phoneError ? 'text-red-400' : 'text-gray-400'}`} />
                                        <span className="text-sm font-black text-gray-900 border-r-2 border-gray-100 pr-2">+57</span>
                                    </div>
                                    <Input
                                        required
                                        type="tel"
                                        value={newCustomerData.phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        placeholder="300 123 4567"
                                        className={`h-12 pl-24 rounded-xl border-2 transition-all font-bold text-sm ${phoneError
                                            ? 'border-red-100 bg-red-50/30 focus:border-red-400 focus:ring-red-50'
                                            : 'border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50'
                                            }`}
                                    />
                                    {newCustomerData.phone.length === 10 && !phoneError && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-0.5"
                                        >
                                            <Check className="w-3 h-3 text-white" />
                                        </motion.div>
                                    )}
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold ml-1 uppercase tracking-tighter">
                                    Ingresa los 10 dígitos después del código de país.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico (Opcional)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="email"
                                        value={newCustomerData.email}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                        placeholder="juan@ejemplo.com"
                                        className="h-12 pl-11 rounded-xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Cumpleaños (Opcional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        value={newCustomerData.birthday}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, birthday: e.target.value })}
                                        className="h-12 pl-11 rounded-xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-bold text-sm text-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col md:flex-row gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="h-12 flex-1 rounded-xl border-2 font-black text-[11px] tracking-widest"
                            >
                                CANCELAR
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 flex-1 rounded-xl bg-[#4ADE80] hover:bg-[#1da850] border-none font-black text-[11px] tracking-widest shadow-lg shadow-green-100"
                            >
                                REGISTRAR CLIENTE
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
