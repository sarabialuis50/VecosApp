import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    ChevronDown,
    Package,
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    LayoutGrid,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function AllProductsPage() {
    const { slug } = useParams();
    const { api } = useAuth();
    const navigate = useNavigate();

    // State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('TODAS');
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                api().get(`/menu-items/${slug}`),
                api().get(`/categories/${slug}`).catch(() => ({ data: [] }))
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data.map(c => typeof c === 'string' ? c : c.nombre));
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Error al cargar el catálogo");
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (productId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await api().put(`/menu-items/${slug}/${productId}`, { available: newStatus });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: newStatus } : p));
            toast.success(newStatus ? 'Producto disponible' : 'Producto agotado');
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await api().delete(`/menu-items/${slug}/${productId}`);
            setProducts(prev => prev.filter(p => p.id !== productId));
            toast.success('Producto eliminado');
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const filteredProducts = products.filter(product => {
        const name = product.name || product.nombre || '';
        const desc = product.description || product.descripcion || '';
        const cat = product.category || product.categoria || '';
        const available = product.available ?? product.disponible ?? true;

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            desc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'TODAS' || cat === filterCategory;
        const matchesStatus = filterStatus === 'TODOS' ||
            (filterStatus === 'DISPONIBLE' ? available : !available);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Package className="w-6 h-6 text-[#22C55E]" />
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">CATÁLOGO COMPLETO</h1>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Gestiona todos tus productos, precios y disponibilidad en un solo lugar.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/dashboard/${slug}/configuracion?tab=menu`)}
                            className="h-11 px-6 rounded-xl border-2 font-black text-[11px] tracking-widest gap-2 hover:bg-gray-50 transition-all active:scale-95 text-gray-700 border-gray-200 bg-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            VOLVER
                        </Button>
                        <Button
                            onClick={() => window.open(`/${slug}/menu`, '_blank')}
                            variant="outline"
                            className="h-11 px-6 rounded-xl border-2 font-black text-[11px] tracking-widest gap-2 hover:bg-gray-50 transition-all active:scale-95 text-[#618972] border-gray-200"
                        >
                            <ExternalLink className="w-4 h-4" />
                            VER CATÁLOGO
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-2 border-gray-100 shadow-2xl shadow-gray-200/50 rounded-[2rem] overflow-hidden bg-white">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar productos por nombre o descripción..."
                                className="pl-11 h-12 rounded-2xl border-2 border-gray-100 focus:border-[#22C55E] focus:ring-4 focus:ring-green-50 transition-all font-medium text-sm"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Category Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black text-[10px] tracking-widest gap-2 bg-white hover:bg-gray-50 transition-all border-gray-100 min-w-[160px] justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Filter className="w-3.5 h-3.5" />
                                            <span>CATEGORÍA</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-3 min-w-[220px] space-y-1">
                                    <DropdownMenuItem onClick={() => { setFilterCategory('TODAS'); setCurrentPage(1); }} className="rounded-xl px-4 py-2.5 text-[11px] font-bold gap-3 cursor-pointer">
                                        TODAS LAS CATEGORÍAS
                                        {filterCategory === 'TODAS' && <CheckCircle2 className="w-4 h-4 ml-auto text-[#22C55E]" />}
                                    </DropdownMenuItem>
                                    {categories.map((cat) => (
                                        <DropdownMenuItem key={cat} onClick={() => { setFilterCategory(cat); setCurrentPage(1); }} className="rounded-xl px-4 py-2.5 text-[11px] font-bold gap-3 cursor-pointer">
                                            {cat.toUpperCase()}
                                            {filterCategory === cat && <CheckCircle2 className="w-4 h-4 ml-auto text-[#22C55E]" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Status Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black text-[10px] tracking-widest gap-2 bg-white hover:bg-gray-50 transition-all border-gray-100 min-w-[140px] justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            <span>ESTADO</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-2 border-gray-100 shadow-xl p-3 min-w-[200px] space-y-1">
                                    {['TODOS', 'DISPONIBLE', 'AGOTADO'].map((status) => (
                                        <DropdownMenuItem key={status} onClick={() => { setFilterStatus(status); setCurrentPage(1); }} className="rounded-xl px-4 py-2.5 text-[11px] font-bold gap-3 cursor-pointer">
                                            {status}
                                            {filterStatus === status && <CheckCircle2 className="w-4 h-4 ml-auto text-[#22C55E]" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Producto</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Precio</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Estado</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-10 rounded-full border-4 border-[#22C55E] border-t-transparent animate-spin" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando Catálogo...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-gray-50">
                                                    <img src={p.image_url || p.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt={p.name || p.nombre} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-black text-sm text-gray-900 leading-none group-hover:text-[#22C55E] transition-colors">{p.name || p.nombre}</p>
                                                        {p.etiqueta && <Badge className="bg-[#4ADE80] text-black border-none py-0 px-1.5 h-4 text-[7px] font-black uppercase">{p.etiqueta}</Badge>}
                                                        {p.oferta_porcentaje && <Badge className="bg-red-400 text-white border-none py-0 px-1.5 h-4 text-[7px] font-black uppercase">-{p.oferta_porcentaje}%</Badge>}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[200px]">{p.description || p.descripcion || 'Sin descripción'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge variant="outline" className="rounded-xl px-3 py-1 text-[9px] font-black border-2 border-gray-100 text-[#618972] uppercase tracking-tighter bg-gray-50/50">
                                                {p.category || p.categoria}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-black text-gray-900 tracking-tight">{formatCurrency(p.base_price || p.precio)}</p>
                                                {(p.precio_original || p.oferta_porcentaje) && <p className="text-[10px] text-gray-400 line-through font-bold">{formatCurrency(p.precio_original || p.precio / (1 - (p.oferta_porcentaje / 100)))}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${(p.available ?? p.disponible) ? 'text-[#22C55E]' : 'text-red-400'}`}>
                                                    {(p.available ?? p.disponible) ? 'Disponible' : 'Agotado'}
                                                </span>
                                                <Switch
                                                    checked={p.available ?? p.disponible}
                                                    onCheckedChange={() => toggleAvailability(p.id, p.available ?? p.disponible)}
                                                    className="data-[state=checked]:bg-[#22C55E]"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/dashboard/${slug}/configuracion?tab=menu&edit=${p.id}`)}
                                                    className="size-9 rounded-xl text-gray-400 hover:text-[#22C55E] hover:bg-green-50 transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(p.id)}
                                                    className="size-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && paginatedProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-3 opacity-30">
                                                <Package className="size-12 mx-auto" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No se encontraron productos</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredProducts.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Mostrando {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredProducts.length, currentPage * itemsPerPage)} de {filteredProducts.length} productos
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
                                        setCurrentPage(p => Math.min(totalPages, p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-10 px-4 rounded-xl border-2 border-[#22C55E] text-[#22C55E] bg-white font-black text-[10px] tracking-widest hover:bg-green-50 shadow-sm transition-all disabled:opacity-30"
                                >
                                    SIGUIENTE
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
