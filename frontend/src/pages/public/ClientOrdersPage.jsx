
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, Clock, Hash, MapPin, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientOrdersPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [token] = useState(localStorage.getItem('client_token'));
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hidden orders state (frontend hide only)
    const [hiddenOrderIds, setHiddenOrderIds] = useState(() => {
        const saved = localStorage.getItem('client_hidden_orders');
        return saved ? JSON.parse(saved) : [];
    });

    const handleHideOrder = (orderId) => {
        const newHidden = [...hiddenOrderIds, orderId];
        setHiddenOrderIds(newHidden);
        localStorage.setItem('client_hidden_orders', JSON.stringify(newHidden));
        toast.success("Pedido eliminado de tu vista");
    };

    useEffect(() => {
        if (!token) {
            navigate(`/${slug}/mi-cuenta`);
            return;
        }
        fetchOrders();
    }, [token, slug]);

    const markOrdersAsSeen = (ordersList) => {
        try {
            const saved = localStorage.getItem('client_seen_order_ids');
            const prevIds = saved ? JSON.parse(saved) : [];
            const newIds = (ordersList || []).map((o) => o.id).filter(Boolean);
            const merged = Array.from(new Set([...prevIds, ...newIds]));
            localStorage.setItem('client_seen_order_ids', JSON.stringify(merged));
        } catch (e) {
            console.warn('Error marking orders as seen', e);
        }
    };

    const fetchOrders = async () => {
        if (token === 'universal-client-token') {
            const demoOrders = [
                {
                    id: 'PED-1042',
                    estado: 'entregado',
                    total: 22000,
                    created_at: new Date().toISOString(),
                    items: [{ nombre: 'Churrasco a la Brasa (250g)', cantidad: 1, precio_unitario: 22000 }],
                },
                {
                    id: 'PED-1039',
                    estado: 'entregado',
                    total: 18500,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    items: [{ nombre: 'Almuerzo Ejecutivo: Pechuga al Romero', cantidad: 1, precio_unitario: 18500 }],
                },
            ];
            setOrders(demoOrders);
            markOrdersAsSeen(demoOrders);
            setLoading(false);
            return;
        }
        try {
            const rawApi = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '';
            const apiBase = rawApi ? (rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`) : '/api';
            const api = axios.create({
                baseURL: apiBase,
                headers: { Authorization: `Bearer ${token}` }
            });

            // Assuming /client/orders returns all orders for the authenticated user
            const res = await api.get('/client/orders');
            setOrders(res.data);
            markOrdersAsSeen(res.data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                navigate(`/${slug}/mi-cuenta`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 font-inter pb-20">
            {/* Header */}
            <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/${slug}/mi-cuenta`)} className="rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                    <h1 className="text-xl font-black tracking-tight text-[#111814]">Mis Pedidos</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {orders.filter(o => !hiddenOrderIds.includes(o.id)).length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                            <Package className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-black text-[#111814] mb-2">No tienes pedidos aún</h2>
                        <p className="text-gray-500 mb-8">¡Explora nuestro menú y realiza tu primer pedido!</p>
                        <Button
                            onClick={() => navigate(slug === 'demo-restaurante' ? '/demo-restaurante' : `/${slug}/menu`)}
                            className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-bold px-8 py-6 rounded-2xl shadow-lg shadow-[#4ADE80]/20"
                        >
                            Ir al Menú
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.filter(o => !hiddenOrderIds.includes(o.id)).map((order) => (
                            <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">

                                        {/* Order Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                                    <Package className="w-5 h-5 text-[#22C55E]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-[#111814] text-lg">
                                                            #{order.id.slice(0, 8).toUpperCase()}
                                                        </h4>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gray-100 text-gray-700`}>
                                                            {order.estado}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                        <span>•</span>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg text-[#111814]">${order.total?.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.items?.length || 0} ITEMS</p>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-gray-100 w-full" />

                                        {/* Items Preview */}
                                        <div className="space-y-2">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-gray-700">
                                                        <span className="font-bold text-[#22C55E] mr-2">{item.cantidad}x</span>
                                                        {item.nombre}
                                                    </span>
                                                    <span className="text-gray-500">${(item.precio || item.precio_unitario || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2 flex items-center justify-end gap-3">
                                            {['pendiente', 'en_proceso', 'en_camino'].includes(order.estado) && (
                                                <Button
                                                    className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-bold rounded-xl h-10 shadow-lg shadow-[#4ADE80]/20"
                                                    onClick={() => navigate(`/${slug}/mis-pedidos?order=${order.id}`)}
                                                >
                                                    Rastrear Pedido
                                                </Button>
                                            )}
                                            {['entregado', 'cancelado'].includes(order.estado) && (
                                                <Button
                                                    variant="outline"
                                                    className="border-2 border-gray-100 hover:bg-gray-50 text-gray-600 font-bold rounded-xl h-10"
                                                    onClick={() => navigate(slug === 'demo-restaurante' ? '/demo-restaurante' : `/${slug}/menu`)}
                                                >
                                                    Volver a pedir
                                                </Button>
                                            )}
                                            {order.estado === 'entregado' && (
                                                <Button
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold rounded-xl h-10 px-4 flex items-center gap-2"
                                                    onClick={() => handleHideOrder(order.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar del historial
                                                </Button>
                                            )}
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
