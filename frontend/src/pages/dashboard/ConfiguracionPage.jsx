import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
    Building2,
    Store,
    MapPin,
    Phone,
    Clock,
    Camera,
    Utensils,
    Image as ImageIcon,
    Save,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    Loader2,
    LayoutGrid,
    Settings2,
    Languages,
    Smartphone,
    X,
    FolderPlus,
    Palette,
    Upload,
    MoreVertical,
    Tag as TagIcon,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Package,
    Truck,
    ShoppingBag,
    Navigation as NavigationIcon,
    CreditCard as CreditCardIcon,
    Globe,
    QrCode,
    Copy,
    Download,
    Sparkles,
    Coins,
    Wallet,
    Banknote,
    Link as LinkIcon,
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
    Star,
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
    MessageSquare,
    Lock,
    Eye,
    EyeOff,
    Layers,
    ListChecks,
    GripVertical,
    Maximize,
    PlusCircle
} from 'lucide-react';

// Icon mapping for categories
const AvailableIcons = {
    Utensils, Pizza, Coffee, Beer, Wine, Cake, IceCream, Sandwich, Salad, Soup,
    Fish, Drumstick, Beef, Wheat, Apple, Carrot, Egg, Milk, Vegan, GlassWater,
    Star, Tag, Cookie, Croissant, Grape, Banana, Cherry, Citrus, Martini, CupSoda,
    Popcorn
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPicker } from '@/components/MapPicker';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';

const defaultCategories = ['Platos fuertes', 'Entradas', 'Bebidas', 'Postres', 'Acompañamientos'];
const defaultImages = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
];

const getButtonStyle = (hasPendingChanges, size = "large") => {
    const heightClass = size === "small" ? "h-11 px-6" : "h-14 px-10";
    if (hasPendingChanges) {
        return `${heightClass} rounded-full bg-[#4ADE80] text-[#111814] font-black uppercase text-[10px] tracking-widest hover:bg-[#4ADE80] shadow-xl shadow-[#4ADE80]/20 transition-all active:scale-95 flex items-center gap-3 border-2 border-transparent`;
    }
    return `${heightClass} rounded-full bg-white text-[#22C55E] border-2 border-[#4ADE80] font-black uppercase text-[10px] tracking-widest hover:bg-[#4ADE80]/5 transition-all active:scale-95 flex items-center gap-3 shadow-sm`;
};

const getModalButtonStyle = (hasPendingChanges) => {
    if (hasPendingChanges) {
        return "flex-1 h-12 rounded-2xl bg-[#4ADE80] text-[#111814] border border-[#4ADE80]/50 font-black uppercase text-[10px] tracking-widest hover:bg-[#4ADE80] shadow-lg shadow-[#4ADE80]/10 transition-all active:scale-95";
    }
    return "flex-1 h-12 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100 font-black uppercase text-[10px] tracking-widest cursor-not-allowed transition-all";
};

const formatPrice = (val) => {
    if (!val || val === '0' || val === 0) return '';
    const numeric = val.toString().replace(/\D/g, '');
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const ConfiguracionPage = () => {
    const { slug = 'vecos' } = useParams();
    const { user, api } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Single-business slug for Fogón & Mesa
    const currentSlug = slug || user?.slug || 'demo-restaurante';

    // Default to 'domicilios' tab
    const rawTab = searchParams.get('tab');
    const validTabs = ['domicilios', 'entrega', 'pagos', 'ai'];
    const activeTab = validTabs.includes(rawTab) ? rawTab : 'domicilios';

    // Status states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Business Data
    const [businessData, setBusinessData] = useState({
        nombre: '',
        descripcion: '',
        direccion: '',
        telefono: '',
        horarios: '',
        banner_url: '',
        logo_url: '',
        slogan: '',
        banner_tag: '',
        banner_title: '',
        banner_description: '',
        ai_habilitado: true,
        ai_personalidad: 'Amigable y cercano (Recomendado)',
        ai_saludo: '',
        ai_conocimiento: '',

        twilio_sid: '',
        twilio_token: '',
        twilio_number: '',
        datos_pago: {
            nequi: { numero: '', qr_url: '' },
            daviplata: { numero: '', qr_url: '' },
            transferencia: { banco: '', numero_cuenta: '' },
            tarjeta: { link_pago: '', qr_url: '' },
            link: { llave: '', qr_url: '' }
        }
    });
    const [originalData, setOriginalData] = useState(null);

    // Catalog Data
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Category State
    const [categories, setCategories] = useState([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // The object being edited
    const [categoryName, setCategoryName] = useState('');
    const [originalCategoryName, setOriginalCategoryName] = useState('');
    const [categoryIcon, setCategoryIcon] = useState('Utensils'); // Default icon

    // Tag State
    const [tags, setTags] = useState([]);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [tagName, setTagName] = useState('');
    const [originalTagName, setOriginalTagName] = useState('');

    const [analyzingNutrition, setAnalyzingNutrition] = useState(false);
    const [generatingAIImage, setGeneratingAIImage] = useState(false);
    const [generatingAIDescription, setGeneratingAIDescription] = useState(false);

    // Modal states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [productForm, setProductForm] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        etiqueta: '',
        imagen: '',
        disponible: true,
        destacado: false,
        oferta_porcentaje: '',
        modificadores: [],
        tamanos: [],
        opciones: [],
        is_vegan: false,
        is_vegetarian: false,
        is_gluten_free: false,
        is_spicy: false,
        prep_time_minutes: '',
        allergens: []
    });
    const [originalProductForm, setOriginalProductForm] = useState(null);

    const [uploadingProductImage, setUploadingProductImage] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newDeliveryMethod, setNewDeliveryMethod] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        setUploadingProductImage(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api().post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProductForm(prev => ({ ...prev, imagen: response.data.url }));
            toast.success('Imagen subida correctamente');
        } catch (error) {
            console.error('Upload error:', error);
            const errorMsg = error.response?.data?.detail || 'Error al subir la imagen';
            toast.error(errorMsg);
        } finally {
            setUploadingProductImage(false);
        }
    };

    const handleCategoryIconUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        setSaving(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api().post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCategoryIcon(response.data.url);
            toast.success('Icono subido correctamente');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error al subir icono');
        } finally {
            setSaving(false);
        }
    };

    const defaultDatosPago = {
        nequi: { numero: '', qr_url: '' },
        daviplata: { numero: '', qr_url: '' },
        transferencia: { banco: '', numero_cuenta: '' },
        tarjeta: { link_pago: '', qr_url: '' },
        link: { llave: '', qr_url: '' }
    };

    const normalizeDatosPago = (rawDatos) => {
        let localDatos = {};
        try {
            const saved = localStorage.getItem('fogon_mesa_datos_pago');
            if (saved) localDatos = JSON.parse(saved);
        } catch (e) {}

        const source = rawDatos && Object.keys(rawDatos).length > 0 ? rawDatos : localDatos;
        return {
            nequi: { ...defaultDatosPago.nequi, ...(localDatos.nequi || {}), ...(source?.nequi || {}) },
            daviplata: { ...defaultDatosPago.daviplata, ...(localDatos.daviplata || {}), ...(source?.daviplata || {}) },
            transferencia: { ...defaultDatosPago.transferencia, ...(localDatos.transferencia || {}), ...(source?.transferencia || {}) },
            tarjeta: { ...defaultDatosPago.tarjeta, ...(localDatos.tarjeta || {}), ...(source?.tarjeta || {}) },
            link: { ...defaultDatosPago.link, ...(localDatos.link || {}), ...(source?.link || {}) }
        };
    };

    const updatePaymentDetail = (methodKey, field, value) => {
        setBusinessData(prev => ({
            ...prev,
            datos_pago: {
                ...defaultDatosPago,
                ...(prev.datos_pago || {}),
                [methodKey]: {
                    ...(defaultDatosPago[methodKey] || {}),
                    ...(prev.datos_pago?.[methodKey] || {}),
                    [field]: value
                }
            }
        }));
    };

    const [uploadingQrMethod, setUploadingQrMethod] = useState(null);

    const handlePaymentQrUpload = async (e, methodKey) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida para el QR');
            e.target.value = '';
            return;
        }

        setUploadingQrMethod(methodKey);

        // Immediate local preview & demo fallback
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            updatePaymentDetail(methodKey, 'qr_url', dataUrl);
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api().post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data?.url) {
                updatePaymentDetail(methodKey, 'qr_url', response.data.url);
            }
            toast.success('Código QR adjuntado correctamente');
        } catch (error) {
            // Keep local dataUrl in demo mode
            toast.success('Código QR adjuntado correctamente');
        } finally {
            setUploadingQrMethod(null);
            e.target.value = '';
        }
    };

    const handleBusinessMediaUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        setSaving(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api().post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setBusinessData(prev => ({ ...prev, [field]: response.data.url }));
            toast.success('Imagen de identidad actualizada');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [currentSlug]);

    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && products.length > 0) {
            const productToEdit = products.find(p => p.id === editId || p.id.toString() === editId);
            if (productToEdit) {
                openEditProduct(productToEdit);
                setSearchParams({ tab: activeTab });
            }
        }
    }, [searchParams, products]);

    const fetchCatalog = async () => {
        try {
            const [productsRes, categoriesRes, tagsRes] = await Promise.all([
                api().get(`/menu-items/${slug}`),
                api().get(`/categories/${slug}`).catch(() => ({ data: defaultCategories })),
                api().get(`/tags/${slug}`).catch(() => ({ data: [] }))
            ]);

            // Map new structure to existing UI structure if names differ
            const mappedProducts = productsRes.data.map(p => ({
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
            setCategories(categoriesRes.data.length > 0 ? categoriesRes.data : defaultCategories);
            setTags(tagsRes.data);
            return { products: mappedProducts, categories: categoriesRes.data, tags: tagsRes.data };
        } catch (error) {
            console.error('Error loading catalog:', error);
            toast.error('Error al actualizar catálogo');
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [businessRes, catalogData] = await Promise.all([
                api().get(`/business/${currentSlug}`),
                fetchCatalog()
            ]);

            // Normalize delivery methods if they are in old array format
            const normalizedEntrega = (methods) => {
                if (!methods) return { domicilio: true, recoger: true, mesa: true };
                if (Array.isArray(methods)) {
                    const lower = methods.map(m => m.toLowerCase());
                    return {
                        domicilio: lower.some(m => m.includes('domicilio')),
                        recoger: lower.some(m => m.includes('recoger') || m.includes('llevar')),
                        mesa: lower.some(m => m.includes('mesa'))
                    };
                }
                return {
                    domicilio: !!methods.domicilio,
                    recoger: !!methods.recoger,
                    mesa: !!methods.mesa
                };
            };

            // Normalize payment methods if they are in old array format
            const normalizedPago = (methods) => {
                if (!methods) return { efectivo: true, nequi: true, transferencia: true, daviplata: false, tarjeta: false, link: false };
                if (Array.isArray(methods)) {
                    const lower = methods.map(m => m.toLowerCase());
                    return {
                        efectivo: lower.some(m => m.includes('efectivo')),
                        nequi: lower.some(m => m.includes('nequi')),
                        daviplata: lower.some(m => m.includes('daviplata')),
                        transferencia: lower.some(m => m.includes('transferencia')),
                        tarjeta: lower.some(m => m.includes('tarjeta') || m.includes('datáfono') || m.includes('datafono')),
                        link: lower.some(m => m.includes('link') || m.includes('epayco') || m.includes('wompi'))
                    };
                }
                return {
                    efectivo: !!methods.efectivo,
                    nequi: !!methods.nequi,
                    daviplata: !!methods.daviplata,
                    transferencia: !!methods.transferencia,
                    tarjeta: !!methods.tarjeta,
                    link: !!methods.link
                };
            };

            const savedIcoporRaw = (() => {
                try { return localStorage.getItem('vecos_icopor_price'); } catch { return null; }
            })();
            const resolvedIcopor = savedIcoporRaw !== null
                ? (parseFloat(savedIcoporRaw) || 0)
                : (businessRes.data.precio_icopor ?? 1000);

            const dataWithNormalizedMethods = {
                ...businessRes.data,
                precio_icopor: resolvedIcopor,
                metodos_entrega: normalizedEntrega(businessRes.data.metodos_entrega),
                metodos_pago: normalizedPago(businessRes.data.metodos_pago),
                datos_pago: normalizeDatosPago(businessRes.data.datos_pago),
                ai_use_modal: true
            };

            setBusinessData(dataWithNormalizedMethods);
            setOriginalData(dataWithNormalizedMethods);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error loading config:', error);
            toast.error('Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBusiness = async () => {
        if (businessData.promo_habilitado) {
            if (!businessData.promo_precio || parseFloat(businessData.promo_precio) <= 0) {
                toast.error('El precio es obligatorio para activar el modal promocional');
                setSearchParams({ tab: 'diseno' }); // Ensure we are on the right tab
                return;
            }
            if (!businessData.promo_imagen_url) {
                toast.error('La imagen es obligatoria para activar el modal promocional');
                setSearchParams({ tab: 'diseno' });
                return;
            }
        }

        setSaving(true);
        try {
            // Normalize delivery methods
            const normalizedEntrega = (methods) => {
                if (!methods) return { domicilio: true, recoger: true, mesa: true };
                if (Array.isArray(methods)) {
                    const lower = methods.map(m => m.toLowerCase());
                    return {
                        domicilio: lower.some(m => m.includes('domicilio')),
                        recoger: lower.some(m => m.includes('recoger') || m.includes('llevar')),
                        mesa: lower.some(m => m.includes('mesa'))
                    };
                }
                return {
                    domicilio: !!methods.domicilio,
                    recoger: !!methods.recoger,
                    mesa: !!methods.mesa
                };
            };

            // Normalize payment methods
            const normalizedPago = (methods) => {
                if (!methods) return { efectivo: true, nequi: true, transferencia: true, daviplata: false, tarjeta: false, link: false };
                if (Array.isArray(methods)) {
                    const lower = methods.map(m => m.toLowerCase());
                    return {
                        efectivo: lower.some(m => m.includes('efectivo')),
                        nequi: lower.some(m => m.includes('nequi')),
                        daviplata: lower.some(m => m.includes('daviplata')),
                        transferencia: lower.some(m => m.includes('transferencia')),
                        tarjeta: lower.some(m => m.includes('tarjeta') || m.includes('datáfono') || m.includes('datafono')),
                        link: lower.some(m => m.includes('link') || m.includes('epayco') || m.includes('wompi'))
                    };
                }
                return {
                    efectivo: !!methods.efectivo,
                    nequi: !!methods.nequi,
                    daviplata: !!methods.daviplata,
                    transferencia: !!methods.transferencia,
                    tarjeta: !!methods.tarjeta,
                    link: !!methods.link
                };
            };

            try {
                if (businessData.datos_pago) {
                    localStorage.setItem('fogon_mesa_datos_pago', JSON.stringify(businessData.datos_pago));
                }
                if (businessData.metodos_pago) {
                    localStorage.setItem('vecos_metodos_pago', JSON.stringify(normalizedPago(businessData.metodos_pago)));
                }
                if (businessData.telefono) {
                    localStorage.setItem('vecos_restaurant_phone', String(businessData.telefono));
                }
                const icoporVal = Math.max(0, Number(businessData.precio_icopor) || 0);
                localStorage.setItem('vecos_icopor_price', String(icoporVal));
            } catch (e) {}

            const response = await api().put(`/business/${currentSlug}`, businessData);

            const dataWithNormalizedMethods = {
                ...response.data,
                precio_icopor: Math.max(0, Number(businessData.precio_icopor) || 0),
                metodos_entrega: normalizedEntrega(response.data.metodos_entrega),
                metodos_pago: normalizedPago(response.data.metodos_pago),
                datos_pago: normalizeDatosPago(response.data.datos_pago || businessData.datos_pago)
            };

            setBusinessData(dataWithNormalizedMethods);
            setOriginalData(dataWithNormalizedMethods);
            toast.success('Configuración general guardada');
        } catch (error) {
            toast.error('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = () => {
        if (!originalData) return false;

        const isEquivalent = (val1, val2) => {
            // Handle null/undefined as equal to empty string for simple fields
            if ((val1 === null || val1 === undefined || val1 === '') &&
                (val2 === null || val2 === undefined || val2 === '')) return true;

            // Handle numbers as strings (e.g. price inputs)
            if (typeof val1 === 'number' || typeof val2 === 'number') {
                return val1?.toString() === val2?.toString();
            }

            // Handle objects (like metodos)
            if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
                return JSON.stringify(val1) === JSON.stringify(val2);
            }

            return val1 === val2;
        };

        const fields = [
            'precio_km', 'costo_minimo_domicilio', 'lat', 'lng',
            'nombre', 'descripcion', 'direccion', 'telefono', 'horarios', 'slogan',
            'banner_url', 'logo_url',
            'ai_habilitado', 'ai_personalidad', 'ai_saludo', 'ai_conocimiento',
            'twilio_sid', 'twilio_token', 'twilio_number',
            'banner_tag', 'banner_title', 'banner_description'
        ];

        const simpleChanges = fields.some(f => !isEquivalent(businessData[f], originalData[f]));
        const entregaChanges = !isEquivalent(businessData.metodos_entrega, originalData.metodos_entrega);
        const pagoChanges = !isEquivalent(businessData.metodos_pago, originalData.metodos_pago);

        return simpleChanges || entregaChanges || pagoChanges;
    };

    // Product Functions
    const openAddProduct = () => {
        const initial = {
            nombre: '',
            descripcion: '',
            precio: '',
            categoria: categories[0] || 'Entradas',
            etiqueta: '',
            imagen: '',
            disponible: true,
            destacado: false,
            oferta_porcentaje: '',
            modificadores: [],
            tamanos: [],
            opciones: [],
            is_vegan: false,
            is_vegetarian: false,
            is_gluten_free: false,
            is_spicy: false,
            prep_time_minutes: '',
            allergens: [],
            nutri_kcal: '',
            nutri_proteina: '',
            nutri_carbohidratos: '',
            nutri_grasa: ''
        };
        setEditingProduct(null);
        const clonedInitial = JSON.parse(JSON.stringify(initial));
        setProductForm(clonedInitial);
        setOriginalProductForm(clonedInitial);
        setIsProductModalOpen(true);
    };

    const openEditProduct = (product) => {
        const catName = typeof product.categoria === 'object' ? product.categoria.nombre : product.categoria;
        const initial = {
            nombre: product.nombre,
            descripcion: product.descripcion || '',
            precio: (product.precio_original || product.precio || 0).toString(),
            categoria: catName,
            etiqueta: product.etiqueta || '',
            imagen: product.imagen || '',
            disponible: product.disponible,
            destacado: product.destacado || false,
            oferta_porcentaje: product.oferta_porcentaje?.toString() || '',
            modificadores: product.modificadores || [],
            tamanos: product.tamanos || [],
            opciones: product.opciones || [],
            is_vegan: product.is_vegan || false,
            is_vegetarian: product.is_vegetarian || false,
            is_gluten_free: product.is_gluten_free || false,
            is_spicy: product.is_spicy || false,
            prep_time_minutes: product.prep_time_minutes?.toString() || '',
            allergens: product.allergens || [],
            nutri_kcal: product.nutri_kcal || '',
            nutri_proteina: product.nutri_proteina || '',
            nutri_carbohidratos: product.nutri_carbohidratos || '',
            nutri_grasa: product.nutri_grasa || ''
        };
        setEditingProduct(product);
        setProductForm(JSON.parse(JSON.stringify(initial)));
        setOriginalProductForm(JSON.parse(JSON.stringify(initial)));
        setIsProductModalOpen(true);
    };

    const getAICredits = (type) => {
        const plan = businessData?.plan?.toLowerCase() || 'free';
        const limits = {
            'impulso': 50,
            'basic': 50,
            'pro': 120,
            'elite': 300,
            'premium': 300,
            'free': 5,
            'trial': 0
        };
        const limit = limits[plan] || 5;
        const usedField = `ai_credits_${type === 'desc' ? 'desc' : type === 'img' ? 'img' : 'nutri'}_used`;
        const used = businessData[usedField] || 0;
        return {
            remaining: Math.max(0, limit - used),
            limit,
            used
        };
    };

    const handleAnalyzeNutrition = async () => {
        if (!productForm.nombre) {
            toast.error('Ingresa al menos el nombre del plato');
            return;
        }
        setAnalyzingNutrition(true);
        try {
            const res = await api().post('/ai/nutrition', {
                name: productForm.nombre,
                description: productForm.descripcion
            });
            setProductForm(prev => ({
                ...prev,
                nutri_kcal: res.data.kcal,
                nutri_proteina: res.data.proteina,
                nutri_carbohidratos: res.data.carbohidratos,
                nutri_grasa: res.data.grasa
            }));
            toast.success('Información nutricional generada');
        } catch (err) {
            console.error(err);
            toast.error('Error al generar información nutricional');
        } finally {
            setAnalyzingNutrition(false);
            // Refresh business data to update credits
            const updatedBiz = await api().get(`/business/${currentSlug}`);
            setBusinessData(prev => ({ ...prev, ...updatedBiz.data }));
        }
    };

    const handleGenerateAIImage = async () => {
        if (!productForm.nombre) {
            toast.error('Asigna un nombre al producto para generar su imagen');
            return;
        }
        setGeneratingAIImage(true);
        try {
            const res = await api().post('/ai/generate-product-image', {
                nombre: productForm.nombre,
                descripcion: productForm.descripcion || ''
            });

            if (res.data.url) {
                setProductForm(prev => ({ ...prev, imagen: res.data.url }));
                toast.success('¡Imagen generada por IA con éxito!');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al generar imagen con IA. Verifica tus créditos o configuración.');
        } finally {
            setGeneratingAIImage(false);
            // Refresh business data to update credits
            const updatedBiz = await api().get(`/business/${currentSlug}`);
            setBusinessData(prev => ({ ...prev, ...updatedBiz.data }));
        }
    };

    const handleGenerateAIDescription = async () => {
        if (!productForm.nombre) {
            toast.error('Asigna un nombre al producto para generar su descripción');
            return;
        }
        setGeneratingAIDescription(true);
        try {
            const res = await api().post('/ai/generate-product-description', {
                nombre: productForm.nombre
            });

            if (res.data.description) {
                setProductForm(prev => ({ ...prev, descripcion: res.data.description }));
                toast.success('¡Descripción generada con éxito!');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al generar descripción con IA.');
        } finally {
            setGeneratingAIDescription(false);
            // Refresh business data to update credits
            const updatedBiz = await api().get(`/business/${currentSlug}`);
            setBusinessData(prev => ({ ...prev, ...updatedBiz.data }));
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!productForm.precio || parseInt(productForm.precio) === 0) {
                toast.info('Guardando producto sin precio base (útil para productos con opciones variables)');
            }
            const rawPrice = productForm.precio ? productForm.precio.toString().replace(/\./g, '').replace(',', '.') : '0';
            const basePrice = parseFloat(rawPrice) || 0;
            const discount = parseInt(productForm.oferta_porcentaje) || 0;
            const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

            // Limpiar modificadores vacíos o sin opciones
            const cleanGroups = (list) => (list || [])
                .filter(m => m.nombre.trim() && m.opciones.length > 0)
                .map(m => ({
                    ...m,
                    opciones: m.opciones.filter(o => o.nombre.trim())
                }));

            const cleanModificadores = cleanGroups(productForm.modificadores);
            const cleanTamanos = cleanGroups(productForm.tamanos);
            const cleanOpciones = cleanGroups(productForm.opciones);

            const payload = {
                name: productForm.nombre,
                description: productForm.descripcion,
                base_price: finalPrice,
                precio_original: discount > 0 ? basePrice : null,
                oferta_porcentaje: discount > 0 ? discount : null,
                category: productForm.categoria,
                image_url: productForm.imagen,
                available: productForm.disponible,
                is_recommended: productForm.destacado,
                etiqueta: productForm.etiqueta,
            };

            // If the backend expects the exact MenuItem model
            const menuItemPayload = {
                negocio_id: businessData.id,
                name: payload.name,
                description: payload.description,
                base_price: payload.base_price,
                precio_original: payload.precio_original,
                oferta_porcentaje: payload.oferta_porcentaje,
                category: payload.category,
                image_url: payload.image_url,
                available: payload.available,
                is_recommended: payload.is_recommended,
                etiqueta: payload.etiqueta,
                currency: 'COP',
                is_vegan: productForm.is_vegan,
                is_vegetarian: productForm.is_vegetarian,
                is_gluten_free: productForm.is_gluten_free,
                is_spicy: productForm.is_spicy,
                prep_time_minutes: productForm.prep_time_minutes ? parseInt(productForm.prep_time_minutes) : null,
                allergens: productForm.allergens,
                modificadores: cleanModificadores,
                tamanos: cleanTamanos,
                opciones: cleanOpciones,
                nutri_kcal: productForm.nutri_kcal ? parseInt(productForm.nutri_kcal) : null,
                nutri_proteina: productForm.nutri_proteina || null,
                nutri_carbohidratos: productForm.nutri_carbohidratos || null,
                nutri_grasa: productForm.nutri_grasa || null
            };

            if (editingProduct) {
                await api().put(`/menu-items/${currentSlug}/${editingProduct.id}`, menuItemPayload);
                toast.success('Producto actualizado');
            } else {
                await api().post(`/menu-items/${currentSlug}`, menuItemPayload);
                toast.success('Producto creado');
            }
            setIsProductModalOpen(false);
            fetchCatalog();
        } catch (error) {
            console.error('Error saving product:', error);
            const detail = error.response?.data?.detail;
            let errorMsg = 'Error al guardar producto';
            if (Array.isArray(detail)) {
                errorMsg = detail.map(d => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`).join(', ');
            } else if (typeof detail === 'string') {
                errorMsg = detail;
            }
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
            await api().delete(`/menu-items/${currentSlug}/${id}`);
            toast.success('Producto eliminado');
            fetchCatalog();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Category Functions
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;

        setSaving(true);
        try {
            const oldName = typeof editingCategory === 'object' ? editingCategory?.nombre : editingCategory;
            const newName = categoryName.trim();
            const newIcon = categoryIcon;
            console.log('Submitting Category:', { oldName, newName, newIcon, editingCategory });

            // Scenario 1: Editing existing category
            if (editingCategory) {
                // If name changed, update all products
                if (oldName !== newName) {
                    const productsToUpdate = products.filter(p => p.categoria === oldName);
                    // Update products sequentially to avoid race conditions or overload
                    for (const p of productsToUpdate) {
                        await api().put(`/products/${currentSlug}/${p.id}`, { categoria: newName });
                    }
                }

                // Update category metadata in backend (name & icon)
                // We use post to create/update if it exists (upsert logic in backend would be ideal, but for now we rely on API)
                // Actually, our backend POST /categories/{slug} performs insert. 
                // We should add a PUT endpoint or just call POST which likely inserts. 
                // Wait, if we rename, we should update the existing record.
                // But the backend current implementation (line 709) checks by NAME.
                // So if we rename, we might be creating a new one matching the new name.
                // We need to delete the old one if name changed? 
                // Let's assume for now we call POST to save the new state.
                await api().post(`/categories/${currentSlug}`, { nombre: newName, icono: newIcon });

                // If name changed, delete old category entry if it was purely based on name
                if (oldName !== newName) {
                    await api().delete(`/categories/${currentSlug}?nombre=${encodeURIComponent(oldName)}`);
                }

                toast.success('Categoría actualizada');
            } else {
                // Scenario 2: New Category
                await api().post(`/categories/${currentSlug}`, { nombre: newName, icono: newIcon });
                toast.success('Categoría creada');
            }

            // Refresh data
            fetchCatalog();
            setIsCategoryModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al gestionar categoría');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (catToDelete) => {
        const catName = typeof catToDelete === 'object' ? catToDelete.nombre : catToDelete;
        const hasProducts = products.some(p => p.categoria === catName);
        const msg = hasProducts
            ? `Esta categoría tiene productos asignados. ¿Realmente deseas eliminarla y dejar esos productos sin categoría?`
            : `¿Eliminar la categoría "${catName}"?`;

        if (!confirm(msg)) return;

        setSaving(true);
        try {
            if (hasProducts) {
                // If it has products, we might want to update them to "Sin Categoría" or similar
                const productsToUpdate = products.filter(p => p.categoria === catName);
                await Promise.all(productsToUpdate.map(p =>
                    api().put(`/products/${currentSlug}/${p.id}`, { categoria: 'General' })
                ));
            }
            // Delete from backend table
            await api().delete(`/categories/${currentSlug}?nombre=${encodeURIComponent(catName)}`);

            toast.success('Categoría eliminada');
            fetchCatalog();
        } catch (error) {
            toast.error('Error al eliminar categoría');
        } finally {
            setSaving(false);
        }
    };

    // Tag Functions
    const handleTagSubmit = async (e) => {
        e.preventDefault();
        if (!tagName.trim()) return;

        setSaving(true);
        try {
            if (editingTag) {
                // Rename scenario: update all products with this tag
                const productsToUpdate = products.filter(p => p.etiqueta === editingTag);
                await Promise.all(productsToUpdate.map(p =>
                    api().put(`/products/${currentSlug}/${p.id}`, { etiqueta: tagName.trim() })
                ));
                toast.success('Etiqueta renombrada');
                fetchCatalog();
            } else {
                await api().post(`/tags/${currentSlug}`, { nombre: tagName.trim() });
                setTags(prev => [...new Set([...prev, tagName.trim()])]);
                toast.success('Etiqueta creada');
            }
            setIsTagModalOpen(false);
        } catch (error) {
            toast.error('Error al gestionar etiqueta');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTag = async (tagToDelete) => {
        const hasProducts = products.some(p => p.etiqueta === tagToDelete);
        const msg = hasProducts
            ? `Esta etiqueta se usa en algunos productos. ¿Realmente deseas eliminarla de ellos?`
            : `¿Eliminar la etiqueta "${tagToDelete}"?`;

        if (!confirm(msg)) return;

        setSaving(true);
        try {
            if (hasProducts) {
                const productsToUpdate = products.filter(p => p.etiqueta === tagToDelete);
                await Promise.all(productsToUpdate.map(p =>
                    api().put(`/products/${currentSlug}/${p.id}`, { etiqueta: null })
                ));
            }

            await api().delete(`/tags/${currentSlug}?nombre=${encodeURIComponent(tagToDelete)}`);

            setTags(tags.filter(t => t !== tagToDelete));
            toast.success('Etiqueta eliminada');
        } catch (error) {
            toast.error('Error al eliminar etiqueta');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value || isNaN(value) || parseFloat(value) === 0) return '';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(Number(value));
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === 'all' || p.categoria === filterCategory;
        return matchesSearch && matchesCat;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const hasProductChanges = () => {
        if (!originalProductForm) return false;
        return JSON.stringify(productForm) !== JSON.stringify(originalProductForm);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen -mt-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#22C55E]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20 px-2 md:px-6">
                {/* Superior Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div className="space-y-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuración</h1>
                        <p className="text-[#618972] mt-2">Gestiona la logística y los ajustes operativos de Fogón & Mesa.</p>
                    </div>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={(val) => setSearchParams({ tab: val })}
                    className="w-full"
                >
                    <TabsList className="bg-gray-100/50 p-1 h-auto rounded-[2.5rem] grid grid-cols-2 md:grid-cols-4 gap-1 mb-8 w-full overflow-hidden">

                        <TabsTrigger
                            value="domicilios"
                            className="flex-1 rounded-full px-2 py-3 font-black uppercase tracking-tighter text-[9px] items-center gap-2 transition-all duration-300 border border-transparent whitespace-nowrap
                            data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg data-[state=active]:shadow-[#4ADE80]/20
                            data-[state=inactive]:text-[#618972] data-[state=inactive]:bg-white data-[state=inactive]:border-gray-100 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:shadow-sm"
                        >
                            <Truck className="w-3.5 h-3.5" />
                            Logística
                        </TabsTrigger>
                        <TabsTrigger
                            value="entrega"
                            className="flex-1 rounded-full px-2 py-3 font-black uppercase tracking-tighter text-[9px] items-center gap-2 transition-all duration-300 border border-transparent whitespace-nowrap
                            data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg data-[state=active]:shadow-[#4ADE80]/20
                            data-[state=inactive]:text-[#618972] data-[state=inactive]:bg-white data-[state=inactive]:border-gray-100 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:shadow-sm"
                        >
                            <Package className="w-3.5 h-3.5" />
                            Métodos de Entrega
                        </TabsTrigger>
                        <TabsTrigger
                            value="pagos"
                            className="flex-1 rounded-full px-2 py-3 font-black uppercase tracking-tighter text-[9px] items-center gap-2 transition-all duration-300 border border-transparent whitespace-nowrap
                            data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg data-[state=active]:shadow-[#4ADE80]/20
                            data-[state=inactive]:text-[#618972] data-[state=inactive]:bg-white data-[state=inactive]:border-gray-100 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:shadow-sm"
                        >
                            <CreditCardIcon className="w-3.5 h-3.5" />
                            Métodos de Pago
                        </TabsTrigger>
                        <TabsTrigger
                            value="ai"
                            className="flex-1 rounded-full px-2 py-3 font-black uppercase tracking-tighter text-[9px] items-center gap-2 transition-all duration-300 border border-transparent whitespace-nowrap
                            data-[state=active]:bg-[#4ADE80] data-[state=active]:text-[#111814] data-[state=active]:shadow-lg data-[state=active]:shadow-[#4ADE80]/20
                            data-[state=inactive]:text-[#618972] data-[state=inactive]:bg-white data-[state=inactive]:border-gray-100 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Configuración Bot
                        </TabsTrigger>
                    </TabsList>




                    {/* MENU TAB — Replaced by CatalogoMaestroPage in multi-sede architecture */}


                    {/* DOMICILIOS TAB */}
                    <TabsContent value="domicilios" className="space-y-6 outline-none">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="pt-8 md:pt-10 px-4 md:px-10 pb-4">
                                <CardTitle>Configuración de Envíos</CardTitle>
                                <CardDescription>Establece las reglas para el cálculo automático de domicilios por distancia.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 md:px-10 pb-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Precio por KM */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-[#22C55E]" />
                                                Precio por Kilómetro (COP)
                                            </Label>
                                            <p className="text-xs text-[#618972]">Valor que se multiplicará por la distancia entre el local y el cliente.</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#618972]">$</div>
                                            <Input
                                                type="text"
                                                value={formatPrice(businessData.precio_km)}
                                                onChange={e => {
                                                    const raw = e.target.value.replace(/\D/g, '');
                                                    setBusinessData({ ...businessData, precio_km: parseFloat(raw) || 0 });
                                                }}
                                                className="h-14 pl-10 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-[#4ADE80] focus:bg-white transition-all font-black text-lg"
                                                placeholder="Ej: 2.500"
                                            />
                                        </div>
                                    </div>

                                    {/* Costo Mínimo */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                                                <Check className="w-4 h-4 text-[#22C55E]" />
                                                Costo Mínimo de Domicilio
                                            </Label>
                                            <p className="text-xs text-[#618972]">El cobro mínimo garantizado, incluso para distancias muy cortas.</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#618972]">$</div>
                                            <Input
                                                type="text"
                                                value={formatPrice(businessData.costo_minimo_domicilio)}
                                                onChange={e => {
                                                    const raw = e.target.value.replace(/\D/g, '');
                                                    setBusinessData({ ...businessData, costo_minimo_domicilio: parseFloat(raw) || 0 });
                                                }}
                                                className="h-14 pl-10 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-[#4ADE80] focus:bg-white transition-all font-black text-lg"
                                                placeholder="Ej: 5.000"
                                            />
                                        </div>
                                    </div>

                                    {/* Valor de Empaque / Icopor */}
                                    <div className="space-y-4 md:col-span-2">
                                        <div className="space-y-2">
                                            <Label className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-[#22C55E]" />
                                                Valor de Empaque / Icopor por Plato (COP)
                                            </Label>
                                            <p className="text-xs text-[#618972]">
                                                Se suma automáticamente en el Resumen de Pago únicamente para pedidos a <b>Domicilio</b> o <b>Para Llevar</b> (escribe 0 si no deseas cobrar empaque).
                                            </p>
                                        </div>
                                        <div className="relative max-w-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#618972]">$</div>
                                            <Input
                                                type="text"
                                                value={formatPrice(businessData.precio_icopor ?? 1000)}
                                                onChange={e => {
                                                    const raw = e.target.value.replace(/\D/g, '');
                                                    setBusinessData({ ...businessData, precio_icopor: parseFloat(raw) || 0 });
                                                }}
                                                className="h-14 pl-10 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-[#4ADE80] focus:bg-white transition-all font-black text-lg"
                                                placeholder="Ej: 1.000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-gray-900">
                                            <NavigationIcon className="w-4 h-4" />
                                            Dirección y Ubicación Geográfica
                                        </Label>
                                        <p className="text-xs text-gray-500">Busca tu dirección y ajusta el marcador en el mapa para mayor precisión.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección del Local</Label>
                                            <PlacesAutocomplete
                                                value={businessData.direccion || ''}
                                                placeholder="Ej: Calle 100 # 15-20, Bogotá"
                                                onChange={val => setBusinessData({ ...businessData, direccion: val })}
                                                onPlaceSelected={({ address, lat, lng }) => {
                                                    setBusinessData({
                                                        ...businessData,
                                                        direccion: address,
                                                        lat,
                                                        lng
                                                    });
                                                    toast.success("Ubicación actualizada desde el buscador");
                                                }}
                                                className="h-12 rounded-2xl border-gray-200"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-gray-400">LATITUD</Label>
                                                <Input
                                                    type="number"
                                                    value={businessData.lat || ''}
                                                    onChange={e => setBusinessData({ ...businessData, lat: parseFloat(e.target.value) || 0 })}
                                                    placeholder="Ej: 4.6097"
                                                    className="h-12 rounded-2xl border-gray-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-gray-400">LONGITUD</Label>
                                                <Input
                                                    type="number"
                                                    value={businessData.lng || ''}
                                                    onChange={e => setBusinessData({ ...businessData, lng: parseFloat(e.target.value) || 0 })}
                                                    placeholder="Ej: -74.0817"
                                                    className="h-12 rounded-2xl border-gray-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mapa de Ubicación</Label>
                                            <MapPicker
                                                lat={businessData.lat}
                                                lng={businessData.lng}
                                                onChange={({ lat, lng }) => setBusinessData({ ...businessData, lat, lng })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition((pos) => {
                                                setBusinessData({
                                                    ...businessData,
                                                    lat: pos.coords.latitude,
                                                    lng: pos.coords.longitude
                                                });
                                                toast.success("Ubicación capturada correctamente");
                                            });
                                        } else {
                                            toast.error("Geolocalización no soportada");
                                        }
                                    }}
                                    className="w-full h-auto py-3 sm:h-12 rounded-2xl border-2 border-dashed border-[#4ADE80]/30 text-[#618972] font-black text-[10px] sm:text-xs tracking-tight gap-2 hover:bg-[#4ADE80]/5 transition-all whitespace-normal"
                                >
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    USAR MI UBICACIÓN ACTUAL
                                </Button>

                                <div className="flex justify-end pt-6">
                                    <Button
                                        onClick={handleSaveBusiness}
                                        disabled={saving}
                                        className={getButtonStyle(hasChanges())}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        GUARDAR LOGÍSTICA
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MÉTODOS DE ENTREGA TAB */}
                    <TabsContent value="entrega" className="space-y-6 outline-none">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="pt-8 md:pt-10 px-4 md:px-10 pb-4">
                                <CardTitle className="text-2xl flex items-center gap-3 font-black tracking-tighter">
                                    <div className="size-10 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center text-[#22C55E]">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    Configuración de Servicios
                                </CardTitle>
                                <CardDescription>Habilita o deshabilita los canales de venta según tu modelo de negocio.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 md:px-10 pb-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Domicilio Switch */}
                                    <div className={`p-5 md:p-8 rounded-[2.5rem] md:rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${businessData.metodos_entrega?.domicilio ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-gray-100 bg-gray-50'}`}
                                        onClick={() => setBusinessData({
                                            ...businessData,
                                            metodos_entrega: { ...businessData.metodos_entrega, domicilio: !businessData.metodos_entrega?.domicilio }
                                        })}>
                                        <div className={`size-16 rounded-3xl flex items-center justify-center transition-all ${businessData.metodos_entrega?.domicilio ? 'bg-[#4ADE80] text-[#111814]' : 'bg-white text-gray-300 shadow-sm'}`}>
                                            <Truck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight">Domicilio</p>
                                            <p className="text-[10px] text-[#618972] mt-1 font-medium">Activa logística y rastreo GPS.</p>
                                        </div>
                                        <Switch
                                            activeColor="#22C55E"
                                            checked={businessData.metodos_entrega?.domicilio || false}
                                            onCheckedChange={(checked) => setBusinessData({
                                                ...businessData,
                                                metodos_entrega: { ...businessData.metodos_entrega, domicilio: checked }
                                            })}
                                        />
                                    </div>

                                    {/* Recoger Switch */}
                                    <div className={`p-5 md:p-8 rounded-[2.5rem] md:rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${businessData.metodos_entrega?.recoger ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-gray-100 bg-gray-50'}`}
                                        onClick={() => setBusinessData({
                                            ...businessData,
                                            metodos_entrega: { ...businessData.metodos_entrega, recoger: !businessData.metodos_entrega?.recoger }
                                        })}>
                                        <div className={`size-16 rounded-3xl flex items-center justify-center transition-all ${businessData.metodos_entrega?.recoger ? 'bg-[#4ADE80] text-[#111814]' : 'bg-white text-gray-300 shadow-sm'}`}>
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight">Recoger en local</p>
                                            <p className="text-[10px] text-[#618972] mt-1 font-medium">El cliente retira su pedido.</p>
                                        </div>
                                        <Switch
                                            activeColor="#22C55E"
                                            checked={businessData.metodos_entrega?.recoger || false}
                                            onCheckedChange={(checked) => setBusinessData({
                                                ...businessData,
                                                metodos_entrega: { ...businessData.metodos_entrega, recoger: checked }
                                            })}
                                        />
                                    </div>

                                    {/* Mesa Switch */}
                                    <div className={`p-5 md:p-8 rounded-[2.5rem] md:rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${businessData.metodos_entrega?.mesa ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-gray-100 bg-gray-50'}`}
                                        onClick={() => setBusinessData({
                                            ...businessData,
                                            metodos_entrega: { ...businessData.metodos_entrega, mesa: !businessData.metodos_entrega?.mesa }
                                        })}>
                                        <div className={`size-16 rounded-3xl flex items-center justify-center transition-all ${businessData.metodos_entrega?.mesa ? 'bg-[#4ADE80] text-[#111814]' : 'bg-white text-gray-300 shadow-sm'}`}>
                                            <Utensils className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight">Servicio en Mesa</p>
                                            <p className="text-[10px] text-[#618972] mt-1 font-medium">Pedidos mediante código QR.</p>
                                        </div>
                                        <Switch
                                            activeColor="#22C55E"
                                            checked={businessData.metodos_entrega?.mesa || false}
                                            onCheckedChange={(checked) => setBusinessData({
                                                ...businessData,
                                                metodos_entrega: { ...businessData.metodos_entrega, mesa: checked }
                                            })}
                                        />
                                    </div>
                                </div>

                                {/* Cocinas Duales Toggle */}
                                <div className="mt-6 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${businessData.cocinas_duales_activo ? 'bg-[#4ADE80]/10 text-[#22C55E]' : 'bg-gray-200 text-gray-400'}`}>
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">Cocinas Duales</p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                Separa los pedidos de domicilio y de salón en dos cocinas independientes. 
                                                Útil si tienes una dark kitchen para domicilios.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="cocinas-duales-switch"
                                        checked={businessData.cocinas_duales_activo || false}
                                        onCheckedChange={(checked) => setBusinessData({
                                            ...businessData,
                                            cocinas_duales_activo: checked
                                        })}
                                        className="shrink-0 mt-0.5"
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <Button
                                        onClick={handleSaveBusiness}
                                        disabled={saving}
                                        className={getButtonStyle(hasChanges())}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        GUARDAR CONFIGURACIÓN
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MÉTODOS DE PAGO TAB */}
                    <TabsContent value="pagos" className="space-y-6 outline-none">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="pt-8 md:pt-10 px-4 md:px-10 pb-4">
                                <CardTitle className="text-2xl flex items-center gap-3 font-black tracking-tighter">
                                    <div className="size-10 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center text-[#22C55E]">
                                        <CreditCardIcon className="w-6 h-6" />
                                    </div>
                                    Gestión de Pagos
                                </CardTitle>
                                <CardDescription>Habilita los medios de pago y configura los datos digitales que tu Agente IA compartirá con tus clientes para pagar.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 md:px-10 pb-10 space-y-8">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#111814]">
                                    <Sparkles className="w-5 h-5 text-[#22C55E] shrink-0" />
                                    <p className="text-xs font-medium leading-relaxed">
                                        <span className="font-black">Conectado con tu Agente IA:</span> cuando un cliente seleccione un medio digital, el agente le enviará automáticamente el número de cuenta, llave Bre-B, número de billetera, link de pago o código QR que configures aquí.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                    {/* Predefined Payment Methods */}
                                    {[
                                        { key: 'nequi', label: 'Nequi', desc: 'Plataforma digital.', icon: Smartphone },
                                        { key: 'daviplata', label: 'Daviplata', desc: 'Billetera virtual.', icon: Wallet },
                                        { key: 'link', label: 'Bre-B', desc: 'Pagos Inteligentes.', icon: LinkIcon },
                                        { key: 'tarjeta', label: 'Tarjeta / Datáfono', desc: 'Débito o Crédito.', icon: CreditCardIcon },
                                        { key: 'transferencia', label: 'Transferencia', desc: 'Bancolombia/Otros.', icon: Coins },
                                        { key: 'efectivo', label: 'Efectivo', desc: 'Pago físico en caja.', icon: Banknote }
                                    ].map((method) => {
                                        const isActive = !!businessData.metodos_pago?.[method.key];
                                        const methodDetails = businessData.datos_pago?.[method.key] || {};
                                        const supportsQr = ['nequi', 'daviplata', 'tarjeta', 'link'].includes(method.key);
                                        const qrInputId = `payment-qr-upload-${method.key}`;

                                        const toggleMethod = () => setBusinessData({
                                            ...businessData,
                                            metodos_pago: { ...businessData.metodos_pago, [method.key]: !isActive }
                                        });

                                        return (
                                            <div
                                                key={method.key}
                                                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${isActive ? 'border-[#4ADE80] bg-[#4ADE80]/5 shadow-sm' : 'border-gray-100 bg-gray-50'}`}
                                            >
                                                <div
                                                    className="w-full flex flex-col items-center gap-3 cursor-pointer"
                                                    onClick={toggleMethod}
                                                >
                                                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#4ADE80] text-[#111814]' : 'bg-white text-gray-300 shadow-sm'}`}>
                                                        <method.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase tracking-tight">{method.label}</p>
                                                        <p className="text-[10px] text-[#618972] mt-1 font-medium">{method.desc}</p>
                                                    </div>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            activeColor="#22C55E"
                                                            checked={isActive}
                                                            onCheckedChange={(checked) => setBusinessData({
                                                                ...businessData,
                                                                metodos_pago: { ...businessData.metodos_pago, [method.key]: checked }
                                                            })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Digital Payment Details (shown when enabled) */}
                                                {isActive && method.key !== 'efectivo' && (
                                                    <div
                                                        className="w-full pt-4 mt-2 border-t border-[#4ADE80]/25 space-y-3 text-left"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* Nequi & Daviplata: Número */}
                                                        {(method.key === 'nequi' || method.key === 'daviplata') && (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814]">
                                                                    Número {method.label}
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={methodDetails.numero || ''}
                                                                    onChange={(e) => updatePaymentDetail(method.key, 'numero', e.target.value)}
                                                                    placeholder="Ej: 300 123 4567"
                                                                    className="h-10 rounded-xl bg-white border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Transferencia: Banco + Número de cuenta */}
                                                        {method.key === 'transferencia' && (
                                                            <>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814]">
                                                                        Banco / Tipo de cuenta
                                                                    </Label>
                                                                    <Input
                                                                        type="text"
                                                                        value={methodDetails.banco || ''}
                                                                        onChange={(e) => updatePaymentDetail('transferencia', 'banco', e.target.value)}
                                                                        placeholder="Ej: Bancolombia Ahorros"
                                                                        className="h-10 rounded-xl bg-white border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814]">
                                                                        Número de cuenta
                                                                    </Label>
                                                                    <Input
                                                                        type="text"
                                                                        value={methodDetails.numero_cuenta || ''}
                                                                        onChange={(e) => updatePaymentDetail('transferencia', 'numero_cuenta', e.target.value)}
                                                                        placeholder="Ej: 123-456789-01"
                                                                        className="h-10 rounded-xl bg-white border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* Tarjeta / Datáfono: Link de pago (URL) */}
                                                        {method.key === 'tarjeta' && (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814]">
                                                                    Link de pago (URL)
                                                                </Label>
                                                                <Input
                                                                    type="url"
                                                                    value={methodDetails.link_pago || ''}
                                                                    onChange={(e) => updatePaymentDetail('tarjeta', 'link_pago', e.target.value)}
                                                                    placeholder="https://checkout.wompi.co/..."
                                                                    className="h-10 rounded-xl bg-white border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Bre-B: Llave */}
                                                        {method.key === 'link' && (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814]">
                                                                    Llave Bre-B
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={methodDetails.llave || ''}
                                                                    onChange={(e) => updatePaymentDetail('link', 'llave', e.target.value)}
                                                                    placeholder="Ej: @fogonmesa o celular"
                                                                    className="h-10 rounded-xl bg-white border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* QR Code Attachment for Nequi, Daviplata & Tarjeta */}
                                                        {supportsQr && (
                                                            <div className="space-y-1.5 pt-1">
                                                                <Label className="text-[10px] font-black uppercase tracking-wider text-[#111814] flex items-center gap-1.5">
                                                                    <QrCode className="w-3.5 h-3.5 text-[#22C55E]" />
                                                                    Código QR
                                                                </Label>
                                                                <input
                                                                    type="file"
                                                                    id={qrInputId}
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handlePaymentQrUpload(e, method.key)}
                                                                />

                                                                {methodDetails.qr_url ? (
                                                                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-200">
                                                                        <img
                                                                            src={methodDetails.qr_url}
                                                                            alt={`QR ${method.label}`}
                                                                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[10px] font-black text-[#22C55E] uppercase tracking-wider">QR Adjuntado</p>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => document.getElementById(qrInputId)?.click()}
                                                                                className="text-[10px] font-bold text-gray-500 hover:text-[#111814] underline mt-0.5"
                                                                            >
                                                                                Cambiar imagen
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePaymentDetail(method.key, 'qr_url', '')}
                                                                            title="Eliminar QR"
                                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => document.getElementById(qrInputId)?.click()}
                                                                        disabled={uploadingQrMethod === method.key}
                                                                        className="w-full h-10 px-3 rounded-xl border border-dashed border-[#22C55E]/50 bg-white hover:bg-[#4ADE80]/10 text-[#111814] text-[11px] font-bold flex items-center justify-center gap-2 transition-all"
                                                                    >
                                                                        {uploadingQrMethod === method.key ? (
                                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22C55E]" />
                                                                        ) : (
                                                                            <Upload className="w-3.5 h-3.5 text-[#22C55E]" />
                                                                        )}
                                                                        {uploadingQrMethod === method.key ? 'Subiendo QR...' : 'Adjuntar código QR'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-center md:justify-end pt-4 border-t border-gray-100">
                                    <Button
                                        onClick={handleSaveBusiness}
                                        disabled={saving}
                                        className={`${getButtonStyle(hasChanges())} w-auto`}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        GUARDAR MÉTODOS DE PAGO
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BOT CONFIG TAB */}
                    <TabsContent value="ai" className="space-y-6 outline-none">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="pt-8 px-6 md:pt-10 md:px-10 pb-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 bg-white">
                                <div className="text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-2 mb-2 justify-center md:justify-start">
                                        <div className="p-2 bg-[#4ADE80]/10 rounded-xl">
                                            <Sparkles className="w-5 h-5 text-[#22C55E]" />
                                        </div>
                                        <CardTitle className="text-xl md:text-2xl font-black text-[#111814]">Configuración del Bot IA</CardTitle>
                                    </div>
                                    <CardDescription className="text-xs md:text-sm text-center md:text-left">Personaliza cómo tu asistente responde por WhatsApp.</CardDescription>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 w-full md:w-auto justify-between md:justify-start">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#618972]">Estado del Bot</span>
                                    <Switch
                                        checked={businessData.ai_habilitado}
                                        onCheckedChange={(val) => setBusinessData({ ...businessData, ai_habilitado: val })}
                                        className="data-[state=checked]:bg-[#4ADE80]"
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="px-6 md:px-10 pb-8 md:pb-10 space-y-8">
                                <div className="grid grid-cols-1 gap-8 max-w-xl mx-auto">
                                    {/* Personalidad */}
                                    <div className="space-y-3 text-center">
                                        <Label className="text-xs font-black uppercase tracking-widest text-[#111814]">Personalidad del Bot</Label>
                                        <Select
                                            value={businessData.ai_personalidad}
                                            onValueChange={(val) => setBusinessData({ ...businessData, ai_personalidad: val })}
                                        >
                                            <SelectTrigger className="h-11 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-[#22C55E]/20 transition-all font-medium text-xs text-center justify-center">
                                                <SelectValue placeholder="Selecciona una personalidad" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-gray-100 text-xs font-medium">
                                                <SelectItem value="Amigable y cercano (Recomendado)">Amigable y cercano (Recomendado)</SelectItem>
                                                <SelectItem value="Formal y profesional">Formal y profesional</SelectItem>
                                                <SelectItem value="Divertido y entusiasta">Divertido y entusiasta</SelectItem>
                                                <SelectItem value="Elegante y sofisticado">Elegante y sofisticado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-[#618972] font-medium italic">Define el tono de voz que usará el bot.</p>
                                    </div>

                                    {/* Saludo */}
                                    <div className="space-y-3 text-center">
                                        <Label className="text-xs font-black uppercase tracking-widest text-[#111814]">Saludo Automático</Label>
                                        <Textarea
                                            value={businessData.ai_saludo || ''}
                                            onChange={(e) => setBusinessData({ ...businessData, ai_saludo: e.target.value })}
                                            placeholder="¡Hola! Soy el asistente de su negocio 🍕 ¿En qué puedo ayudarte hoy?"
                                            className="min-h-[80px] rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-[#22C55E]/20 transition-all font-medium leading-relaxed text-xs text-center placeholder:text-center"
                                        />
                                        <p className="text-[10px] text-[#618972] font-medium italic">Este mensaje se enviará al iniciar.</p>
                                    </div>

                                    {/* Conocimiento */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center text-[#22C55E]">
                                                <Search className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <Label className="text-sm font-black uppercase tracking-widest text-[#111814]">Base de Conocimiento</Label>
                                                <p className="text-[10px] text-[#618972] font-medium">Instrucciones específicas que el bot recordará.</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Textarea
                                                value={businessData.ai_conocimiento || ''}
                                                onChange={(e) => setBusinessData({ ...businessData, ai_conocimiento: e.target.value })}
                                                placeholder="Ej: 'Ofrecemos 2x1 en pizzas los jueves', 'Estamos ubicados frente al parque principal', 'No tenemos opciones veganas por ahora'..."
                                                className="min-h-[150px] rounded-3xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-[#22C55E]/20 transition-all font-medium leading-relaxed text-sm p-6"
                                            />
                                            <div className="absolute right-6 bottom-6">
                                                <div className="px-3 py-1 rounded-full bg-[#4ADE80]/5 border border-[#4ADE80]/10 text-[#22C55E] text-[10px] font-black uppercase tracking-widest">
                                                    Entrena a tu IA
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer / Actions */}
                                <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-6">
                                    <div className="flex gap-8 justify-center w-full">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-[#22C55E]" />
                                            </div>
                                            <span className="text-[9px] font-bold text-[#618972]">Bot Activo</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <span className="text-[9px] font-bold text-[#618972]">Multilingüe</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSaveBusiness}
                                        disabled={saving}
                                        className={`${getButtonStyle(hasChanges(), "small")} w-full md:w-auto justify-center h-11 px-8 text-[10px]`}
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                                        GUARDAR CONFIGURACIÓN
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* PRODUCT MODAL */}
                <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                    <DialogContent className="rounded-[2.5rem] max-w-[95vw] lg:max-w-5xl p-0 overflow-hidden border-2 border-[#4ADE80]/20 shadow-2xl shadow-[#4ADE80]/10" aria-describedby="product-modal-description">
                        <DialogHeader className="p-10 pb-6 bg-gray-50 shrink-0">
                            <DialogTitle className="text-3xl font-black tracking-tighter">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </DialogTitle>
                            <DialogDescription id="product-modal-description">
                                Completa los detalles para actualizar tu catálogo en tiempo real.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleProductSubmit} className="p-10 pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold">Nombre del Producto</Label>
                                        <Input
                                            value={productForm.nombre}
                                            onChange={e => setProductForm({ ...productForm, nombre: e.target.value })}
                                            required
                                            className="h-12 rounded-2xl bg-gray-50 border-gray-100"
                                            placeholder="Ej: Hamburguesa Suprema"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-[#111814]">Precio (COP)</Label>
                                        <Input
                                            type="text"
                                            value={formatPrice(productForm.precio)}
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                setProductForm({ ...productForm, precio: raw });
                                            }}
                                            className="h-12 rounded-2xl bg-gray-50 border-gray-100 font-bold text-[#111814]"
                                            placeholder="25.000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 p-6 rounded-[2rem] border border-[#4ADE80]/20 bg-white/50">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-[#111814]">Descripción / Ingredientes</Label>
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const credits = getAICredits('desc');
                                                    return (
                                                        <>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${credits.remaining > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                {credits.remaining}/{credits.limit} créditos
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="link"
                                                                size="sm"
                                                                onClick={handleGenerateAIDescription}
                                                                disabled={generatingAIDescription || !productForm.nombre || credits.remaining <= 0}
                                                                className={`h-auto p-0 text-[#22C55E] hover:text-[#4ADE80] font-bold text-[10px] gap-1.5 ${credits.remaining <= 0 ? 'opacity-30' : ''}`}
                                                            >
                                                                {generatingAIDescription ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Sparkles className="w-3 h-3" />
                                                                )}
                                                                {generatingAIDescription ? 'GENERANDO...' : 'DESCRIBIR CON IA'}
                                                            </Button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={productForm.descripcion}
                                            onChange={e => setProductForm({ ...productForm, descripcion: e.target.value })}
                                            className="rounded-2xl bg-white border-[#4ADE80]/10 focus:border-[#4ADE80]/30 min-h-[100px] text-sm"
                                            placeholder="Detalla lo que incluye el plato, alérgenos o ingredientes especiales..."
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-[#111814]">Imagen del Producto</Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    id="product-image-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploadingProductImage}
                                                />
                                                {(() => {
                                                    const credits = getAICredits('img');
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${credits.remaining > 0 ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'}`}>
                                                                {credits.remaining}/{credits.limit}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className={`h-8 rounded-xl border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1]/5 font-bold gap-2 text-[10px] ${credits.remaining <= 0 ? 'opacity-30 hover:bg-transparent' : ''}`}
                                                                onClick={handleGenerateAIImage}
                                                                disabled={generatingAIImage || uploadingProductImage || credits.remaining <= 0}
                                                            >
                                                                {generatingAIImage ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Sparkles className="w-3 h-3" />
                                                                )}
                                                                {generatingAIImage ? 'GENERANDO...' : '🔮 GENERAR CON IA'}
                                                            </Button>
                                                        </div>
                                                    );
                                                })()}

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 rounded-xl border-[#4ADE80]/30 text-[#22C55E] hover:bg-[#4ADE80]/5 font-bold gap-2 text-[10px]"
                                                    onClick={() => document.getElementById('product-image-upload').click()}
                                                    disabled={uploadingProductImage}
                                                >
                                                    {uploadingProductImage ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-3 h-3" />
                                                    )}
                                                    {uploadingProductImage ? 'SUBIENDO...' : 'SUBIR IMAGEN'}
                                                </Button>

                                                {productForm.imagen && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setProductForm({ ...productForm, imagen: '' })}
                                                        className="h-8 rounded-xl border-red-100 text-red-500 hover:bg-red-50 font-bold gap-2 text-[10px]"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        ELIMINAR
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={productForm.imagen}
                                                    onChange={e => setProductForm({ ...productForm, imagen: e.target.value })}
                                                    className="h-12 rounded-2xl bg-white border-[#4ADE80]/10 focus:border-[#4ADE80]/30 text-xs font-mono pr-10"
                                                    placeholder="URL de la imagen o sube una..."
                                                />
                                                <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            </div>
                                            <div className="size-12 rounded-xl border border-[#4ADE80]/20 overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center">
                                                {productForm.imagen ? (
                                                    <img src={productForm.imagen} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-200" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] border border-[#4ADE80]/10 bg-gray-50/30">
                                    <div className="space-y-2">
                                        <Label className="font-bold">Categoría</Label>
                                        <Select
                                            value={productForm.categoria}
                                            onValueChange={val => setProductForm({ ...productForm, categoria: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl bg-white border-[#4ADE80]/10">
                                                <SelectValue placeholder="Seleccionar sección..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat, idx) => {
                                                    const catName = typeof cat === 'object' ? cat.nombre : cat;
                                                    return <SelectItem key={`${catName}-${idx}`} value={catName}>{catName}</SelectItem>;
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-bold">Etiqueta (Opcional)</Label>
                                        <Select
                                            value={productForm.etiqueta}
                                            onValueChange={val => setProductForm({ ...productForm, etiqueta: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl bg-white border-[#4ADE80]/10 border-dashed">
                                                <SelectValue placeholder="Sin etiqueta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Ninguna</SelectItem>
                                                {tags.map(tag => (
                                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>



                                {/* Valores Nutricionales */}
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Apple className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="font-bold text-[#111814]">Valores Nutricionales</Label>
                                                    <p className="text-[10px] text-gray-400">Información calculada o aproximada (Opcional)</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const credits = getAICredits('nutri');
                                                        return (
                                                            <>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${credits.remaining > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {credits.remaining}/{credits.limit}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    onClick={handleAnalyzeNutrition}
                                                                    disabled={analyzingNutrition || credits.remaining <= 0}
                                                                    variant="outline"
                                                                    className={`h-8 rounded-xl border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-all text-[10px] font-black gap-2 px-3 ${credits.remaining <= 0 ? 'opacity-30' : ''}`}
                                                                >
                                                                    {analyzingNutrition ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                    {analyzingNutrition ? 'ANALIZANDO...' : '🔮 GENERAR CON IA'}
                                                                </Button>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Calorías (kcal)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Ej: 250"
                                                value={productForm.nutri_kcal || ''}
                                                onChange={e => setProductForm({ ...productForm, nutri_kcal: e.target.value ? parseInt(e.target.value) : '' })}
                                                className="bg-gray-50 border-transparent focus:bg-white focus:border-[#4ADE80]/30 transition-colors rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Proteínas (g)</Label>
                                            <Input
                                                placeholder="Ej: 15g"
                                                value={productForm.nutri_proteina || ''}
                                                onChange={e => setProductForm({ ...productForm, nutri_proteina: e.target.value })}
                                                className="bg-gray-50 border-transparent focus:bg-white focus:border-[#4ADE80]/30 transition-colors rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Carbos (g)</Label>
                                            <Input
                                                placeholder="Ej: 30g"
                                                value={productForm.nutri_carbohidratos || ''}
                                                onChange={e => setProductForm({ ...productForm, nutri_carbohidratos: e.target.value })}
                                                className="bg-gray-50 border-transparent focus:bg-white focus:border-[#4ADE80]/30 transition-colors rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grasas (g)</Label>
                                            <Input
                                                placeholder="Ej: 8g"
                                                value={productForm.nutri_grasa || ''}
                                                onChange={e => setProductForm({ ...productForm, nutri_grasa: e.target.value })}
                                                className="bg-gray-50 border-transparent focus:bg-white focus:border-[#4ADE80]/30 transition-colors rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>


                                {/* SECCIONES DE PERSONALIZACIÓN */}
                                <div className="space-y-10 border-t border-gray-100 pt-10">
                                    {/* Helper to render sections to avoid duplication */}
                                    {[
                                        {
                                            id: 'tamanos',
                                            label: 'Tamaños',
                                            desc: 'Define las tallas o porciones disponibles.',
                                            icon: Maximize,
                                            hasPrice: true
                                        },
                                        {
                                            id: 'modificadores',
                                            label: 'Adicionales',
                                            desc: 'Ingredientes o extras con costo adicional.',
                                            icon: PlusCircle,
                                            hasPrice: true
                                        },
                                        {
                                            id: 'opciones',
                                            label: 'Opciones',
                                            desc: 'Preferencias que no afectan el precio.',
                                            icon: ListChecks,
                                            hasPrice: false
                                        }
                                    ].map((section) => (
                                        <div key={section.id} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-[#4ADE80]/10 rounded-xl">
                                                        <section.icon className="w-4 h-4 text-[#22C55E]" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-black uppercase tracking-tight text-[#111814]">{section.label}</Label>
                                                        <p className="text-[10px] text-[#618972] font-medium">{section.desc}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newGroup = {
                                                            id: Date.now().toString(),
                                                            nombre: '',
                                                            obligatorio: section.id === 'tamanos',
                                                            seleccion_minima: section.id === 'tamanos' ? 1 : 0,
                                                            seleccion_maxima: 1,
                                                            max_qty_per_option: 1,
                                                            opciones: [{ id: Date.now().toString() + '-opt', nombre: '', precio: 0 }]
                                                        };
                                                        setProductForm({
                                                            ...productForm,
                                                            [section.id]: [...(productForm[section.id] || []), newGroup]
                                                        });
                                                    }}
                                                    className="h-9 rounded-xl border-[#4ADE80]/20 text-[#22C55E] hover:bg-[#4ADE80]/5 font-bold gap-2 text-[10px]"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    AÑADIR GRUPO
                                                </Button>
                                            </div>

                                            <div className="space-y-6">
                                                {(productForm[section.id] || []).map((group, gIdx) => (
                                                    <div key={group.id || gIdx} className="bg-white border border-[#22C55E]/15 rounded-[2rem] p-6 shadow-sm relative group/card hover:border-[#22C55E]/30 transition-all">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newList = [...productForm[section.id]];
                                                                newList.splice(gIdx, 1);
                                                                setProductForm({ ...productForm, [section.id]: newList });
                                                            }}
                                                            className="absolute -top-2 -right-2 size-8 bg-white border border-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 items-start">
                                                            <div className="md:col-span-2 lg:col-span-1 space-y-2">
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Nombre del Grupo</Label>
                                                                <Input
                                                                    value={group.nombre}
                                                                    onChange={e => {
                                                                        const newList = [...productForm[section.id]];
                                                                        newList[gIdx].nombre = e.target.value;
                                                                        setProductForm({ ...productForm, [section.id]: newList });
                                                                    }}
                                                                    className="h-10 rounded-xl bg-gray-50 border-[#22C55E]/10 focus:bg-white"
                                                                    placeholder={`Ej: ${section.id === 'tamanos' ? 'Tamaño' : 'Ingredientes'}`}
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-4 pt-4 lg:pt-6 md:col-span-3 lg:col-span-3 lg:justify-end">
                                                                <div className="flex items-center gap-2 bg-[#F0FCF4] px-3 py-1.5 rounded-xl border border-[#22C55E]/10">
                                                                    <Switch
                                                                        checked={group.obligatorio}
                                                                        onCheckedChange={val => {
                                                                            const newList = [...productForm[section.id]];
                                                                            newList[gIdx].obligatorio = val;
                                                                            newList[gIdx].seleccion_minima = val ? 1 : 0;
                                                                            setProductForm({ ...productForm, [section.id]: newList });
                                                                        }}
                                                                        className="data-[state=checked]:bg-[#22C55E] scale-75"
                                                                    />
                                                                    <Label className="text-[9px] font-black uppercase text-[#22C55E] cursor-pointer">Obligatorio</Label>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                                                    <Label className="text-[9px] font-black uppercase text-gray-400">Máx. Items</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={group.seleccion_maxima}
                                                                        onChange={e => {
                                                                            const newList = [...productForm[section.id]];
                                                                            newList[gIdx].seleccion_maxima = parseInt(e.target.value) || 1;
                                                                            setProductForm({ ...productForm, [section.id]: newList });
                                                                        }}
                                                                        className="h-7 w-12 rounded-lg bg-gray-50 border-gray-100 text-center font-bold text-xs p-0 px-1"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                                                    <Label className="text-[9px] font-black uppercase text-gray-400" title="Cantidad máxima por cada opción individual. 0 = ilimitado">Cant. x Opción</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={group.max_qty_per_option ?? 1}
                                                                        onChange={e => {
                                                                            const newList = [...productForm[section.id]];
                                                                            newList[gIdx].max_qty_per_option = parseInt(e.target.value) || 0;
                                                                            setProductForm({ ...productForm, [section.id]: newList });
                                                                        }}
                                                                        className="h-7 w-12 rounded-lg bg-gray-50 border-gray-100 text-center font-bold text-xs p-0 px-1"
                                                                        placeholder="1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 border-t border-gray-50 pt-4">
                                                            <Label className="text-[10px] font-black uppercase text-[#618972] tracking-widest pl-1">Opciones</Label>
                                                            <div className="space-y-2">
                                                                {group.opciones.map((opt, oIdx) => (
                                                                    <div key={opt.id || oIdx} className="flex gap-2 items-center">
                                                                        <div className="flex-1">
                                                                            <Input
                                                                                value={opt.nombre}
                                                                                onChange={e => {
                                                                                    const newList = [...productForm[section.id]];
                                                                                    newList[gIdx].opciones[oIdx].nombre = e.target.value;
                                                                                    setProductForm({ ...productForm, [section.id]: newList });
                                                                                }}
                                                                                className="h-9 rounded-xl bg-white border-[#4ADE80]/40 text-xs"
                                                                                placeholder="Nombre de la opción"
                                                                            />
                                                                        </div>
                                                                        {section.hasPrice && (
                                                                            <div className="w-32 relative">
                                                                                <Input
                                                                                    type="text"
                                                                                    value={opt.precio > 0 ? formatPrice(opt.precio.toString()) : ''}
                                                                                    onChange={e => {
                                                                                        const raw = e.target.value.replace(/\D/g, '');
                                                                                        const newList = [...productForm[section.id]];
                                                                                        newList[gIdx].opciones[oIdx].precio = parseFloat(raw) || 0;
                                                                                        setProductForm({ ...productForm, [section.id]: newList });
                                                                                    }}
                                                                                    className="h-9 rounded-xl bg-white border-[#4ADE80]/40 text-xs pl-6"
                                                                                    placeholder="+ 0"
                                                                                />
                                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">$</span>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newList = [...productForm[section.id]];
                                                                                newList[gIdx].opciones.splice(oIdx, 1);
                                                                                setProductForm({ ...productForm, [section.id]: newList });
                                                                            }}
                                                                            disabled={group.opciones.length <= 1}
                                                                            className="size-9 rounded-xl border border-[#4ADE80]/40 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const newList = [...productForm[section.id]];
                                                                    newList[gIdx].opciones.push({ id: Date.now().toString(), nombre: '', precio: 0 });
                                                                    setProductForm({ ...productForm, [section.id]: newList });
                                                                }}
                                                                className="mt-2 h-8 text-[10px] font-black text-[#22C55E] hover:bg-[#4ADE80]/5 w-full border border-dashed border-[#4ADE80]/20 rounded-xl"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" /> AÑADIR OPCIÓN
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {(!productForm[section.id] || productForm[section.id].length === 0) && (
                                                    <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-[#4ADE80]/10 rounded-[2rem] gap-2 opacity-30 grayscale grayscale-0">
                                                        <p className="text-[10px] font-black uppercase text-[#618972]">No hay {section.label.toLowerCase()} configurados</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] border border-[#4ADE80]/20 bg-[#4ADE80]/5">
                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <TagIcon className="w-4 h-4 text-[#22C55E]" />
                                            Descuento (%)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={productForm.oferta_porcentaje}
                                                onChange={e => setProductForm({ ...productForm, oferta_porcentaje: e.target.value })}
                                                className="h-12 rounded-2xl bg-white border-[#4ADE80]/20 focus:border-[#4ADE80]/50 pr-10 font-bold text-[#22C55E]"
                                                placeholder="Ej: 15"
                                                min="0"
                                                max="100"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#22C55E]">%</div>
                                        </div>
                                        <p className="text-[9px] text-[#618972] font-medium italic pl-1">Se aplicará al precio base automáticamente.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-bold flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#22C55E]" />
                                            Tiempo de Prep. (Minutos)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={productForm.prep_time_minutes}
                                            onChange={e => setProductForm({ ...productForm, prep_time_minutes: e.target.value })}
                                            className="h-12 w-full rounded-2xl bg-white border-[#4ADE80]/20 focus:border-[#4ADE80]/50 font-bold"
                                            placeholder="Ej: 15"
                                        />
                                        <p className="text-[9px] text-[#618972] font-medium italic pl-1">Estimado para la espera del cliente.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 py-4 px-6 rounded-2xl border border-[#4ADE80]/10 bg-white shadow-sm">
                                        <Switch
                                            checked={productForm.disponible}
                                            onCheckedChange={checked => setProductForm({ ...productForm, disponible: checked })}
                                            className="data-[state=checked]:bg-[#4ADE80]"
                                        />
                                        <div>
                                            <Label className="font-bold text-[#111814]">Disponible para la venta</Label>
                                            <p className="text-[10px] text-[#618972] font-medium leading-tight">Si lo desactivas, aparecerá como "Agotado" en el menú.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 py-4 px-6 rounded-2xl border border-[#4ADE80]/10 bg-white shadow-sm">
                                        <Switch
                                            id="featured-toggle"
                                            checked={productForm.destacado}
                                            onCheckedChange={checked => setProductForm({ ...productForm, destacado: checked })}
                                            className="data-[state=checked]:bg-[#4ADE80]"
                                        />
                                        <div>
                                            <Label htmlFor="featured-toggle" className="font-bold cursor-pointer flex items-center gap-2 text-[#111814]">
                                                <Star className={`w-3.5 h-3.5 ${productForm.destacado ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                Producto Destacado
                                            </Label>
                                            <p className="text-[10px] text-[#618972] font-medium leading-tight">Aparecerá en los recomendados.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 border-t mt-auto">
                                    <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl font-bold border border-gray-100 hover:bg-gray-50 transition-colors" onClick={() => setIsProductModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={saving} className={getModalButtonStyle(hasProductChanges())}>
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProduct ? 'GUARDAR PRODUCTO' : 'CREAR PRODUCTO'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* CATEGORY MODAL */}
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogContent className="rounded-[2.5rem] max-w-md border-none overflow-hidden max-h-[90vh] flex flex-col" aria-describedby="category-modal-description">
                        <DialogHeader className="p-8 pb-4 shrink-0">
                            <DialogTitle className="text-2xl font-black">{editingCategory ? 'Renombrar Categoría' : 'Nueva Categoría'}</DialogTitle>
                            <DialogDescription id="category-modal-description">Las categorías ayudan a tus clientes a navegar el menú.</DialogDescription>
                        </DialogHeader>
                        <div className="overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleCategorySubmit} className="p-8 pt-4 space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">Nombre de la Categoría</Label>
                                    <Input
                                        value={categoryName}
                                        onChange={e => setCategoryName(e.target.value)}
                                        placeholder="Ej: Postres de Autor"
                                        className="h-12 rounded-2xl bg-gray-50"
                                        required
                                    />
                                    {editingCategory && (
                                        <p className="text-[10px] text-orange-500 font-bold bg-orange-50 p-3 rounded-xl border border-orange-100">
                                            Aviso: Al renombrar una categoría, todos los productos asociados se actualizarán automáticamente.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Label className="font-bold">Icono</Label>
                                    <Tabs defaultValue="icons" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-4 h-11 p-1 bg-gray-100 rounded-xl">
                                            <TabsTrigger value="icons" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">Iconos</TabsTrigger>
                                            <TabsTrigger value="emojis" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">Emojis</TabsTrigger>
                                            <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold">Subir</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="icons" className="mt-0">
                                            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                                                {Object.entries(AvailableIcons).map(([name, Icon]) => (
                                                    <button
                                                        key={name}
                                                        type="button"
                                                        onClick={() => setCategoryIcon(name)}
                                                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${categoryIcon === name
                                                            ? 'bg-[#4ADE80]/10 border-[#4ADE80] text-[#22C55E] ring-2 ring-[#22C55E]/20'
                                                            : 'bg-white border-gray-100 hover:border-gray-300 text-gray-500'
                                                            }`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                    </button>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="emojis" className="mt-0 space-y-3">
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 gap-4 bg-gray-50/50">
                                                <Input
                                                    value={(!AvailableIcons[categoryIcon] && !categoryIcon?.includes('/')) ? categoryIcon : ''}
                                                    onChange={(e) => setCategoryIcon(e.target.value)}
                                                    className="w-24 h-24 text-6xl text-center rounded-2xl border-gray-200 focus:border-[#4ADE80] bg-white shadow-sm"
                                                    placeholder="😁"
                                                />
                                                <p className="text-xs text-gray-500 text-center font-medium mt-2">
                                                    Usa <span className="font-bold text-[#111814]">Tecla Windows</span> + <span className="font-bold text-[#111814]">Punto (.)</span> para abrir el panel de emojis
                                                </p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="upload" className="mt-0 space-y-3">
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors relative cursor-pointer group"
                                                onClick={() => document.getElementById('cat-icon-upload').click()}>

                                                <input
                                                    type="file"
                                                    id="cat-icon-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleCategoryIconUpload}
                                                />

                                                {categoryIcon?.includes('/') || categoryIcon?.includes('http') ? (
                                                    <div className="relative group">
                                                        <img src={categoryIcon} alt="Icon Preview" className="w-24 h-24 object-contain rounded-2xl shadow-xl transition-transform group-hover:scale-110" />
                                                        <div className="absolute -top-2 -right-2 bg-[#4ADE80] text-white p-1 rounded-full shadow-lg">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="size-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-gray-300 border border-gray-100">
                                                            <Upload className="w-8 h-8" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-[#618972] uppercase tracking-widest">JPG, PNG o SVG</p>
                                                    </div>
                                                )}

                                                <div className="text-center">
                                                    <p className="font-black text-xs uppercase tracking-tight text-[#111814]">
                                                        {categoryIcon?.includes('/') ? 'Imagen subida' : 'Seleccionar archivo'}
                                                    </p>
                                                    <p className="text-[10px] text-[#618972] font-medium mt-1">Sube una ilustración o icono personalizado</p>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                {/* Preview of Selection */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1">Vista Previa:</span>
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                        {(() => {
                                            const isUrl = categoryIcon?.includes('/') || categoryIcon?.includes('http');
                                            const isLucide = AvailableIcons[categoryIcon];
                                            const IconComponent = isLucide ? AvailableIcons[categoryIcon] : Utensils;

                                            if (isUrl) return <img src={categoryIcon} className="w-5 h-5 object-contain" />;
                                            if (isLucide) return <IconComponent className="w-5 h-5 text-[#22C55E]" />;
                                            return <span className="text-lg leading-none">{categoryIcon || '🍽️'}</span>;
                                        })()}
                                        <span className="text-sm font-bold text-[#111814]">{categoryName || 'Nombre Categoría'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t">
                                    <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={saving} className={getModalButtonStyle(categoryName !== originalCategoryName || (editingCategory && categoryIcon !== (typeof editingCategory === 'object' ? editingCategory.icono : 'Utensils')))}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GUARDAR SECCIÓN'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog >

                {/* TAG MODAL */}
                <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
                    <DialogContent className="rounded-[2.5rem] max-w-md border-none overflow-hidden" aria-describedby="tag-modal-description">
                        <DialogHeader className="p-8 pb-4">
                            <DialogTitle className="text-2xl font-black">{editingTag ? 'Renombrar Etiqueta' : 'Nueva Etiqueta'}</DialogTitle>
                            <DialogDescription id="tag-modal-description">Las etiquetas sirven para resaltar promociones o estados especiales.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTagSubmit} className="p-8 pt-4 space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold">Nombre de la Etiqueta</Label>
                                <Input
                                    value={tagName}
                                    onChange={e => setTagName(e.target.value)}
                                    placeholder="Ej: Oferta, Nuevo, Recomendado"
                                    className="h-12 rounded-2xl bg-gray-50"
                                    required
                                />
                                {editingTag && (
                                    <p className="text-[10px] text-orange-500 font-bold bg-orange-50 p-3 rounded-xl border border-orange-100">
                                        Aviso: Al renombrar una etiqueta, todos los productos que la usen se actualizarán automáticamente.
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setIsTagModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={saving} className={getModalButtonStyle(tagName !== originalTagName)}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GUARDAR ETIQUETA'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div >
        </DashboardLayout >
    );
};

export default ConfiguracionPage;
