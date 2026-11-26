import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    Plus,
    Minus,
    Search,
    ArrowLeft,
    Star,
    UtensilsCrossed,
    Filter,
    Sparkles,
    CheckCircle2,
    User,
    X,
    Send,
    MapPin,
    Phone,
    CreditCard,
    ChefHat,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Heart,
    Clock,
    Ticket,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import LandingAgent from '@/components/LandingAgent';
import RuletaPremiosModal from '@/components/RuletaPremiosModal';
import {
    loadWheelConfigLocal,
    getCouponsForUser,
    validateCouponCode,
    markCouponAsUsed,
    PENDING_COUPON_KEY,
} from '@/utils/wheelDefaults';
import { repairProductImages } from '@/utils/demoMockAdapter';
import {
    loadMenuIngredientsLocal,
    evaluateProductIngredients,
    ensureVecosMenuMigration,
} from '@/utils/menuIngredients';
import { VECOS_CATEGORIES, VECOS_PRODUCTS } from '@/utils/vecosMenuData';

// Normalización fonética para búsquedas tolerantes en español (acentos, s/z/c, b/v, ll/y)
const normalizeSearchText = (text) => {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/z/g, 's')
        .replace(/c([ei])/g, 's$1')
        .replace(/v/g, 'b')
        .replace(/ll/g, 'y')
        .trim();
};

// Datos oficiales de Veco's Restaurante
const DEMO_BUSINESS = {
    nombre: "Veco's Restaurante",
    logo_url: "/images/vecos-logo.jpg",
    banner_url: "/images/hero-almuerzo.jpg",
    slogan: "Sabor que te encanta — Ejecutivos, Preparados del Día, Asados al carbón, Vaqueritos y Picadas.",
    banner_tag: "Sabor que te encanta",
    banner_title: "Nuestro Menú",
    banner_description: "Ejecutivos, Preparados del Día, Asados al carbón, Vaqueritos y Picadas. Valor de icopor por almuerzo: $1.000.",
    slug: "demo-restaurante"
};

const DEMO_CATEGORIES = [
    { nombre: 'Todas', icono: '🍽️' },
    ...VECOS_CATEGORIES
];

const DEMO_PRODUCTS = [
    // Ejecutivos del Día
    {
        id: 1,
        categoria: 'Ejecutivos del Día',
        nombre: 'Churrasco a la Brasa (250g)',
        precio: 22000,
        descripcion: 'Corte jugoso al carbón con chimichurri de la casa, arroz con cilantro, tajadas maduras y ensalada fresca.',
        imagen: '/images/hero-almuerzo.jpg',
        destacado: true,
        etiqueta: 'MÁS PEDIDO',
        nutri_kcal: 720,
        nutri_proteina: '48g',
        nutri_carbohidratos: '42g',
        nutri_grasa: '32g',
        prep_time_minutes: 15,
        tamanos: [
            {
                nombre: "Término de la Carne",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Término Medio (Jugoso)", precio: 0 },
                    { nombre: "Tres Cuartos (3/4)", precio: 0 },
                    { nombre: "Bien Asado", precio: 0 }
                ]
            }
        ],
        modificadores: [
            {
                nombre: "Adicionales del Fogón",
                obligatorio: false,
                seleccion_maxima: 3,
                opciones: [
                    { nombre: "Aguacate Hass Extra", precio: 3000 },
                    { nombre: "Porción de Chicharrón Carnudo", precio: 6500 },
                    { nombre: "Huevo Frito", precio: 2000 }
                ]
            }
        ],
        opciones: [
            {
                nombre: "Sopa del Día Incluida",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Crema de Ahuyama Rostizada", precio: 0 },
                    { nombre: "Consomé de Pollo y Verduras", precio: 0 },
                    { nombre: "Sin Sopa", precio: 0 }
                ]
            }
        ]
    },
    {
        id: 2,
        categoria: 'Ejecutivos del Día',
        nombre: 'Pechuga al Romero y Limón',
        precio: 18500,
        descripcion: 'Pechuga marinada 12 horas en finas hierbas, puré de papa rústico al ajo y vegetales rostizados.',
        imagen: '/images/plato-pollo.jpg',
        destacado: true,
        etiqueta: 'LIGERO',
        nutri_kcal: 540,
        nutri_proteina: '52g',
        nutri_carbohidratos: '34g',
        nutri_grasa: '16g',
        prep_time_minutes: 12,
        tamanos: [
            {
                nombre: "Preparación",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "A la Plancha con Romero", precio: 0 },
                    { nombre: "Gratinada con Queso", precio: 3500 }
                ]
            }
        ],
        modificadores: [
            {
                nombre: "Acompañamiento",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Puré Rústico al Ajo", precio: 0 },
                    { nombre: "Papas a la Francesa", precio: 0 },
                    { nombre: "Arroz con Cilantro", precio: 0 }
                ]
            }
        ],
        opciones: [
            {
                nombre: "Sopa del Día",
                obligatorio: false,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Crema de Ahuyama", precio: 0 },
                    { nombre: "Consomé Casero", precio: 0 }
                ]
            }
        ]
    },
    {
        id: 3,
        categoria: 'Ejecutivos del Día',
        nombre: 'Sobrebarriga Criolla en Salsa',
        precio: 19500,
        descripcion: 'Cocción lenta de 4 horas en salsa de tomate asado y cebolla, papa chorreada, arroz blanco y aguacate.',
        imagen: '/images/plato-cazuela.jpg',
        destacado: true,
        etiqueta: 'ESPECIALIDAD',
        nutri_kcal: 680,
        nutri_proteina: '44g',
        nutri_carbohidratos: '52g',
        nutri_grasa: '28g',
        prep_time_minutes: 10,
        tamanos: [
            {
                nombre: "Presentación",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "En Salsa Criolla (Hogao)", precio: 0 },
                    { nombre: "A la Brasa / Dorada", precio: 0 }
                ]
            }
        ],
        modificadores: [
            {
                nombre: "Extras",
                obligatorio: false,
                seleccion_maxima: 2,
                opciones: [
                    { nombre: "Extra Salsa Criolla", precio: 1500 },
                    { nombre: "Tajada de Aguacate", precio: 2500 }
                ]
            }
        ]
    },
    {
        id: 4,
        categoria: 'Ejecutivos del Día',
        nombre: 'Filete de Tilapia al Ajillo',
        precio: 21000,
        descripcion: 'Pesca fresca sellada en mantequilla clarificada, patacones crujientes, arroz con coco y ensalada de mango.',
        imagen: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80',
        destacado: false,
        etiqueta: 'FRESCO',
        nutri_kcal: 510,
        nutri_proteina: '42g',
        nutri_carbohidratos: '38g',
        nutri_grasa: '18g',
        prep_time_minutes: 14,
        opciones: [
            {
                nombre: "Acompañamiento",
                obligatorio: false,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Patacones Crujientes", precio: 0 },
                    { nombre: "Papa Criolla Frita", precio: 0 }
                ]
            }
        ]
    },
    {
        id: 5,
        categoria: 'Ejecutivos del Día',
        nombre: 'Costillitas al Fogón Criollo',
        precio: 20500,
        precio_original: 23000,
        oferta_porcentaje: 11,
        descripcion: 'Costillitas tiernas doradas a fuego vivo con yuca al vapor, arroz parbolizado y suero costeño artesanal.',
        imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        destacado: false,
        etiqueta: 'OFERTA',
        nutri_kcal: 760,
        nutri_proteina: '46g',
        nutri_carbohidratos: '48g',
        nutri_grasa: '36g',
        prep_time_minutes: 15
    },

    // Cazuelas & Olla
    {
        id: 6,
        categoria: 'Cazuelas & Olla',
        nombre: 'Cazuela de Frijoles de la Casa',
        precio: 24000,
        descripcion: 'Frijoles rojos cremosos con chicharrón carnudo, carne desmechada, maduritos, aguacate, arroz y arepa asada.',
        imagen: '/images/plato-cazuela.jpg',
        destacado: true,
        etiqueta: 'IMPERDIBLE',
        nutri_kcal: 890,
        nutri_proteina: '46g',
        nutri_carbohidratos: '88g',
        nutri_grasa: '42g',
        prep_time_minutes: 10,
        tamanos: [
            {
                nombre: "Tamaño Cazuela",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Cazuela Estándar", precio: 0 },
                    { nombre: "Cazuela Doble Chicharrón", precio: 5000 }
                ]
            }
        ],
        modificadores: [
            {
                nombre: "Adicionales",
                obligatorio: false,
                seleccion_maxima: 3,
                opciones: [
                    { nombre: "Huevo Frito Campesino", precio: 2000 },
                    { nombre: "Arepa Extra con Mantequilla", precio: 1500 },
                    { nombre: "Porción de Aguacate", precio: 3000 }
                ]
            }
        ]
    },
    {
        id: 7,
        categoria: 'Cazuelas & Olla',
        nombre: 'Ajiaco Santafereño Tradicional',
        precio: 23000,
        descripcion: 'Tres variedades de papa, pollo desmechado, mazorca tierna, guascas, alcaparras, crema de leche y aguacate.',
        imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80',
        destacado: true,
        etiqueta: 'SOLO JUE-DOM',
        nutri_kcal: 640,
        nutri_proteina: '38g',
        nutri_carbohidratos: '76g',
        nutri_grasa: '20g',
        prep_time_minutes: 10,
        opciones: [
            {
                nombre: "Acompañamiento",
                obligatorio: false,
                seleccion_maxima: 2,
                opciones: [
                    { nombre: "Con Crema y Alcaparras", precio: 0 },
                    { nombre: "Alcaparras Aparte", precio: 0 }
                ]
            }
        ]
    },
    {
        id: 8,
        categoria: 'Cazuelas & Olla',
        nombre: 'Sancocho Trifásico en Leña',
        precio: 25000,
        descripcion: 'Caldo concentrado con res, cerdo y pollo, yuca, plátano verde, mazorca, arroz blanco y ají casero.',
        imagen: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80',
        destacado: false,
        etiqueta: 'FIN DE SEMANA',
        nutri_kcal: 750,
        nutri_proteina: '45g',
        nutri_carbohidratos: '70g',
        nutri_grasa: '30g',
        prep_time_minutes: 10
    },
    {
        id: 9,
        categoria: 'Cazuelas & Olla',
        nombre: 'Mondongo Criollo Paisa',
        precio: 22000,
        descripcion: 'Caldo espeso con carne de cerdo en trocitos, papa criolla, verduras picadas finas, arroz, banano y arepa.',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        destacado: false,
        etiqueta: 'TRADICIONAL',
        nutri_kcal: 620,
        nutri_proteina: '40g',
        nutri_carbohidratos: '62g',
        nutri_grasa: '24g',
        prep_time_minutes: 10
    },

    // Parrilla & Bowls
    {
        id: 10,
        categoria: 'Parrilla & Bowls',
        nombre: 'Punta de Anca al Carbón (300g)',
        precio: 32000,
        descripcion: 'Asada al término de tu elección, acompañada de papa criolla salteada, ensalada verde y chimichurri.',
        imagen: '/images/hero-almuerzo.jpg',
        destacado: true,
        etiqueta: 'CORTE PREMIUM',
        nutri_kcal: 780,
        nutri_proteina: '68g',
        nutri_carbohidratos: '28g',
        nutri_grasa: '44g',
        prep_time_minutes: 18,
        tamanos: [
            {
                nombre: "Término de Cocción",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Término Medio (Jugoso)", precio: 0 },
                    { nombre: "Tres Cuartos (3/4)", precio: 0 },
                    { nombre: "Bien Asado", precio: 0 }
                ]
            }
        ],
        modificadores: [
            {
                nombre: "Acompañamiento",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Papa Criolla Salteada", precio: 0 },
                    { nombre: "Yuca al Vapor con Chimichurri", precio: 0 },
                    { nombre: "Papas Rústicas", precio: 0 }
                ]
            }
        ]
    },
    {
        id: 11,
        categoria: 'Parrilla & Bowls',
        nombre: 'Bowl Mediodía Saludable',
        precio: 19000,
        descripcion: 'Base de arroz integral y quinua, pollo a la plancha, aguacate, maíz tierno, tomate cherry y vinagreta cítrica.',
        imagen: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80',
        destacado: false,
        etiqueta: 'BALANCEADO',
        is_vegetarian: true,
        nutri_kcal: 480,
        nutri_proteina: '36g',
        nutri_carbohidratos: '48g',
        nutri_grasa: '14g',
        prep_time_minutes: 10,
        modificadores: [
            {
                nombre: "Proteína del Bowl",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "Pechuga de Pollo a la Plancha", precio: 0 },
                    { nombre: "Tofu Salteado al Ajillo (Vegano)", precio: 0 },
                    { nombre: "Lomito Asado (+4.000)", precio: 4000 }
                ]
            }
        ]
    },
    {
        id: 12,
        categoria: 'Parrilla & Bowls',
        nombre: 'Costillas BBQ de Guayaba',
        precio: 28000,
        precio_original: 31000,
        oferta_porcentaje: 10,
        descripcion: 'Costillas de cerdo glaseadas en salsa artesanal de guayaba y especias, con papas rústicas y coleslaw.',
        imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        destacado: true,
        etiqueta: 'FAVORITO',
        nutri_kcal: 860,
        nutri_proteina: '54g',
        nutri_carbohidratos: '42g',
        nutri_grasa: '52g',
        prep_time_minutes: 16
    },
    {
        id: 13,
        categoria: 'Parrilla & Bowls',
        nombre: 'Lomo de Cerdo al Carbón',
        precio: 26000,
        descripcion: 'Corte tierno de lomo sellado en parrilla de leña, con papas a la francesa caseras y ensalada de repollo agridulce.',
        imagen: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80',
        destacado: false,
        etiqueta: 'AL CARBÓN',
        nutri_kcal: 690,
        nutri_proteina: '58g',
        nutri_carbohidratos: '32g',
        nutri_grasa: '26g',
        prep_time_minutes: 15
    },

    // Bebidas & Postres
    {
        id: 14,
        categoria: 'Bebidas & Postres',
        nombre: 'Limonada de Hierbabuena y Panela',
        precio: 6500,
        descripcion: 'Limón tahití recién exprimido con hojas frescas de hierbabuena y toque de panela orgánica.',
        imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
        destacado: false,
        etiqueta: 'REFRESCANTE',
        nutri_kcal: 110,
        nutri_proteina: '0g',
        nutri_carbohidratos: '28g',
        nutri_grasa: '0g',
        prep_time_minutes: 3
    },
    {
        id: 15,
        categoria: 'Bebidas & Postres',
        nombre: 'Jugo Natural de Maracuyá o Mango',
        precio: 7000,
        descripcion: 'Pulpa 100% natural preparada al momento en agua o leche.',
        imagen: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&q=80',
        destacado: false,
        etiqueta: 'NATURAL',
        nutri_kcal: 140,
        nutri_proteina: '1g',
        nutri_carbohidratos: '34g',
        nutri_grasa: '0g',
        prep_time_minutes: 3,
        opciones: [
            {
                nombre: "Preparación",
                obligatorio: true,
                seleccion_maxima: 1,
                opciones: [
                    { nombre: "En Agua", precio: 0 },
                    { nombre: "En Leche Entera (+1.500)", precio: 1500 },
                    { nombre: "En Leche Deslactosada (+1.500)", precio: 1500 }
                ]
            }
        ]
    },
    {
        id: 16,
        categoria: 'Bebidas & Postres',
        nombre: 'Flan de Caramelo & Café',
        precio: 8500,
        descripcion: 'Receta cremosa de la casa con baño de caramelo oscuro y toque de café colombiano.',
        imagen: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&q=80',
        destacado: true,
        etiqueta: 'POSTRE',
        nutri_kcal: 320,
        nutri_proteina: '6g',
        nutri_carbohidratos: '44g',
        nutri_grasa: '14g',
        prep_time_minutes: 2
    },
    {
        id: 17,
        categoria: 'Bebidas & Postres',
        nombre: 'Torta Tibia de Almojábana con Bocadillo',
        precio: 9000,
        descripcion: 'Dulce tradicional horneado con queso campesino y centro derretido de guayaba de Vélez.',
        imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80',
        destacado: false,
        etiqueta: 'ARTESANAL',
        nutri_kcal: 360,
        nutri_proteina: '8g',
        nutri_carbohidratos: '52g',
        nutri_grasa: '14g',
        prep_time_minutes: 4
    },
    {
        id: 18,
        categoria: 'Bebidas & Postres',
        nombre: 'Limonada de Coco Cremosa',
        precio: 9500,
        precio_original: 11000,
        oferta_porcentaje: 14,
        descripcion: 'Refrescante mezcla frozen de limón fresco, crema de coco artesanal y hielo frapeado.',
        imagen: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&q=80',
        destacado: false,
        etiqueta: 'FROZEN',
        nutri_kcal: 210,
        nutri_proteina: '2g',
        nutri_carbohidratos: '30g',
        nutri_grasa: '10g',
        prep_time_minutes: 4
    }
];

export default function DemoRestaurante() {
    const navigate = useNavigate();
    const [businessLogo, setBusinessLogo] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_logo') : null) || DEMO_BUSINESS.logo_url);
    const [businessBanner, setBusinessBanner] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_banner') : null) || DEMO_BUSINESS.banner_url);

    useEffect(() => {
        const updateBrand = () => {
            const l = localStorage.getItem('fogon_mesa_logo');
            const b = localStorage.getItem('fogon_mesa_banner');
            if (l) setBusinessLogo(l);
            if (b) setBusinessBanner(b);
        };
        updateBrand();
        window.addEventListener('storage', updateBrand);
        return () => window.removeEventListener('storage', updateBrand);
    }, []);

    const [activeCategory, setActiveCategory] = useState('Todas');
    const [specialFilter, setSpecialFilter] = useState(null); // 'destacados', 'ofertas', or null
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWheelOpen, setIsWheelOpen] = useState(false);
    const [wheelActive, setWheelActive] = useState(() => loadWheelConfigLocal().activo !== false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedModifiers, setSelectedModifiers] = useState([]);
    const [qty, setQty] = useState(1);
    const [productNotes, setProductNotes] = useState('');
    const categoriesRef = useRef(null);

    const scrollCategories = (direction) => {
        if (categoriesRef.current) {
            const scrollAmount = 300;
            categoriesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Checkout States
    const [step, setStep] = useState('cart'); // 'cart', 'checkout', 'success'
    const [checkoutData, setCheckoutData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        metodo: 'WhatsApp'
    });
    const [checkoutErrors, setCheckoutErrors] = useState({});
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);

    // Pre-cargar datos del cliente si existen en el perfil local
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('universal_client_profile');
            const parsed = savedProfile ? JSON.parse(savedProfile) : null;
            const savedAddresses = localStorage.getItem('universal_client_addresses');
            const parsedAddrs = savedAddresses ? JSON.parse(savedAddresses) : null;
            const primaryAddr = Array.isArray(parsedAddrs) ? (parsedAddrs.find(a => a.es_principal)?.direccion || parsedAddrs[0]?.direccion) : '';

            setCheckoutData(prev => ({
                ...prev,
                nombre: prev.nombre || parsed?.nombre || '',
                telefono: prev.telefono || parsed?.telefono || '',
                direccion: prev.direccion || primaryAddr || ''
            }));
        } catch (e) {
            console.warn('Error reading stored client profile for checkout', e);
        }
    }, []);

    const formatCurrency = (value) => {
        if (value === undefined || value === null || isNaN(value) || Number(value) === 0) return '$ 0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(Number(value));
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

    const cartTotal = cart.reduce((acc, item) => acc + (item.precio * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const ICOPOR_PER_ITEM = 1000;
    const icoporTotal = cartCount * ICOPOR_PER_ITEM;

    const discountAmount = appliedCoupon?.coupon?.premio_tipo === 'descuento'
        ? Math.round((cartTotal * Number(appliedCoupon.coupon.premio_valor || 0)) / 100)
        : 0;
    const finalTotal = Math.max(0, cartTotal - discountAmount) + icoporTotal;

    // Load active wheel coupons and auto-apply pending coupon from Profile
    useEffect(() => {
        let userPhone = '';
        try {
            const savedProfile = localStorage.getItem('universal_client_profile');
            if (savedProfile) userPhone = JSON.parse(savedProfile).telefono || '';
        } catch {}
        const active = getCouponsForUser(userPhone).filter((c) => c.isActive);
        setAvailableCoupons(active);

        try {
            const pendingCode = localStorage.getItem(PENDING_COUPON_KEY);
            if (pendingCode && !appliedCoupon) {
                setCouponCodeInput(pendingCode);
                if (cartTotal > 0) {
                    const res = validateCouponCode(pendingCode, cartTotal);
                    if (res.valid) {
                        setAppliedCoupon(res);
                    }
                }
            }
        } catch {}
    }, [isCartOpen, isWheelOpen, cartTotal]);

    // If cart total drops below coupon minimum, remove applied coupon cleanly
    useEffect(() => {
        if (!appliedCoupon) return;
        const minReq = Number(appliedCoupon.coupon?.compra_minima || 0);
        if (minReq > 0 && cartTotal < minReq) {
            setAppliedCoupon(null);
            toast.info(`El cupón requiere un consumo mínimo de ${formatCurrency(minReq)}.`);
        }
    }, [cartTotal]);

    const handleApplyCoupon = (codeToApply) => {
        const targetCode = (codeToApply ?? couponCodeInput).trim();
        const res = validateCouponCode(targetCode, cartTotal);
        if (!res.valid) {
            toast.error(res.error);
            return;
        }
        setAppliedCoupon(res);
        setCouponCodeInput(res.coupon.codigo_cupon);
        toast.success(`¡Cupón aplicado! ${res.coupon.premio_emoji || '🎁'} ${res.coupon.premio_label}`);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCodeInput('');
        try { localStorage.removeItem(PENDING_COUPON_KEY); } catch {}
        toast.info('Cupón removido del pedido');
    };

    const loadClientMenuProducts = () => {
        ensureVecosMenuMigration();
        try {
            const saved = localStorage.getItem('fogon_mesa_custom_products');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return repairProductImages(parsed);
                }
            }
        } catch (e) {}
        return repairProductImages(JSON.parse(JSON.stringify(VECOS_PRODUCTS)));
    };

    const [menuProducts, setMenuProducts] = useState(loadClientMenuProducts);
    const [menuIngredients, setMenuIngredients] = useState(loadMenuIngredientsLocal);
    const [selectedIngredients, setSelectedIngredients] = useState({});

    useEffect(() => {
        const syncMenu = () => {
            setMenuProducts(loadClientMenuProducts());
            setMenuIngredients(loadMenuIngredientsLocal());
        };
        window.addEventListener('storage', syncMenu);
        window.addEventListener('focus', syncMenu);
        return () => {
            window.removeEventListener('storage', syncMenu);
            window.removeEventListener('focus', syncMenu);
        };
    }, []);

    const currentMenuProducts = menuProducts.filter((p) => p.disponible !== false);

    const cleanQuery = searchQuery.trim().toLowerCase();
    const phoneticQuery = normalizeSearchText(searchQuery);

    const filteredProducts = currentMenuProducts.filter(p => {
        const matchesSearch = cleanQuery === '' ||
            (p.nombre && (p.nombre.toLowerCase().includes(cleanQuery) || normalizeSearchText(p.nombre).includes(phoneticQuery))) ||
            (p.descripcion && (p.descripcion.toLowerCase().includes(cleanQuery) || normalizeSearchText(p.descripcion).includes(phoneticQuery))) ||
            (p.categoria && (p.categoria.toLowerCase().includes(cleanQuery) || normalizeSearchText(p.categoria).includes(phoneticQuery))) ||
            (p.etiqueta && (p.etiqueta.toLowerCase().includes(cleanQuery) || normalizeSearchText(p.etiqueta).includes(phoneticQuery)));

        if (!matchesSearch) return false;

        if (specialFilter === 'destacados') return p.destacado;
        if (specialFilter === 'ofertas') return (p.oferta_porcentaje && p.oferta_porcentaje > 0) || p.precio_original;

        // Si el usuario escribe una búsqueda activa, buscamos en toda la carta
        if (cleanQuery !== '') return true;

        return activeCategory === 'Todas' || p.categoria === activeCategory;
    });

    const destacados = currentMenuProducts.filter(p => p.destacado);
    const ofertas = currentMenuProducts.filter(p => p.oferta_porcentaje > 0);

    const handleConfirmOrder = () => {
        if (step === 'cart') {
            setStep('checkout');
            setCheckoutErrors({});
        } else if (step === 'checkout') {
            const newErrors = {};
            const missingLabels = [];

            if (!checkoutData.nombre || !checkoutData.nombre.trim()) {
                newErrors.nombre = 'Falta tu nombre';
                missingLabels.push('tu nombre');
            }
            if (!checkoutData.direccion || !checkoutData.direccion.trim()) {
                newErrors.direccion = 'Falta la dirección de entrega';
                missingLabels.push('la dirección de entrega');
            }
            if (!checkoutData.telefono || !checkoutData.telefono.trim()) {
                newErrors.telefono = 'Falta el número de WhatsApp / teléfono';
                missingLabels.push('el WhatsApp / teléfono');
            }

            if (Object.keys(newErrors).length > 0) {
                setCheckoutErrors(newErrors);

                if (missingLabels.length === 1) {
                    toast.error(`⚠️ Falta completar ${missingLabels[0]}`, {
                        description: 'Por favor ingresa este dato para poder confirmar y enviar tu pedido.',
                        duration: 4000
                    });
                } else {
                    toast.error(`⚠️ Faltan datos obligatorios`, {
                        description: `Por favor completa: ${missingLabels.join(', ')}.`,
                        duration: 5000
                    });
                }

                // Desplazar y enfocar el primer campo faltante
                const firstKey = Object.keys(newErrors)[0];
                setTimeout(() => {
                    const el = document.getElementById(`checkout-input-${firstKey}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                    }
                }, 50);
                return;
            }

            setCheckoutErrors({});

            if (appliedCoupon?.coupon?.codigo_cupon) {
                markCouponAsUsed(appliedCoupon.coupon.codigo_cupon);
            }
            setStep('success');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#C86414', '#1F1C1A', '#ffffff']
            });
        }
    };

    const computeProductUnitPrice = (product, modifiers = []) => {
        if (!product) return 0;
        const sizeNames = new Set(
            (product.tamanos || []).flatMap((g) => (g.opciones || []).map((o) => o.nombre))
        );
        const selectedSize = modifiers.find((m) => m.isSize || sizeNames.has(m.nombre));
        const extrasTotal = modifiers
            .filter((m) => !(m.isSize || sizeNames.has(m.nombre)))
            .reduce((acc, m) => acc + (Number(m.precio || 0) * (m.cantidad || 1)), 0);

        // Si el cliente selecciona un tamaño con precio final, ese valor REEMPLAZA al precio de la tarjeta
        const basePrice = selectedSize && Number(selectedSize.precio) > 0
            ? Number(selectedSize.precio)
            : Number(product.precio || 0);

        return basePrice + extrasTotal;
    };

    const addToCartAndConfirm = () => {
        if (!selectedProduct) return;

        // Check if required modifiers are selected
        const allModifierGroups = [
            ...(selectedProduct.tamanos || []),
            ...(selectedProduct.modificadores || []),
            ...(selectedProduct.opciones || [])
        ];

        const missingRequired = allModifierGroups.find(group =>
            group.obligatorio && !selectedModifiers.some(m => group.opciones.some(opt => opt.nombre === m.nombre))
        );

        if (missingRequired) {
            toast.error(`Por favor selecciona: ${missingRequired.nombre}`);
            return;
        }

        const finalUnitPrice = computeProductUnitPrice(selectedProduct, selectedModifiers);

        const selectedIngNames = Object.values(selectedIngredients).flat().filter(Boolean);

        const cartItem = {
            id: selectedProduct.id + Date.now(),
            productId: selectedProduct.id,
            nombre: selectedProduct.nombre,
            precio: finalUnitPrice,
            quantity: qty,
            imagen: selectedProduct.imagen || selectedProduct.imagen_url || '/images/hero-almuerzo.jpg',
            notas: productNotes,
            modificadores_visual: [
                ...selectedIngNames,
                ...selectedModifiers.map(m => (m.cantidad && m.cantidad > 1) ? `${m.cantidad}x ${m.nombre}` : m.nombre)
            ]
        };

        setCart(prev => [...prev, cartItem]);
        setSelectedProduct(null);
        setSelectedIngredients({});
        toast.success(`${selectedProduct.nombre} agregado al carrito`);
    };

    const resetAll = () => {
        setCart([]);
        setStep('cart');
        setIsCartOpen(false);
        setAppliedCoupon(null);
        setCouponCodeInput('');
        setCheckoutData({ nombre: '', direccion: '', telefono: '', metodo: 'WhatsApp' });
    };

    const handleProductClick = (product) => {
        const ingEval = evaluateProductIngredients(product, menuIngredients);
        if (ingEval.soldOut) {
            toast.info(`"${product.nombre}" está agotado por hoy`);
            return;
        }
        // Pre-seleccionar el primer tamaño si el plato tiene tamaños configurados
        const defaultSizes = (product.tamanos || [])
            .map((g) => (g.opciones && g.opciones.length > 0 ? { ...g.opciones[0], isSize: true } : null))
            .filter(Boolean);
        setSelectedIngredients({});
        setSelectedProduct(product);
        setQty(1);
        setSelectedModifiers(defaultSizes);
        setProductNotes('');
    };

    const ProductCard = ({ product }) => {
        const ingEval = evaluateProductIngredients(product, menuIngredients);
        const isSoldOut = ingEval.soldOut;

        return (
        <motion.div
            layout
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group bg-[#231F1D] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border transition-all duration-300 flex flex-row h-auto ${
                isSoldOut
                    ? 'opacity-55 grayscale-[40%] border-red-500/30 cursor-not-allowed'
                    : 'border-white/10 shadow-lg hover:border-[#C86414]/60 hover:shadow-2xl cursor-pointer'
            }`}
            onClick={() => handleProductClick(product)}
        >
            {/* Left Column (Image + Prep Time) */}
            <div className="flex flex-col shrink-0">
                <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden m-2 md:m-3 rounded-2xl md:rounded-[2rem]">
                    <img
                        src={product.imagen || product.imagen_url || "/images/hero-almuerzo.jpg"}
                        alt={product.nombre}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/hero-almuerzo.jpg";
                        }}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isSoldOut ? '' : 'group-hover:scale-105'}`}
                    />

                    {/* Overlay Agotado si falta ingrediente obligatorio */}
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] z-30 flex items-center justify-center">
                            <span className="px-3 py-1 rounded-xl bg-red-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg border border-white/25">
                                Agotado
                            </span>
                        </div>
                    )}

                    {/* Badge Etiqueta - Fixed position (Left) */}
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20">
                        {product.etiqueta && (
                            <div className="bg-[#C86414] group-hover:bg-[#16A34A] transition-colors duration-300 text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg shadow-md border border-white/10 flex items-center gap-1 ring-1 ring-white/20">
                                <div className="size-1 rounded-full bg-white animate-pulse" />
                                {product.etiqueta}
                            </div>
                        )}
                    </div>

                    {/* Rating removed as requested */}

                </div>

                {/* Prep Time - Positioned in the white space below image */}
                {product.prep_time_minutes > 0 && (
                    <div className="flex justify-center -mt-1 mb-2 md:mb-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 rounded-xl bg-[#2563EB] text-white text-[8px] md:text-[10px] font-black border border-blue-300/40 shadow-md shadow-blue-600/25 transition-all duration-300 group-hover:bg-[#C86414] group-hover:text-white group-hover:border-[#C86414]">
                            <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 stroke-[3]" />
                            {product.prep_time_minutes} MIN
                        </div>
                    </div>
                )}
            </div>
            <div className="p-3 md:p-6 flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 md:mb-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-[#C86414]/15 border border-white/80 text-[7px] md:text-[10px] font-black text-[#F59E0B] uppercase tracking-wider shadow-sm">
                            {product.categoria}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {product.oferta_porcentaje > 0 && (
                            <div className="bg-[#E51919] text-white text-[8px] md:text-[11px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-lg shadow-md shadow-red-600/30 border border-transparent group-hover:border-white transition-all duration-300 inline-flex items-center gap-1 whitespace-nowrap">
                                🔥 -{product.oferta_porcentaje}%
                            </div>
                        )}
                    </div>
                </div>

                <h3
                    className="text-sm md:text-xl font-bold text-[#FBF9F5] group-hover:text-[#F59E0B] transition-colors mb-1 md:mb-1.5 leading-tight line-clamp-2 min-h-[1.2em] md:min-h-[1.5em]"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                    {product.nombre}
                </h3>
                <p className="text-[#C9C1B8] text-[10px] md:text-sm font-medium leading-tight md:leading-relaxed mb-2 line-clamp-2 md:line-clamp-3">
                    {product.descripcion}
                </p>

                {/* Nutritional Info (IA) - Compact row below description */}
                {(product.nutri_kcal || product.nutri_proteina || product.nutri_carbohidratos || product.nutri_grasa) && (
                    <div className="flex flex-nowrap items-center gap-1 md:gap-1.5 mb-2 pb-0.5 w-full overflow-x-auto no-scrollbar">
                        {product.nutri_kcal && (
                            <div title="Calorías" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#C86414]/10 text-[#C86414] text-[7px] md:text-[8px] font-black border border-[#C86414]/20 whitespace-nowrap">
                                🔥 {product.nutri_kcal} <span className="md:inline hidden">kcal</span>
                            </div>
                        )}
                        {product.nutri_proteina && (
                            <div title="Proteína" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#C86414]/10 text-[#C86414] text-[7px] md:text-[8px] font-black border border-[#C86414]/20 whitespace-nowrap">
                                🥩 {product.nutri_proteina} <span className="md:inline hidden">prot</span>
                            </div>
                        )}
                        {product.nutri_carbohidratos && (
                            <div title="Carbohidratos" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#C86414]/10 text-[#C86414] text-[7px] md:text-[8px] font-black border border-[#C86414]/20 whitespace-nowrap">
                                🍝 {product.nutri_carbohidratos} <span className="md:inline hidden">carb</span>
                            </div>
                        )}
                        {product.nutri_grasa && (
                            <div title="Grasa" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#C86414]/10 text-[#C86414] text-[7px] md:text-[8px] font-black border border-[#C86414]/20 whitespace-nowrap">
                                🥑 {product.nutri_grasa} <span className="md:inline hidden">grasa</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 md:pt-3 border-t border-white/10">
                    <div className="flex items-baseline gap-2 md:gap-3">
                        {product.precio > 0 && (
                            <span className="text-base md:text-2xl font-black text-[#FBF9F5]">{formatCurrency(product.precio)}</span>
                        )}
                        {product.precio_original > 0 && product.precio_original > product.precio && (
                            <span className="text-[9px] md:text-[13px] font-bold text-[#9A9086] line-through decoration-1 opacity-70">
                                {formatCurrency(product.precio_original)}
                            </span>
                        )}
                    </div>
                    {isSoldOut ? (
                        <div className="px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[9px] md:text-[11px] font-black uppercase tracking-wider">
                            Agotado
                        </div>
                    ) : (
                        <div className="size-9 md:size-12 bg-[#C86414] rounded-full flex items-center justify-center shadow-lg shadow-[#C86414]/25 text-white group-hover:scale-110 active:scale-95 transition-all border border-white/15">
                            <Plus className="w-4 h-4 md:w-6 md:h-6 stroke-[3]" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
        );
    };

    const ProductSection = ({ title, items, icon, rows, onVerTodo }) => {
        const displayItems = rows ? items.slice(0, rows * 2) : items;
        return (
            <div className="mb-16">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2
                        className="text-xl md:text-3xl font-bold text-[#FBF9F5] tracking-tight flex items-center gap-2.5"
                        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                        {icon}
                        {title}
                    </h2>
                    {onVerTodo && (
                        <button
                            onClick={onVerTodo}
                            className="flex h-8 items-center justify-center rounded-full px-4 bg-[#231F1D] border border-white/15 text-[#D9B99B] hover:border-[#C86414] hover:text-white transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                            Ver todo
                        </button>
                    )}
                </div>
                <div className="px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        {displayItems.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen bg-[#181615] pb-24 text-[#FBF9F5] antialiased"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* Top Header */}
            <header className="sticky top-0 z-50 bg-[#181615]/95 backdrop-blur-md border-b border-white/10 shadow-sm">
                <div className="px-4 md:px-10 py-3 max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3 group">
                            <div className="size-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                                <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-lg md:text-xl font-black tracking-tighter text-white truncate max-w-[100px] sm:max-w-[200px]">
                                {DEMO_BUSINESS.nombre}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setIsCartOpen(true);
                                setStep('cart');
                            }}
                            className="relative size-11 rounded-full bg-white border-2 border-[#C86414] flex items-center justify-center hover:bg-[#C86414] transition-all hover:scale-105 active:scale-95 group shadow-lg shadow-[#C86414]/10"
                        >
                            <ShoppingCart className="w-5 h-5 text-[#C86414] group-hover:text-white" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C86414] text-[10px] font-black text-[#1F1C1A] ring-2 ring-white">{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
                {/* Banner Section */}
                <div className="mb-10">
                    <div className="relative w-full h-80 md:h-[450px] rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181615]/95 via-[#181615]/45 to-transparent z-10" />
                        <img src={businessBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 z-20 w-full pb-20 md:pb-24 flex flex-col items-start gap-3 md:gap-4">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 md:py-2 text-[10px] font-black text-white bg-[#C86414] rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#C86414]/25">
                                <Star className="w-3 h-3 fill-white" />
                                {DEMO_BUSINESS.banner_tag}
                            </span>
                            <h1
                                className="text-3xl md:text-6xl font-bold text-white mb-2 md:mb-3 tracking-tight leading-none"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                            >
                                {DEMO_BUSINESS.banner_title}
                            </h1>
                            <p className="text-[#C9C1B8] text-sm md:text-lg max-w-xl font-medium leading-relaxed line-clamp-2 md:line-clamp-none">{DEMO_BUSINESS.banner_description}</p>
                        </div>
                    </div>
                    <div className="relative z-30 -mt-10 max-w-3xl mx-auto px-4">
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A9086] group-focus-within:text-[#F59E0B] transition-colors"><Search className="w-full h-full" /></div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Busquemos la comida que te gusta..."
                                className="w-full h-14 bg-[#231F1D] border border-white/15 rounded-full pl-14 pr-24 text-base font-medium shadow-2xl hover:border-[#C86414] focus:outline-none focus:border-[#C86414] focus:ring-2 focus:ring-[#C86414]/40 transition-all placeholder:text-[#9A9086] text-[#FBF9F5]"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                        title="Borrar búsqueda"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setFilterOpen(!filterOpen)}
                                    className={`p-2.5 rounded-full border transition-all shadow-sm active:scale-95 ${
                                        filterOpen || specialFilter !== null
                                            ? 'bg-[#C86414] border-[#C86414] text-white shadow-lg shadow-[#C86414]/30'
                                            : 'bg-[#181615] border-white/10 text-[#C9C1B8] hover:text-[#F59E0B]'
                                    }`}
                                    title="Filtrar platos"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Dropdown de Filtros */}
                            {filterOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setFilterOpen(false)}
                                    />
                                    <div className="absolute right-0 top-16 w-64 bg-[#231F1D] rounded-2xl shadow-2xl border border-white/15 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-1.5 text-[10px] font-black text-[#9A9086] uppercase tracking-widest border-b border-white/10 mb-2 flex items-center justify-between">
                                            <span>Filtrar Platos</span>
                                            {(specialFilter !== null || activeCategory !== 'Todas') && (
                                                <button
                                                    onClick={() => {
                                                        setSpecialFilter(null);
                                                        setActiveCategory('Todas');
                                                        setFilterOpen(false);
                                                    }}
                                                    className="text-[#F59E0B] hover:underline normal-case text-[11px] font-bold"
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>

                                        <div className="px-2 space-y-1 mb-2">
                                            <button
                                                onClick={() => {
                                                    setSpecialFilter(specialFilter === 'destacados' ? null : 'destacados');
                                                    setFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    specialFilter === 'destacados'
                                                        ? 'bg-[#C86414] text-white'
                                                        : 'text-[#FBF9F5] hover:bg-white/5'
                                                }`}
                                            >
                                                <Sparkles className="w-4 h-4 text-orange-400" />
                                                <span>Recomendados</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSpecialFilter(specialFilter === 'ofertas' ? null : 'ofertas');
                                                    setFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    specialFilter === 'ofertas'
                                                        ? 'bg-[#C86414] text-white'
                                                        : 'text-[#FBF9F5] hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="text-red-400 font-black text-xs">%</span>
                                                <span>Ofertas Especiales</span>
                                            </button>
                                        </div>

                                        <div className="px-4 py-1 text-[10px] font-black text-[#9A9086] uppercase tracking-widest border-t border-white/10 pt-2 mb-1">
                                            Por Categoría
                                        </div>

                                        <div className="px-2 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                                            {DEMO_CATEGORIES.map((cat, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setActiveCategory(cat.nombre);
                                                        setSpecialFilter(null);
                                                        setFilterOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                        activeCategory === cat.nombre && specialFilter === null
                                                            ? 'bg-[#C86414] text-white'
                                                            : 'text-[#FBF9F5] hover:bg-white/5'
                                                    }`}
                                                >
                                                    <span>{cat.icono}</span>
                                                    <span>{cat.nombre}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="flex items-center gap-2 md:gap-4 mb-12 overflow-hidden px-2 md:px-0">
                    {/* Botón de navegación Izquierdo (Flecha) */}
                    <button
                        onClick={() => scrollCategories('left')}
                        className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-[#231F1D] shadow-sm border border-white/10 text-[#F59E0B] hover:bg-[#C86414]/20 hover:border-[#C86414] transition-all active:scale-90"
                        aria-label="Anterior categoría"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>

                    {/* Área de Scrollable de Categorías */}
                    <div
                        ref={categoriesRef}
                        className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-4 px-2"
                    >
                        {DEMO_CATEGORIES.map((cat, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setActiveCategory(cat.nombre); setSpecialFilter(null); }}
                                className={`flex h-10 md:h-12 shrink-0 items-center justify-center gap-x-2.5 rounded-full px-6 md:px-8 transition-all active:scale-95 font-bold text-[10px] md:text-sm uppercase tracking-wider snap-start
                                ${activeCategory === cat.nombre && specialFilter === null
                                        ? 'bg-[#C86414] text-white shadow-xl shadow-[#C86414]/30 scale-105 ring-2 ring-[#F59E0B]/40'
                                        : 'bg-[#231F1D] border border-white/10 text-[#C9C1B8] hover:border-[#C86414] hover:text-white shadow-sm'}`}
                            >
                                <span className="text-lg md:text-2xl leading-none">{cat.icono}</span>
                                <span>{cat.nombre}</span>
                            </button>
                        ))}
                    </div>

                    {/* Botón de navegación Derecho (Flecha) */}
                    <button
                        onClick={() => scrollCategories('right')}
                        className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-[#231F1D] shadow-sm border border-white/10 text-[#F59E0B] hover:bg-[#C86414]/20 hover:border-[#C86414] transition-all active:scale-90"
                        aria-label="Siguiente categoría"
                    >
                        <ChevronRight className="w-7 h-7" />
                    </button>
                </div>

                {/* Sections */}
                {activeCategory === 'Todas' && specialFilter === null && cleanQuery === '' ? (
                    <>
                        <ProductSection title="Recomendados" items={destacados} icon={<Sparkles className="w-6 h-6 text-orange-400 fill-orange-400" />} onVerTodo={() => setSpecialFilter('destacados')} rows={2} />
                        <ProductSection title="Ofertas Especiales" items={ofertas} icon={<Sparkles className="w-6 h-6 text-red-500" />} onVerTodo={() => setSpecialFilter('ofertas')} rows={2} />
                        <ProductSection title="Nuestros Productos" items={DEMO_PRODUCTS} icon={<CheckCircle2 className="w-6 h-6 text-[#C86414]" />} />
                    </>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center px-4">
                        <div className="size-20 rounded-full bg-[#231F1D] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#C86414]">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-[#FBF9F5] mb-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                            No encontramos platos para "{searchQuery}"
                        </h3>
                        <p className="text-[#C9C1B8] text-sm max-w-md mx-auto mb-6">
                            Prueba buscando por otro término como churrasco, cazuela, pollo, ajiaco o limonada.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveCategory('Todas');
                                setSpecialFilter(null);
                            }}
                            className="px-6 py-2.5 rounded-full bg-[#C86414] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#e07318] transition-all shadow-lg shadow-[#C86414]/30"
                        >
                            Ver toda la carta
                        </button>
                    </div>
                ) : (
                    <ProductSection
                        title={
                            cleanQuery
                                ? `Resultados para "${searchQuery}" (${filteredProducts.length})`
                                : (specialFilter === 'destacados'
                                    ? 'Recomendados del Chef'
                                    : (specialFilter === 'ofertas'
                                        ? 'Ofertas Especiales'
                                        : activeCategory))
                        }
                        items={filteredProducts}
                        icon={<UtensilsCrossed className="w-6 h-6 text-[#C86414]" />}
                    />
                )}
            </main>

            {/* Cart/Checkout Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetAll} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white text-[#181615] z-[70] shadow-2xl flex flex-col">

                            <div className="p-6 border-b flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">{step === 'cart' ? 'Tu Pedido' : (step === 'checkout' ? 'Finalizar Pedido' : '¡Pedido Éxito!')}</h2>
                                    {step !== 'success' && <p className="text-xs font-bold text-[#665E57] uppercase tracking-wider">{cartCount} productos seleccionados</p>}
                                </div>
                                <button onClick={resetAll} className="p-2 border border-[#181615] text-[#181615] hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {step === 'cart' && (
                                    <div className="space-y-4">
                                        {cart.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                                <ShoppingCart className="w-16 h-16 text-gray-100 mb-4" />
                                                <p className="font-black text-gray-300">Aún no has añadido nada delicioso</p>
                                            </div>
                                        ) : cart.map((item) => (
                                            <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                                <div className="size-20 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-gray-900 truncate">{item.nombre}</h4>
                                                    {item.modificadores_visual && item.modificadores_visual.length > 0 && (
                                                        <p className="text-[10px] font-bold text-[#665E57] mb-1 leading-tight">
                                                            {item.modificadores_visual.join(' · ')}
                                                        </p>
                                                    )}
                                                    {item.notas && (
                                                        <p className="text-[9px] italic text-gray-400 truncate mb-1">"{item.notas}"</p>
                                                    )}
                                                    <p className="text-[#C86414] font-black text-sm">{formatCurrency(item.precio)}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-3 bg-white rounded-full p-1 border border-gray-200 shadow-sm text-[#181615]">
                                                            <button type="button" onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#181615] hover:text-[#C86414] transition-colors"><Minus className="w-4 h-4" /></button>
                                                            <span className="font-black text-xs w-5 text-center text-[#181615]">{item.quantity}</span>
                                                            <button type="button" onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#181615] hover:text-[#C86414] transition-colors"><Plus className="w-4 h-4" /></button>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 text-[10px] font-black uppercase tracking-wider">Eliminar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {step === 'checkout' && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-[#C86414]/10 border border-[#C86414]/20 rounded-2xl">
                                            <p className="text-[10px] font-black text-[#C86414] uppercase tracking-widest mb-1">Información de Entrega</p>
                                            <p className="text-xs font-medium text-[#1F1C1A]/70">Completa tus datos para simular el envío del pedido.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Nombre */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="checkout-input-nombre"
                                                    className={`text-xs font-black uppercase tracking-wider flex items-center justify-between transition-colors ${
                                                        checkoutErrors.nombre ? 'text-red-600' : 'text-gray-500'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" /> Tu Nombre <span className="text-red-500">*</span>
                                                    </span>
                                                    {checkoutErrors.nombre && (
                                                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Requerido
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    id="checkout-input-nombre"
                                                    type="text"
                                                    value={checkoutData.nombre}
                                                    onChange={(e) => {
                                                        setCheckoutData({ ...checkoutData, nombre: e.target.value });
                                                        if (checkoutErrors.nombre) {
                                                            setCheckoutErrors(prev => ({ ...prev, nombre: undefined }));
                                                        }
                                                    }}
                                                    placeholder="Ej: Luis Sarabia"
                                                    className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none transition-all ${
                                                        checkoutErrors.nombre
                                                            ? 'bg-red-50/60 border-2 border-red-500 text-red-950 placeholder-red-300 ring-2 ring-red-200'
                                                            : 'bg-gray-50 border border-gray-200 focus:border-[#C86414] focus:bg-white text-gray-900'
                                                    }`}
                                                />
                                                {checkoutErrors.nombre && (
                                                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1 pl-1">
                                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                        {checkoutErrors.nombre}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Dirección */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="checkout-input-direccion"
                                                    className={`text-xs font-black uppercase tracking-wider flex items-center justify-between transition-colors ${
                                                        checkoutErrors.direccion ? 'text-red-600' : 'text-gray-500'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5" /> Dirección de Entrega <span className="text-red-500">*</span>
                                                    </span>
                                                    {checkoutErrors.direccion && (
                                                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Requerido
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    id="checkout-input-direccion"
                                                    type="text"
                                                    value={checkoutData.direccion}
                                                    onChange={(e) => {
                                                        setCheckoutData({ ...checkoutData, direccion: e.target.value });
                                                        if (checkoutErrors.direccion) {
                                                            setCheckoutErrors(prev => ({ ...prev, direccion: undefined }));
                                                        }
                                                    }}
                                                    placeholder="Ej: Carrera 1 g # 91-58"
                                                    className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none transition-all ${
                                                        checkoutErrors.direccion
                                                            ? 'bg-red-50/60 border-2 border-red-500 text-red-950 placeholder-red-300 ring-2 ring-red-200'
                                                            : 'bg-gray-50 border border-gray-200 focus:border-[#C86414] focus:bg-white text-gray-900'
                                                    }`}
                                                />
                                                {checkoutErrors.direccion && (
                                                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1 pl-1">
                                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                        {checkoutErrors.direccion}
                                                    </p>
                                                )}
                                            </div>

                                            {/* WhatsApp / Teléfono */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="checkout-input-telefono"
                                                    className={`text-xs font-black uppercase tracking-wider flex items-center justify-between transition-colors ${
                                                        checkoutErrors.telefono ? 'text-red-600' : 'text-gray-500'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5" /> WhatsApp / Teléfono <span className="text-red-500">*</span>
                                                    </span>
                                                    {checkoutErrors.telefono && (
                                                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Requerido
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    id="checkout-input-telefono"
                                                    type="tel"
                                                    value={checkoutData.telefono}
                                                    onChange={(e) => {
                                                        setCheckoutData({ ...checkoutData, telefono: e.target.value });
                                                        if (checkoutErrors.telefono) {
                                                            setCheckoutErrors(prev => ({ ...prev, telefono: undefined }));
                                                        }
                                                    }}
                                                    placeholder="Ej: 312 883 3350"
                                                    className={`w-full h-12 rounded-xl px-4 text-sm font-bold outline-none transition-all ${
                                                        checkoutErrors.telefono
                                                            ? 'bg-red-50/60 border-2 border-red-500 text-red-950 placeholder-red-300 ring-2 ring-red-200'
                                                            : 'bg-gray-50 border border-gray-200 focus:border-[#C86414] focus:bg-white text-gray-900'
                                                    }`}
                                                />
                                                {checkoutErrors.telefono && (
                                                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1 pl-1">
                                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                        {checkoutErrors.telefono}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 space-y-3">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Ticket className="w-3.5 h-3.5 text-[#C86414]" />
                                                ¿Tienes un cupón de la ruleta?
                                            </p>

                                            {appliedCoupon ? (
                                                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="text-xl shrink-0">{appliedCoupon.coupon.premio_emoji || '🎁'}</span>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-emerald-900 truncate">
                                                                {appliedCoupon.coupon.premio_label}
                                                            </p>
                                                            <p className="text-[10px] font-mono font-bold text-emerald-700">
                                                                {appliedCoupon.coupon.codigo_cupon} • Aplicado
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveCoupon}
                                                        className="text-[11px] font-black text-red-500 hover:text-red-700 shrink-0 px-2 py-1"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={couponCodeInput}
                                                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                                                            placeholder="Ej: FM-PREMIO-1208"
                                                            className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-mono font-bold uppercase focus:border-[#C86414] focus:outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApplyCoupon()}
                                                            className="px-4 h-11 rounded-xl bg-[#181615] hover:bg-[#C86414] text-white text-xs font-black transition-colors shrink-0"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>

                                                    {availableCoupons.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            <p className="text-[10px] font-bold text-gray-400">
                                                                Tus cupones disponibles (toca para aplicar):
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {availableCoupons.map((c) => (
                                                                    <button
                                                                        key={c.id || c.codigo_cupon}
                                                                        type="button"
                                                                        onClick={() => handleApplyCoupon(c.codigo_cupon)}
                                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-[#181615] transition-colors"
                                                                    >
                                                                        <span>{c.premio_emoji || '🎁'}</span>
                                                                        <span className="max-w-[150px] truncate">{c.premio_label}</span>
                                                                        <span className="text-[10px] font-black text-[#C86414]">Aplicar</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Resumen de Pago</p>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                                                <div className="flex justify-between text-sm font-medium"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                                                {icoporTotal > 0 && (
                                                    <div className="flex justify-between text-sm font-medium text-gray-600">
                                                        <span>Empaque icopor ($1.000 × {cartCount})</span>
                                                        <span>{formatCurrency(icoporTotal)}</span>
                                                    </div>
                                                )}
                                                {appliedCoupon && (
                                                    discountAmount > 0 ? (
                                                        <div className="flex justify-between text-sm font-bold text-emerald-700">
                                                            <span>Cupón ({appliedCoupon.coupon.codigo_cupon})</span>
                                                            <span>- {formatCurrency(discountAmount)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between text-sm font-bold text-emerald-700">
                                                            <span>🎁 {appliedCoupon.coupon.premio_label}</span>
                                                            <span>GRATIS</span>
                                                        </div>
                                                    )
                                                )}
                                                <div className="flex justify-between text-sm font-medium"><span>Envío</span><span className="text-[#C86414]">GRATIS</span></div>
                                                <div className="pt-2 border-t border-gray-200 flex justify-between text-lg font-black text-gray-900"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 'success' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                        <div className="size-24 bg-[#C86414] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#C86414]/40 scale-110">
                                            <ChefHat className="w-12 h-12 text-[#1F1C1A]" />
                                        </div>
                                        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">¡Pedido Recibido!</h3>
                                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                                            Este es un <span className="text-[#C86414] font-bold">simulacro funcional</span>. En la vida real, el restaurante recibiría este pedido al instante por WhatsApp y su panel de control.
                                        </p>
                                        <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8 space-y-2 text-left">
                                            <div className="flex justify-between text-xs font-bold"><span>Cliente</span><span className="text-gray-900">{checkoutData.nombre}</span></div>
                                            <div className="flex justify-between text-xs font-bold"><span>Orden #</span><span className="text-gray-900">DEMO-001</span></div>
                                            {appliedCoupon && (
                                                <div className="flex justify-between text-xs font-bold text-emerald-700">
                                                    <span>Premio redimido</span>
                                                    <span>{appliedCoupon.coupon.premio_emoji} {appliedCoupon.coupon.premio_label} ({appliedCoupon.coupon.codigo_cupon})</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs font-bold"><span>Total</span><span className="text-[#C86414] font-black">{formatCurrency(finalTotal)}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t mt-auto">
                                {step !== 'success' ? (
                                    <>
                                        {step === 'checkout' && Object.keys(checkoutErrors).some(k => !!checkoutErrors[k]) && (
                                            <div className="mb-3.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                                <span>Faltan datos obligatorios. Completa los campos marcados en rojo.</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={cart.length === 0 ? resetAll : handleConfirmOrder}
                                            className="w-full h-14 bg-[#C86414] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#C86414]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {step === 'cart' ? (cart.length === 0 ? 'Ver menu para hacer pedido' : 'Continuar Compra') : 'Confirmar Pedido'}
                                            {cart.length > 0 && <Send className="w-5 h-5" />}
                                        </button>
                                        {step === 'checkout' && (
                                            <button onClick={() => setStep('cart')} className="w-full mt-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Volver al carrito</button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={resetAll}
                                        className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Volver al Menú
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Product Detail Modal */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl xl:max-w-[1300px] w-full p-0 overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-white border-none shadow-2xl [&>button]:hidden outline-none" aria-describedby="product-description">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Detalles del Producto</DialogTitle>
                        <DialogDescription id="product-description">Vista detallada del producto seleccionado con opciones de personalización.</DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[85vh]">
                            {/* Left Side: Product Image */}
                            <div className="relative w-full md:w-[45%] h-64 md:h-auto overflow-hidden bg-gray-50 flex-shrink-0">
                                <img
                                    src={selectedProduct.imagen || selectedProduct.imagen_url || "/images/hero-almuerzo.jpg"}
                                    alt={selectedProduct.nombre}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/images/hero-almuerzo.jpg";
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-6 left-6 size-10 bg-white/90 backdrop-blur-xl text-[#1F1C1A] rounded-full flex items-center justify-center hover:bg-white transition-all shadow-xl md:hidden z-20"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                {selectedProduct.etiqueta && (
                                    <div className="absolute top-6 right-6 z-20">
                                        <span className="bg-[#C86414] text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-[#C86414]/30">
                                            {selectedProduct.etiqueta}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Product Details & Modifiers */}
                            <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
                                <div className="hidden md:flex items-center justify-end p-6 pb-0 absolute top-0 right-0 z-40">
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="size-10 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-48 md:pb-56">
                                    <div className="max-w-2xl mx-auto space-y-8">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#C86414]/10 text-[10px] font-black text-[#C86414] uppercase tracking-wider mb-2">
                                                    {selectedProduct.categoria}
                                                </div>
                                                <h2 className="text-3xl md:text-4xl font-black text-[#1F1C1A] tracking-tighter leading-tight">
                                                    {selectedProduct.nombre}
                                                </h2>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-black text-[#C86414]">
                                                    {formatCurrency(computeProductUnitPrice(selectedProduct, selectedModifiers))}
                                                </span>
                                                {selectedProduct.precio_original > 0 && (
                                                    <span className="text-lg font-bold text-gray-300 line-through">
                                                        {formatCurrency(selectedProduct.precio_original)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <h3 className="text-[10px] font-black text-[#1F1C1A] uppercase tracking-widest opacity-40 mb-2">Descripción</h3>
                                                <p className="text-[#665E57] font-medium leading-relaxed text-sm">
                                                    {selectedProduct.descripcion}
                                                </p>
                                            </div>

                                            {/* Ingredientes / Componentes disponibles del plato (todos opcionales para el cliente) */}
                                            {(() => {
                                                const selEval = evaluateProductIngredients(selectedProduct, menuIngredients);
                                                // Ocultar proteína única interna (solo controla si el plato está Agotado)
                                                const visibleGroups = selEval.availableGroups.filter(
                                                    (g) => !(g.category === 'proteina' && g.items.length === 1)
                                                );
                                                if (visibleGroups.length === 0) return null;
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[10px] font-black text-[#1F1C1A] uppercase tracking-widest opacity-60">
                                                                Acompañantes / Ingredientes (Opcional)
                                                            </h3>
                                                            <span className="text-[10px] font-semibold text-gray-400">
                                                                Elige solo lo que desees
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {visibleGroups.map((group) => {
                                                                const currentSel = selectedIngredients[group.category] || [];
                                                                const isSingleChoiceCat = ['sopa', 'arroz', 'proteina', 'bebida'].includes(group.category);
                                                                return (
                                                                    <div key={group.category} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs font-black text-[#1F1C1A] uppercase tracking-wider flex items-center gap-1.5">
                                                                                <span>{group.emoji}</span>
                                                                                <span>{group.label}</span>
                                                                            </span>
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-200/70 text-gray-500">
                                                                                Opcional
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex flex-wrap gap-2">
                                                                            {group.items.map((ing) => {
                                                                                const isPicked = currentSel.includes(ing.name);
                                                                                return (
                                                                                    <button
                                                                                        key={ing.id}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setSelectedIngredients((prev) => {
                                                                                                const prevArr = prev[group.category] || [];
                                                                                                const exists = prevArr.includes(ing.name);
                                                                                                if (isSingleChoiceCat) {
                                                                                                    // Tocar el seleccionado lo desmarca (ej. pedir sin sopa)
                                                                                                    return {
                                                                                                        ...prev,
                                                                                                        [group.category]: exists ? [] : [ing.name],
                                                                                                    };
                                                                                                }
                                                                                                return {
                                                                                                    ...prev,
                                                                                                    [group.category]: exists
                                                                                                        ? prevArr.filter((n) => n !== ing.name)
                                                                                                        : [...prevArr, ing.name],
                                                                                                };
                                                                                            });
                                                                                        }}
                                                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                                                                            isPicked
                                                                                                ? 'bg-[#C86414] text-white border-[#C86414] shadow-sm'
                                                                                                : 'bg-white text-[#1F1C1A] border-gray-200 hover:border-[#C86414]/60'
                                                                                        }`}
                                                                                    >
                                                                                        {isPicked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                                                                        <span>{ing.name}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Nutritional Info Section (Requested Design) */}
                                            {(selectedProduct.nutri_kcal || selectedProduct.nutri_proteina) && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-[10px] font-black text-[#5C6B89] uppercase tracking-widest">Información Nutricional (Estimada por IA)</h3>
                                                        <div className="size-1.5 rounded-full bg-[#C86414] animate-pulse" />
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                                                        <div className="p-3 md:p-4 bg-[#edfdf2] rounded-3xl border border-[#d3f9d8] flex flex-col items-center justify-center text-center">
                                                            <span className="text-sm md:text-xl font-black text-[#00a854]">{selectedProduct.nutri_kcal || '0'}</span>
                                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Kcal</span>
                                                        </div>
                                                        <div className="p-3 md:p-4 bg-[#edfdf2] rounded-3xl border border-[#d3f9d8] flex flex-col items-center justify-center text-center">
                                                            <span className="text-sm md:text-xl font-black text-[#00a854]">{selectedProduct.nutri_proteina || '0g'}</span>
                                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Prot</span>
                                                        </div>
                                                        <div className="p-3 md:p-4 bg-[#edfdf2] rounded-3xl border border-[#d3f9d8] flex flex-col items-center justify-center text-center">
                                                            <span className="text-sm md:text-xl font-black text-[#00a854]">{selectedProduct.nutri_carbohidratos || '25g'}</span>
                                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Carb</span>
                                                        </div>
                                                        <div className="p-3 md:p-4 bg-[#edfdf2] rounded-3xl border border-[#d3f9d8] flex flex-col items-center justify-center text-center">
                                                            <span className="text-sm md:text-xl font-black text-[#00a854]">{selectedProduct.nutri_grasa || '12g'}</span>
                                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Grasa</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-medium text-gray-400 italic">
                                                        * Valores aproximados calculados por inteligencia artificial basados en la receta estándar.
                                                    </p>
                                                    {/* Dietary Labels - Relocated below grid */}
                                                    {(selectedProduct.is_vegan || selectedProduct.is_vegetarian || selectedProduct.is_spicy) && (
                                                        <div className="flex flex-nowrap gap-2 pt-2 overflow-x-auto no-scrollbar w-full">
                                                            {selectedProduct.is_vegan && (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#edfdf2] border border-[#d3f9d8] text-[#00a854] text-[9px] md:text-[11px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap flex-shrink-0">
                                                                    <span>🌱</span> VEGANO
                                                                </div>
                                                            )}
                                                            {selectedProduct.is_vegetarian && !selectedProduct.is_vegan && (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fffbe6] border border-[#fff1b8] text-[#c49c00] text-[9px] md:text-[11px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap flex-shrink-0">
                                                                    <span>🥗</span> VEGETARIANO
                                                                </div>
                                                            )}
                                                            {selectedProduct.is_spicy && (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] text-[9px] md:text-[11px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap flex-shrink-0">
                                                                    <span>🌶️</span> PICANTE
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                </div>
                                            )}
                                        </div>

                                        {/* Modifiers Simulation */}
                                        <div className="space-y-8">
                                            {['tamanos', 'modificadores', 'opciones'].map((categoryKey) => {
                                                const groups = selectedProduct[categoryKey];
                                                if (!groups || !Array.isArray(groups)) return null;

                                                return groups.map((group, groupIdx) => (
                                                    <div key={`${categoryKey}-${groupIdx}`} className="space-y-4">
                                                        <div className="flex justify-between items-center bg-white sticky top-0 z-10 py-2 border-b border-gray-100">
                                                            <div className="space-y-1">
                                                                <h3 className="text-lg font-black text-[#1F1C1A] tracking-tight">{group.nombre}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${group.obligatorio ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                                        {group.obligatorio ? 'Obligatorio' : 'Opcional'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-gray-400">
                                                                        Escoge {group.seleccion_maxima === 1 ? '1 opción' : `hasta ${group.seleccion_maxima} opciones`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3">
                                                            {group.opciones.map((option, optIdx) => {
                                                                const isSelected = selectedModifiers.some(m => m.nombre === option.nombre);
                                                                return (
                                                                    <button
                                                                        key={`${categoryKey}-${groupIdx}-${optIdx}`}
                                                                        onClick={() => {
                                                                            const optPayload = categoryKey === 'tamanos' ? { ...option, isSize: true } : option;
                                                                            if (isSelected) {
                                                                                if (categoryKey === 'tamanos' && group.obligatorio) return;
                                                                                setSelectedModifiers(prev => prev.filter(m => m.nombre !== option.nombre));
                                                                            } else {
                                                                                if (group.seleccion_maxima === 1) {
                                                                                    setSelectedModifiers(prev => [
                                                                                        ...prev.filter(m => !group.opciones.some(opt => opt.nombre === m.nombre)),
                                                                                        optPayload
                                                                                    ]);
                                                                                } else if (selectedModifiers.filter(m => group.opciones.some(opt => opt.nombre === m.nombre)).length < group.seleccion_maxima) {
                                                                                    setSelectedModifiers(prev => [...prev, optPayload]);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isSelected ? 'bg-[#C86414]/5 border-[#C86414] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                                                    >
                                                                        <span className={`text-sm font-black ${isSelected ? 'text-[#1F1C1A]' : 'text-gray-600'}`}>
                                                                            {option.nombre}
                                                                        </span>
                                                                        {option.precio > 0 && (
                                                                            <span className={`text-xs font-black ${isSelected ? 'text-[#C86414]' : 'text-gray-400'}`}>
                                                                                {categoryKey === 'tamanos' ? formatCurrency(option.precio) : `+ ${formatCurrency(option.precio)}`}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                            })}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-[#1F1C1A] uppercase tracking-widest opacity-40">Notas Especiales</h3>
                                            <textarea
                                                value={productNotes}
                                                onChange={(e) => setProductNotes(e.target.value)}
                                                placeholder="Ej: Sin cebolla, salsas aparte..."
                                                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium focus:outline-none focus:border-[#C86414] transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Sticky Actions */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
                                    <div className="max-w-2xl mx-auto flex items-center gap-4">
                                        <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl border border-gray-200">
                                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:text-[#C86414] shadow-sm"><Minus className="w-5 h-5" /></button>
                                            <span className="text-xl font-black text-[#1F1C1A] w-6 text-center">{qty}</span>
                                            <button onClick={() => setQty(qty + 1)} className="size-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:text-[#C86414] shadow-sm"><Plus className="w-5 h-5" /></button>
                                        </div>
                                        <Button
                                            onClick={addToCartAndConfirm}
                                            className="flex-1 h-16 bg-[#C86414] hover:bg-[#C86414] text-white rounded-2xl font-black text-xl shadow-xl shadow-[#C86414]/20 flex items-center justify-between px-8 group transition-all"
                                        >
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] uppercase tracking-widest opacity-60">Agregar</span>
                                                <span>{formatCurrency(computeProductUnitPrice(selectedProduct, selectedModifiers) * qty)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">Confirmar</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Botón Flotante Ruleta del Día (Estilo Temu) */}
            {wheelActive && !isWheelOpen && (
                <motion.button
                    type="button"
                    onClick={() => setIsWheelOpen(true)}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-6 left-5 z-40 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-[#4ADE80] text-[#0F172A] shadow-[0_10px_30px_rgba(245,158,11,0.4)] border-2 border-white/80 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                    <span className="text-lg animate-bounce">🎰</span>
                    <span className="flex flex-col items-start leading-tight">
                        <span className="text-[9px] font-black text-amber-950/75">1 Giro Gratis Hoy</span>
                        <span>¡Gira y Gana!</span>
                    </span>
                </motion.button>
            )}

            {/* Modal Ruleta de Recompensas */}
            <RuletaPremiosModal
                open={isWheelOpen}
                onOpenChange={setIsWheelOpen}
                slug="demo-restaurante"
                businessName={DEMO_BUSINESS.nombre}
            />

            {/* Agente Experto Flotante de Fogón & Mesa */}
            <LandingAgent hidden={isWheelOpen || isCartOpen} />
        </div>
    );
}
