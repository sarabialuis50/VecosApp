import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ChevronLeft, Calendar, FileText, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FidelidadHistoryPage() {
    const { slug } = useParams();
    const { api } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let url = `/loyalty/${slug}/recent-transactions?limit=100`; // Increased limit for history view
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;

            const res = await api().get(url);
            if (res.data) {
                const formatted = res.data.map(t => ({
                    ...t,
                    fecha: new Date(t.fecha).toLocaleString()
                }));
                setTransactions(formatted);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [slug]); // Initial load

    const handleFilter = () => {
        fetchTransactions();
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    const handleExportExcel = () => {
        if (transactions.length === 0) return;

        const headers = ['Cliente', 'Monto', 'Puntos', 'Fecha', 'Estado'];
        const csvRows = [headers.join(',')];

        transactions.forEach(t => {
            const row = [
                `"${t.nombre || 'Cliente'}"`,
                t.monto || 0,
                t.puntos,
                `"${t.fecha}"`,
                `"${t.estado}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial_fidelidad_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#FAFAF9] p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to={`/dashboard/${slug}/fidelidad`}>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:text-[#22C55E]">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Historial de Fidelidad</h1>
                        <p className="text-gray-500 font-medium">Registro completo de acreditaciones y canjes</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="rounded-[2rem] border-gray-100 shadow-xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row items-end gap-4">
                            <div className="space-y-2 w-full lg:w-auto">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Desde</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="pl-10 rounded-xl border-gray-200 bg-gray-50/50 h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 w-full lg:w-auto">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Hasta</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="pl-10 rounded-xl border-gray-200 bg-gray-50/50 h-11"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleFilter}
                                className="rounded-xl px-8 h-11 bg-[#4ADE80] hover:bg-[#1da850] text-[#111814] font-black uppercase tracking-widest shadow-lg shadow-[#4ADE80]/20 w-full lg:w-auto"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                FILTRAR
                            </Button>
                            <Button
                                onClick={handleExportExcel}
                                variant="outline"
                                className="rounded-xl px-6 h-11 border-[#22C55E] text-[#22C55E] hover:bg-green-50 font-black uppercase tracking-widest w-full lg:w-auto mt-2 lg:mt-0"
                                disabled={transactions.length === 0}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                EXPORTAR EXCEL
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Puntos</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex justify-center">
                                                <span className="animate-spin h-8 w-8 border-4 border-[#22C55E] border-t-transparent rounded-full"></span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length > 0 ? (
                                    (() => {
                                        const startIndex = (currentPage - 1) * itemsPerPage;
                                        const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);
                                        const totalPages = Math.ceil(transactions.length / itemsPerPage);

                                        return paginatedTransactions.map((t, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#22C55E] font-black text-[10px] uppercase">
                                                            {(t.nombre || 'C').split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{t.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-gray-900 font-bold text-sm">
                                                        {t.monto ? formatCurrency(t.monto) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[#22C55E] font-black text-sm">+{t.puntos} pts</span>
                                                </td>
                                                <td className="px-8 py-5 text-gray-400 font-bold text-xs italic">
                                                    {t.fecha}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-green-100 text-[#22C55E]">
                                                        {t.estado}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">No se encontraron registros</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {transactions.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Mostrando {Math.min(transactions.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(transactions.length, currentPage * itemsPerPage)} de {transactions.length} registros
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
                                        setCurrentPage(p => Math.min(Math.ceil(transactions.length / itemsPerPage), p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage >= Math.ceil(transactions.length / itemsPerPage)}
                                    className="h-10 px-4 rounded-xl border-2 border-[#22C55E] text-[#22C55E] bg-white font-black text-[10px] tracking-widest hover:bg-green-50 shadow-sm transition-all disabled:opacity-30"
                                >
                                    SIGUIENTE
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}
