import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    History,
    Check,
    Search,
    Download,
    Filter,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format, isWithinInterval, parse, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

export default function CustomerHistoryPage() {
    const { slug, customerId } = useParams();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(null);

    const customer = {
        name: 'Carlos Rodríguez',
        id: 'CAR00001'
    };

    const initialHistory = [
        { id: '#TRX-9921', date: '12 Oct 2023', product: 'Pestaña de Lomo', name: 'Almuerzo Familiar', amount: '$145.000', points: '+145', status: 'COMPLETADO' },
        { id: '#TRX-9854', date: '08 Oct 2023', product: 'Baby Beef', name: 'Cena Ejecutiva', amount: '$78.000', points: '+78', status: 'COMPLETADO' },
        { id: '#TRX-9712', date: '01 Oct 2023', product: 'Bebidas y Entradas', name: 'After Office', amount: '$112.000', points: '+112', status: 'COMPLETADO' },
        { id: '#TRX-9601', date: '25 Sep 2023', product: 'Parrillada Mixta', name: 'Cena Amigos', amount: '$210.000', points: '+210', status: 'COMPLETADO' },
        { id: '#TRX-9588', date: '18 Sep 2023', product: 'Salmón Grillé', name: 'Almuerzo Ejecutivo', amount: '$65.000', points: '+65', status: 'COMPLETADO' }
    ];

    // Filter Logic
    const filteredHistory = useMemo(() => {
        return initialHistory.filter(item => {
            const matchesSearch =
                item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (!date) return matchesSearch;

            // Parse date from "12 Oct 2023" format
            // We use 'es' locale if needed, but the original mock uses month abbreviations.
            // For simplicity and robustness in this mock, we convert it to a date object.
            const itemDate = parse(item.date, 'dd MMM yyyy', new Date(), { locale: es });

            const isSameDate =
                itemDate.getDate() === date.getDate() &&
                itemDate.getMonth() === date.getMonth() &&
                itemDate.getFullYear() === date.getFullYear();

            return matchesSearch && isSameDate;
        });
    }, [searchTerm, date]);

    // CSV Export Logic (Excel Compatible)
    const handleExportExcel = () => {
        const headers = ["ID TRX", "FECHA", "PRODUCTO", "NOMBRE", "MONTO", "PUNTOS", "ESTADO"];
        const rows = filteredHistory.map(item => [
            item.id,
            item.date,
            item.product,
            item.name,
            item.amount.replace('$', '').replace('.', ''),
            item.points,
            item.status
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(e => e.join(";"))
        ].join("\n");

        // UTF-8 BOM for Excel support
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `historial_${customer.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-20 pt-4 px-4 bg-gray-50/30 min-h-screen">

                {/* Header Section */}
                <div className="mb-8 space-y-4">
                    <button
                        onClick={() => navigate(`/dashboard/${slug}/clientes/${customerId}`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#22C55E] transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Volver al Perfil</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-[#4ADE80] text-[#111814] rounded-[1.5rem] shadow-xl shadow-green-100">
                                <History className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Historial de Consumo</h2>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{customer.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleExportExcel}
                                className="h-12 px-6 rounded-xl bg-white border-2 border-gray-100 text-gray-600 font-black text-[11px] tracking-widest hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> EXPORTAR EXCEL
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <Card className="mb-8 border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[2.5rem] bg-white border-2 border-gray-50 overflow-hidden">
                    <CardContent className="p-8 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por producto o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 border-none bg-gray-50/50 focus:border-[#22C55E] rounded-2xl pl-12 font-bold text-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`h-12 px-6 rounded-xl border-2 font-black text-[11px] tracking-widest gap-3 transition-all ${date ? 'border-[#22C55E] text-[#22C55E] bg-green-50' : 'border-gray-100 text-gray-600'}`}
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                        {date ? format(date, "PPP", { locale: es }) : "FILTRAR POR FECHA"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setDate(null)}
                                    className="h-12 w-12 rounded-xl border-2 border-red-50 text-red-500 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Full History Table */}
                <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[3rem] overflow-hidden bg-white border-2 border-gray-50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">ID TRX</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">FECHA</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">DETALLE</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-right text-gray-500 uppercase tracking-widest">MONTO</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-center text-gray-500 uppercase tracking-widest">PUNTOS</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-center text-gray-500 uppercase tracking-widest">ESTADO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHistory.length > 0 ? filteredHistory.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-green-50/20 transition-all group">
                                        <td className="px-10 py-8">
                                            <p className="text-xs font-black text-[#22C55E] tracking-tight">{item.id}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <p className="text-xs font-black text-gray-400 tracking-tighter uppercase">{item.date}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.product}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{item.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right font-black text-gray-900 text-lg tracking-tight">
                                            {item.amount}
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                                    <span className="text-green-700 font-black text-sm">{item.points} PTS</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center">
                                                <Badge className="bg-[#4ADE80] hover:bg-green-600 text-[#111814] font-black text-[9px] px-4 py-2 rounded-full shadow-lg shadow-green-100 uppercase tracking-widest flex items-center gap-2 border-none">
                                                    <Check className="w-3 h-3 stroke-[4]" /> {item.status}
                                                </Badge>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                                <Search className="w-12 h-12 opacity-20" />
                                                <p className="text-sm font-black uppercase tracking-widest">No se encontraron registros para esta búsqueda</p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => { setSearchTerm(''); setDate(null); }}
                                                    className="text-[#22C55E] font-black"
                                                >
                                                    LIMPIAR FILTROS
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
