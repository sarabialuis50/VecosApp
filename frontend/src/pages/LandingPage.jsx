import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  UtensilsCrossed,
  Clock,
  Flame,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  Check,
  ChefHat,
  Leaf,
  Lock,
  Sparkles,
  Menu as MenuIcon,
  X,
  ShoppingBag,
  ShoppingCart,
  User,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  CreditCard,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { FaWhatsapp } from 'react-icons/fa';
import LandingAgent from '@/components/LandingAgent';
import { registerRealOrder } from '@/utils/demoMockAdapter';

const BUSINESS_SLUG = 'vecos';

const MENU_CATEGORIES = [
  {
    id: 'ejecutivos',
    label: 'Ejecutivos del Día',
    subtitle: 'Incluye sopa del día, proteína al gusto, 2 acompañamientos y bebida natural',
    items: [
      {
        id: 'exec-1',
        name: 'Churrasco a la Brasa (250g)',
        desc: 'Corte jugoso al carbón con chimichurri de la casa, arroz con cilantro, tajadas maduras y ensalada fresca.',
        priceNum: 22000,
        price: '$22.000',
        tag: 'Más Pedido',
        time: '15 min',
        image: '/images/hero-almuerzo.jpg',
      },
      {
        id: 'exec-2',
        name: 'Pechuga al Romero y Limón',
        desc: 'Pechuga marinada 12 horas en finas hierbas, puré de papa rústico al ajo y vegetales rostizados.',
        priceNum: 18500,
        price: '$18.500',
        tag: 'Ligero',
        time: '12 min',
        image: '/images/plato-pollo.jpg',
      },
      {
        id: 'exec-3',
        name: 'Sobrebarriga Criolla en Salsa',
        desc: 'Cocción lenta de 4 horas en salsa de tomate asado y cebolla, papa chorreada, arroz blanco y aguacate.',
        priceNum: 19500,
        price: '$19.500',
        tag: 'Especialidad',
        time: '10 min',
        image: '/images/plato-cazuela.jpg',
      },
      {
        id: 'exec-4',
        name: 'Filete de Tilapia al Ajillo',
        desc: 'Pesca fresca sellada en mantequilla clarificada, patacones crujientes, arroz con coco y ensalada de mango.',
        priceNum: 21000,
        price: '$21.000',
        tag: 'Fresco',
        time: '14 min',
        image: '/images/plato-pollo.jpg',
      },
    ],
  },
  {
    id: 'cazuelas',
    label: 'Cazuelas & Olla',
    subtitle: 'Platos de cuchara preparados desde temprano a fuego lento',
    items: [
      {
        id: 'caz-1',
        name: 'Cazuela de Frijoles de la Casa',
        desc: 'Frijoles rojos cremosos con chicharrón carnudo, carne desmechada, maduritos, aguacate, arroz y arepa asada.',
        priceNum: 24000,
        price: '$24.000',
        tag: 'Imperdible',
        time: '10 min',
        image: '/images/plato-cazuela.jpg',
      },
      {
        id: 'caz-2',
        name: 'Ajiaco Santafereño Tradicional',
        desc: 'Tres variedades de papa, pollo desmechado, mazorca tierna, guascas, alcaparras, crema de leche y aguacate.',
        priceNum: 23000,
        price: '$23.000',
        tag: 'Solo Jueves–Dom',
        time: '10 min',
        image: '/images/plato-cazuela.jpg',
      },
      {
        id: 'caz-3',
        name: 'Sancocho Trifásico en Leña',
        desc: 'Caldo concentrado con res, cerdo y pollo, yuca, plátano verde, mazorca, arroz blanco y ají casero.',
        priceNum: 25000,
        price: '$25.000',
        tag: 'Fin de Semana',
        time: '10 min',
        image: '/images/plato-cazuela.jpg',
      },
    ],
  },
  {
    id: 'parrilla',
    label: 'Parrilla & Bowls',
    subtitle: 'Cortes al carbón y opciones balanceadas para el mediodía',
    items: [
      {
        id: 'par-1',
        name: 'Punta de Anca al Carbón (300g)',
        desc: 'Asada al término de tu elección, acompañada de papa criolla salteada, ensalada verde y chimichurri.',
        priceNum: 32000,
        price: '$32.000',
        tag: 'Corte Premium',
        time: '18 min',
        image: '/images/hero-almuerzo.jpg',
      },
      {
        id: 'par-2',
        name: 'Bowl Mediodía Saludable',
        desc: 'Base de arroz integral y quinua, pollo a la plancha, aguacate, maíz tierno, tomate cherry y vinagreta cítrica.',
        priceNum: 19000,
        price: '$19.000',
        tag: 'Balanceado',
        time: '10 min',
        image: '/images/plato-pollo.jpg',
      },
      {
        id: 'par-3',
        name: 'Costillas BBQ de Guayaba',
        desc: 'Costillas de cerdo glaseadas en salsa artesanal de guayaba y especias, con papas rústicas y coleslaw.',
        priceNum: 28000,
        price: '$28.000',
        tag: 'Favorito',
        time: '16 min',
        image: '/images/hero-almuerzo.jpg',
      },
    ],
  },
  {
    id: 'bebidas',
    label: 'Bebidas & Postres',
    subtitle: 'Jugos prensados al instante y dulces tradicionales',
    items: [
      {
        id: 'beb-1',
        name: 'Limonada de Hierbabuena y Panela',
        desc: 'Limón tahití recién exprimido con hojas frescas de hierbabuena y toque de panela orgánica.',
        priceNum: 6500,
        price: '$6.500',
        tag: 'Refrescante',
        time: '3 min',
        image: '/images/hero-almuerzo.jpg',
      },
      {
        id: 'beb-2',
        name: 'Jugo Natural de Maracuyá o Mango',
        desc: 'Pulpa 100% natural preparada al momento en agua o leche.',
        priceNum: 7000,
        price: '$7.000',
        tag: 'Natural',
        time: '3 min',
        image: '/images/plato-pollo.jpg',
      },
      {
        id: 'beb-3',
        name: 'Flan de Caramelo & Café',
        desc: 'Receta cremosa de la casa con baño de caramelo oscuro y toque de café colombiano.',
        priceNum: 8500,
        price: '$8.500',
        tag: 'Postre',
        time: '2 min',
        image: '/images/plato-cazuela.jpg',
      },
    ],
  },
];

const DAILY_BUILDER = {
  sopas: ['Crema de Ahuyama Rostizada', 'Consomé de Pollo con Verduras', 'Sopa de Lentejas de la Abuela'],
  proteinas: ['Carne Asada al Carbón', 'Pechuga al Romero', 'Sobrebarriga en Salsa', 'Filete de Pescado'],
  acompanamientos: ['Arroz con Cilantro', 'Tajadas de Madurito', 'Puré Rústico', 'Ensalada Fresca', 'Aguacate', 'Papa Criolla'],
  bebidas: ['Limonada de Panela', 'Jugo de Mango', 'Agua con Gas y Limón'],
};

const FEATURED_PLATES = [
  {
    id: 'feat-1',
    title: 'Churrasco & Chimichurri de la Casa',
    category: 'Almuerzo Ejecutivo',
    priceNum: 22000,
    price: '$22.000',
    image: '/images/hero-almuerzo.jpg',
    description: 'Sellado a fuego vivo, servido con arroz verde, maduritos dorados, aguacate y sopa del día.',
    badge: 'Plato Estrella',
  },
  {
    id: 'feat-2',
    title: 'Pechuga al Romero & Vegetales',
    category: 'Cocina Ligera',
    priceNum: 18500,
    price: '$18.500',
    image: '/images/plato-pollo.jpg',
    description: 'Pechuga jugosa en hierbas frescas sobre puré cremoso al ajo con zanahorias baby y espárragos.',
    badge: 'Opción Fit',
  },
  {
    id: 'feat-3',
    title: 'Cazuela Criolla de Olla Lenta',
    category: 'Tradición Casera',
    priceNum: 24000,
    price: '$24.000',
    image: '/images/plato-cazuela.jpg',
    description: 'Guiso lento de res con papa sabanera, mazorca dulce, cilantro fresco y arepa tostada al comal.',
    badge: 'Receta Original',
  },
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(val);

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [activeCategory, setActiveCategory] = useState('ejecutivos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Lunch Builder State
  const [selectedSoup, setSelectedSoup] = useState(DAILY_BUILDER.sopas[0]);
  const [selectedProtein, setSelectedProtein] = useState(DAILY_BUILDER.proteinas[0]);
  const [selectedSides, setSelectedSides] = useState([
    DAILY_BUILDER.acompanamientos[0],
    DAILY_BUILDER.acompanamientos[1],
  ]);
  const [selectedDrink, setSelectedDrink] = useState(DAILY_BUILDER.bebidas[0]);

  // Cart & Checkout Drawer State (persisted in localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('fogon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [checkoutData, setCheckoutData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    tipo_servicio: 'domicilio',
    metodo_pago: 'efectivo',
  });

  // Unified Login / Account Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('cliente'); // 'cliente' | 'admin'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('fogon_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.precio * item.qty, 0);

  const addToCart = (product) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.id === product.id && (item.notes || '') === (product.notes || '')
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.nombre} agregado al carrito`);
  };

  const updateCartQty = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const nextQty = updated[idx].qty + delta;
      if (nextQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].qty = nextQty;
      return updated;
    });
  };

  const handleAddCustomLunchToCart = () => {
    const customLunch = {
      id: `almuerzo-${Date.now()}`,
      nombre: `Almuerzo Ejecutivo: ${selectedProtein}`,
      precio: 18500,
      imagen: '/images/hero-almuerzo.jpg',
      notes: `${selectedSoup} · ${selectedSides.join(' + ')} · ${selectedDrink}`,
    };
    addToCart(customLunch);
    setCartStep('cart');
    setIsCartOpen(true);
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    const orderNum = `VEC-${Math.floor(1000 + Math.random() * 9000)}`;
    const isMesa = checkoutForm.deliveryType === 'mesa';
    const isPickup = checkoutForm.deliveryType === 'recoger';
    try {
      registerRealOrder({
        id: orderNum,
        numero_orden: orderNum,
        cliente_nombre: checkoutForm.name?.trim() || 'Cliente Web',
        cliente_telefono: checkoutForm.phone?.trim() || '',
        tipo: isMesa ? 'mesa' : isPickup ? 'takeaway' : 'delivery',
        tipo_pedido: isMesa ? 'mesa' : isPickup ? 'takeaway' : 'delivery',
        tipo_servicio: isMesa ? 'mesa' : isPickup ? 'recoger' : 'domicilio',
        direccion: !isMesa && !isPickup ? (checkoutForm.address?.trim() || '') : '',
        mesa_numero: isMesa ? (checkoutForm.address?.trim() || '1') : null,
        estado: 'pendiente',
        total: cartTotal,
        metodo_pago: checkoutForm.payment || 'efectivo',
        items: cart.map((item) => ({
          nombre: item.nombre,
          cantidad: item.qty,
          precio_unitario: item.precio,
          notas: item.notes || '',
        })),
      });
    } catch (err) {
      console.warn('Error registrando pedido desde Landing:', err);
    }
    setCartStep('success');
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const business = await login(adminEmail, adminPassword);
      toast.success('¡Bienvenido al panel administrativo!');
      setIsAuthModalOpen(false);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Credenciales incorrectas';
      toast.error(message);
    } finally {
      setAdminLoading(false);
    }
  };

  const toggleSide = (side) => {
    if (selectedSides.includes(side)) {
      if (selectedSides.length > 1) {
        setSelectedSides(selectedSides.filter((s) => s !== side));
      }
    } else if (selectedSides.length < 2) {
      setSelectedSides([...selectedSides, side]);
    } else {
      setSelectedSides([selectedSides[1], side]);
    }
  };

  const handleWhatsAppOrder = async () => {
    const orderNum = `VEC-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      registerRealOrder({
        id: orderNum,
        numero_orden: orderNum,
        cliente_nombre: 'Pedido Web (Almuerzo del Día)',
        cliente_telefono: '',
        tipo: 'delivery',
        tipo_pedido: 'delivery',
        tipo_servicio: 'domicilio',
        estado: 'pendiente',
        total: 18500,
        metodo_pago: 'efectivo',
        notas: `Sopa: ${selectedSoup} | Proteína: ${selectedProtein} | Acompañamientos: ${selectedSides.join(' + ')} | Bebida: ${selectedDrink}`,
        items: [
          {
            nombre: `Almuerzo del Día (${selectedProtein})`,
            cantidad: 1,
            precio_unitario: 18500,
            notas: `Sopa: ${selectedSoup}, Acompañamientos: ${selectedSides.join(' + ')}, Bebida: ${selectedDrink}`,
          },
        ],
      });
    } catch (err) {
      console.warn('No se pudo registrar orden en cocina:', err);
    }
    const text = `¡Hola Veco's Restaurante! Quiero pedir el Almuerzo del Día ($18.500):%0A• Sopa: ${selectedSoup}%0A• Proteína: ${selectedProtein}%0A• Acompañamientos: ${selectedSides.join(' + ')}%0A• Bebida: ${selectedDrink}`;
    window.open(`https://wa.me/573017810256?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const currentMenu = MENU_CATEGORIES.find((c) => c.id === activeCategory) || MENU_CATEGORIES[0];

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const hasClientToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('client_token'));

  return (
    <div
      className="min-h-screen bg-[#FBF9F5] text-[#1F1C1A] selection:bg-[#C86414] selection:text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Top Bar / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#181615]/95 backdrop-blur-md border-b border-white/10 text-[#FBF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Identity (Single Business) */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#C86414] overflow-hidden flex items-center justify-center text-white shadow-md shadow-[#C86414]/20 group-hover:scale-105 transition-transform">
                <img
                  src={user?.logo_url || (typeof window !== 'undefined' && localStorage.getItem('fogon_mesa_logo')) || '/images/vecos-logo.jpg'}
                  alt="Veco's Restaurante"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="leading-none">
                <span
                  className="block text-xl sm:text-2xl font-bold tracking-tight text-[#FBF9F5]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Veco&apos;s Restaurante
                </span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#D9B99B] font-semibold mt-0.5">
                  Sabor que te encanta
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#E7E0D6]">
              <button onClick={() => scrollToSection('menu-hoy')} className="hover:text-[#F59E0B] transition-colors">
                Menú del Día
              </button>
              <button onClick={() => scrollToSection('arma-almuerzo')} className="hover:text-[#F59E0B] transition-colors">
                Arma tu Almuerzo
              </button>
              <button onClick={() => scrollToSection('especialidades')} className="hover:text-[#F59E0B] transition-colors">
                Especialidades
              </button>
              <button onClick={() => scrollToSection('visitanos')} className="hover:text-[#F59E0B] transition-colors">
                Horarios & Ubicación
              </button>
            </nav>

            {/* Desktop & Mobile Right Icons: Unified Login/Profile + Cart (matching interactive menu) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/menu')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/25 hover:bg-[#C86414] hover:border-[#C86414] text-[#FBF9F5] text-xs font-bold transition-all group"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#F59E0B] group-hover:text-white transition-colors" />
                Menú
              </button>

              {/* Unified Login / Profile Icon */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="relative size-11 rounded-full bg-[#24201E] border border-white/15 flex items-center justify-center hover:border-[#C86414] hover:bg-[#C86414]/15 transition-all group"
                title={user ? `Admin: ${user.nombre || user.slug}` : 'Iniciar sesión / Mi perfil'}
                aria-label="Iniciar sesión o ver perfil"
              >
                <User className="w-5 h-5 text-[#FBF9F5] group-hover:text-[#F59E0B] transition-colors" />
                {(user || hasClientToken) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#2F5D46] ring-2 ring-[#181615]" />
                )}
              </button>

              {/* Cart Icon */}
              <button
                onClick={() => {
                  setCartStep('cart');
                  setIsCartOpen(true);
                }}
                className="relative size-11 rounded-full bg-[#FBF9F5] border-2 border-[#C86414] flex items-center justify-center hover:bg-[#C86414] transition-all group shadow-lg shadow-[#C86414]/15"
                title="Ver carrito de compras"
                aria-label="Ver carrito"
              >
                <ShoppingCart className="w-5 h-5 text-[#C86414] group-hover:text-white transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C86414] text-[10px] font-black text-white ring-2 ring-[#181615]">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#FBF9F5] hover:bg-white/10"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#181615] border-t border-white/10 px-4 py-5 space-y-3">
            <button
              onClick={() => scrollToSection('menu-hoy')}
              className="block w-full text-left py-2 text-base font-medium text-[#FBF9F5] hover:text-[#F59E0B]"
            >
              Menú del Día
            </button>
            <button
              onClick={() => scrollToSection('arma-almuerzo')}
              className="block w-full text-left py-2 text-base font-medium text-[#FBF9F5] hover:text-[#F59E0B]"
            >
              Arma tu Almuerzo
            </button>
            <button
              onClick={() => scrollToSection('especialidades')}
              className="block w-full text-left py-2 text-base font-medium text-[#FBF9F5] hover:text-[#F59E0B]"
            >
              Especialidades
            </button>
            <button
              onClick={() => scrollToSection('visitanos')}
              className="block w-full text-left py-2 text-base font-medium text-[#FBF9F5] hover:text-[#F59E0B]"
            >
              Horarios & Ubicación
            </button>
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={() => navigate('/menu')}
                className="w-full py-3 rounded-xl bg-[#C86414] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Abrir Menú
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION: Full-bleed dark cast-iron canvas */}
      <section className="relative bg-[#181615] text-[#FBF9F5] pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#C86414]/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#2F5D46]/20 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-7">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#2F5D46]/30 border border-[#4ADE80]/25 text-[#A7F3D0] text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                Sirviendo Almuerzos Hoy · 11:30 AM – 3:30 PM
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-[62px] font-bold leading-[1.06] tracking-tight text-[#FBF9F5]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                El almuerzo casero que{' '}
                <span className="italic font-normal text-[#F59E0B]">sí vale</span>{' '}
                la pausa del día.
              </h1>

              <p className="text-base sm:text-lg text-[#C9C1B8] max-w-xl leading-relaxed">
                Cada mañana encendemos el fogón con ingredientes frescos de plaza. Cortes al carbón, cazuelas de cocción lenta y almuerzos ejecutivos servidos en tu mesa o listos en tu puerta en menos de 30 minutos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('arma-almuerzo')}
                  className="sm:w-[230px] inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full border border-transparent bg-[#C86414] hover:bg-[#DF741D] text-white font-bold text-base shadow-xl shadow-[#C86414]/25 transition-all hover:-translate-y-0.5"
                >
                  Armar mi Almuerzo
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/menu')}
                  className="sm:w-[230px] inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full border border-white/25 hover:border-[#C86414] bg-white/5 hover:bg-[#C86414] text-[#FBF9F5] font-semibold text-base transition-all group"
                >
                  <UtensilsCrossed className="w-4 h-4 text-[#F59E0B] group-hover:text-white transition-colors" />
                  Ver Menú
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9A9086] font-semibold">Menú Ejecutivo</p>
                  <p className="text-xl font-bold text-[#FBF9F5] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    Desde $18.500
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9A9086] font-semibold">Entrega Local</p>
                  <p className="text-xl font-bold text-[#FBF9F5] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    25 – 35 min
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9A9086] font-semibold">Cocina</p>
                  <p className="text-xl font-bold text-[#FBF9F5] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    100% Fresca
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 aspect-[4/3] lg:aspect-[5/4]">
                <img
                  src="/images/hero-almuerzo.jpg"
                  alt="Plato de churrasco artesanal con chimichurri, tajadas, aguacate y arroz"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181615]/85 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div className="bg-[#181615]/85 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3">
                    <span className="text-[11px] uppercase tracking-widest text-[#F59E0B] font-bold block">
                      Sugerencia del Chef Hoy
                    </span>
                    <p
                      className="text-lg font-bold text-white leading-snug"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Churrasco al Carbón + Sopa del Día
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      addToCart({
                        id: 'hero-churrasco',
                        nombre: 'Churrasco al Carbón + Sopa del Día',
                        precio: 22000,
                        imagen: '/images/hero-almuerzo.jpg',
                      })
                    }
                    className="hidden sm:flex flex-col items-end bg-[#C86414] hover:bg-[#DF741D] text-white rounded-2xl px-4 py-2.5 shadow-lg transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">+ Agregar</span>
                    <span className="text-xl font-extrabold">$22.000</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CULINARY PILLARS STRIP */}
      <section className="bg-[#F2ECE1] border-y border-[#E5DCCD] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#2F5D46] text-white flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1F1C1A]">Mercado Fresco Cada Mañana</h3>
                <p className="text-sm text-[#665E57] mt-1 leading-relaxed">
                  Vegetales, hierbas y proteínas seleccionadas a primera hora. Sin congelados ni recalentar de ayer.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#C86414] text-white flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1F1C1A]">Sazón Casera, Fuego Vivo</h3>
                <p className="text-sm text-[#665E57] mt-1 leading-relaxed">
                  Caldos reducidos por horas y cortes sellados a la parrilla justo cuando confirmas tu orden.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#1F1C1A] text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1F1C1A]">Puntualidad para tu Jornada</h3>
                <p className="text-sm text-[#665E57] mt-1 leading-relaxed">
                  Empaque térmico biodegradable para domicilios o servicio ágil en salón para que disfrutes sin afán.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE ELEMENT: INTERACTIVE LUNCH BUILDER */}
      <section id="arma-almuerzo" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#C86414]">
              <Sparkles className="w-3.5 h-3.5" />
              La Pizarra del Mediodía
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1C1A] mt-2 tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Arma tu Almuerzo Ejecutivo
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#665E57] max-w-md">
            Elige tu sopa, proteína, dos acompañamientos y bebida natural. Todo incluido por un precio único de{' '}
            <strong className="text-[#1F1C1A]">$18.500</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5DCCD] p-6 sm:p-8 shadow-sm space-y-8">
            {/* Step 1: Sopa */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F1C1A]">1. Sopa o Entrada del Día</h3>
                <span className="text-xs font-medium text-[#2F5D46] bg-[#2F5D46]/10 px-2.5 py-0.5 rounded-full">Elige 1</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DAILY_BUILDER.sopas.map((sopa) => {
                  const active = selectedSoup === sopa;
                  return (
                    <button
                      key={sopa}
                      onClick={() => setSelectedSoup(sopa)}
                      className={`text-left p-3.5 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        active
                          ? 'border-[#C86414] bg-[#C86414]/8 text-[#1F1C1A] ring-1 ring-[#C86414]'
                          : 'border-[#E5DCCD] hover:border-[#C86414]/50 text-[#665E57]'
                      }`}
                    >
                      <span>{sopa}</span>
                      {active && <Check className="w-4 h-4 text-[#C86414] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Proteína */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F1C1A]">2. Proteína Principal</h3>
                <span className="text-xs font-medium text-[#2F5D46] bg-[#2F5D46]/10 px-2.5 py-0.5 rounded-full">Elige 1</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DAILY_BUILDER.proteinas.map((prot) => {
                  const active = selectedProtein === prot;
                  return (
                    <button
                      key={prot}
                      onClick={() => setSelectedProtein(prot)}
                      className={`text-left p-3.5 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        active
                          ? 'border-[#C86414] bg-[#C86414]/8 text-[#1F1C1A] ring-1 ring-[#C86414]'
                          : 'border-[#E5DCCD] hover:border-[#C86414]/50 text-[#665E57]'
                      }`}
                    >
                      <span>{prot}</span>
                      {active && <Check className="w-4 h-4 text-[#C86414] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Acompañamientos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F1C1A]">3. Acompañamientos</h3>
                <span className="text-xs font-medium text-[#2F5D46] bg-[#2F5D46]/10 px-2.5 py-0.5 rounded-full">
                  Elige hasta 2 ({selectedSides.length}/2)
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {DAILY_BUILDER.acompanamientos.map((side) => {
                  const active = selectedSides.includes(side);
                  return (
                    <button
                      key={side}
                      onClick={() => toggleSide(side)}
                      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                        active
                          ? 'border-[#2F5D46] bg-[#2F5D46] text-white'
                          : 'border-[#E5DCCD] hover:border-[#2F5D46]/50 text-[#665E57]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {side}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Bebida */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F1C1A]">4. Bebida Natural</h3>
                <span className="text-xs font-medium text-[#2F5D46] bg-[#2F5D46]/10 px-2.5 py-0.5 rounded-full">Incluida</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DAILY_BUILDER.bebidas.map((drink) => {
                  const active = selectedDrink === drink;
                  return (
                    <button
                      key={drink}
                      onClick={() => setSelectedDrink(drink)}
                      className={`text-left p-3.5 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        active
                          ? 'border-[#C86414] bg-[#C86414]/8 text-[#1F1C1A] ring-1 ring-[#C86414]'
                          : 'border-[#E5DCCD] hover:border-[#C86414]/50 text-[#665E57]'
                      }`}
                    >
                      <span>{drink}</span>
                      {active && <Check className="w-4 h-4 text-[#C86414] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Order Ticket Summary */}
          <div className="lg:col-span-4 bg-[#181615] text-[#FBF9F5] rounded-3xl p-7 shadow-xl sticky top-28 border border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs uppercase tracking-[0.2em] text-[#D9B99B] font-bold">Tu Comanda de Hoy</span>
              <span className="px-2.5 py-1 rounded-full bg-[#2F5D46] text-[11px] font-bold text-white">Listo en 15 min</span>
            </div>

            <div className="py-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#9A9086]">Sopa</span>
                <span className="font-semibold text-right">{selectedSoup}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#9A9086]">Proteína</span>
                <span className="font-semibold text-right text-[#F59E0B]">{selectedProtein}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#9A9086]">Guarnición</span>
                <span className="font-semibold text-right">{selectedSides.join(' + ')}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#9A9086]">Bebida</span>
                <span className="font-semibold text-right">{selectedDrink}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-baseline justify-between mb-6">
              <span className="text-sm text-[#C9C1B8]">Total Ejecutivo</span>
              <span
                className="text-3xl font-bold text-[#FBF9F5]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                $18.500
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddCustomLunchToCart}
                className="w-full py-3.5 px-5 rounded-full bg-[#C86414] hover:bg-[#DF741D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C86414]/25 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                Agregar al Carrito
              </button>
              <button
                onClick={handleWhatsAppOrder}
                className="w-full py-3.5 px-5 rounded-full bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/30 transition-all hover:-translate-y-0.5"
              >
                <FaWhatsapp className="w-5 h-5 text-white shrink-0" />
                Pedir por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PLATES SHOWCASE */}
      <section id="especialidades" className="py-20 bg-[#F2ECE1] border-y border-[#E5DCCD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C86414]">
              Favoritos del Mediodía
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1F1C1A] mt-2 tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Platos que salen directo del fogón
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURED_PLATES.map((plate) => (
              <article
                key={plate.id}
                className="group bg-[#FBF9F5] rounded-3xl overflow-hidden border border-[#E5DCCD] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={plate.image}
                    alt={plate.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#181615]/85 backdrop-blur-sm text-white text-xs font-semibold">
                    {plate.badge}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2F5D46]">
                        {plate.category}
                      </span>
                      <span className="text-lg font-extrabold text-[#C86414]">{plate.price}</span>
                    </div>
                    <h3
                      className="text-xl font-bold text-[#1F1C1A] mb-2"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {plate.title}
                    </h3>
                    <p className="text-sm text-[#665E57] leading-relaxed">{plate.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      addToCart({
                        id: plate.id,
                        nombre: plate.title,
                        precio: plate.priceNum,
                        imagen: plate.image,
                      })
                    }
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1F1C1A] hover:text-[#C86414] transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#C86414]" />
                    Agregar al Carrito
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FULL INTERACTIVE MENU BOARD */}
      <section id="menu-hoy" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C86414]">Carta Completa</span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1F1C1A] mt-2"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Menú de Almuerzos & Parrilla
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {MENU_CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  active
                    ? 'bg-[#C86414] hover:bg-[#181615] text-white shadow-md shadow-[#C86414]/25'
                    : 'bg-[#F2ECE1] text-[#665E57] hover:bg-[#181615] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#665E57] mb-8">{currentMenu.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentMenu.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5DCCD] p-6 hover:border-[#C86414]/60 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className="text-lg font-bold text-[#1F1C1A]"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {item.name}
                  </h3>
                  <span className="text-lg font-extrabold text-[#C86414] shrink-0">{item.price}</span>
                </div>
                <p className="text-sm text-[#665E57] mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2ECE1] text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-[#F2ECE1] text-[#1F1C1A] font-semibold">
                    {item.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#665E57] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#2F5D46]" />
                    {item.time}
                  </span>
                </div>
                <button
                  onClick={() =>
                    addToCart({
                      id: item.id,
                      nombre: item.name,
                      precio: item.priceNum,
                      imagen: item.image,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C86414]/10 hover:bg-[#C86414] text-[#C86414] hover:text-white font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#C86414] hover:bg-[#181615] text-white font-bold text-sm shadow-lg shadow-[#C86414]/25 transition-all hover:-translate-y-0.5"
          >
            Explorar Menú Completo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* VISIT US / HOURS & DIRECT ORDERS */}
      <section id="visitanos" className="bg-[#181615] text-[#FBF9F5] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
              Te Esperamos en la Mesa
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Ven a almorzar con nosotros o pide directo a tu oficina
            </h2>
            <p className="text-[#C9C1B8] max-w-xl leading-relaxed">
              Contamos con salón amplio, ambiente tranquilo para almuerzos de trabajo o en familia, y cobertura de domicilio en toda la zona.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Dirección del Restaurante</h4>
                  <p className="text-sm text-[#9A9086] mt-1">Calle 84 # 45 - 22, Zona Gastronómica</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Horario de Almuerzos</h4>
                  <p className="text-sm text-[#9A9086] mt-1">Lunes a Domingo · 11:30 AM a 4:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Pedidos y Reservas</h4>
                  <p className="text-sm text-[#9A9086] mt-1">+57 301 781 0256</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <UtensilsCrossed className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Planes Corporativos</h4>
                  <p className="text-sm text-[#9A9086] mt-1">Almuerzos diarios para equipos y empresas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#231F1D] border border-white/10 rounded-3xl p-8 space-y-6">
            <h3
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              ¿Listo para almorzar hoy?
            </h3>
            <p className="text-sm text-[#C9C1B8]">
              Escríbenos por WhatsApp para reservar mesa o pedir tu almuerzo ejecutivo sin filas.
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/573017810256?text=Hola%20Fog%C3%B3n%20%26%20Mesa%2C%20quiero%20hacer%20un%20pedido%20de%20almuerzo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/30 transition-all hover:-translate-y-0.5"
              >
                <FaWhatsapp className="w-5 h-5 text-white shrink-0" />
                Pedir por WhatsApp
              </a>
              <button
                onClick={() => navigate('/menu')}
                className="w-full py-3.5 px-6 rounded-full bg-[#C86414] hover:bg-[#DF741D] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Abrir Menú Interactivo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SINGLE-BUSINESS FOOTER */}
      <footer className="bg-[#12100F] text-[#9A9086] py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className="text-base font-bold text-[#FBF9F5]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Veco&apos;s Restaurante
            </span>
            <span>· Sabor que te encanta</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              Mi Cuenta / Acceso
            </button>
            <Link to="/legal/autorizacion-datos" className="hover:text-white transition-colors">
              Política de Privacidad
            </Link>
            <span>© 2026 Veco&apos;s Restaurante</span>
          </div>
        </div>
      </footer>

      {/* =================================================================== */}
      {/* UNIFIED SINGLE-CHANNEL LOGIN / PROFILE MODAL (Cliente & Admin)      */}
      {/* =================================================================== */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="max-w-md bg-[#FBF9F5] border-[#E5DCCD] rounded-3xl p-0 overflow-hidden text-[#1F1C1A] [&>button]:text-[#FBF9F5] [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:opacity-100">
          <div className="bg-[#181615] text-[#FBF9F5] px-6 py-5 border-b border-white/10">
            <DialogHeader>
              <DialogTitle
                className="text-xl font-bold flex items-center gap-2.5 text-[#FBF9F5]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                <span className="w-8 h-8 rounded-full bg-[#C86414] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </span>
                Mi Cuenta — Veco&apos;s Restaurante
              </DialogTitle>
              <DialogDescription className="text-xs text-[#C9C1B8]">
                Un solo canal de acceso para clientes del restaurante y administración.
              </DialogDescription>
            </DialogHeader>

            {/* Role Selector Tabs inside Single Modal */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-2xl bg-white/10">
              <button
                type="button"
                onClick={() => setAuthTab('cliente')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'cliente'
                    ? 'bg-[#C86414] text-white shadow'
                    : 'text-[#C9C1B8] hover:text-white'
                }`}
              >
                Soy Cliente (Mi Perfil)
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('admin')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'admin'
                    ? 'bg-[#2F5D46] text-white shadow'
                    : 'text-[#C9C1B8] hover:text-white'
                }`}
              >
                Administrador
              </button>
            </div>
          </div>

          <div className="p-6">
            {authTab === 'cliente' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F2ECE1] border border-[#E5DCCD] space-y-1.5">
                  <p className="text-sm font-bold text-[#1F1C1A]">
                    {hasClientToken ? 'Sesión de cliente activa' : 'Ingresa o regístrate con tu celular'}
                  </p>
                  <p className="text-xs text-[#665E57] leading-relaxed">
                    Consulta tus pedidos activos, historial de almuerzos, direcciones guardadas y puntos de fidelidad.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    localStorage.setItem('client_token', 'universal-client-token');
                    setIsAuthModalOpen(false);
                    navigate('/mi-cuenta');
                  }}
                  className="w-full h-12 rounded-full bg-[#C86414] hover:bg-[#DF741D] text-white font-bold text-sm"
                >
                  <User className="w-4 h-4 mr-2" />
                  {hasClientToken ? 'Ir a Mi Perfil' : 'Ingresar a Mi Perfil (Prueba)'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigate('/mi-cuenta');
                  }}
                  className="w-full py-2 text-xs font-semibold text-[#665E57] hover:text-[#1F1C1A]"
                >
                  O ingresar con mi número celular real →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigate('/mis-pedidos');
                  }}
                  className="w-full py-2.5 text-xs font-bold text-[#2F5D46] hover:underline"
                >
                  Consultar estado de mi pedido sin iniciar sesión →
                </button>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F2ECE1] border border-[#E5DCCD]">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#2F5D46]">Sesión de Administrador</p>
                  <p className="text-base font-bold text-[#1F1C1A] mt-1">{user.nombre || user.slug}</p>
                  <p className="text-xs text-[#665E57]">{user.email}</p>
                </div>
                <Button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full h-12 rounded-full bg-[#2F5D46] hover:bg-[#3A7256] text-white font-bold text-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Ir al Panel de Ajustes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    toast.info('Sesión administrativa cerrada');
                  }}
                  className="w-full h-11 rounded-full border-[#E5DCCD] text-[#665E57] hover:text-[#1F1C1A]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-xs font-bold text-[#1F1C1A]">
                    Correo del Administrador
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665E57]" />
                    <Input
                      id="admin-email"
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl bg-white border-[#E5DCCD]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass" className="text-xs font-bold text-[#1F1C1A]">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665E57]" />
                    <Input
                      id="admin-pass"
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl bg-white border-[#E5DCCD]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#665E57] hover:text-[#1F1C1A]"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full h-12 rounded-full bg-[#2F5D46] hover:bg-[#3A7256] text-white font-bold text-sm"
                >
                  {adminLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Ingresar a Ajustes
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* CART & CHECKOUT DRAWER (Full functionality on Home Page)            */}
      {/* =================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#181615]/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#FBF9F5] h-full shadow-2xl flex flex-col z-10 border-l border-[#E5DCCD]">
            {/* Drawer Header */}
            <div className="p-6 bg-[#181615] text-[#FBF9F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C86414] flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className="font-bold text-lg"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    Tu Pedido
                  </h2>
                  <p className="text-xs text-[#D9B99B]">Veco&apos;s Restaurante · Sabor que te encanta</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16">
                      <ShoppingCart className="w-14 h-14 text-[#E5DCCD] mb-4" />
                      <p className="font-bold text-[#665E57]">Tu carrito está vacío</p>
                      <p className="text-xs text-[#9A9086] mt-1 max-w-xs">
                        Arma tu almuerzo ejecutivo o agrega un plato de nuestra carta para comenzar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className="flex gap-3.5 p-3.5 bg-white rounded-2xl border border-[#E5DCCD]"
                        >
                          {item.imagen && (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-[#1F1C1A] truncate">{item.nombre}</h4>
                            {item.notes && (
                              <p className="text-[11px] text-[#665E57] mt-0.5 leading-snug">{item.notes}</p>
                            )}
                            <p className="text-sm font-extrabold text-[#C86414] mt-1">
                              {formatCurrency(item.precio * item.qty)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#F2ECE1] px-2 rounded-xl h-9 self-center">
                            <button
                              onClick={() => updateCartQty(idx, -1)}
                              className="p-1 text-[#665E57] hover:text-[#1F1C1A]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(idx, 1)}
                              className="p-1 text-[#665E57] hover:text-[#1F1C1A]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {cartStep === 'checkout' && (
                <form id="landing-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#665E57] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <User className="w-3.5 h-3.5" /> Tu Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutData.nombre}
                      onChange={(e) => setCheckoutData({ ...checkoutData, nombre: e.target.value })}
                      placeholder="Ej: Laura Martínez"
                      className="w-full h-11 bg-white border border-[#E5DCCD] rounded-xl px-4 text-sm focus:border-[#C86414] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E57] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <Phone className="w-3.5 h-3.5" /> Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={checkoutData.telefono}
                      onChange={(e) => setCheckoutData({ ...checkoutData, telefono: e.target.value })}
                      placeholder="Ej: 300 123 4567"
                      className="w-full h-11 bg-white border border-[#E5DCCD] rounded-xl px-4 text-sm focus:border-[#C86414] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E57] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Dirección de Entrega o Mesa
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutData.direccion}
                      onChange={(e) => setCheckoutData({ ...checkoutData, direccion: e.target.value })}
                      placeholder="Calle 84 # 45-22 / Apto 302"
                      className="w-full h-11 bg-white border border-[#E5DCCD] rounded-xl px-4 text-sm focus:border-[#C86414] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E57] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Método de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'efectivo', label: 'Efectivo' },
                        { id: 'transferencia', label: 'Nequi / Bancol.' },
                        { id: 'datafono', label: 'Datáfono' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setCheckoutData({ ...checkoutData, metodo_pago: m.id })}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                            checkoutData.metodo_pago === m.id
                              ? 'border-[#C86414] bg-[#C86414]/10 text-[#C86414]'
                              : 'border-[#E5DCCD] bg-white text-[#665E57]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {cartStep === 'success' && (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#2F5D46]/15 text-[#2F5D46] flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3
                    className="text-2xl font-bold text-[#1F1C1A] mb-2"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    ¡Pedido Recibido!
                  </h3>
                  <p className="text-sm text-[#665E57] mb-6 max-w-xs">
                    Estamos preparando tu almuerzo en este momento. Te contactaremos al {checkoutData.telefono}.
                  </p>
                  <div className="w-full p-4 rounded-2xl bg-[#F2ECE1] border border-[#E5DCCD] text-left space-y-2 text-xs mb-6">
                    <div className="flex justify-between">
                      <span className="text-[#665E57]">Cliente</span>
                      <span className="font-bold">{checkoutData.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#665E57]">Total</span>
                      <span className="font-extrabold text-[#C86414]">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setCart([]);
                      setCartStep('cart');
                      setIsCartOpen(false);
                    }}
                    className="w-full h-12 rounded-full bg-[#181615] hover:bg-[#2E2A28] text-white font-bold"
                  >
                    Volver al Inicio
                  </Button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && cartStep !== 'success' && (
              <div className="p-6 bg-white border-t border-[#E5DCCD] space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-[#665E57]">Total a pagar</span>
                  <span
                    className="text-2xl font-bold text-[#1F1C1A]"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                {cartStep === 'cart' ? (
                  <Button
                    onClick={() => setCartStep('checkout')}
                    className="w-full h-12 rounded-full bg-[#C86414] hover:bg-[#DF741D] text-white font-bold"
                  >
                    Continuar con el Pedido
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCartStep('cart')}
                      className="h-12 px-5 rounded-full border-[#E5DCCD]"
                    >
                      Volver
                    </Button>
                    <Button
                      type="submit"
                      form="landing-checkout-form"
                      className="flex-1 h-12 rounded-full bg-[#2F5D46] hover:bg-[#3A7256] text-white font-bold"
                    >
                      Confirmar Pedido
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agente Experto Flotante de Fogón & Mesa */}
      <LandingAgent />
    </div>
  );
}
