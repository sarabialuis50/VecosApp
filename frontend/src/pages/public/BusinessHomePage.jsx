import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { PublicLayout } from '@/layouts/PublicLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    ShoppingCart,
    Plus,
    MapPin,
    Clock,
    Phone,
    LayoutGrid,
    ChevronRight,
    Star,
    CheckCircle2,
    ArrowRight,
    UtensilsCrossed,
    Verified,
    Store,
    Navigation,
    Heart,
    Instagram,
    Facebook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PublicTrialLocked from '@/components/PublicTrialLocked';
import { parseBusinessSchedule } from '@/utils/scheduleParser';
import { BusinessClosedModal } from '@/components/BusinessClosedModal';
import { PromoModal } from '@/components/PromoModal';

// Backend API URL
// Consistent with AuthContext prefixing
const API = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';


const BusinessHomePageContent = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { checkAndSetSede } = useCart();
    const [business, setBusiness] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lockedMessage, setLockedMessage] = useState(null);
    const [products, setProducts] = useState([]); // Added new state for all products
    const [scheduleData, setScheduleData] = useState(null);
    const [showClosedModal, setShowClosedModal] = useState(false);

    useEffect(() => {
        // Register this branch — clears cart if user switched branches
        if (slug) checkAndSetSede(slug);
        fetchData();
    }, [slug]);

    const fetchData = async (retryCount = 0) => {
        if (!slug) return;

        // Clean and normalize slug
        const cleanSlug = slug.trim().toLowerCase();

        if (retryCount === 0) setLoading(true);

        try {
            // Fetch business first
            const businessRes = await axios.get(`${API}/business/${cleanSlug}`);
            setBusiness(businessRes.data);

            const parsedSched = parseBusinessSchedule(businessRes.data.horarios, businessRes.data.abierto);
            setScheduleData(parsedSched);
            if (parsedSched.isClosed) {
                setShowClosedModal(true);
            }

            // Fetch products separately so failure doesn't block the whole page
            try {
                const productsRes = await axios.get(`${API}/menu-items/${cleanSlug}`);
                const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];

                // Map fields for consistency
                const mappedProducts = productsData.map(p => ({
                    ...p,
                    nombre: p.name || p.nombre,
                    descripcion: p.description || p.descripcion,
                    precio: p.base_price ?? p.precio ?? 0,
                    imagen: p.image_url || p.imagen,
                    categoria: p.category || p.categoria,
                    disponible: p.available ?? p.disponible,
                    destacado: p.is_recommended ?? p.destacado
                }));

                setProducts(mappedProducts);

                // Priority for featured products:
                // 1. Items marked as is_recommended
                // 2. First items if none are marked
                let featured = mappedProducts.filter(p => p.disponible && p.destacado);
                if (featured.length === 0) {
                    featured = mappedProducts.filter(p => p.disponible).slice(0, 4);
                }
                setFeaturedProducts(featured);

            } catch (prodErr) {
                console.warn('Error fetching products:', prodErr);
                setProducts([]);
                setFeaturedProducts([]);
            }
            setLoading(false);
        } catch (error) {
            console.error(`Error fetching business data (Attempt ${retryCount + 1}):`, error);

            // Retry logic: up to 2 retries with a small delay
            if (retryCount < 2) {
                const delay = retryCount === 0 ? 500 : 1500;
                setTimeout(() => fetchData(retryCount + 1), delay);
                return;
            }

            if (error.response && error.response.status === 403) {
                setLockedMessage(error.response.data?.detail || "Este restaurante no está disponible temporalmente.");
            }
            setLoading(false);
        }
    };

    const [isFavorite, setIsFavorite] = useState(false);
    const token = localStorage.getItem('client_token');

    useEffect(() => {
        if (token && slug) {
            checkFavoriteStatus();
        }
    }, [token, slug]);

    const checkFavoriteStatus = async () => {
        try {
            const res = await axios.get(`${API}/client/favorites/${slug}/check`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFavorite(res.data.is_favorite);
        } catch (e) {
            console.error("Error checking favorite:", e);
        }
    };

    const toggleFavorite = async () => {
        if (!token) {
            toast.error("Inicia sesión para guardar favoritos");
            navigate(`/${slug}/mi-cuenta`);
            return;
        }

        try {
            const res = await axios.post(`${API}/client/favorites/${slug}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFavorite(res.data.is_favorite);
            toast.success(res.data.message);
        } catch (e) {
            console.error("Error toggling favorite:", e);
            toast.error("Error al actualizar favoritos");
        }
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null || isNaN(value) || Number(value) === 0) return '';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(Number(value));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
            </div>
        );
    }

    if (lockedMessage) {
        return <PublicTrialLocked message={lockedMessage} />;
    }

    if (!business) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8f7] p-4 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                    <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                </div>
                <h1 className="font-heading text-3xl font-bold mb-3 text-[#111814]">Negocio no encontrado</h1>
                <p className="text-[#618972] max-w-xs mb-8">El enlace que seguiste podría estar roto o el restaurante ya no está disponible.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => window.location.reload()} className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] px-8 h-12 rounded-xl font-bold">
                        Reintentar
                    </Button>
                    <Button onClick={() => navigate('/')} variant="outline" className="px-8 h-12 rounded-xl font-bold border-gray-200 text-gray-500">
                        Ir al inicio
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <PublicLayout
            businessName={business.nombre}
            businessLogo={business.logo_url}
            slug={slug}
            whatsapp={business.whatsapp}
            aiEnabled={business.ai_habilitado}
            aiSaludo={business.ai_saludo}
            aiUseModal={business.ai_use_modal}
            isClosed={scheduleData?.isClosed ?? !business.abierto}
        >
            <div className="bg-[#f6f8f7] min-h-screen pb-20">
                {/* Closure Alert Banner */}
                {scheduleData?.isClosed && (
                    <div className="bg-red-600 text-white py-4 px-4 sticky top-0 z-[60] shadow-xl animate-pulse">
                        <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-3">
                            <Clock className="w-5 h-5" />
                            <p className="font-black text-sm md:text-base uppercase tracking-wider text-center">
                                ¡LO SENTIMOS! EL NEGOCIO SE ENCUENTRA CERRADO Y NO ESTÁ RECIBIENDO PEDIDOS EN ESTE MOMENTO.
                            </p>
                        </div>
                    </div>
                )}

                {/* Hero Section */}
                <section className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pt-6">
                    {/* Banner Image */}
                    <div className="w-full h-64 md:h-96 bg-gray-200 overflow-hidden relative rounded-[2.5rem] shadow-xl border border-white">
                        <img
                            src={business.banner_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80'}
                            alt={business.nombre}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#102218]/60 via-transparent to-transparent" />

                        {/* Favorite Button */}
                        <button
                            onClick={toggleFavorite}
                            className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all active:scale-95 shadow-lg border border-white/10 group/heart"
                        >
                            <Heart className={`w-6 h-6 transition-all duration-300 ${isFavorite ? 'fill-[#22C55E] text-[#22C55E] scale-110' : 'text-white group-hover/heart:scale-110'}`} />
                        </button>
                    </div>

                    {/* Profile Info Container */}
                    <div className="flex flex-col items-center -mt-16 md:-mt-20 z-10 relative px-4">
                        {/* Avatar/Logo */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="size-32 md:size-40 rounded-full border-[6px] border-[#f6f8f7] bg-white shadow-2xl overflow-hidden flex items-center justify-center p-1"
                        >
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#4ADE80]/10">
                                <img
                                    src={business.logo_url || `https://ui-avatars.com/api/?name=${business.nombre}&background=22C55E&color=111814&bold=true&size=512`}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </motion.div>

                        {/* Text Content */}
                        <div className="mt-6 text-center max-w-2xl px-4">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-4xl md:text-5xl font-black text-[#111814] mb-3 tracking-tighter"
                            >
                                {business.nombre}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-[#22C55E] font-bold text-xl mb-5 tracking-tight"
                            >
                                {business.slogan || 'Sabor auténtico en cada plato'}
                            </motion.p>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-[#618972] text-base md:text-lg leading-relaxed font-medium"
                            >
                                {business.descripcion || 'Bienvenido a nuestro restaurante. Disfruta de la mejor experiencia culinaria con ingredientes frescos y recetas preparadas con pasión.'}
                            </motion.p>

                            {/* Quick Info Badges */}
                            <div className="flex flex-wrap justify-center gap-3 mt-8">
                                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Verificado
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                                    <Star className="w-4 h-4 fill-orange-700" />
                                    4.9 (1.2k)
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border ${!(scheduleData?.isClosed ?? !business.abierto)
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    {!(scheduleData?.isClosed ?? !business.abierto) ? 'Abierto ahora' : 'Cerrado'}
                                </div>
                            </div>

                            {/* Social Media Icons */}
                            <div className="flex justify-center gap-4 mt-8 pb-2">
                                {/* WhatsApp Business */}
                                {business.whatsapp && (
                                    <motion.a
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-sm border border-[#25D366]/20"
                                        title="WhatsApp de Pedidos"
                                    >
                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </motion.a>
                                )}

                                {/* Instagram */}
                                {business.instagram_url && (
                                    <motion.a
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={business.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white transition-all shadow-sm border border-pink-500/20"
                                        title="Instagram"
                                    >
                                        <Instagram className="w-5 h-5" />
                                    </motion.a>
                                )}

                                {/* Facebook */}
                                {business.facebook_url && (
                                    <motion.a
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={business.facebook_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-600/20"
                                        title="Facebook"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </motion.a>
                                )}

                                {/* TikTok */}
                                {business.tiktok_url && (
                                    <motion.a
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        href={business.tiktok_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-900 hover:bg-black hover:text-white transition-all shadow-sm border border-slate-900/20"
                                        title="TikTok"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27 1.03-1.51 1.8-.31.82-.28 1.73.08 2.51.26.6.68 1.14 1.22 1.51.51.35 1.12.53 1.74.54 1.14.03 2.25-.51 2.91-1.44.27-.41.43-.88.46-1.37.07-2.17.03-4.35.05-6.52.02-3.13.01-6.25.03-9.37z" />
                                        </svg>
                                    </motion.a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Divider */}
                <div className="max-w-[1200px] mx-auto px-4 md:px-10 mt-12 mb-10">
                    <div className="h-px bg-[#f0f4f2] w-full" />
                </div>

                {/* Featured Products */}
                {/* Featured Products */}
                <section className="px-4 md:px-10 mb-10 w-full overflow-hidden max-w-[1200px] mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#111814]">Destacados del Menú</h2>
                        <Link to={`/${slug}/menu`} className="text-[#22C55E] text-sm font-semibold hover:underline">
                            Ver todo
                        </Link>
                    </div>

                    <div className="relative group/carousel">
                        {/* Carousel Container */}
                        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
                            {featuredProducts.length > 0 ? (
                                featuredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/${slug}/menu`)}
                                        className="min-w-[280px] md:min-w-[320px] snap-center flex flex-col gap-3 rounded-xl bg-white shadow-sm border border-[#f0f4f2] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="w-full h-48 md:h-56 relative overflow-hidden">
                                            <img
                                                src={product.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                                                alt={product.nombre}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
                                                {product.etiqueta && (
                                                    <span className="bg-[#4ADE80] text-[#111814] text-[8px] md:text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10 ring-1 ring-white/20 flex items-center gap-1">
                                                        <div className="size-1 rounded-full bg-white animate-pulse" />
                                                        {product.etiqueta}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 pt-3 flex flex-col gap-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-[#111814] text-base leading-tight flex-1 line-clamp-1">{product.nombre}</h3>
                                                <div className="flex items-center gap-2">
                                                    {product.oferta_porcentaje && (
                                                        <span className="bg-[#ff4b4b] text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                                                            -{product.oferta_porcentaje}%
                                                        </span>
                                                    )}
                                                    {product.precio > 0 && (
                                                        <span className="text-[#22C55E] font-black text-base">{formatCurrency(product.precio)}</span>
                                                    )}
                                                    {product.precio_original > 0 && product.precio_original > product.precio && (
                                                        <span className="text-gray-400 line-through text-[10px] font-bold">
                                                            {formatCurrency(product.precio_original)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-[#618972] line-clamp-2 leading-snug">
                                                {product.descripcion || "Platillo delicioso preparado con ingredientes frescos de la mejor calidad."}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                    <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium text-sm">No hay productos destacados aún</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Location and Info */}
                <section className="max-w-[1200px] mx-auto px-4 md:px-10 mb-24">
                    <h2 className="text-2xl font-black text-[#111814] mb-8 tracking-tight">Ubicación y Horarios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                        <div className="md:col-span-5 flex flex-col gap-4">
                            {/* Address Card */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f4f2] flex gap-5 hover:border-[#22C55E]/30 transition-colors">
                                <div className="bg-[#4ADE80]/10 p-4 rounded-2xl h-fit text-[#22C55E]">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[#111814] mb-1">Dirección</h3>
                                    <p className="text-[#618972] text-sm leading-relaxed">{business.direccion || 'Av. Principal 123, Ciudad'}</p>
                                </div>
                            </div>

                            {/* Contact Card */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f4f2] flex gap-5 hover:border-[#22C55E]/30 transition-colors">
                                <div className="bg-[#4ADE80]/10 p-4 rounded-2xl h-fit text-[#22C55E]">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-[#111814] mb-1">Contacto</h3>
                                    <p className="text-[#618972] text-sm leading-relaxed">{business.telefono || business.whatsapp || 'Llámanos ahora'}</p>
                                    {(business.telefono || business.whatsapp) && (
                                        <Button
                                            variant="link"
                                            className="text-[#22C55E] p-0 h-auto font-bold text-xs mt-2 hover:no-underline"
                                            onClick={() => window.location.href = `tel:${(business.telefono || business.whatsapp).replace(/\D/g, '')}`}
                                        >
                                            Llamar ahora
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Hours Card */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f4f2] flex gap-5 hover:border-[#22C55E]/30 transition-colors">
                                <div className="bg-[#4ADE80]/10 p-4 rounded-2xl h-fit text-[#22C55E]">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[#111814] mb-1">Horario</h3>
                                    {(() => {
                                        let horarios = business.horarios;
                                        if (typeof horarios === 'string' && horarios.trim().startsWith('{')) {
                                            try { horarios = JSON.parse(horarios); } catch (e) { }
                                        }

                                        if (typeof horarios === 'object' && horarios !== null) {
                                            return (
                                                <div className="space-y-1">
                                                    <p className="text-[#618972] text-sm leading-relaxed">
                                                        <span className="font-bold text-[#618972] opacity-80">Lun - Vie: </span>
                                                        {horarios.semana || horarios.week || 'Consultar'}
                                                    </p>
                                                    {(horarios.sabado || horarios.saturday) && (
                                                        <p className="text-[#618972] text-sm leading-relaxed">
                                                            <span className="font-bold text-[#618972] opacity-80">Sábados: </span>
                                                            {horarios.sabado || horarios.saturday}
                                                        </p>
                                                    )}
                                                    <p className="text-[#618972] text-sm leading-relaxed">
                                                        <span className="font-bold text-[#618972] opacity-80">Dom - Fest: </span>
                                                        {horarios.domingos || horarios.sunday || horarios.fines || horarios.weekend || 'Consultar'}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return <p className="text-[#618972] text-sm leading-relaxed whitespace-pre-wrap">{horarios || 'Lun - Vie: 12:00 PM - 10:00 PM'}</p>;
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-7 bg-white p-2 rounded-[2.5rem] shadow-sm border border-[#f0f4f2] h-[300px] md:min-h-full overflow-hidden">
                            <div className="w-full h-full bg-gray-100 rounded-[2rem] relative overflow-hidden group">
                                <iframe
                                    title="Ubicación del Negocio"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(business.direccion || 'Colombia')}&output=embed&hl=es`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    className="opacity-90 group-hover:opacity-100 transition-all duration-700"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Floating Bottom CTA */}
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 w-full z-50 bg-white/80 dark:bg-[#1a2e22]/95 backdrop-blur-xl border-t border-[#f0f4f2] py-3 px-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]"
                >
                    <div className="max-w-[1200px] mx-auto flex items-center justify-center sm:justify-between gap-6 px-2 md:px-6">
                        <div className="hidden sm:flex flex-col">
                            <span className="text-[10px] text-[#618972] uppercase tracking-[0.2em] font-black">¿Tienes hambre?</span>
                            <span className="text-sm font-bold text-[#111814]">Explora nuestra carta completa</span>
                        </div>
                        <Button
                            onClick={() => navigate(`/${slug}/menu`)}
                            className="w-full max-w-[280px] sm:w-auto sm:min-w-[200px] h-12 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-sm font-black rounded-xl shadow-lg shadow-[#4ADE80]/30 transform active:scale-95 transition-all flex items-center justify-center gap-2 overflow-hidden group mx-auto sm:mx-0"
                        >
                            <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                                <UtensilsCrossed className="w-4 h-4" />
                            </div>
                            <span>VER MENÚ</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </motion.div>
            </div >
            <BusinessClosedModal
                isOpen={showClosedModal}
                onClose={() => setShowClosedModal(false)}
                scheduleData={scheduleData}
            />
            <PromoModal business={business} />
        </PublicLayout >
    );
};

export default function BusinessHomePage() {
    return <BusinessHomePageContent />;
}
