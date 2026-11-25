import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Phone,
    Mail,
    Calendar,
    Plus,
    BarChart3,
    Brain,
    TrendingUp,
    Clock,
    Activity,
    MessageSquareQuote,
    History,
    Check,
    Loader2,
    DollarSign,
    Award,
    Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// UNIFIED BRAND COLOR: #22C55E (Verde Burger Full)
const BRAND_GREEN = "#22C55E";

export default function CustomerDetailsPage() {
    const { slug, customerId } = useParams();
    const navigate = useNavigate();

    const { api } = useAuth();

    // States
    const [customerData, setCustomerData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);

    // Modal States
    const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
    const [creditMode, setCreditMode] = useState('compra'); // 'compra' o 'puntos'
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [manualPoints, setManualPoints] = useState('');
    const [awarding, setAwarding] = useState(false);

    useEffect(() => {
        if (slug && customerId) {
            fetchData();
        }
    }, [slug, customerId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [customerRes, configRes, historyRes] = await Promise.all([
                api().get(`/loyalty/${slug}/points/${customerId}`),
                api().get(`/loyalty/${slug}/config`),
                api().get(`/loyalty/${slug}/transactions/${customerId}`)
            ]);

            setCustomerData(customerRes.data);
            setConfig(configRes.data);
            setHistory(historyRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar la información del cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleAwardPoints = async () => {
        let points = 0;
        let description = '';
        let amount = 0;

        if (!config) {
            toast.error('Cargando configuración... Por favor espera.');
            return;
        }

        if (creditMode === 'compra') {
            const val = parseFloat(purchaseAmount);
            if (isNaN(val) || val <= 0) {
                toast.error('Ingresa un monto de compra válido');
                return;
            }
            points = Math.floor(val / config.pesos_por_punto);
            amount = val;
            description = `Acreditación por compra de $${val.toLocaleString()}`;
        } else {
            const val = parseInt(manualPoints);
            if (isNaN(val) || val <= 0) {
                toast.error('Ingresa una cantidad de puntos válida');
                return;
            }
            points = val;
            amount = val * config.pesos_por_punto;
            description = `Acreditación manual de ${points} puntos`;
        }

        if (points <= 0) {
            toast.error('La cantidad de puntos debe ser mayor a 0');
            return;
        }

        setAwarding(true);
        try {
            await api().post(`/loyalty/${slug}/award`, {
                telefono: customerId,
                puntos: points,
                descripcion: description,
                monto: amount
            });

            toast.success('¡Puntos acreditados exitosamente!');
            setIsAwardModalOpen(false);
            setPurchaseAmount('');
            setManualPoints('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error awarding points:', error);
            toast.error('Hubo un error al acreditar los puntos.');
        } finally {
            setAwarding(false);
        }
    };

    // Calculate level based on points (same logic as CustomersPage)
    const getLevel = (totalPoints) => {
        if (totalPoints > 1000) return 'ORO';
        if (totalPoints > 300) return 'PLATA';
        return 'BRONCE';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const customer = {
        name: customerData?.nombre || 'Cliente Registrado',
        email: customerData?.email || 'Sin correo',
        phone: customerData?.telefono || customerId,
        birthday: customerData?.fecha_nacimiento || 'No registrada',
        points: (customerData?.puntos_actuales || 0).toLocaleString(),
        totalPoints: customerData?.puntos_totales || 0,
        visits: customerData?.cantidad_pedidos || 0,
        avgSpending: customerData?.total_compras ? `$${(customerData.total_compras / (customerData.cantidad_pedidos || 1)).toLocaleString()}k` : '$0',
        avgFrequency: '14 DÍAS', // Simulated
        avatar: (customerData?.nombre || 'C').charAt(0).toUpperCase(),
        level: getLevel(customerData?.puntos_totales || 0)
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-20 pt-4 px-4 bg-gray-50/30 min-h-screen">

                {/* Back Navigation */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/dashboard/${slug}/clientes`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#22C55E] transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Base de Clientes / Análisis Táctico</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* LEFT SIDEBAR: Personal Card */}
                    <div className="lg:col-span-4">
                        <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] md:rounded-[3rem] overflow-hidden border-2 border-gray-50 h-full">
                            <CardContent className="p-6 md:p-10 flex flex-col items-center text-center h-full">
                                <div className="relative mb-6 md:mb-8">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] md:border-[8px] border-green-50 p-1 md:p-1.5 shadow-inner">
                                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                                            <img
                                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop"
                                                alt={customer.name}
                                                className="w-full h-full object-cover shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <Badge className="absolute bottom-2 right-2 bg-yellow-400 text-yellow-900 font-black text-[10px] px-3 py-1 border-4 border-white rounded-full shadow-lg">
                                        {customer.level}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{customer.name}</h2>
                                </div>

                                <Button
                                    onClick={() => setIsAwardModalOpen(true)}
                                    className="w-[90%] text-white font-black rounded-xl h-12 shadow-[0_10px_20px_rgba(34,197,94,0.15)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 mb-10 text-[10px] tracking-wider uppercase border-none"
                                    style={{ backgroundColor: BRAND_GREEN }}
                                >
                                    <Plus className="w-4 h-4 stroke-[4]" /> Acreditar Puntos
                                </Button>

                                <div className="w-full space-y-2 pt-6 border-t-2 border-gray-50 mt-auto">
                                    {[
                                        { icon: Phone, label: customer.phone },
                                        { icon: Mail, label: customer.email },
                                        { icon: Calendar, label: customer.birthday }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#22C55E] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-green-100/50 flex-shrink-0">
                                                <item.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-[12px] font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT TOP: Profile Header & KPIs */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-2 border-gray-50 gap-6 md:gap-8">
                            <div className="space-y-2 md:space-y-3 text-center md:text-left w-full flex flex-col items-center md:items-start">
                                <h3 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter flex items-center justify-center md:justify-start gap-3 md:gap-4 uppercase font-outfit">
                                    PERFIL DEL CLIENTE
                                </h3>
                                <p className="text-[10px] md:text-sm font-bold text-[#22C55E] uppercase tracking-[0.2em] md:tracking-[0.25em] bg-green-50 px-3 md:px-4 py-1 rounded-full inline-block">
                                    Desempeño y estadísticas generales
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            {[
                                { label: 'PUNTOS ACTUALES', value: customer.points, icon: Activity, color: 'text-green-600', sub: 'Puntos Disponibles', bg: 'bg-white', border: 'border-green-100' },
                                { label: 'PUNTOS TOTALES', value: customer.totalPoints.toLocaleString(), icon: Award, color: 'text-yellow-600', sub: 'Histórico Acumulado', bg: 'bg-white', border: 'border-yellow-100' },
                                { label: 'COMPRAS TOTALES', value: customerData?.total_compras ? `$${customerData.total_compras.toLocaleString()}` : '$0', icon: DollarSign, color: 'text-blue-600', sub: 'Gasto histórico', bg: 'bg-white', border: 'border-blue-100' },
                                { label: 'PEDIDOS REALIZADOS', value: customer.visits, icon: Clock, color: 'text-orange-600', sub: 'Frecuencia de compra', bg: 'bg-white', border: 'border-orange-100' }
                            ].map((kpi, idx) => (
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    key={idx}
                                    className={`rounded-[1.5rem] md:rounded-[2.2rem] p-6 md:p-8 space-y-4 md:space-y-6 border-2 shadow-[0_15px_30px_rgba(0,0,0,0.02)] ${kpi.bg} ${kpi.border} transition-all`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${kpi.bg} border-2 ${kpi.border} shadow-sm`}>
                                                <kpi.icon className={`w-4 md:w-5 h-4 md:h-5 ${kpi.color}`} />
                                            </div>
                                            <h5 className="text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.1em] md:tracking-[0.2em] uppercase">{kpi.label}</h5>
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:space-y-2">
                                        <p className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter">{kpi.value}</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${kpi.color.replace('text', 'bg')} animate-pulse`} />
                                            <p className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-tight">{kpi.sub}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* BOTTOM FULL WIDTH: Context & History */}
                    <div className="lg:col-span-12 space-y-6 md:space-y-8 mt-4">
                        <Card className="bg-white border-2 border-green-100/50 shadow-[0_20px_40px_rgba(0,0,0,0.03)] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
                            <div className="absolute -top-4 -right-4 p-8 opacity-[0.03]">
                                <MessageSquareQuote className="w-24 h-24 text-[#22C55E]" />
                            </div>
                            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                <div className="flex items-center gap-4 flex-shrink-0 border-r-0 md:border-r-2 border-gray-50 pr-0 md:pr-8 md:min-w-[280px] w-full md:w-auto justify-center md:justify-start">
                                    <div className="p-3 md:p-4 bg-[#4ADE80] text-[#111814] rounded-xl md:rounded-2xl shadow-lg shadow-green-100">
                                        <Brain className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-[10px] md:text-[11px] font-black text-green-800 uppercase tracking-widest leading-none">Contexto Sugerido</h4>
                                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Análisis IA</p>
                                    </div>
                                </div>
                                <p className="text-base md:text-lg font-bold italic text-gray-800 leading-relaxed max-w-5xl text-center md:text-left">
                                    "{customerData?.visit_context || "Prefiere ser atendido con agilidad. Valora las recomendaciones del personal."}"
                                </p>
                            </CardContent>
                        </Card>

                        {/* TRANSACTION HISTORY SECTION */}
                        <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white border-2 border-gray-100">
                            <div className="p-6 md:p-10 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/20 gap-6">
                                <div className="flex items-center gap-4 md:gap-5">
                                    <div className="p-3 md:p-4 bg-[#4ADE80] text-[#111814] rounded-xl md:rounded-[1.5rem] shadow-lg shadow-green-100">
                                        <History className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1">
                                        <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">HISTORIAL RECIENTE</h3>
                                        <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Últimas transacciones registradas</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => navigate(`/dashboard/${slug}/clientes/${customerId}/historial`)}
                                    className="text-[9px] md:text-[10px] font-black text-[#22C55E] bg-white hover:bg-[#4ADE80] hover:text-[#111814] rounded-xl px-6 md:px-8 h-10 md:h-11 transition-all uppercase tracking-[0.2em] border-[3px] border-[#4ADE80] shadow-sm active:scale-95 w-full sm:w-auto"
                                >
                                    VER TODO
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest">FECHA</th>
                                            <th className="px-8 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest">DETALLE</th>
                                            <th className="px-8 py-6 text-[11px] font-black text-left text-gray-500 uppercase tracking-widest">MONTO</th>
                                            <th className="px-10 py-6 text-[11px] font-black text-center text-gray-500 uppercase tracking-widest">PUNTOS</th>
                                            <th className="px-10 py-6 text-[11px] font-black text-center text-gray-500 uppercase tracking-widest">ESTADO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {history.length > 0 ? history.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-green-50/20 transition-all group">
                                                <td className="px-10 py-6">
                                                    <p className="text-[11px] font-black text-gray-400 tracking-tighter uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{item.tipo === 'ganado' ? 'Acreditación' : 'Redención'}</p>
                                                        <p className="text-[9px] font-bold text-[#22C55E]/60 uppercase">{item.descripcion}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-left font-black text-gray-900 text-sm tracking-tight">
                                                    {item.monto ? `$${parseFloat(item.monto).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center justify-center">
                                                        <div className={`${item.tipo === 'ganado' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} px-3 py-1.5 rounded-xl border whitespace-nowrap`}>
                                                            <span className={`${item.tipo === 'ganado' ? 'text-green-700' : 'text-red-700'} font-black text-[11px]`}>
                                                                {item.tipo === 'ganado' ? '+' : '-'}{item.puntos} PTS
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center justify-center">
                                                        <Badge className="bg-[#4ADE80] hover:bg-green-600 text-[#111814] font-black text-[9px] px-3 py-1.5 rounded-full shadow-lg shadow-green-100 uppercase tracking-widest flex items-center gap-2 border-none">
                                                            <Check className="w-3 h-3 stroke-[4]" /> COMPLETADO
                                                        </Badge>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="px-10 py-20 text-center">
                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay transacciones registradas</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Award Points Modal - SUPER PREMIUM REDESIGN */}
                <Dialog open={isAwardModalOpen} onOpenChange={setIsAwardModalOpen}>
                    <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-[2.5rem] border-none shadow-[0_40px_100px_rgba(0,0,0,0.25)] p-0 overflow-y-auto max-h-[90vh] bg-white/95 backdrop-blur-xl scrollbar-hide" aria-describedby="award-points-description">
                        <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-green-50/80 via-white to-white relative border-b border-gray-50/50">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none text-green-900">
                                <Trophy className="w-40 h-40" />
                            </div>
                            <div className="flex items-center gap-5 mb-1 relative z-10">
                                <div className="p-4 bg-[#4ADE80] text-[#111814] rounded-[1.25rem] shadow-xl shadow-[#4ADE80]/20 ring-4 ring-white">
                                    <Award className="w-6 h-6 stroke-[2.5]" />
                                </div>
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Acreditar Puntos</DialogTitle>
                                    <DialogDescription id="award-points-description" className="sr-only">Formulario para asignar puntos de fidelidad al cliente.</DialogDescription>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                            Beneficios para {customer.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="px-8 pt-8 pb-8 space-y-8">
                            <Tabs value={creditMode} onValueChange={setCreditMode} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full h-[64px] bg-white p-1.5 rounded-[1.5rem] border-2 border-green-200/50 shadow-sm overflow-hidden auto-cols-fr">
                                    <TabsTrigger
                                        value="compra"
                                        className="h-full rounded-[1.2rem] font-black text-[10px] tracking-[0.15em] uppercase border border-green-200/30 data-[state=inactive]:border-green-200/40 data-[state=inactive]:bg-green-50/20 data-[state=inactive]:text-green-800/60 data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg transition-all duration-300"
                                    >
                                        POR COMPRA
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="puntos"
                                        className="h-full rounded-[1.2rem] font-black text-[10px] tracking-[0.15em] uppercase border border-green-200/30 data-[state=inactive]:border-green-200/40 data-[state=inactive]:bg-green-50/20 data-[state=inactive]:text-green-800/60 data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg transition-all duration-300"
                                    >
                                        DIRECTO
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <AnimatePresence mode="wait">
                                {creditMode === 'compra' ? (
                                    <motion.div
                                        key="compra"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Monto Total de la Compra</Label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    <DollarSign className="w-5 h-5 text-[#22C55E]" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={purchaseAmount}
                                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="h-20 pl-16 pr-8 rounded-[1.5rem] border-2 border-green-100 bg-green-50/10 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-black text-3xl tracking-tight text-gray-900 shadow-sm"
                                                />
                                            </div>
                                            {config && (
                                                <div className="flex items-center gap-2 ml-4">
                                                    <div className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                        Equivale a 1 punto por cada ${config.pesos_por_punto.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="puntos"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cantidad de Puntos a Sumar</Label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                                    <Plus className="w-5 h-5 text-[#22C55E]" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={manualPoints}
                                                    onChange={(e) => setManualPoints(e.target.value)}
                                                    placeholder="0"
                                                    className="h-20 pl-16 pr-8 rounded-[1.5rem] border-2 border-green-100 bg-green-50/10 focus:bg-white focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-black text-3xl tracking-tight text-gray-900 shadow-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <div className="w-1 h-1 rounded-full bg-[#4ADE80] animate-pulse" />
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                    Se sumarán directamente al saldo actual
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <DialogFooter className="p-8 bg-gray-50/50 gap-4 flex-row border-t border-gray-100">
                            <Button
                                variant="outline"
                                onClick={() => setIsAwardModalOpen(false)}
                                className="h-14 flex-1 rounded-full border-2 border-gray-200 bg-white font-black text-[10px] tracking-widest uppercase hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 shadow-sm"
                            >
                                CANCELAR
                            </Button>
                            <Button
                                onClick={handleAwardPoints}
                                disabled={awarding || (creditMode === 'compra' ? !purchaseAmount || parseFloat(purchaseAmount) <= 0 : !manualPoints || parseInt(manualPoints) <= 0)}
                                className={`h-14 flex-1 rounded-full font-black text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 group overflow-hidden border-2 border-[#22C55E] ${(creditMode === 'compra' ? parseFloat(purchaseAmount) > 0 : parseInt(manualPoints) > 0)
                                    ? 'bg-[#4ADE80] text-[#111814] hover:bg-[#22C55E] shadow-xl shadow-[#4ADE80]/30 scale-100'
                                    : 'bg-white text-[#22C55E] cursor-not-allowed'
                                    }`}
                            >
                                {awarding ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Award className="w-4 h-4 transition-transform group-hover:rotate-12" />
                                        <span>ACREDITAR {creditMode === 'compra' && purchaseAmount > 0 && `(${Math.floor(purchaseAmount / (config?.pesos_por_punto || 1))} PTS)`}</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
