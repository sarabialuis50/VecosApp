import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Brain,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Utensils,
    Clock,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const InsightCard = ({ title, icon: Icon, children, color = "text-purple-600", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    </motion.div>
);

export default function InsightsPage() {
    const { slug } = useParams();
    const { user, api } = useAuth();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInsights = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Use user.id as negocio_id for the endpoint
            const response = await api().get(`/ai/insights/${user.id}`);
            setInsights(response.data);
            toast.success('Insights generados con IA');
        } catch (error) {
            console.error('Error fetching AI insights:', error);
            toast.error('No se pudieron generar los insights. Verifica tu API Key.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [user]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600" />
                        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <p className="text-gray-500 font-medium animate-pulse">Burger Full AI está analizando tu negocio...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!insights) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900">No se pudieron cargar los insights</h2>
                    <Button onClick={fetchInsights} className="mt-4">Intentar de nuevo</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            Consultor IA · Insights
                        </h1>
                        <p className="text-gray-500">Análisis inteligente de tu restaurante potenciado por DeepSeek</p>
                    </div>
                    <Button onClick={fetchInsights} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </Button>
                </div>

                {/* Resumen del Día */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InsightCard title="Resumen del Día" icon={TrendingUp} color="text-green-600" delay={0.1}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ventas estimadas</span>
                                <span className="text-xl font-bold">{formatCurrency(insights.resumen_dia?.ventas || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pedidos</span>
                                <span className="font-semibold">{insights.resumen_dia?.pedidos || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Ticket Promedio</span>
                                <span className="font-semibold">{formatCurrency(insights.resumen_dia?.ticket_promedio || 0)}</span>
                            </div>
                        </div>
                    </InsightCard>

                    <InsightCard title="Top Platos" icon={Utensils} color="text-orange-500" delay={0.2}>
                        <ul className="space-y-3">
                            {insights.top_platos?.map((plato, idx) => (
                                <li key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-800 line-clamp-1">{plato.nombre}</span>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                        {plato.ventas_estimadas} ventas
                                    </span>
                                </li>
                            ))}
                            {(!insights.top_platos || insights.top_platos.length === 0) && (
                                <p className="text-gray-400 text-sm">No hay suficientes datos aún.</p>
                            )}
                        </ul>
                    </InsightCard>

                    <InsightCard title="Horas Pico" icon={Clock} color="text-blue-500" delay={0.3}>
                        <div className="flex flex-wrap gap-2">
                            {insights.horas_pico?.map((hora, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-100">
                                    {hora}
                                </span>
                            ))}
                            {(!insights.horas_pico || insights.horas_pico.length === 0) && (
                                <p className="text-gray-400 text-sm">Sin datos de horas pico.</p>
                            )}
                        </div>
                    </InsightCard>
                </div>

                {/* Alertas y Recomendaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightCard title="Alertas Operativas" icon={AlertTriangle} color="text-red-500" delay={0.4}>
                        {insights.mesas_alerta?.length > 0 ? (
                            <ul className="space-y-3">
                                {insights.mesas_alerta.map((alerta, idx) => (
                                    <li key={idx} className="flex gap-3 items-start bg-red-50 p-3 rounded-md border border-red-100">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-800 text-sm">Mesa {alerta.mesa}</p>
                                            <p className="text-red-600 text-sm">{alerta.motivo}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                    <Sparkles className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-green-700 font-medium">¡Todo opera con normalidad!</p>
                                <p className="text-green-600 text-sm">No hay alertas críticas en este momento.</p>
                            </div>
                        )}
                    </InsightCard>

                    <InsightCard title="Sugerencias de IA" icon={Lightbulb} color="text-yellow-500" delay={0.5}>
                        <ul className="space-y-4">
                            {insights.acciones_sugeridas?.map((accion, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{accion}</p>
                                </li>
                            ))}
                            {(!insights.acciones_sugeridas || insights.acciones_sugeridas.length === 0) && (
                                <p className="text-gray-400 text-sm">La IA está recopilando más datos para sugerencias.</p>
                            )}
                        </ul>
                    </InsightCard>
                </div>
            </div>
        </DashboardLayout>
    );
}
