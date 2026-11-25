import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart, CartProvider } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ShoppingCart,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Phone,
  User,
  Award,
  Gift,
  Search,
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ArrowRight,
  Truck,
  MapPin,
  Map,
  Navigation as NavigationIcon,
  Pizza,
  Coffee,
  Beer,
  Wine,
  Cake,
  IceCream,
  Sandwich,
  Salad,
  Soup,
  Fish,
  Drumstick,
  Beef,
  Wheat,
  Apple,
  Carrot,
  Egg,
  Milk,
  Vegan,
  GlassWater,
  Tag,
  Cookie,
  Croissant,
  Grape,
  Banana,
  Cherry,
  Citrus,
  Martini,
  CupSoda,
  Popcorn,
  Sparkles,
  ChefHat,
  CookingPot,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MapPicker } from '@/components/MapPicker';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { FloatingWA } from '@/components/FloatingWA';
import PublicTrialLocked from '@/components/PublicTrialLocked';
import { parseBusinessSchedule } from '@/utils/scheduleParser';
import { BusinessClosedModal } from '@/components/BusinessClosedModal';
import { PromoModal } from '@/components/PromoModal';
import GOOGLE_MAPS_API_KEY from '@/config/googleMaps';

const AvailableIcons = {
  UtensilsCrossed,
  Pizza,
  Coffee,
  Beer,
  Wine,
  Cake,
  IceCream,
  Sandwich,
  Salad,
  Soup,
  Fish,
  Drumstick,
  Beef,
  Wheat,
  Apple,
  Carrot,
  Egg,
  Milk,
  Vegan,
  GlassWater,
  Tag,
  Cookie,
  Croissant,
  Grape,
  Banana,
  Cherry,
  Citrus,
  Martini,
  CupSoda,
  Popcorn,
  Sparkles,
  ChefHat,
  CookingPot,
  Navigation: NavigationIcon,
  Truck,
  MapPin,
  Clock,
  User,
  Star,
  Gift,
  Award
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Backend API URL
const API = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';


const MenuContent = () => {
  const { slug, mesa } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, addItem, updateQuantity, clearCart, total, itemCount, customerInfo, setCustomerInfo, checkAndSetSede } = useCart();

  const [business, setBusiness] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [lockedMessage, setLockedMessage] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [shuffledAllProducts, setShuffledAllProducts] = useState([]);
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

  // New states for Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [productNotes, setProductNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Loyalty states
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);
  const [customerPoints, setCustomerPoints] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Delivery states
  const [tipoPedido, setTipoPedido] = useState(mesa ? 'mesa' : 'takeaway');
  const [direccion, setDireccion] = useState('');
  const [isManualAddress, setIsManualAddress] = useState(true);
  const [distancia, setDistancia] = useState(0);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [metodoPago, setMetodoPago] = useState('');
  const [metodoEntregaNombre, setMetodoEntregaNombre] = useState('');

  const handleBack = () => {
    // El botón de atrás del menú SIEMPRE me lleva al Perfil del negocio primero
    if (slug) {
      navigate(`/${slug}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    if (slug === 'demo-restaurante') {
      navigate('/demo-restaurante', { replace: true });
      return;
    }
    // Register this branch in the cart context — clears cart if user switched branches
    if (slug) checkAndSetSede(slug);
    fetchData();
  }, [slug, mesa]);

  // Fetch customer points when phone changes
  useEffect(() => {
    if (customerInfo.telefono && customerInfo.telefono.length >= 10 && loyaltyConfig?.activo) {
      fetchCustomerPoints(customerInfo.telefono);
    } else {
      setCustomerPoints(null);
      setRedeemPoints(0);
      setDiscount(0);
    }
  }, [customerInfo.telefono, loyaltyConfig]);

  const fetchData = async () => {
    try {
      const [businessRes, productsRes, loyaltyRes] = await Promise.all([
        axios.get(`${API}/business/${slug}`),
        axios.get(`${API}/menu-items/${slug}`),
        axios.get(`${API}/loyalty/${slug}/config`).catch(() => ({ data: { activo: false } }))
      ]);

      setBusiness(businessRes.data);

      const parsedSched = parseBusinessSchedule(businessRes.data.horarios, businessRes.data.abierto);
      setScheduleData(parsedSched);
      if (parsedSched.isClosed) {
        setShowClosedModal(true);
      }

      // Initialize payment method from active ones
      const pMethods = businessRes.data.metodos_pago || {};
      const activePM = Object.entries(pMethods)
        .filter(([_, active]) => active)
        .map(([key]) => key);

      const pLabels = {
        efectivo: 'Efectivo',
        nequi: 'Nequi',
        daviplata: 'Daviplata',
        transferencia: 'Transferencia',
        tarjeta: 'Tarjeta',
        link: 'Link de Pago'
      };

      if (activePM.length > 0) {
        setMetodoPago(pLabels[activePM[0]] || 'Efectivo');
      } else {
        setMetodoPago('Efectivo');
      }

      if (!mesa) {
        const methods = businessRes.data.metodos_entrega || {};
        const activeMethods = Object.entries(methods)
          .filter(([_, active]) => active)
          .map(([key]) => key);

        if (activeMethods.length > 0) {
          const first = activeMethods[0];
          setTipoPedido(first === 'domicilio' ? 'delivery' : first === 'mesa' ? 'mesa' : 'takeaway');
          setMetodoEntregaNombre(first === 'domicilio' ? 'Domicilio' : first === 'mesa' ? 'Mesa' : 'Para recoger');
        }
      }

      // Map and filter available products
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
      const mappedProducts = productsData.map(p => {
        const nombreNormalizado = p.name || p.nombre || "";
        const lowerName = nombreNormalizado.toLowerCase();

        return {
          ...p,
          nombre: nombreNormalizado,
          descripcion: p.description || p.descripcion,
          precio: p.base_price ?? p.precio ?? 0,
          imagen: p.image_url || p.imagen,
          categoria: p.category || p.categoria,
          disponible: p.available ?? p.disponible,
          destacado: p.is_recommended ?? p.destacado,
          // DEMO: Inyectamos datos nutricionales IA si no existen para la prueba visual
          nutri_kcal: p.nutri_kcal || (lowerName.includes('hamburguesa') ? 850 : lowerName.includes('paisa') ? 1150 : lowerName.includes('salada') ? 320 : lowerName.includes('salmón') ? 540 : null),
          nutri_proteina: p.nutri_proteina || (lowerName.includes('hamburguesa') ? '32g' : lowerName.includes('paisa') ? '45g' : lowerName.includes('salada') ? '12g' : lowerName.includes('salmón') ? '38g' : null),
          nutri_carbohidratos: p.nutri_carbohidratos || (lowerName.includes('hamburguesa') ? '48g' : lowerName.includes('paisa') ? '110g' : lowerName.includes('salada') ? '15g' : lowerName.includes('salmón') ? '12g' : null),
          nutri_grasa: p.nutri_grasa || (lowerName.includes('hamburguesa') ? '38g' : lowerName.includes('paisa') ? '58g' : lowerName.includes('salada') ? '18g' : lowerName.includes('salmón') ? '22g' : null),
          is_vegan: false,
          is_vegetarian: false,
          is_gluten_free: false,
          is_spicy: false
        };
      });

      const availableProducts = mappedProducts.filter(p => p.disponible);
      setProducts(availableProducts);
      setShuffledAllProducts([...availableProducts]); // No random sort, maintain backend order (latest first)
      setLoyaltyConfig(loyaltyRes.data);

      // Handle categories
      let cats = [];
      try {
        const categoriesRes = await axios.get(`${API}/categories/${slug}`);
        if (Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
          // Map string categories (legacy) to objects if necessary, though backend should return objects now
          cats = categoriesRes.data.map(c => typeof c === 'string' ? { nombre: c, icono: null } : c);
        }
      } catch (err) {
        console.log("Error fetching categories, falling back to products");
      }

      if (cats.length === 0) {
        // Fallback if API fails or returns empty
        const uniqueCats = [...new Set(productsData.map(p => p.categoria))].filter(Boolean);
        cats = uniqueCats.map(c => ({ nombre: c, icono: null }));
      }

      // Add 'Todas' at the beginning
      setCategories([{ nombre: 'Todas', icono: 'UtensilsCrossed' }, ...cats]);

      if (mesa) {
        try {
          const tableRes = await axios.get(`${API}/tables/${slug}/${mesa}/info`);
          setTableInfo(tableRes.data);
        } catch (e) {
          console.log('Table not found');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response && error.response.status === 403) {
        setLockedMessage(error.response.data?.detail || "Este servicio no está disponible temporalmente.");
      } else {
        toast.error('Error al cargar el menú');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerPoints = async (telefono) => {
    try {
      const response = await axios.get(`${API}/loyalty/${slug}/points/${encodeURIComponent(telefono)}`);
      setCustomerPoints(response.data);
    } catch (error) {
      setCustomerPoints(null);
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value) || Number(value) === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value));
  };

  const handleAddToCart = (product, quantity = 1) => {
    addItem(product, quantity);
    toast.success(`${product.nombre} agregado`, { duration: 1500 });
  };

  const handleProductClick = (product) => {
    if (!product.disponible) return;
    setSelectedProduct(product);
    setQty(1);
    setSelectedModifiers([]);
    setProductNotes('');
  };

  const addToCartAndConfirm = () => {
    if (!selectedProduct) return;

    // Check if required modifiers are selected
    if (selectedProduct.modificadores) {
      const missingRequired = selectedProduct.modificadores.find(group =>
        group.obligatorio && !selectedModifiers.some(m => group.opciones.some(opt => opt.nombre === m.nombre))
      );

      if (missingRequired) {
        toast.error(`Por favor selecciona: ${missingRequired.nombre}`);
        return;
      }
    }

    addItem(selectedProduct, qty, productNotes, selectedModifiers);
    setSelectedProduct(null);
    setShowSuccessModal(true);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada por tu navegador');
      return;
    }

    setCalculatingDistance(true);
    setIsManualAddress(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCustomerInfo(prev => ({ ...prev, lat: latitude, lng: longitude }));

        // Mostrar un texto temporal más limpio
        setDireccion("Obteniendo dirección...");

        if (business?.lat && business?.lng) {
          const dist = calculateDistance(
            business.lat,
            business.lng,
            latitude,
            longitude
          );
          setDistancia(dist);

          const precioKm = business.precio_km || 0;
          const costoMin = business.costo_minimo_domicilio || 0;
          const calculado = dist * precioKm;
          setCostoEnvio(Math.max(calculado, costoMin));
        }

        // Intentar obtener dirección legible
        try {
          let addressFound = null;

          // 1. Intentar con fetch directo a la API de Geocoding (Método Fideli.IA)
          const apiKey = GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            try {
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
              const data = await res.json();
              if (data.status === "OK" && data.results && data.results.length > 0) {
                // Filtrar los plus codes que son molestos e ilegibles para el usuario normal
                const validResults = data.results.filter(r => !r.types.includes('plus_code'));
                if (validResults.length > 0) {
                  addressFound = validResults[0].formatted_address;
                } else {
                  addressFound = data.results[0].formatted_address;
                }
              }
            } catch (e) {
              console.warn("Direct fetch geocoding failed, trying backend...", e);
            }
          }

          // 2. Si falló o no está cargado, intentar por el Backend (que ya tiene la API Key)
          if (!addressFound) {
            const res = await axios.get(`${API}/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
            if (res.data && res.data.address) {
              addressFound = res.data.address;
            } else if (res.data.error) {
              console.error("Backend geocoding error:", res.data.message);
            }
          }

          if (addressFound) {
            setDireccion(addressFound);
          } else {
            setDireccion("Ubicación actual detectada");
          }
        } catch (e) {
          console.error("Geocoding failed entirely:", e);
          setDireccion("Ubicación actual detectada");
        }

        setCalculatingDistance(false);
      },
      (error) => {
        let msg = 'No se pudo obtener tu ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Permiso de ubicación denegado. Actívalo en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            msg = 'Se agotó el tiempo para obtener la ubicación.';
            break;
          default:
            msg = 'Error desconocido al obtener ubicación.';
        }
        console.warn('Geolocation Error:', error);
        toast.error(msg);
        setCalculatingDistance(false);
      }
    );
  };

  const handleRedeemChange = (points) => {
    if (!customerPoints || !loyaltyConfig) return;
    const maxRedeemable = Math.min(customerPoints.puntos_disponibles, Math.floor(total / loyaltyConfig.valor_punto_descuento));
    const validPoints = Math.max(0, Math.min(points, maxRedeemable));
    setRedeemPoints(validPoints);
    setDiscount(validPoints * loyaltyConfig.valor_punto_descuento);
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.nombre || !customerInfo.telefono) {
      toast.error('Por favor completa tu información');
      return;
    }

    setSubmitting(true);

    try {
      // Redeem points first if applicable
      if (redeemPoints > 0 && loyaltyConfig?.activo) {
        await axios.post(`${API}/loyalty/${slug}/redeem`, {
          telefono: customerInfo.telefono,
          puntos_a_canjear: redeemPoints
        });
      }

      const orderData = {
        mesa_id: tableInfo?.id || null,
        mesa_numero: tableInfo?.numero || null,
        items: items.map(item => ({
          producto_id: item.producto_id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          notas: item.notas,
          modificadores: item.modificadores // Send modifiers to backend
        })),
        cliente_nombre: customerInfo.nombre,
        cliente_telefono: customerInfo.telefono,
        tipo: tipoPedido,
        metodo_entrega: metodoEntregaNombre,
        metodo_pago: metodoPago,
        direccion: tipoPedido === 'delivery' ? direccion : null,
        distancia: tipoPedido === 'delivery' ? distancia : null,
        costo_envio: tipoPedido === 'delivery' ? costoEnvio : 0,
        cliente_lat: customerInfo.lat || null,
        cliente_lng: customerInfo.lng || null,
        notas: [
          customerInfo.notas,
          discount > 0 ? `Descuento: ${formatCurrency(discount)} (${redeemPoints} pts)` : null
        ].filter(Boolean).join('. ')
      };

      const response = await axios.post(`${API}/orders/${slug}`, orderData);
      setOrderSuccess({ ...response.data, discount, redeemPoints });
      clearCart();
      setRedeemPoints(0);
      setDiscount(0);
      setCheckoutStep(2);
      toast.success('¡Pedido enviado!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al enviar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    let matchesCategory = false;
    if (activeCategory === 'Todas') {
      matchesCategory = true;
    } else if (activeCategory === 'Destacados') {
      matchesCategory = p.destacado || p.etiqueta?.toLowerCase().includes('destacado');
    } else if (activeCategory === 'Ofertas') {
      matchesCategory = (p.precio_original && p.precio_original > p.precio) || p.etiqueta?.toLowerCase().includes('oferta');
    } else if (activeCategory === 'Menu') {
      matchesCategory = true; // All products
    } else {
      matchesCategory = p.categoria === activeCategory;
    }

    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Use shuffled list for 'Menu' view
  const displayProducts = activeCategory === 'Menu' && searchQuery === ''
    ? shuffledAllProducts
    : filteredProducts;

  // Pagination logic
  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);
  const currentItems = displayProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
    if (activeCategory === 'Menu') {
      setShuffledAllProducts([...products]); // No random sort, maintain latest first order
    }
  }, [activeCategory, searchQuery, products]);

  // Separate sections for 'Todas' view
  const destacados = products.filter(p => p.destacado || p.etiqueta?.toLowerCase().includes('destacado'));
  const ofertas = products.filter(p => (p.precio_original && p.precio_original > p.precio) || p.etiqueta?.toLowerCase().includes('oferta'));
  // "Nuestros Productos" should show EVERYTHING in order of creation
  const principales = [...products];

  const ProductCard = ({ product }) => (
    <motion.div
      layout
      key={product.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => handleProductClick(product)}
      className={`group bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-[#f0f4f2] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-row h-auto cursor-pointer ${!product.disponible ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Left Column (Image + Prep Time) */}
      <div className="flex flex-col shrink-0">
        <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden m-2 md:m-3 rounded-2xl md:rounded-[2rem]">
          <img
            src={product.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badge Etiqueta - Fixed position (Left) */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20">
            {product.etiqueta && (
              <div className="bg-[#4ADE80] text-[#111814] text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg shadow-md border border-white/10 flex items-center gap-1 ring-1 ring-white/20">
                <div className="size-1 rounded-full bg-white animate-pulse" />
                {product.etiqueta}
              </div>
            )}
          </div>

          {/* Rating removed as requested */}


          {!product.disponible && (
            <div className="absolute inset-0 bg-[#618972]/80 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-white/20 backdrop-blur border border-white/50 text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-center">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Prep Time - Positioned in the white space below image */}
        {product.prep_time_minutes > 0 && (
          <div className="flex justify-center -mt-1 mb-2 md:mb-4">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-xl bg-blue-50/50 text-blue-600 text-[8px] md:text-[10px] font-black border border-blue-100 shadow-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
              <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 stroke-[3]" />
              {product.prep_time_minutes} MIN
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-6 flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 md:mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1.5 rounded-full bg-[#4ADE80]/10 text-[8px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-wider">
              {product.categoria}
            </div>
          </div>

          {/* Discount Badges only here */}
          <div className="flex items-center gap-1.5">
            {(product.oferta_porcentaje || (product.precio_original && product.precio_original > product.precio)) && (
              <div className="bg-[#ff4b4b] text-white text-[9px] md:text-[11px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg shadow-sm">
                {product.oferta_porcentaje ? `-${product.oferta_porcentaje}%` : 'OFERTA'}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-sm md:text-xl font-black text-[#111814] group-hover:text-[#22C55E] transition-colors mb-1 md:mb-1.5 leading-tight line-clamp-2 min-h-[1.2em] md:min-h-[1.5em]">
          {product.nombre}
        </h3>

        <p className="text-[#618972] text-[10px] md:text-sm font-medium leading-tight md:leading-relaxed mb-2 line-clamp-2 md:line-clamp-3">
          {product.descripcion || "Plato especial preparado con ingredientes seleccionados."}
        </p>

        {/* Nutritional Info (IA) - Compact row below description */}
        {(product.nutri_kcal || product.nutri_proteina || product.nutri_carbohidratos || product.nutri_grasa) && (
          <div className="flex flex-nowrap items-center gap-1 md:gap-1.5 mb-3 pb-1 w-full overflow-x-auto no-scrollbar">
            {product.nutri_kcal && (
              <div title="Calorías" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#4ADE80]/10 text-[#22C55E] text-[7px] md:text-[8px] font-black border border-[#4ADE80]/20 whitespace-nowrap">
                🔥 {product.nutri_kcal} <span className="md:inline hidden">kcal</span>
              </div>
            )}
            {product.nutri_proteina && (
              <div title="Proteína" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#4ADE80]/10 text-[#22C55E] text-[7px] md:text-[8px] font-black border border-[#4ADE80]/20 whitespace-nowrap">
                🥩 {product.nutri_proteina} <span className="md:inline hidden">prot</span>
              </div>
            )}
            {product.nutri_carbohidratos && (
              <div title="Carbohidratos" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#4ADE80]/10 text-[#22C55E] text-[7px] md:text-[8px] font-black border border-[#4ADE80]/20 whitespace-nowrap">
                🍝 {product.nutri_carbohidratos} <span className="md:inline hidden">carb</span>
              </div>
            )}
            {product.nutri_grasa && (
              <div title="Grasa" className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-[#4ADE80]/10 text-[#22C55E] text-[7px] md:text-[8px] font-black border border-[#4ADE80]/20 whitespace-nowrap">
                🥑 {product.nutri_grasa} <span className="md:inline hidden">grasa</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-[#f0f4f2] min-h-[60px] md:min-h-0">
          <div className="flex items-baseline gap-2 md:gap-3">
            {product.precio > 0 && (
              <span className="text-base md:text-2xl font-black text-[#111814]">{formatCurrency(product.precio)}</span>
            )}
            {product.precio_original > 0 && product.precio_original > product.precio && (
              <span className="text-[9px] md:text-[13px] font-bold text-gray-400 line-through decoration-1 opacity-70">
                {formatCurrency(product.precio_original)}
              </span>
            )}
          </div>
          <div className="size-9 md:size-12 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-lg shadow-[#4ADE80]/20 text-[#111814] group-hover:scale-110 active:scale-95 transition-all border-2 border-white/20">
            <Plus className="w-4 h-4 md:w-6 md:h-6 stroke-[3]" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ProductSection = ({ title, items, onSeeAll, rows = 1 }) => (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-black text-[#111814] tracking-tighter flex items-center gap-2">
          {title}
        </h2>
        <button
          onClick={onSeeAll}
          className="flex h-8 items-center justify-center rounded-full px-4 bg-white border border-[#f0f4f2] text-[#618972] hover:border-[#22C55E] hover:text-[#22C55E] transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          Ver todo
        </button>
      </div>

      <div className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {items.slice(0, rows * 2).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );

  const finalTotal = total - discount + (tipoPedido === 'delivery' ? costoEnvio : 0);
  const potentialPoints = loyaltyConfig?.activo ? Math.floor(finalTotal / loyaltyConfig.pesos_por_punto) : 0;

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
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-[#111814] mb-2">Página no disponible</h1>
        <p className="text-[#618972] max-w-xs mb-8">El restaurante que buscas no existe o ha cambiado su nombre.</p>
        <Button onClick={() => navigate('/')} className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] px-8 h-12 rounded-xl font-bold">
          Ir al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] font-sans text-[#111814] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="px-4 md:px-10 py-3 max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Link to={`/${slug}`} className="flex items-center gap-3 group">
              <div className="size-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                <img
                  src={business.logo_url || `https://ui-avatars.com/api/?name=${business.nombre || 'Burger Full'}&background=22C55E&color=fff&bold=true`}
                  alt={business.nombre || 'Logo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${business.nombre || 'Burger Full'}&background=22C55E&color=fff&bold=true`;
                  }}
                />
              </div>
              <h2 className="text-lg md:text-xl font-black tracking-tighter text-white truncate max-w-[100px] sm:max-w-[200px]">
                {business.nombre}
              </h2>
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden sm:block lg:hidden">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#618972] group-focus-within:text-[#22C55E] transition-colors">
                <Search className="w-full h-full" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tu antojo..."
                className="w-full h-11 bg-gray-100 border-none rounded-2xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#22C55E]/50 transition-all placeholder:text-[#618972]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/${slug}/mi-cuenta`)}
              className="relative size-11 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-[#4ADE80]/10 hover:border-[#4ADE80] transition-all hover:scale-105 active:scale-95 group shadow-sm"
            >
              <User className="w-5 h-5 text-[#111814] group-hover:text-[#22C55E]" />
            </button>
            <button
              onClick={() => { setCartOpen(true); setCheckoutStep(1); }}
              className="relative size-11 rounded-full bg-[#111814] border border-[#4ADE80] flex items-center justify-center hover:bg-[#4ADE80] transition-all hover:scale-105 active:scale-95 group shadow-lg shadow-[#111814]/20"
            >
              <ShoppingCart className="w-5 h-5 text-white group-hover:text-[#111814]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4ADE80] text-[10px] font-black text-[#111814] ring-2 ring-white group-hover:bg-white group-hover:text-[#22C55E]">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Closure Alert Banner */}
        {business && !business.abierto && (
          <div className="bg-red-600 text-white py-4 px-4 sticky top-0 z-[60] shadow-xl animate-pulse rounded-2xl mb-8 -mx-2">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <p className="font-black text-[10px] md:text-sm uppercase tracking-wider text-center">
                ¡LO SENTIMOS! EL NEGOCIO SE ENCUENTRA CERRADO Y NO ESTÁ RECIBIENDO PEDIDOS EN ESTE MOMENTO.
              </p>
            </div>
          </div>
        )}

        {/* Table Info Banner */}
        {tableInfo && (
          <div className="mb-8 p-3 rounded-2xl bg-[#4ADE80] text-[#111814] flex items-center justify-center gap-3 font-bold shadow-lg shadow-[#4ADE80]/20">
            <div className="bg-white/20 p-1 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span>Mesa {tableInfo.numero} · {tableInfo.capacidad} personas</span>
          </div>
        )}

        <div className="mb-10">
          <div className="relative w-full h-80 md:h-[450px] rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white">
            <div className="absolute inset-0 bg-gradient-to-t from-[#102218] via-[#102218]/50 to-transparent z-10" />
            <img
              src={business.banner_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"}
              alt="Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute bottom-0 left-0 p-6 md:p-12 z-20 w-full pb-20 md:pb-24 flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-[#111814] bg-[#4ADE80] rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#4ADE80]/20">
                <Star className="w-3 h-3 fill-[#111814]" />
                {business.banner_tag || 'Los mejores sabores'}
              </span>
              <h1 className="text-3xl md:text-6xl font-black text-white mb-2 tracking-tighter leading-none">{business.banner_title || 'Nuestro Menú'}</h1>
              <p className="text-gray-300 text-sm md:text-lg max-w-xl font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
                {business.banner_description || business.slogan || "Descubre una explosión de sabores preparados con pasión."}
              </p>
            </div>
          </div>

          {/* New Hero Search Bar */}
          <div className="relative z-30 -mt-10 max-w-3xl mx-auto px-4">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#618972] group-focus-within:text-[#22C55E] transition-colors">
                <Search className="w-full h-full" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busquemos la comida que te gusta..."
                className="w-full h-14 bg-white border border-transparent rounded-full pl-14 pr-16 text-base font-medium shadow-xl hover:border-[#22C55E] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 transition-all placeholder:text-[#a0b5ab] text-[#111814]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`p-2.5 rounded-full border transition-colors shadow-sm active:scale-95 ${filterOpen ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814]' : 'bg-gray-50 border-gray-100 text-[#618972] hover:text-[#22C55E]'}`}
                >
                  <Filter className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {filterOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                      Filtrar por
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {categories.map((cat, idx) => {
                        const catName = typeof cat === 'string' ? cat : cat.nombre;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveCategory(catName);
                              setFilterOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${activeCategory === catName ? 'text-[#22C55E]' : 'text-[#111814]'
                              }`}
                          >
                            {catName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Controls - Positioned below search */}
        {/* Category Controls - Sticky on Mobile */}
        {/* Category Controls */}
        <div className="flex items-center gap-2 md:gap-4 mb-8 md:mb-12 overflow-hidden px-2 md:px-0">
          {/* Botón de navegación Izquierdo (Flecha) */}
          <button
            onClick={() => scrollCategories('left')}
            className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-[#22C55E] hover:bg-[#F0FDF4] hover:border-[#22C55E] transition-all active:scale-90"
            aria-label="Anterior categoría"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Área de Scrollable de Categorías */}
          <div
            ref={categoriesRef}
            className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-4 px-2"
          >
            {categories.map((catObj, idx) => {
              const catName = typeof catObj === 'string' ? catObj : catObj.nombre;
              const catIcon = typeof catObj === 'object' ? catObj.icono : null;

              const isUrl = catIcon?.includes('/') || catIcon?.includes('http');
              const isLucide = catIcon && AvailableIcons[catIcon];
              const IconComponent = isLucide ? AvailableIcons[catIcon] : UtensilsCrossed;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(catName)}
                  className={`
                    flex h-10 md:h-12 shrink-0 items-center justify-center gap-x-2.5 rounded-full px-6 md:px-8 transition-all active:scale-95 font-bold text-[10px] md:text-sm uppercase tracking-wider snap-start
                    ${activeCategory === catName
                      ? 'bg-[#4ADE80] text-[#111814] shadow-xl shadow-[#4ADE80]/30 scale-105 ring-2 ring-white'
                      : 'bg-white border border-gray-100 text-gray-500 hover:border-[#22C55E] hover:text-[#111814] shadow-sm'
                    }
                  `}
                >
                  {isUrl ? (
                    <img src={catIcon} alt="" className="w-4 md:w-5 h-4 md:h-5 object-contain" />
                  ) : isLucide ? (
                    <IconComponent className="w-4 md:w-5 h-4 md:h-5" />
                  ) : catIcon ? (
                    <span className="text-lg md:text-2xl leading-none">{catIcon}</span>
                  ) : (
                    <IconComponent className="w-4 md:w-5 h-4 md:h-5" />
                  )}
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>

          {/* Botón de navegación Derecho (Flecha) */}
          <button
            onClick={() => scrollCategories('right')}
            className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-[#22C55E] hover:bg-[#F0FDF4] hover:border-[#22C55E] transition-all active:scale-90"
            aria-label="Siguiente categoría"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>



        {/* Sections or Grid */}
        {activeCategory === 'Todas' && searchQuery === '' ? (
          <div className="pb-32">
            {tableInfo && (
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#f0f4f2] mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#4ADE80]/10 p-3 rounded-full">
                    <User className="w-6 h-6 text-[#22C55E]" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-[#111814]">Bienvenido a la Mesa {tableInfo.numero}</h3>
                    <p className="text-gray-500 text-sm">Escanea el QR de la mesa para vincular tu pedido</p>
                  </div>
                </div>
              </div>
            )}

            {destacados.length > 0 && (
              <ProductSection
                title="✨ Recomendados"
                items={destacados}
                onSeeAll={() => setActiveCategory('Destacados')}
                rows={2}
              />
            )}

            {ofertas.length > 0 && (
              <ProductSection
                title="🔥 Ofertas Especiales"
                items={ofertas}
                onSeeAll={() => setActiveCategory('Ofertas')}
                rows={2}
              />
            )}

            {principales.length > 0 && (
              <ProductSection
                title="🥘 Nuestros Productos"
                items={principales}
                onSeeAll={() => setActiveCategory('Menu')}
                rows={4}
              />
            )}
          </div>
        ) : (
          <div className="space-y-12 pb-32">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-2xl font-black text-[#111814] tracking-tighter flex items-center gap-2">
                {(() => {
                  if (activeCategory === 'Destacados') {
                    return <><Sparkles className="w-6 h-6 text-[#22C55E]" /> <span>✨ Recomendados</span></>;
                  }
                  if (activeCategory === 'Ofertas') {
                    return <><div className="text-[#22C55E] text-xl">🔥</div> <span>Ofertas Especiales</span></>;
                  }
                  if (activeCategory === 'Menu') {
                    return <><CookingPot className="w-6 h-6 text-[#22C55E]" /> <span>🥘 Nuestros Productos</span></>;
                  }
                  if (activeCategory === 'Todas') {
                    return <><UtensilsCrossed className="w-6 h-6 text-[#22C55E]" /> <span>Todas</span></>;
                  }

                  const currentCat = categories.find(c => (c.nombre || c) === activeCategory);
                  const catIcon = typeof currentCat === 'object' ? currentCat.icono : null;

                  const isUrl = catIcon?.includes('/') || catIcon?.includes('http');
                  const isLucide = catIcon && AvailableIcons[catIcon];
                  const IconComp = isLucide ? AvailableIcons[catIcon] : UtensilsCrossed;

                  return (
                    <>
                      {isUrl ? (
                        <img src={catIcon} alt="" className="w-6 h-6 object-contain" />
                      ) : isLucide ? (
                        <IconComp className="w-6 h-6 text-[#22C55E]" />
                      ) : catIcon ? (
                        <span className="text-xl">{catIcon}</span>
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-[#22C55E]" />
                      )}
                      <span>{activeCategory}</span>
                    </>
                  );
                })()}
              </h2>
              {activeCategory !== 'Todas' && (
                <button
                  onClick={() => setActiveCategory('Todas')}
                  className="flex h-8 items-center justify-center rounded-full px-4 bg-white border border-[#f0f4f2] text-[#618972] hover:border-[#22C55E] hover:text-[#22C55E] transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
                >
                  Volver al inicio
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 py-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-[#f0f4f2] h-11 px-6 font-bold text-[#618972]"
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`size-10 rounded-xl font-black text-sm transition-all ${currentPage === i + 1 ? 'bg-[#4ADE80] text-[#111814] shadow-lg shadow-[#4ADE80]/20' : 'bg-white text-[#618972] border border-[#f0f4f2] hover:border-[#4ADE80]'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-[#f0f4f2] h-11 px-6 font-bold text-[#618972]"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}

        {
          filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111814] mb-2">No encontramos nada</h3>
              <p className="text-[#618972]">Intenta buscar con otras palabras o cambia la categoría.</p>
            </div>
          )
        }
      </main>

      {/* Floating Action Button (Cart) */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4"
          >
            <button
              onClick={() => { setCartOpen(true); setCheckoutStep(1); }}
              className="w-full max-w-md bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] rounded-full shadow-[0_20px_50px_rgba(19,236,109,0.3)] flex items-center pl-6 pr-8 py-4 gap-4 transform transition-all hover:scale-[1.02] active:scale-95 group border-2 border-white/20"
            >
              <div className="relative size-12 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111814] text-[11px] font-black text-white ring-2 ring-[#22C55E]">
                  {itemCount}
                </span>
              </div>
              <div className="flex flex-col items-start leading-none flex-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Ver pedido</span>
                <span className="text-xl font-black">{formatCurrency(total)}</span>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[95vh] sm:h-[95vh] rounded-t-[3rem] border-none shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-0" aria-describedby="sheet-description">
          <div className="h-2 bg-gray-100 w-16 rounded-full mx-auto mt-4 mb-2 md:hidden" />
          <div className="px-6 md:px-10 py-6 md:py-8 h-full flex flex-col max-w-[95vw] lg:max-w-6xl mx-auto w-full">
            <SheetHeader className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center text-[#22C55E]">
                    {checkoutStep === 1 && items.length > 0 && <User className="w-6 h-6" />}
                    {checkoutStep === 1 && items.length === 0 && <ShoppingCart className="w-6 h-6" />}
                    {checkoutStep === 2 && <Check className="w-6 h-6" />}
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-black text-[#111814] tracking-tighter">
                      {checkoutStep === 1
                        ? (items.length > 0 ? 'Completa tu pedido' : 'Tu Pedido')
                        : '¡Recibido!'}
                    </SheetTitle>
                    <SheetDescription id="sheet-description" className="text-xs font-bold text-[#618972] uppercase tracking-[0.1em]">
                      {checkoutStep === 1
                        ? (items.length > 0 ? 'Revisa y confirma tus datos' : '0 PRODUCTOS SELECCIONADOS')
                        : 'Pedido enviado con éxito'}
                    </SheetDescription>
                  </div>
                </div>

                {/* Mi Cesta Top Right Indicator */}
                {checkoutStep === 1 && (
                  <div className="flex flex-col items-end">
                    <div className="size-10 bg-[#4ADE80] rounded-full flex items-center justify-center text-[#111814] shadow-lg shadow-[#4ADE80]/30 mb-1">
                      <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#111814]">Mi Cesta</span>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 px-4 md:px-10">
              {/* Combined Checkout View */}
              {checkoutStep === 1 && items.length > 0 && (
                <div className="space-y-8 pb-12">

                  {/* Section 1: Detalle del Pedido (Moved to Top) */}
                  <div className="space-y-4">
                    {/* Title Optional since we have it in header, but keeping for structure */}
                    <h3 className="text-lg font-black text-[#111814] flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" /> Detalle del Pedido
                    </h3>
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                          {/* Remove Button top right */}
                          <button
                            onClick={() => updateQuantity(index, 0)}
                            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors z-10 p-1 hover:bg-gray-100 rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          {/* Image - Wider and always visible */}
                          <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 self-center sm:self-auto">
                            <img
                              src={item.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"}
                              alt={item.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-[#111814] text-base leading-tight pr-6">{item.nombre}</h4>
                            </div>
                            <p className="text-lg font-black text-[#22C55E] mb-2">{formatCurrency(item.precio_unitario)}</p>

                            {/* Modifiers & Notes in Cart */}
                            {item.modificadores && item.modificadores.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {item.modificadores.map((mod, midx) => (
                                  <span key={midx} className="text-[9px] font-black bg-[#4ADE80]/10 text-[#22C55E] px-2 py-0.5 rounded-lg uppercase tracking-tight">
                                    + {typeof mod === 'string' ? mod : `(${mod.cantidad || 1}) ${mod.nombre}`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notas && (
                              <p className="text-[10px] text-amber-600 font-bold mb-3 bg-amber-50 px-2 py-1 rounded-lg border-l-4 border-amber-400">
                                "{item.notas}"
                              </p>
                            )}

                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1.5 w-fit">
                              <button
                                className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#111814] hover:bg-gray-100 active:scale-95 disabled:opacity-50"
                                onClick={() => updateQuantity(index, item.cantidad - 1)}
                              >
                                <Minus className="w-4 h-4 stroke-[3]" />
                              </button>
                              <span className="text-base font-black text-[#111814] min-w-[1.5rem] text-center">{item.cantidad}</span>
                              <button
                                className="size-8 bg-[#111814] text-white rounded-lg shadow-sm flex items-center justify-center hover:bg-black active:scale-95"
                                onClick={() => updateQuantity(index, item.cantidad + 1)}
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">Tu carrito está vacío.</p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Customer Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-[#111814] flex items-center gap-2">
                      <User className="w-5 h-5" /> Datos del Cliente
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="nombre" className="text-xs font-black uppercase tracking-widest text-[#618972] ml-2">Nombre</Label>
                        <Input
                          id="nombre"
                          value={customerInfo.nombre}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, nombre: e.target.value })}
                          placeholder="Tu nombre"
                          className="h-12 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4ADE80]/10 focus:border-[#4ADE80]/20 transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="telefono" className="text-xs font-black uppercase tracking-widest text-[#618972] ml-2">Teléfono</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={customerInfo.telefono}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, telefono: e.target.value })}
                          placeholder="300 000 0000"
                          className="h-12 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#4ADE80]/10 focus:border-[#4ADE80]/20 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="notas" className="text-xs font-black uppercase tracking-widest text-[#618972] ml-2">Observaciones de Entrega</Label>
                      <textarea
                        id="notas"
                        value={customerInfo.notas || ''}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, notas: e.target.value })}
                        placeholder="Ej: Código del edificio, dejar en portería..."
                        className="w-full min-h-[80px] p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 resize-y"
                      />
                    </div>
                  </div>

                  {/* Section 3: Delivery Address (Only if Delivery, Below Customer Data) */}
                  {tipoPedido === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 overflow-visible"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2 px-2">
                          <Label htmlFor="direccion" className="text-xs font-black uppercase tracking-widest text-[#618972] block">Dirección de Entrega</Label>
                          <button
                            onClick={() => {
                              setIsManualAddress(!isManualAddress);
                              if (!isManualAddress) {
                                setDistancia(0);
                                setCostoEnvio(business?.costo_minimo_domicilio || 0);
                              }
                            }}
                            className="text-[10px] font-black underline text-[#22C55E] uppercase tracking-wider"
                          >
                            {isManualAddress ? "Usar buscador (Google)" : "Escribir manualmente (Falla GPS?)"}
                          </button>
                        </div>

                        {!isManualAddress ? (
                          <PlacesAutocomplete
                            value={direccion}
                            placeholder="Calle, Carrera, Edificio, Apto..."
                            onChange={(val) => setDireccion(val)}
                            onPlaceSelected={({ address, lat, lng }) => {
                              setDireccion(address);
                              setCustomerInfo(prev => ({ ...prev, lat, lng }));
                              if (business?.lat && business?.lng) {
                                const dist = calculateDistance(business.lat, business.lng, lat, lng);
                                setDistancia(dist);
                                const precioKm = business.precio_km || 0;
                                const costoMin = business.costo_minimo_domicilio || 0;
                                const calculado = dist * precioKm;
                                setCostoEnvio(Math.max(calculado, costoMin));
                              }
                              toast.success("Dirección validada");
                            }}
                            className="h-14 pl-12 bg-white border-2 border-gray-100 rounded-2xl text-base font-medium focus:ring-4 focus:ring-[#4ADE80]/10 focus:border-[#4ADE80]/20 transition-all shadow-sm"
                          />
                        ) : (
                          <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                            <Input
                              id="direccion"
                              value={direccion}
                              onChange={(e) => setDireccion(e.target.value)}
                              placeholder="Escribe tu dirección completa (calle, apto, barrio...)"
                              className="h-14 pl-12 bg-white border-2 border-gray-100 rounded-2xl text-base font-medium focus:ring-4 focus:ring-[#4ADE80]/10 focus:border-[#4ADE80]/20 transition-all shadow-sm"
                            />
                          </div>
                        )}

                        {isManualAddress && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border-l-4 border-amber-400 flex items-start gap-2">
                              <span>⚠️</span>
                              <span>Asegúrate de incluir barrio y cualquier indicación extra. <b>Nota:</b> Al escribir manualmente, no se genera punto en el mapa para seguimiento en vivo.</span>
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={handleGetLocation}
                            disabled={calculatingDistance}
                            className="w-full h-12 rounded-2xl border-2 border-dashed border-[#4ADE80]/30 text-[#618972] font-black text-xs gap-2 hover:bg-[#4ADE80]/5 transition-all"
                          >
                            {calculatingDistance ? <Loader2 className="w-4 h-4 animate-spin" /> : <NavigationIcon className="w-4 h-4" />}
                            USAR MI UBICACIÓN ACTUAL (GPS)
                          </Button>
                          <p className="text-[9px] font-black text-[#22C55E] text-center uppercase tracking-widest animate-pulse">
                            📍 RECOMENDADO para ver el movimiento del repartidor en vivo
                          </p>
                        </div>

                        {!isManualAddress && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ajusta tu ubicación en el mapa</Label>
                            <MapPicker
                              lat={customerInfo.lat}
                              lng={customerInfo.lng}
                              onChange={({ lat, lng }) => {
                                setCustomerInfo(prev => ({ ...prev, lat, lng }));
                                if (business?.lat && business?.lng) {
                                  const dist = calculateDistance(business.lat, business.lng, lat, lng);
                                  setDistancia(dist);
                                  const precioKm = business.precio_km || 0;
                                  const costoMin = business.costo_minimo_domicilio || 0;
                                  const calculado = dist * precioKm;
                                  setCostoEnvio(Math.max(calculado, costoMin));
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {distancia > 0 && (
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#22C55E]/20 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-[#4ADE80]/10 rounded-xl flex items-center justify-center text-[#22C55E]">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#111814] uppercase tracking-tighter">Costo Envío ({distancia.toFixed(1)} km)</p>
                              <p className="text-[10px] font-bold text-[#618972] italic">Calculado automáticamente</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-[#22C55E]">{formatCurrency(costoEnvio)}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Section 4: Order Type (At the end) */}
                  {!tableInfo && business.metodos_entrega && (
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-[#618972] ml-2 block">Método de Entrega</Label>
                      <div className="bg-gray-50 p-2 rounded-[2rem] flex flex-wrap gap-2">
                        {business.metodos_entrega.domicilio && (
                          <button
                            onClick={() => {
                              setTipoPedido('delivery');
                              setMetodoEntregaNombre('Domicilio');
                            }}
                            className={`flex-1 md:flex-none md:w-48 min-w-[120px] py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest transition-all border-2 ${tipoPedido === 'delivery' ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814] shadow-lg' : 'bg-white border-[#4ADE80]/30 text-[#111814] hover:border-[#4ADE80]'}`}
                          >
                            DOMICILIO
                          </button>
                        )}
                        {business.metodos_entrega.recoger && (
                          <button
                            onClick={() => {
                              setTipoPedido('takeaway');
                              setMetodoEntregaNombre('Para recoger');
                            }}
                            className={`flex-1 md:flex-none md:w-48 min-w-[120px] py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest transition-all border-2 ${tipoPedido === 'takeaway' ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814] shadow-lg' : 'bg-white border-[#4ADE80]/30 text-[#111814] hover:border-[#4ADE80]'}`}
                          >
                            PARA RECOGER
                          </button>
                        )}
                        {business.metodos_entrega.mesa && !mesa && (
                          <button
                            onClick={() => {
                              setTipoPedido('mesa');
                              setMetodoEntregaNombre('Mesa');
                            }}
                            className={`flex-1 md:flex-none md:w-48 min-w-[120px] py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest transition-all border-2 ${tipoPedido === 'mesa' ? 'bg-[#4ADE80] border-[#4ADE80] text-[#111814] shadow-lg' : 'bg-white border-[#4ADE80]/30 text-[#111814] hover:border-[#4ADE80]'}`}
                          >
                            MESA
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 5: Payment Method (At the end) */}
                  {(() => {
                    const pMethods = business.metodos_pago || {};
                    const activePM = Object.entries(pMethods)
                      .filter(([_, active]) => active)
                      .map(([key]) => ({
                        key,
                        label: {
                          efectivo: 'Efectivo',
                          nequi: 'Nequi',
                          daviplata: 'Daviplata',
                          transferencia: 'Transferencia',
                          tarjeta: 'Tarjeta / Datáfono',
                          link: 'Link de Pago'
                        }[key] || key
                      }));

                    if (activePM.length === 0) return null;

                    return (
                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-[#618972] ml-2 block">Método de Pago</Label>
                        <div className="flex flex-wrap gap-2">
                          {activePM.map((m) => (
                            <button
                              key={m.key}
                              onClick={() => setMetodoPago(m.label)}
                              className={`flex-1 md:flex-none md:w-48 min-w-[120px] py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest transition-all border-2 ${metodoPago === m.label ? 'bg-[#4ADE80] text-[#111814] border-[#4ADE80] shadow-lg' : 'bg-white text-[#111814] border-[#4ADE80]/30 hover:border-[#4ADE80]'}`}
                            >
                              {m.label.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 6: Loyalty Points */}
                  {loyaltyConfig?.activo && customerPoints && customerPoints.puntos_disponibles > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#4ADE80]/5 rounded-[2rem] p-6 border border-[#4ADE80]/20"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 bg-[#4ADE80] rounded-2xl flex items-center justify-center text-[#111814] shadow-lg shadow-[#4ADE80]/20">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-black text-sm text-[#111814] block">Tus Puntos Burger Full</span>
                          <span className="text-xs font-bold text-[#22C55E]">{customerPoints.puntos_disponibles.toLocaleString()} disponibles</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={redeemPoints}
                            onChange={(e) => handleRedeemChange(parseInt(e.target.value) || 0)}
                            max={customerPoints.puntos_disponibles}
                            className="h-12 w-28 text-center font-black rounded-xl border-[#22C55E]/30"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#111814]">Canjear puntos</p>
                            <p className="text-xs font-medium text-green-600">Equivale a {formatCurrency(discount)} de descuento</p>
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-[#618972] uppercase tracking-wider">
                          Mínimo {loyaltyConfig.puntos_minimo_canje} pts · 1 punto = {formatCurrency(loyaltyConfig.valor_punto_descuento)}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Section 7: Order Summary */}
                  <div className="bg-gray-50 rounded-[2rem] p-6 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#618972]">Resumen del Pedido</h3>
                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {tipoPedido === 'delivery' && (
                      <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                        <span>Envío ({distancia.toFixed(1)} km)</span>
                        <span>{formatCurrency(costoEnvio)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-sm font-medium text-[#22C55E]">
                        <span>Descuento Puntos</span>
                        <span>- {formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-black text-xl text-[#111814]">Total</span>
                      <span className="font-black text-2xl text-[#111814]">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                  {/* Earn points tip */}
                  {loyaltyConfig?.activo && potentialPoints > 0 && (
                    <div className="bg-gray-100 rounded-3xl p-4 flex items-center gap-4">
                      <div className="size-10 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-gray-200">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111814]">¡Gana con esta compra!</p>
                        <p className="text-xs font-medium text-[#618972]">Acumularás <strong>{potentialPoints} puntos</strong></p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={submitting || !customerInfo.nombre || !customerInfo.telefono || (tipoPedido === 'delivery' && !direccion) || items.length === 0 || !business?.abierto}
                    className={`w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all mt-4 border-2 ${!business?.abierto
                      ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-[#4ADE80] text-[#111814] hover:bg-[#22C55E] border-[#4ADE80]'
                      }`}
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (!business?.abierto ? 'NEGOCIO CERRADO' : 'Pedir Ahora')}
                  </Button>
                </div>
              )}

              {/* Empty Cart State */}
              {checkoutStep === 1 && items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6">
                  <div className="size-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-200">
                    <ShoppingCart className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-black text-[#111814] mb-2 leading-tight">Aún no has añadido nada delicioso</h3>
                  <p className="text-[#618972] text-sm mb-10 max-w-xs mx-auto">Explora nuestro menú y elige tus platos favoritos para realizar un pedido.</p>
                  <Button
                    onClick={() => setCartOpen(false)}
                    className="w-full h-14 bg-[#4ADE80] text-[#111814] rounded-2xl font-black text-lg hover:bg-[#22C55E] transition-all shadow-lg shadow-[#4ADE80]/20"
                  >
                    Ver menú para hacer pedido
                  </Button>
                </div>
              )}

              {/* Step 2: Success */}
              {checkoutStep === 2 && orderSuccess && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="size-24 bg-[#4ADE80] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#4ADE80]/40 relative">
                    <Check className="w-12 h-12 text-[#111814] stroke-[4]" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -inset-2 border-2 border-[#22C55E] rounded-[2.5rem] opacity-30"
                    />
                  </div>
                  <h3 className="text-3xl font-black text-[#111814] mb-2 tracking-tighter">¡Pedido Exitoso!</h3>
                  <p className="text-[#618972] font-medium mb-8">
                    Nuestra cocina ya recibió tu orden{' '}
                      <span
                        onClick={() => {
                          const idToCopy = String(orderSuccess.numero_secuencial || '').padStart(8, '0');
                          navigator.clipboard.writeText(idToCopy);
                          toast.success('Código copiado al portapapeles');
                        }}
                        className="cursor-pointer font-bold text-blue-600 hover:text-blue-800 underline decoration-dashed decoration-2 underline-offset-4 active:scale-95 inline-block transition-transform"
                        title="Copiar código para rastreo"
                      >
                        {String(orderSuccess.numero_secuencial || '').padStart(8, '0')}
                      </span>
                  </p>

                  <div className="bg-gray-50 rounded-[2rem] p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-[#618972] uppercase tracking-widest">Resumen Total</span>
                      <span className="text-2xl font-black text-[#22C55E]">{formatCurrency(orderSuccess.total - (orderSuccess.discount || 0))}</span>
                    </div>
                    {orderSuccess.discount > 0 && (
                      <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                        Descuento aplicado: {formatCurrency(orderSuccess.discount)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate(`/${slug}/mis-pedidos?order=${orderSuccess.id}`)}
                      className="w-full h-14 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] rounded-2xl font-black text-lg gap-3 shadow-lg shadow-[#4ADE80]/20"
                    >
                      Rastrear mi pedido
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" onClick={() => { setCartOpen(false); setCheckoutStep(0); }} className="w-full text-[#618972] font-bold">
                      Seguir navegando
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Actions for Cart/Checkout */}
            {checkoutStep < 2 && (
              <div className="pt-8 mt-auto border-t border-gray-100 space-y-4 pb-12">
                <div className="flex flex-col gap-2">
                  {discount > 0 && (
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#618972]">Descuento canjeado</span>
                      <span className="text-red-500">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-[#618972] uppercase tracking-[0.2em] mb-1">Total a pagar</p>
                      <p className="text-4xl font-black text-[#111814] tracking-tighter">{formatCurrency(finalTotal)}</p>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent
          className="w-full sm:max-w-[95vw] lg:max-w-6xl xl:max-w-[1300px] p-0 overflow-hidden rounded-t-[2.5rem] rounded-b-none sm:rounded-[3rem] bg-white border-none shadow-2xl [&>button]:hidden outline-none !left-0 !right-0 !mx-auto !bottom-0 !top-auto !translate-x-0 !translate-y-0 sm:!left-1/2 sm:!top-1/2 sm:!bottom-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%]"
          aria-describedby="product-description"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription id="product-description">Vista detallada del producto seleccionado con opciones de personalización.</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[85vh]">
              {/* Left Side: Product Image (Sticky or fixed on Desktop) */}
              <div className="relative w-full md:w-[45%] h-48 sm:h-64 md:h-auto overflow-hidden bg-gray-50 flex-shrink-0">
                <img
                  src={selectedProduct.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
                  alt={selectedProduct.nombre}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 left-6 size-10 bg-white/90 backdrop-blur-xl text-[#111814] rounded-full flex items-center justify-center hover:bg-white transition-all shadow-xl md:hidden z-20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {selectedProduct.etiqueta && (
                  <div className="absolute top-6 right-6 z-20">
                    <span className="bg-[#4ADE80] text-[#111814] text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-[#4ADE80]/30">
                      {selectedProduct.etiqueta}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side: Product Details & Modifiers */}
              <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
                {/* Header for Desktop Close */}
                <div className="hidden md:flex items-center justify-end p-6 pb-0 absolute top-0 right-0 z-40">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="size-10 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center transition-all"
                  >
                    <Minus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-64 md:pb-72">
                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4 overflow-hidden">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[10px] font-black text-[#22C55E] uppercase tracking-wider">
                            {selectedProduct.categoria}
                          </div>
                          {selectedProduct.oferta_porcentaje && (
                            <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                              -{selectedProduct.oferta_porcentaje}%
                            </div>
                          )}
                          {selectedProduct.prep_time_minutes > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase tracking-widest">
                              ⏱️ {selectedProduct.prep_time_minutes} min
                            </div>
                          )}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-[#111814] tracking-tighter leading-tight">
                          {selectedProduct.nombre}
                        </h2>
                      </div>

                      <div className="flex items-center gap-4">
                        {selectedProduct.precio > 0 && (
                          <span className="text-3xl font-black text-[#22C55E]">
                            {formatCurrency(selectedProduct.precio)}
                          </span>
                        )}
                        {selectedProduct.precio_original > 0 && selectedProduct.precio_original > selectedProduct.precio && (
                          <span className="text-lg font-bold text-gray-300 line-through decoration-2">
                            {formatCurrency(selectedProduct.precio_original)}
                          </span>
                        )}
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h3 className="text-[10px] font-black text-[#111814] uppercase tracking-widest opacity-40 mb-2">Descripción</h3>
                        <p className="text-[#618972] font-medium leading-relaxed text-sm">
                          {selectedProduct.descripcion || "Este plato es una de nuestras especialidades, preparado con el toque secreto de la casa e ingredientes de la más alta calidad."}
                        </p>
                      </div>

                      {/* Nutritional Info Section (IA) */}
                      {(selectedProduct.nutri_kcal || selectedProduct.nutri_proteina || selectedProduct.nutri_carbohidratos || selectedProduct.nutri_grasa) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-black text-[#111814] uppercase tracking-widest opacity-40">Información Nutricional (Estimada por IA)</h3>
                            <div className="size-1 rounded-full bg-[#4ADE80] animate-pulse" />
                          </div>

                          <div className="grid grid-cols-4 gap-2 md:gap-3">
                            {selectedProduct.nutri_kcal && (
                              <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/10 p-4 rounded-3xl text-center">
                                <p className="text-xl font-black text-[#22C55E] tracking-tighter">{selectedProduct.nutri_kcal}</p>
                                <p className="text-[9px] font-bold text-[#618972] uppercase tracking-widest mt-1">KCAL</p>
                              </div>
                            )}
                            {selectedProduct.nutri_proteina && (
                              <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/10 p-4 rounded-3xl text-center">
                                <p className="text-xl font-black text-[#22C55E] tracking-tighter">{selectedProduct.nutri_proteina}</p>
                                <p className="text-[9px] font-bold text-[#618972] uppercase tracking-widest mt-1">PROT</p>
                              </div>
                            )}
                            {selectedProduct.nutri_carbohidratos && (
                              <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/10 p-4 rounded-3xl text-center">
                                <p className="text-xl font-black text-[#22C55E] tracking-tighter">{selectedProduct.nutri_carbohidratos}</p>
                                <p className="text-[9px] font-bold text-[#618972] uppercase tracking-widest mt-1">CARB</p>
                              </div>
                            )}
                            {selectedProduct.nutri_grasa && (
                              <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/10 p-4 rounded-3xl text-center">
                                <p className="text-xl font-black text-[#22C55E] tracking-tighter">{selectedProduct.nutri_grasa}</p>
                                <p className="text-[9px] font-bold text-[#618972] uppercase tracking-widest mt-1">GRASA</p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-[#618972] font-medium opacity-60 italic mt-2">
                            * Valores aproximados calculados por inteligencia artificial basados en la receta estándar.
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Modifiers List */}
                    <div className="space-y-8">
                      {['tamanos', 'modificadores', 'opciones'].map((categoryKey) => {
                        const groups = selectedProduct[categoryKey];
                        if (!groups || !Array.isArray(groups)) return null;

                        return groups.map((group, groupIdx) => (
                          <div key={`${categoryKey}-${groupIdx}`} className="space-y-4">
                            <div className="flex justify-between items-center bg-white sticky top-0 z-10 py-2 border-b border-gray-100">
                              <div className="space-y-1">
                                <h3 className="text-lg font-black text-[#111814] tracking-tight">{group.nombre}</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${group.obligatorio ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                                    }`}>
                                    {group.obligatorio ? 'Obligatorio' : 'Opcional'}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">
                                    Escoge {group.seleccion_maxima === 1 ? '1 opción' : `hasta ${group.seleccion_maxima} opciones`}
                                  </span>
                                </div>
                              </div>
                              {group.obligatorio && !selectedModifiers.some(m => group.opciones.some(opt => opt.nombre === m.nombre)) && (
                                <div className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black rounded-full animate-pulse border border-red-100">
                                  REQUERIDO
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {group.opciones.map((option, optIdx) => {
                                const maxQtyPerOpt = group.max_qty_per_option ?? 1;
                                const hasQtyControl = maxQtyPerOpt > 1 || maxQtyPerOpt === 0;
                                const existingMod = selectedModifiers.find(m => m.nombre === option.nombre);
                                const isSelected = !!existingMod;
                                const optQty = existingMod?.cantidad || 0;
                                const groupSelections = selectedModifiers.filter(m => group.opciones.some(opt => opt.nombre === m.nombre));
                                const totalGroupQty = groupSelections.reduce((acc, m) => acc + (m.cantidad || 1), 0);
                                const selectorMax = group.seleccion_maxima || 1;
                                const isMaxed = !hasQtyControl && groupSelections.length >= selectorMax && !isSelected;

                                if (hasQtyControl) {
                                  // Quantity controls mode (+/-)
                                  const canAdd = (maxQtyPerOpt === 0 || optQty < maxQtyPerOpt);
                                  return (
                                    <div
                                      key={`${categoryKey}-${groupIdx}-${optIdx}`}
                                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${optQty > 0
                                        ? 'bg-[#4ADE80]/5 border-[#4ADE80] shadow-sm'
                                        : 'bg-white border-gray-100'
                                        }`}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="text-left">
                                          <span className={`text-sm font-black ${optQty > 0 ? 'text-[#111814]' : 'text-gray-600'}`}>
                                            {option.nombre}
                                          </span>
                                          {option.precio > 0 && (
                                            <span className={`ml-2 text-xs font-black ${optQty > 0 ? 'text-[#22C55E]' : 'text-gray-400'}`}>
                                              + {formatCurrency(option.precio)} c/u
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (optQty <= 1) {
                                              setSelectedModifiers(prev => prev.filter(m => m.nombre !== option.nombre));
                                            } else {
                                              setSelectedModifiers(prev => prev.map(m =>
                                                m.nombre === option.nombre ? { ...m, cantidad: m.cantidad - 1 } : m
                                              ));
                                            }
                                          }}
                                          disabled={optQty === 0}
                                          className="size-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-30"
                                        >
                                          <Minus className="w-4 h-4 stroke-[3]" />
                                        </button>
                                        <span className="text-sm font-black text-[#111814] min-w-[24px] text-center">{optQty}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isSelected) {
                                              setSelectedModifiers(prev => [...prev, { ...option, cantidad: 1 }]);
                                            } else if (canAdd) {
                                              setSelectedModifiers(prev => prev.map(m =>
                                                m.nombre === option.nombre ? { ...m, cantidad: (m.cantidad || 1) + 1 } : m
                                              ));
                                            }
                                          }}
                                          disabled={!canAdd && isSelected}
                                          className="size-8 rounded-lg bg-[#4ADE80] flex items-center justify-center text-white hover:bg-[#22C55E] active:scale-90 transition-all disabled:opacity-30"
                                        >
                                          <Plus className="w-4 h-4 stroke-[3]" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={`${categoryKey}-${groupIdx}-${optIdx}`}
                                    disabled={isMaxed && selectorMax > 1}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedModifiers(prev => prev.filter(m => m.nombre !== option.nombre));
                                      } else {
                                        if (selectorMax === 1) {
                                          setSelectedModifiers(prev => [
                                            ...prev.filter(m => !group.opciones.some(opt => opt.nombre === m.nombre)),
                                            { ...option, cantidad: 1 }
                                          ]);
                                        } else {
                                          setSelectedModifiers(prev => [...prev, { ...option, cantidad: 1 }]);
                                        }
                                      }
                                    }}
                                    className={`group/opt w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isSelected
                                      ? 'bg-[#4ADE80]/5 border-[#4ADE80] shadow-sm'
                                      : 'bg-white border-gray-100 hover:border-gray-200'
                                      } ${isMaxed && selectorMax > 1 ? 'opacity-40 grayscale-0 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#4ADE80] border-[#4ADE80] rotate-0' : 'border-gray-200 bg-gray-50 group-hover/opt:border-gray-400'
                                        }`}>
                                        {isSelected && <CheckCircle2 className="size-4 text-white stroke-[3]" />}
                                      </div>
                                      <div className="text-left">
                                        <span className={`text-sm font-black ${isSelected ? 'text-[#111814]' : 'text-gray-600'}`}>
                                          {option.nombre}
                                        </span>
                                      </div>
                                    </div>
                                    {option.precio > 0 && (
                                      <div className="flex flex-col items-end">
                                        <span className={`text-xs font-black ${isSelected ? 'text-[#22C55E]' : 'text-gray-400'}`}>
                                          + {formatCurrency(option.precio)}
                                        </span>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })}

                      {/* Notes Section */}
                      <div className="space-y-4 pb-12">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-[#111814] tracking-tight">Observaciones del pedido</h3>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">(Opcional)</span>
                        </div>
                        <textarea
                          value={productNotes}
                          onChange={(e) => setProductNotes(e.target.value)}
                          placeholder="¿Alguna instrucción especial para la cocina?"
                          className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-3xl p-6 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#4ADE80]/10 focus:border-[#4ADE80]/20 focus:outline-none transition-all placeholder:text-gray-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                    {/* Quantity Control */}
                    <div className="flex items-center gap-4 bg-gray-100 rounded-2xl p-2 border border-gray-200 w-full sm:w-auto justify-between">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#111814] hover:bg-gray-50 active:scale-90 transition-all disabled:opacity-30"
                        disabled={qty <= 1}
                      >
                        <Minus className="w-5 h-5 stroke-[3]" />
                      </button>
                      <span className="text-xl font-black text-[#111814] min-w-[30px] text-center">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#111814] hover:bg-gray-50 active:scale-90 transition-all"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Total & Add Button */}
                    <Button
                      onClick={addToCartAndConfirm}
                      disabled={!business?.abierto}
                      className={`w-full h-14 md:h-16 rounded-2xl md:rounded-[1.5rem] font-black text-lg md:text-xl tracking-tight shadow-xl active:scale-95 transition-all flex items-center justify-between px-8 group ${!business?.abierto
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#4ADE80] text-[#111814] hover:bg-[#22C55E] shadow-[#4ADE80]/20'
                        }`}
                    >
                      <span className="flex flex-col items-start leading-none">
                        <span className="text-[10px] uppercase tracking-[0.1em] opacity-60 mb-1">
                          {!business?.abierto ? 'NO DISPONIBLE' : 'Añadir al pedido'}
                        </span>
                        <span className="text-sm md:text-base">
                          {!business?.abierto ? 'NEGOCIO CERRADO' : 'Confirmar producto'}
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-[1px] h-6 bg-[#111814]/10" />
                        <span className="text-xl">
                          {formatCurrency(((selectedProduct.precio || 0) + selectedModifiers.reduce((acc, m) => acc + ((m.precio || 0) * (m.cantidad || 1)), 0)) * qty)}
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success / Added to Cart Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm w-full rounded-[2.5rem] border-none shadow-2xl p-8 bg-white text-center" aria-describedby="success-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#111814] mb-2">¡Producto añadido!</DialogTitle>
            <DialogDescription id="success-description" className="text-[#618972] font-medium mb-8">
              El producto se ha añadido correctamente a tu carrito de compras.
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto size-16 bg-[#4ADE80]/20 rounded-full flex items-center justify-center mb-4 text-[#22C55E]">
            <CheckCircle2 className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setCartOpen(true);
                setCheckoutStep(1); // CORRECT: Direct to combined checkout view
              }}
              className="w-full h-12 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black rounded-xl shadow-lg shadow-[#4ADE80]/20"
            >
              Ver Cesta
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSuccessModal(false)}
              className="w-full h-12 text-[#618972] font-bold hover:bg-gray-50 rounded-xl"
            >
              Seguir comprando
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating WA AI Agent */}
      <FloatingWA
        businessName={business?.nombre}
        whatsapp={business?.whatsapp}
        aiEnabled={business?.ai_habilitado}
        aiSaludo={business?.ai_saludo}
        slug={slug}
        aiUseModal={business?.ai_use_modal}
        isClosed={scheduleData?.isClosed ?? !business?.abierto}
        hidden={!!selectedProduct || cartOpen || showSuccessModal}
      />

      <BusinessClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        scheduleData={scheduleData}
      />
      <PromoModal business={business} />
    </div >
  );
};

export default function MenuPublico() {
  return <MenuContent />;
}
