import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    User, Edit, MapPin, Package, Heart, Ticket, LogOut, ArrowLeft,
    Truck, Star, Plus, Briefcase, Home, CheckCircle2, Loader2, Phone, ShieldCheck,
    Lock, Shield, Navigation, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight,
    Settings, Camera, Crown, Gift, ShoppingCart, Bike, Bell, Headphones, Utensils, Mail,
    Copy, Clock
} from 'lucide-react';
import RuletaPremiosModal from '@/components/RuletaPremiosModal';
import { getCouponsForUser, getWelcomePoints, PENDING_COUPON_KEY } from '@/utils/wheelDefaults';

const RAW_API = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '';
const API_BASE = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`) : '/api';

const DEFAULT_DEMO_ADDRESSES = [];

const DEFAULT_NOTIFICATIONS = [];
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ClientProfilePage() {
    const { slug = 'vecos' } = useParams();
    const navigate = useNavigate();

    // Auth State (purgar sesiones de prueba antiguas)
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('client_token');
        if (stored === 'universal-client-token') {
            localStorage.removeItem('client_token');
            return null;
        }
        return stored;
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authStep, setAuthStep] = useState('phone'); // phone, otp, pin
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [pin, setPin] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [business, setBusiness] = useState(null);

    // Data State
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    // Favorites State
    const [favorites, setFavorites] = useState([]);
    const [loyalty, setLoyalty] = useState(null);
    const [recoveryInfo, setRecoveryInfo] = useState(null);
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [newPin, setNewPin] = useState('');
    const [recoveryMethod, setRecoveryMethod] = useState('hint'); // 'hint' or 'question'
    const [pinHint, setPinHint] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');

    // Password change state
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Modal States
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showWheelModal, setShowWheelModal] = useState(false);
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    const [userCoupons, setUserCoupons] = useState([]);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [showFavoritesModal, setShowFavoritesModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('client_notifications');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter((n) => !['notif-wheel', 'notif-order', 'notif-chef'].includes(n?.id));
                    if (cleaned.length !== parsed.length) {
                        localStorage.setItem('client_notifications', JSON.stringify(cleaned));
                    }
                    return cleaned;
                }
            }
        } catch (e) {
            console.warn('Error loading notifications', e);
        }
        return DEFAULT_NOTIFICATIONS;
    });

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    const handleOpenNotifications = () => {
        setShowNotificationsModal(true);
        if (unreadNotificationsCount > 0) {
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
            try {
                localStorage.setItem('client_notifications', JSON.stringify(updated));
            } catch (e) {
                console.warn('Error saving notifications', e);
            }
        }
    };

    const handleDeleteNotification = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        try {
            localStorage.setItem('client_notifications', JSON.stringify(updated));
        } catch (e) {
            console.warn('Error saving notifications', e);
        }
        toast.success("Notificación eliminada");
    };
    const [addressForm, setAddressForm] = useState({
        nombre: '',
        direccion: '',
        es_principal: false
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Hidden orders state (frontend hide only)
    const [hiddenOrderIds, setHiddenOrderIds] = useState(() => {
        const saved = localStorage.getItem('client_hidden_orders');
        return saved ? JSON.parse(saved) : [];
    });

    // Seen orders state (controls red badge on Pedidos icon)
    const [seenOrderIds, setSeenOrderIds] = useState(() => {
        try {
            const saved = localStorage.getItem('client_seen_order_ids');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const unseenOrdersCount = orders.filter(
        (o) => !hiddenOrderIds.includes(o.id) && !seenOrderIds.includes(o.id)
    ).length;

    const handleOpenOrders = () => {
        const currentIds = orders.map((o) => o.id).filter(Boolean);
        const mergedSeen = Array.from(new Set([...seenOrderIds, ...currentIds]));
        setSeenOrderIds(mergedSeen);
        try {
            localStorage.setItem('client_seen_order_ids', JSON.stringify(mergedSeen));
        } catch (e) {
            console.warn('Error saving seen orders', e);
        }
        navigate('/mi-cuenta/pedidos');
    };

    const goToMenu = () => {
        navigate('/menu');
    };

    const refreshCoupons = () => {
        setUserCoupons(getCouponsForUser(user?.telefono || ''));
    };

    useEffect(() => {
        refreshCoupons();
    }, [user?.telefono, showWheelModal, showCouponsModal]);

    const activeCoupons = userCoupons.filter((c) => c.isActive);
    const inactiveCoupons = userCoupons.filter((c) => !c.isActive);

    const handleCopyCouponCode = (code) => {
        if (!code) return;
        navigator.clipboard?.writeText(code);
        toast.success(`Código ${code} copiado`);
    };

    const handleUseCouponInOrder = (coupon) => {
        try {
            localStorage.setItem(PENDING_COUPON_KEY, coupon.codigo_cupon);
        } catch {}
        setShowCouponsModal(false);
        toast.success(`Cupón ${coupon.codigo_cupon} seleccionado`, {
            description: 'Agrega tus platos al carrito y se aplicará automáticamente.'
        });
        goToMenu();
    };

    useEffect(() => {
        if (showAddressModal && addresses.length > 0) {
            const currentPrimary = addresses.find(a => a.es_principal) || addresses[0];
            setSelectedAddressId(currentPrimary?.id || null);
        }
    }, [showAddressModal, addresses]);

    useEffect(() => {
        fetchBusiness();
        // Solo obtener perfil si tenemos token Y NO tenemos el usuario ya cargado
        // Esto evita que después de un login exitoso, una falla en fetchProfile resetee la sesión
        if (token && !user) {
            fetchProfile();
        } else if (!token) {
            setLoading(false);
        }
    }, [token, user, slug]);

    async function fetchBusiness() {
        const localLogo = localStorage.getItem('fogon_mesa_logo') || '/images/vecos-logo.jpg';
        if (token && token.startsWith('vecos-client-session:')) {
            setBusiness({
                nombre: "Veco's Restaurante",
                slug: slug || 'vecos',
                logo_url: localLogo,
            });
            return;
        }
        try {
            const res = await axios.get(`/api/business/${slug}`);
            if (res.data && typeof res.data === 'object' && res.data.nombre) {
                setBusiness(res.data);
            } else {
                setBusiness({ nombre: "Veco's Restaurante", slug: 'vecos', logo_url: localLogo });
            }
        } catch (err) {
            setBusiness({ nombre: "Veco's Restaurante", slug: 'vecos', logo_url: localLogo });
        }
    }

    async function fetchProfile() {
        if (!token) return;
        if (token.startsWith('vecos-client-session:')) {
            const last10 = token.replace('vecos-client-session:', '');
            let customers = [];
            let allOrders = [];
            let savedAddresses = [];
            try {
                customers = JSON.parse(localStorage.getItem('vecos_customers') || '[]');
                allOrders = JSON.parse(localStorage.getItem('vecos_orders') || '[]');
                savedAddresses = JSON.parse(localStorage.getItem(`vecos_client_addresses_${last10}`) || '[]');
            } catch {}

            const match = (Array.isArray(customers) ? customers : []).find((c) => {
                const d = String(c.telefono || c.phone || '').replace(/\D/g, '');
                return d.slice(-10) === last10;
            });

            const myOrders = (Array.isArray(allOrders) ? allOrders : []).filter((o) => {
                const d = String(o.cliente_telefono || '').replace(/\D/g, '');
                return d.slice(-10) === last10;
            });

            const storedPts = Number(localStorage.getItem(`fogon_mesa_pts_${last10}`) || 0);
            const customerPts = Math.max(Number(match?.puntos_totales ?? match?.puntos ?? 0), storedPts);

            setUser({
                id: match?.id || `cli-${last10}`,
                nombre: match?.nombre || match?.name || `Cliente ${last10.slice(-4)}`,
                telefono: match?.telefono || last10,
                email: match?.email || '',
                avatar_url: match?.avatar_url || '',
                recovery_method: match?.recovery_method || 'hint',
                pin_hint: match?.pin_hint || '',
                security_question: match?.security_question || '',
            });
            setLoyalty({ puntos: customerPts, activo: true });
            setAddresses(Array.isArray(savedAddresses) ? savedAddresses : []);
            setOrders(myOrders);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const api = axios.create({
                baseURL: API_BASE,
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileRes = await api.get('/client/me');
            const currentUser = profileRes.data;
            setUser(currentUser);

            // Initialize security state from user data
            if (currentUser.recovery_method) setRecoveryMethod(currentUser.recovery_method);
            if (currentUser.pin_hint) setPinHint(currentUser.pin_hint);
            if (currentUser.security_question) setSecurityQuestion(currentUser.security_question);

            // Load other data in parallel
            const [ordersRes, addrRes, favRes, pointsRes] = await Promise.allSettled([
                api.get('/client/orders'),
                api.get('/client/addresses'),
                api.get('/client/favorites'),
                api.get(`/loyalty/${slug}/points/${currentUser.telefono}`)
            ]);

            if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
            if (addrRes.status === 'fulfilled') setAddresses(addrRes.value.data);
            if (favRes.status === 'fulfilled') setFavorites(favRes.value.data || []);
            if (pointsRes.status === 'fulfilled') setLoyalty(pointsRes.value.data);
        } catch (error) {
            console.error("Error fetching profile:", error);
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        try {
            localStorage.removeItem('client_token');
        } catch (e) {
            console.warn("Could not access localStorage to remove token");
        }
        setToken(null);
        setUser(null);
        setAuthStep('phone');
    }

    const handleHideOrder = (orderId) => {
        const newHidden = [...hiddenOrderIds, orderId];
        setHiddenOrderIds(newHidden);
        localStorage.setItem('client_hidden_orders', JSON.stringify(newHidden));
        toast.success("Pedido eliminado de tu vista", {
            description: "El registro permanece en la base de datos del restaurante."
        });
    };

    async function handleRequestOtp(e) {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            toast.error("Ingresa un número válido");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post('/api/auth/client/request-otp', { telefono: phone, negocio_slug: slug });
            setAuthStep('otp');
            toast.success("Código enviado por WhatsApp");
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.detail?.includes("No tienes un PIN")) {
                // If the backend would support checking PIN first, we could skip OTP
                // But current request-otp always sends OTP. 
                // Let's add an option to use PIN if they already have one.
            }
            toast.error("Error al enviar código. Intenta de nuevo.");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleLoginPin(e) {
        e.preventDefault();
        const digits = String(phone || '').replace(/\D/g, '');
        if (digits.length < 10) {
            toast.error("Ingresa un número celular válido de 10 dígitos");
            return;
        }
        if (!pin || pin.length < 4) {
            toast.error("Ingresa tu PIN de 4 dígitos");
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post('/api/auth/client/login-pin', { telefono: phone, pin });
            const data = res.data;
            if (!data || typeof data !== 'object' || !data.access_token) {
                const staticErr = new Error('Static host response without API');
                staticErr.isStaticFallback = true;
                throw staticErr;
            }
            const { access_token, cliente } = data;
            try {
                localStorage.setItem('client_token', access_token);
            } catch (e) {
                console.error("Storage Error:", e);
                toast.warning("El navegador bloqueó el almacenamiento. Tu sesión podría perderse al recargar.");
            }
            if (cliente) setUser(cliente);
            setToken(access_token);
            setLoading(false);
            toast.success("¡Bienvenido!");
        } catch (error) {
            const status = error.response?.status;
            const isBackendUnavailable =
                Boolean(error.isStaticFallback) || !error.response || status === 404 || status === 405 || status >= 500;

            if (isBackendUnavailable) {
                const last10 = digits.slice(-10);
                const defaultPin = last10.slice(-4);
                let savedPins = {};
                try {
                    savedPins = JSON.parse(localStorage.getItem('vecos_client_pins') || '{}');
                } catch {}
                const expectedPin = savedPins[last10] || defaultPin;

                if (String(pin).trim() !== String(expectedPin)) {
                    toast.error(
                        savedPins[last10]
                            ? "PIN incorrecto. Verifica tu clave e intenta nuevamente."
                            : "PIN incorrecto. Si es tu primera vez, usa los últimos 4 dígitos de tu celular."
                    );
                    return;
                }

                // Registrar o cargar cliente real en vecos_customers
                let customers = [];
                try {
                    customers = JSON.parse(localStorage.getItem('vecos_customers') || '[]');
                    if (!Array.isArray(customers)) customers = [];
                } catch {
                    customers = [];
                }

                let existing = customers.find((c) => {
                    const d = String(c.telefono || c.phone || '').replace(/\D/g, '');
                    return d.slice(-10) === last10;
                });

                let isNewCustomer = false;
                if (!existing) {
                    isNewCustomer = true;
                    const welcomePts = getWelcomePoints();
                    existing = {
                        id: `cli-${last10}`,
                        nombre: `Cliente ${last10.slice(-4)}`,
                        name: `Cliente ${last10.slice(-4)}`,
                        telefono: last10,
                        phone: last10,
                        email: '',
                        puntos: welcomePts,
                        puntos_disponibles: welcomePts,
                        puntos_totales: welcomePts,
                        total_gastado: 0,
                        pedidos_count: 0,
                        created_at: new Date().toISOString(),
                    };
                    customers.unshift(existing);
                    try {
                        localStorage.setItem(`fogon_mesa_pts_${last10}`, String(welcomePts));
                        localStorage.setItem('vecos_customers', JSON.stringify(customers));
                        window.dispatchEvent(new Event('vecos-data-updated'));
                    } catch {}
                }

                const sessionToken = `vecos-client-session:${last10}`;
                try {
                    localStorage.setItem('client_token', sessionToken);
                } catch {}
                setToken(sessionToken);
                setUser(null); // dispara fetchProfile() con el nuevo sessionToken
                if (isNewCustomer && existing.puntos > 0) {
                    toast.success(`¡Bienvenido a Veco's! Recibiste ${existing.puntos} puntos de bienvenida 🎁`);
                } else {
                    toast.success("¡Bienvenido a Veco's Restaurante!");
                }
                return;
            }

            const detail = error.response?.data?.detail || "Teléfono o PIN incorrecto. Verifica tus datos e intenta nuevamente.";
            toast.error(detail);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleVerifyOtp(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await axios.post('/api/auth/client/verify-otp', { telefono: phone, otp });
            const { access_token, cliente } = res.data;
            
            try {
                localStorage.setItem('client_token', access_token);
            } catch (e) {
                console.error("Storage Error:", e);
                toast.warning("El navegador bloqueó el almacenamiento de la sesión.");
            }
            
            if (cliente) setUser(cliente);
            setToken(access_token);
            setLoading(false);
            toast.success("¡Bienvenido!");
        } catch (error) {
            toast.error("Código inválido o expirado");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGetRecovery() {
        if (!phone) return toast.error("Ingresa tu número");
        setSubmitting(true);
        try {
            const res = await axios.get(`/api/auth/client/recovery-info/${phone}`);
            setRecoveryInfo(res.data);
            setAuthStep('recovery');
        } catch (error) {
            toast.error(error.response?.data?.detail || "No se encontró información de recuperación");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResetPin(e) {
        e.preventDefault();
        if (recoveryInfo?.method === 'question' && !recoveryAnswer) return toast.error("Ingresa la respuesta");
        if (newPin.length !== 4) return toast.error("El nuevo PIN debe ser de 4 dígitos");

        setSubmitting(true);
        try {
            await axios.post('/api/auth/client/reset-pin', {
                telefono: phone,
                answer: recoveryAnswer,
                new_pin: newPin
            });
            toast.success("PIN restablecido con éxito");
            setAuthStep('phone');
            setPin('');
            setRecoveryAnswer('');
            setNewPin('');
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al restablecer PIN");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (!passwordData.new_password || !passwordData.confirm_password) {
            toast.error("Completa los campos de contraseña");
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setChangingPassword(true);
        try {
            const api = axios.create({
                baseURL: (import.meta.env && import.meta.env.REACT_APP_BACKEND_URL) || '/api',
                headers: { Authorization: `Bearer ${token}` }
            });
            await api.post('/client/change-password', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            toast.success("Contraseña actualizada con éxito");
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al cambiar contraseña");
        } finally {
            setChangingPassword(false);
        }
    }

    async function handleSaveAddress(e) {
        e.preventDefault();
        if (!addressForm.nombre.trim() || !addressForm.direccion.trim()) {
            toast.error("Completa todos los campos");
            return;
        }

        setSavingAddress(true);
        const saveLocally = () => {
            const newAddr = {
                id: `addr-${Date.now()}`,
                nombre: addressForm.nombre.trim(),
                direccion: addressForm.direccion.trim(),
                es_principal: addressForm.es_principal || addresses.length === 0,
            };
            const updated = addressForm.es_principal
                ? [...addresses.map(a => ({ ...a, es_principal: false })), newAddr]
                : [...addresses, newAddr];
            setAddresses(updated);
            localStorage.setItem('universal_client_addresses', JSON.stringify(updated));
            toast.success("Dirección guardada correctamente");
            setAddressForm({ nombre: '', direccion: '', es_principal: false });
        };

        if (token === 'universal-client-token') {
            saveLocally();
            setSavingAddress(false);
            return;
        }

        try {
            const api = axios.create({
                baseURL: API_BASE,
                headers: { Authorization: `Bearer ${token}` }
            });
            await api.post('/client/addresses', addressForm);
            toast.success("Dirección guardada correctamente");
            setAddressForm({ nombre: '', direccion: '', es_principal: false });
            fetchProfile();
        } catch (error) {
            console.warn("Backend address save fallback:", error);
            saveLocally();
        } finally {
            setSavingAddress(false);
        }
    }

    async function handleSetPrimaryAddress(addrId) {
        const updated = addresses.map(a => ({ ...a, es_principal: a.id === addrId }));
        setAddresses(updated);
        if (token === 'universal-client-token') {
            localStorage.setItem('universal_client_addresses', JSON.stringify(updated));
            toast.success("Dirección principal actualizada");
            return;
        }
        try {
            const api = axios.create({
                baseURL: API_BASE,
                headers: { Authorization: `Bearer ${token}` }
            });
            await api.put(`/client/addresses/${addrId}`, { es_principal: true });
            toast.success("Dirección principal actualizada");
        } catch {
            localStorage.setItem('universal_client_addresses', JSON.stringify(updated));
            toast.success("Dirección principal actualizada");
        }
    }

    async function handleDeleteAddress(addrId) {
        let updated = addresses.filter(a => a.id !== addrId);
        if (updated.length > 0 && !updated.some(a => a.es_principal)) {
            updated[0] = { ...updated[0], es_principal: true };
        }
        setAddresses(updated);
        if (token === 'universal-client-token') {
            localStorage.setItem('universal_client_addresses', JSON.stringify(updated));
            toast.success("Dirección eliminada");
            return;
        }
        try {
            const api = axios.create({
                baseURL: API_BASE,
                headers: { Authorization: `Bearer ${token}` }
            });
            await api.delete(`/client/addresses/${addrId}`);
            toast.success("Dirección eliminada");
        } catch {
            localStorage.setItem('universal_client_addresses', JSON.stringify(updated));
            toast.success("Dirección eliminada");
        }
    }

    async function handleDirectAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 5MB");
            return;
        }

        const readAsDataUrl = () => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const toastId = toast.loading("Actualizando foto de perfil...");

        const saveAvatarLocally = async () => {
            const dataUrl = await readAsDataUrl();
            setUser(prev => {
                const updated = { ...prev, avatar_url: dataUrl };
                const saved = localStorage.getItem('universal_client_profile');
                const parsed = saved ? JSON.parse(saved) : {};
                localStorage.setItem('universal_client_profile', JSON.stringify({
                    ...parsed,
                    nombre: updated.nombre,
                    email: updated.email,
                    telefono: updated.telefono,
                    avatar_url: dataUrl
                }));
                return updated;
            });
            toast.success("Foto de perfil actualizada", { id: toastId });
        };

        if (token === 'universal-client-token') {
            try {
                await saveAvatarLocally();
            } catch {
                toast.error("No se pudo cargar la imagen", { id: toastId });
            }
            e.target.value = '';
            return;
        }

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            let url = `${API_BASE}/client/upload-avatar`;
            if (business?.id) url += `?negocio_id=${business.id}`;
            const res = await axios.post(url, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            const newUrl = res.data.url;
            await axios.put(`${API_BASE}/client/me`, { ...user, avatar_url: newUrl }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(prev => ({ ...prev, avatar_url: newUrl }));
            toast.success("Foto de perfil actualizada", { id: toastId });
        } catch {
            try {
                await saveAvatarLocally();
            } catch {
                toast.error("Error al subir la imagen", { id: toastId });
            }
        } finally {
            e.target.value = '';
        }
    }

    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            toast.error("Geolocalización no soportada por tu navegador");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    if (data.display_name) {
                        setAddressForm(prev => ({ ...prev, direccion: data.display_name }));
                        toast.success("Ubicación detectada");
                    } else {
                        setAddressForm(prev => ({ ...prev, direccion: `${latitude}, ${longitude}` }));
                    }
                } catch (error) {
                    setAddressForm(prev => ({ ...prev, direccion: `${latitude}, ${longitude}` }));
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                toast.error("Error al obtener ubicación");
                setDetectingLocation(false);
            }
        );
    }

    const isPasswordDirty = passwordData.new_password &&
        passwordData.confirm_password &&
        passwordData.new_password === passwordData.confirm_password;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
            </div>
        );
    }

    // Login View
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex flex-col items-center justify-center p-4 font-inter">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-[#4ADE80]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-8 h-8 text-[#22C55E]" />
                        </div>
                        <h1 className="text-2xl font-black text-[#111814]">
                            {authStep === 'phone' ? 'Bienvenido' : authStep === 'otp' ? 'Verifica tu número' : 'Recuperar PIN'}
                        </h1>
                        <p className="text-gray-500 font-medium">
                            {authStep === 'phone'
                                ? 'Ingresa tu celular y PIN para acceder.'
                                : authStep === 'otp'
                                    ? `Ingresa el código enviado al ${phone}`
                                    : `Sigue los pasos para recuperar tu acceso`
                            }
                        </p>
                    </div>

                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                        <CardContent className="p-8">
                            {authStep === 'phone' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (phone.length >= 4 && pin.length === 4) handleLoginPin(e);
                                        else if (phone.length < 4) toast.error("Código de usuario inválido");
                                        else toast.error("Ingresa tu PIN de 4 dígitos");
                                    }}
                                    className="space-y-6"
                                    autoComplete="off"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Input
                                                    type="tel"
                                                    placeholder="Celular"
                                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 text-center font-bold text-lg"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    autoComplete="off"
                                                    name="p_user_login"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Input
                                                    type="password"
                                                    placeholder="PIN"
                                                    maxLength={4}
                                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 text-center text-2xl tracking-[0.5rem] font-bold"
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value)}
                                                    autoComplete="new-password"
                                                    name="p_pin_login"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            className="w-full h-12 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-base shadow-lg shadow-[#4ADE80]/20"
                                            disabled={submitting}
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar con PIN"}
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={handleGetRecovery}
                                            className="w-full text-xs font-bold text-gray-400 hover:text-[#22C55E] transition-colors"
                                        >
                                            ¿Olvidaste tu PIN?
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
                                        ¿Primera vez? Usa los <b>últimos 4 dígitos</b> de tu celular como PIN inicial.
                                    </p>
                                </form>
                            ) : authStep === 'otp' ? (
                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700">Código de Verificación</Label>
                                        <Input
                                            type="text"
                                            placeholder="123456"
                                            className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-[#22C55E]/20 focus:border-[#22C55E] text-center text-xl tracking-widest font-bold"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-base shadow-lg shadow-[#4ADE80]/20"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-gray-500 font-bold"
                                        onClick={() => setAuthStep('phone')}
                                    >
                                        Atrás
                                    </Button>
                                </form>
                            ) : authStep === 'recovery' ? (
                                <form onSubmit={handleResetPin} className="space-y-6" autoComplete="off">
                                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-5 h-5 text-[#EAB308]" />
                                            <h3 className="font-black text-[#111814]">Recuperar Acceso</h3>
                                        </div>

                                        {recoveryInfo?.method === 'hint' ? (
                                            <div className="space-y-4">
                                                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Tu Pista para el PIN:</p>
                                                    <p className="text-sm font-medium text-yellow-900 italic">"{recoveryInfo.hint}"</p>
                                                </div>
                                                <p className="text-xs text-center text-gray-500 font-medium">
                                                    Intenta recordar tu PIN con esta pista y vuelve al inicio.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full h-11 rounded-xl border-gray-200 text-gray-700 font-bold"
                                                    onClick={() => setAuthStep('phone')}
                                                >
                                                    Entendido, volver a intentar
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Pregunta de Seguridad:</p>
                                                    <p className="text-sm font-black text-[#111814]">{recoveryInfo?.question || "No has configurado una pregunta. Prueba con otro método o contacta soporte."}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-gray-700">Tu Respuesta</Label>
                                                    <Input
                                                        placeholder="Respuesta..."
                                                        className="h-11 rounded-xl bg-white border-gray-200 font-medium"
                                                        value={recoveryAnswer}
                                                        onChange={e => setRecoveryAnswer(e.target.value)}
                                                        required
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-gray-700">Escribe un Nuevo PIN</Label>
                                                    <Input
                                                        type="password"
                                                        maxLength={4}
                                                        placeholder="PIN"
                                                        className="h-11 rounded-xl bg-white border-gray-200 text-center text-xl tracking-widest font-black"
                                                        value={newPin}
                                                        onChange={e => setNewPin(e.target.value)}
                                                        required
                                                        autoComplete="new-password"
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black"
                                                    disabled={submitting}
                                                >
                                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cambiar PIN y Entrar"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full text-gray-500 font-bold text-sm"
                                                    onClick={() => setAuthStep('phone')}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            ) : null}
                        </CardContent>
                    </Card>
                    <Button
                        variant="ghost"
                        onClick={goToMenu}
                        className="w-full text-gray-400 font-bold hover:text-[#111814]"
                    >
                        Volver al menú
                    </Button>
                </div>
            </div >
        );
    }

    // Mandatory Security Setup (Force Question/Hint if not set)
    if (user && !user.recovery_method) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-inter">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-black text-[#111814]">Protege tu cuenta</h1>
                        <p className="text-gray-500 font-medium">
                            Como no usamos WhatsApp para códigos, configura una pregunta de seguridad para poder recuperar tu acceso si olvidas tu PIN.
                        </p>
                    </div>

                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                        <CardContent className="p-8">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const pinVal = e.target.pin.value;
                                if (pinVal.length !== 4) return toast.error("Crea un PIN de 4 dígitos");
                                if (recoveryMethod === 'question' && (!securityQuestion || !securityAnswer)) {
                                    return toast.error("Selecciona una pregunta y escribe la respuesta");
                                }
                                if (recoveryMethod === 'hint' && !pinHint) {
                                    return toast.error("Escribe una pista para recordar tu PIN");
                                }

                                setSubmitting(true);
                                try {
                                    const res = await axios.post('/api/client/update-pin', {
                                        pin: pinVal,
                                        recovery_method: recoveryMethod,
                                        pin_hint: pinHint,
                                        security_question: securityQuestion,
                                        security_answer: securityAnswer
                                    }, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    toast.success("¡Seguridad configurada!");
                                    // Actualizar localmente el usuario para saltar este paso
                                    setUser({ ...user, recovery_method: recoveryMethod });
                                } catch (err) {
                                    toast.error("Error al guardar seguridad");
                                } finally {
                                    setSubmitting(false);
                                }
                            }} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-gray-400">Crea tu PIN Final</Label>
                                        <Input
                                            name="pin"
                                            type="password"
                                            maxLength={4}
                                            placeholder="••••"
                                            className="h-12 rounded-xl bg-gray-50 border-gray-200 text-center text-2xl tracking-[0.5rem] font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3 px-2 pt-2">
                                        <Label className="text-xs font-black uppercase text-gray-400">Método de recuperación</Label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setRecoveryMethod('hint')}
                                                className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold text-sm ${recoveryMethod === 'hint' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                            >
                                                Pista
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRecoveryMethod('question')}
                                                className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold text-sm ${recoveryMethod === 'question' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                                            >
                                                Pregunta
                                            </button>
                                        </div>
                                    </div>

                                    {recoveryMethod === 'hint' ? (
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Ej: Año de mi graduación"
                                                className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                                value={pinHint}
                                                onChange={e => setPinHint(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <select
                                                className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm font-medium"
                                                value={securityQuestion}
                                                onChange={e => setSecurityQuestion(e.target.value)}
                                                required
                                            >
                                                <option value="">Selecciona una pregunta...</option>
                                                <option value="¿Nombre de tu primera mascota?">¿Nombre de tu primera mascota?</option>
                                                <option value="¿Ciudad donde naciste?">¿Ciudad donde naciste?</option>
                                                <option value="¿Nombre de tu escuela primaria?">¿Nombre de tu escuela primaria?</option>
                                                <option value="¿Marca de tu primer auto?">¿Marca de tu primer auto?</option>
                                            </select>
                                            <Input
                                                placeholder="Tu respuesta..."
                                                className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                                value={securityAnswer}
                                                onChange={e => setSecurityAnswer(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/20"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Empezar a usar mi cuenta"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Button
                        variant="ghost"
                        onClick={logout}
                        className="w-full text-gray-400 font-bold hover:text-red-500"
                    >
                        Salir y configurar luego
                    </Button>
                </div>
            </div>
        );
    }

    // Profile Calculations (100% reales, sin datos de prueba)
    const primaryAddress = addresses.find(a => a.es_principal) || addresses[0] || null;
    const puntosCount = Number(loyalty?.puntos_actuales ?? loyalty?.puntos ?? user?.puntos ?? 0);
    const nivel = puntosCount >= 300 ? 'Cliente Diamante' : puntosCount >= 150 ? 'Cliente Oro' : puntosCount >= 50 ? 'Cliente Plata' : 'Cliente Bronce';

    const visibleOrders = orders.filter(o => !hiddenOrderIds.includes(o.id));
    const inProcessOrdersCount = visibleOrders.filter(o => ['pendiente', 'aceptado', 'preparando', 'nuevo'].includes(o.estado?.toLowerCase())).length;
    const onTheWayOrdersCount = visibleOrders.filter(o => ['enviado', 'en_camino'].includes(o.estado?.toLowerCase())).length;
    const deliveredOrdersCount = visibleOrders.filter(o => ['entregado', 'completado', 'listo'].includes(o.estado?.toLowerCase())).length;

    return (
        <div className="min-h-screen bg-[#F6F7F9] font-sans flex justify-center pb-28 md:pb-16 selection:bg-[#C86414] selection:text-white">
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col md:my-6 md:rounded-[2.5rem] md:min-h-0 md:border md:border-gray-100 overflow-hidden">
                {/* 1. Hero Header Banner */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-amber-900 to-[#181615]">
                    <img
                        src={business?.banner_url || "/images/hero-almuerzo.jpg"}
                        alt="Veco's Restaurante"
                        className="w-full h-full object-cover opacity-90 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />

                    {/* Top Buttons on Banner */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                        <button
                            onClick={goToMenu}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all shadow-md active:scale-95"
                            title="Volver"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setShowSecurityModal(true)}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all shadow-md active:scale-95"
                            title="Seguridad y Ajustes"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Bottom Smooth Curved Wave */}
                    <div className="absolute -bottom-1 left-0 right-0 h-9 bg-white rounded-t-[2.5rem]" />
                </div>

                {/* 2. Avatar & User Information */}
                <div className="relative -mt-16 flex flex-col items-center px-4 z-10">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'Luis Sarabia')}&background=C86414&color=fff&bold=true&size=200`}
                                    alt={user.nombre || 'Usuario'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <input
                            id="profile-avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleDirectAvatarChange}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#C86414] hover:bg-[#181615] text-white flex items-center justify-center shadow-lg border-2 border-white transition-all active:scale-90 cursor-pointer"
                            title="Cambiar foto de perfil"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-[#181615] mt-3 tracking-tight text-center">
                        {user.nombre || 'Mi Cuenta'}
                    </h2>

                    {user.telefono && (
                        <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-[#C86414]" />
                            <span>{user.telefono}</span>
                        </div>
                    )}
                </div>

                {/* 3. Loyalty VIP Card (Points, Level, Redeem) */}
                <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/70 shadow-sm flex items-center justify-between text-center divide-x divide-amber-200/60">
                    <div className="flex-1 flex flex-col items-center px-1">
                        <div className="flex items-center gap-1 text-[#C86414] font-black text-lg">
                            <Star className="w-4 h-4 fill-[#C86414] text-[#C86414]" />
                            <span>{puntosCount}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 mt-0.5">Mis Puntos</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-1">
                        <div className="flex items-center gap-1 text-amber-800 font-black text-xs sm:text-sm">
                            <Crown className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="truncate">{nivel}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 mt-0.5">Nivel</span>
                    </div>

                    <div
                        onClick={() => {
                            refreshCoupons();
                            setShowCouponsModal(true);
                        }}
                        className="flex-1 flex flex-col items-center px-1 cursor-pointer group"
                    >
                        <div className="flex items-center gap-1 text-[#C86414] font-black text-xs sm:text-sm group-hover:scale-105 transition-transform">
                            <Gift className="w-4 h-4 text-[#C86414]" />
                            <span>Canjear</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 mt-0.5">
                            {activeCoupons.length > 0 ? `${activeCoupons.length} premio${activeCoupons.length > 1 ? 's' : ''}` : 'Mis premios'}
                        </span>
                    </div>
                </div>

                {/* 4. Mis Pedidos (Counters Card) */}
                <div className="mx-4 mt-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 font-black text-sm text-[#181615]">
                            <Package className="w-4 h-4 text-[#181615]" />
                            <span>Mis Pedidos</span>
                        </div>
                        <button
                            onClick={handleOpenOrders}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                            Ver todos <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div
                            onClick={handleOpenOrders}
                            className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-orange-50/60 cursor-pointer hover:bg-orange-100/60 transition-all"
                        >
                            <ShoppingCart className="w-5 h-5 text-[#C86414] mb-1" />
                            <span className="text-base font-black text-[#181615]">{inProcessOrdersCount}</span>
                            <span className="text-[10px] font-bold text-gray-500">En proceso</span>
                        </div>

                        <div
                            onClick={handleOpenOrders}
                            className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-orange-50/60 cursor-pointer hover:bg-orange-100/60 transition-all"
                        >
                            <Bike className="w-5 h-5 text-[#C86414] mb-1" />
                            <span className="text-base font-black text-[#181615]">{onTheWayOrdersCount}</span>
                            <span className="text-[10px] font-bold text-gray-500">En camino</span>
                        </div>

                        <div
                            onClick={handleOpenOrders}
                            className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-green-50/70 cursor-pointer hover:bg-green-100/70 transition-all"
                        >
                            <CheckCircle2 className="w-5 h-5 text-green-600 mb-1" />
                            <span className="text-base font-black text-[#181615]">{deliveredOrdersCount}</span>
                            <span className="text-[10px] font-bold text-gray-500">Entregados</span>
                        </div>
                    </div>
                </div>

                {/* 5. Mis Direcciones Card */}
                <div className="mx-4 mt-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 font-black text-sm text-[#181615]">
                            <MapPin className="w-4 h-4 text-[#181615]" />
                            <span>Mis Direcciones</span>
                        </div>
                        <button
                            onClick={() => setShowAddressModal(true)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                            Administrar <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div
                        onClick={() => setShowAddressModal(true)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/70 transition-all cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#181615] truncate">
                                    {primaryAddress?.nombre || (user.direccion ? 'Mi Dirección' : 'Sin dirección registrada')}
                                </span>
                                {(primaryAddress || user.direccion) && (
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                        Principal
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {primaryAddress?.direccion || user.direccion || 'Toca para agregar tu dirección de entrega'}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                </div>

                {/* 6. Action Menu List (Grouped with Dividers) */}
                <div className="mx-4 mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100 mb-8">
                    <button
                        onClick={() => navigate('/mi-cuenta/editar')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[#181615]">Mis Datos Personales</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button
                        onClick={() => setShowFavoritesModal(true)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </div>
                            <span className="text-sm font-bold text-[#181615]">Mis Favoritos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {favorites.length > 0 && (
                                <span className="text-xs font-bold text-gray-400">{favorites.length}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </button>

                    <button
                        onClick={handleOpenNotifications}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                <Bell className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[#181615]">Notificaciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadNotificationsCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </button>

                    <button
                        onClick={() => window.open('https://wa.me/573017810256?text=Hola%20Fog%C3%B3n%20%26%20Mesa%2C%20necesito%20ayuda%20con%20mi%20cuenta', '_blank')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Headphones className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[#181615]">Centro de Ayuda</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button
                        onClick={() => setShowSecurityModal(true)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-amber-600">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[#181615]">Seguridad y PIN de Acceso</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-all text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-600 group-hover:text-red-600 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">Cerrar Sesión</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* 7. Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2.5 flex items-center justify-between z-40 shadow-lg md:rounded-b-[2.5rem]">
                    <button
                        onClick={goToMenu}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Inicio</span>
                    </button>

                    <button
                        onClick={goToMenu}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Utensils className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Menú</span>
                    </button>

                    <button
                        onClick={handleOpenOrders}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors relative"
                    >
                        <div className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            {unseenOrdersCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                                    {unseenOrdersCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Pedidos</span>
                    </button>

                    <button
                        className="flex flex-col items-center gap-1 text-[#C86414] font-bold transition-colors"
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-extrabold border-b-2 border-[#C86414] pb-0.5">Perfil</span>
                    </button>
                </div>

                {/* --- MODALS & DIALOGS --- */}

                {/* Modal 1: Ruleta de Premios */}
                <RuletaPremiosModal
                    open={showWheelModal}
                    onOpenChange={setShowWheelModal}
                    slug={slug}
                    businessName="Veco's Restaurante"
                    userPhone={user?.telefono}
                    onSpinComplete={() => refreshCoupons()}
                />

                {/* Modal 1B: Mis Cupones y Premios Ganados */}
                <Dialog open={showCouponsModal} onOpenChange={setShowCouponsModal}>
                    <DialogContent className="rounded-[2rem] max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-2 pr-6">
                                <DialogTitle className="text-xl font-black text-[#181615] flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-[#C86414]" />
                                    Mis Premios y Cupones
                                </DialogTitle>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCouponsModal(false);
                                        setShowWheelModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#C86414] text-[11px] font-black transition-colors cursor-pointer"
                                >
                                    🎰 Ruleta
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            {activeCoupons.length === 0 ? (
                                <div className="py-8 px-4 text-center rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-2xl">
                                        🎁
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#181615]">Aún no tienes cupones activos</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Gira la Ruleta del Día para ganar papas, postres, bebidas o descuentos para tu próximo pedido.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowCouponsModal(false);
                                            setShowWheelModal(true);
                                        }}
                                        className="rounded-xl bg-[#C86414] hover:bg-[#181615] text-white font-bold text-xs px-5 h-10"
                                    >
                                        🎰 Girar la Ruleta ahora
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                                        Disponibles para usar ({activeCoupons.length})
                                    </p>
                                    {activeCoupons.map((coupon) => {
                                        const expDate = coupon.expira_en
                                            ? new Date(coupon.expira_en).toLocaleDateString('es-CO', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : null;
                                        return (
                                            <div
                                                key={coupon.id || coupon.codigo_cupon}
                                                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border-2 border-amber-200/80 shadow-sm space-y-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl shrink-0">{coupon.premio_emoji || '🎁'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-[#181615] leading-snug">
                                                            {coupon.premio_label}
                                                        </p>
                                                        <div className="flex items-center flex-wrap gap-2 mt-1 text-[11px] text-gray-500 font-medium">
                                                            {expDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-[#C86414]" />
                                                                    Vence: {expDate}
                                                                </span>
                                                            )}
                                                            {Number(coupon.compra_minima || 0) > 0 && (
                                                                <span>• Mín. ${Number(coupon.compra_minima).toLocaleString('es-CO')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#181615] text-white">
                                                    <span className="font-mono font-black text-xs tracking-wider text-amber-300">
                                                        {coupon.codigo_cupon}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCouponCode(coupon.codigo_cupon)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold transition-colors cursor-pointer"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        Copiar
                                                    </button>
                                                </div>

                                                <Button
                                                    type="button"
                                                    onClick={() => handleUseCouponInOrder(coupon)}
                                                    className="w-full h-10 rounded-xl bg-[#C86414] hover:bg-[#181615] text-white font-bold text-xs"
                                                >
                                                    Usar en mi pedido →
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {inactiveCoupons.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                        Historial ({inactiveCoupons.length})
                                    </p>
                                    {inactiveCoupons.slice(0, 5).map((coupon) => (
                                        <div
                                            key={coupon.id || coupon.codigo_cupon}
                                            className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 opacity-70"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-lg">{coupon.premio_emoji || '🎁'}</span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-600 truncate">{coupon.premio_label}</p>
                                                    <p className="text-[10px] font-mono text-gray-400">{coupon.codigo_cupon}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                                coupon.isUsed
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}>
                                                {coupon.isUsed ? 'Canjeado' : 'Expirado'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal 2: Direcciones */}
                <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
                    <DialogContent className="rounded-[2rem] max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-[#181615]">Mis Direcciones</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <p className="text-xs font-medium text-gray-500">
                                Selecciona la dirección que deseas mostrar como principal en tu perfil:
                            </p>

                            {addresses.length > 0 ? (
                                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                                    {addresses.map((addr) => {
                                        const isSelected = (selectedAddressId || primaryAddress?.id) === addr.id;
                                        return (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-[#C86414] bg-orange-50/50 shadow-sm'
                                                        : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected ? 'border-[#C86414] bg-[#C86414]' : 'border-gray-300 bg-white'
                                                    }`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-xs text-[#181615] truncate">{addr.nombre}</span>
                                                            {addr.es_principal && (
                                                                <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border-none">Actual</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{addr.direccion}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAddress(addr.id);
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                                    title="Eliminar dirección"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">No tienes direcciones guardadas aún.</p>
                            )}

                            {addresses.length > 0 && (
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        const targetId = selectedAddressId || primaryAddress?.id;
                                        if (targetId) {
                                            await handleSetPrimaryAddress(targetId);
                                            setShowAddressModal(false);
                                        }
                                    }}
                                    className="w-full rounded-xl h-11 bg-[#C86414] hover:bg-[#181615] text-white font-bold shadow-sm transition-colors"
                                >
                                    Usar dirección seleccionada
                                </Button>
                            )}

                            <form onSubmit={handleSaveAddress} className="space-y-3 pt-4 border-t border-gray-100">
                                <h4 className="font-bold text-sm text-gray-800">Agregar Nueva Dirección</h4>
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-xs">Nombre (Ej: Casa, Oficina)</Label>
                                    <Input
                                        placeholder="Mi Casa"
                                        value={addressForm.nombre}
                                        onChange={e => setAddressForm({ ...addressForm, nombre: e.target.value })}
                                        className="rounded-xl h-10"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-xs">Dirección Completa</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Calle 84 # 45 - 22..."
                                            value={addressForm.direccion}
                                            onChange={e => setAddressForm({ ...addressForm, direccion: e.target.value })}
                                            className="rounded-xl h-10 pr-10"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#C86414]"
                                            onClick={handleGetCurrentLocation}
                                            disabled={detectingLocation}
                                            title="Detectar ubicación GPS"
                                        >
                                            {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.es_principal}
                                        onChange={e => setAddressForm({ ...addressForm, es_principal: e.target.checked })}
                                        className="rounded border-gray-300 accent-[#C86414]"
                                    />
                                    Establecer como dirección principal al agregar
                                </label>
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-1 rounded-xl h-10 font-bold"
                                        onClick={() => setShowAddressModal(false)}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={savingAddress}
                                        className="flex-1 rounded-xl h-10 bg-[#181615] hover:bg-[#C86414] text-white font-bold transition-colors"
                                    >
                                        {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ Agregar"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal 3: Seguridad y PIN */}
                <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
                    <DialogContent className="rounded-[2rem] max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-[#181615] flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500" />
                                Seguridad y PIN de Acceso
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const pinVal = e.target.pin.value;
                            if (pinVal.length !== 4) return toast.error("El PIN debe tener 4 dígitos");
                            if (recoveryMethod === 'question' && (!securityQuestion || !securityAnswer)) {
                                return toast.error("Configura la pregunta y respuesta");
                            }
                            if (recoveryMethod === 'hint' && !pinHint) {
                                return toast.error("Escribe una pista para tu PIN");
                            }

                            setSubmitting(true);
                            const saveSecurityLocally = () => {
                                localStorage.setItem('universal_client_security', JSON.stringify({
                                    pin: pinVal,
                                    recovery_method: recoveryMethod,
                                    pin_hint: pinHint,
                                    security_question: securityQuestion,
                                    security_answer: securityAnswer
                                }));
                                toast.success("PIN y método de recuperación guardados");
                                setShowSecurityModal(false);
                            };

                            if (token === 'universal-client-token') {
                                saveSecurityLocally();
                                setSubmitting(false);
                                return;
                            }

                            try {
                                const api = axios.create({
                                    baseURL: API_BASE,
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                await api.post('/client/update-pin', {
                                    pin: pinVal,
                                    recovery_method: recoveryMethod,
                                    pin_hint: pinHint,
                                    security_question: securityQuestion,
                                    security_answer: securityAnswer
                                });
                                toast.success("PIN de seguridad guardado");
                                setShowSecurityModal(false);
                            } catch (err) {
                                saveSecurityLocally();
                            } finally {
                                setSubmitting(false);
                            }
                        }} className="space-y-4 pt-2">
                            <p className="text-xs text-gray-500">
                                Establece un PIN de 4 dígitos para acceder a tu cuenta sin esperar el SMS o código de WhatsApp.
                            </p>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-600">Nuevo PIN (4 dígitos)</Label>
                                <Input
                                    name="pin"
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    className="h-11 rounded-xl bg-gray-50 font-black text-center text-xl tracking-widest"
                                    required
                                />
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl space-y-3">
                                <Label className="text-xs font-bold text-gray-700">Método de recuperación</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRecoveryMethod('hint')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${recoveryMethod === 'hint' ? 'bg-[#C86414] text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        Pista (Hint)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecoveryMethod('question')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${recoveryMethod === 'question' ? 'bg-[#C86414] text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        Pregunta
                                    </button>
                                </div>
                                {recoveryMethod === 'hint' ? (
                                    <Input
                                        placeholder="Pista (ej: últimos 4 de mi cédula)"
                                        className="h-9 rounded-lg text-xs bg-white"
                                        value={pinHint}
                                        onChange={e => setPinHint(e.target.value)}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <select
                                            className="w-full h-9 rounded-lg border border-gray-200 text-xs px-2 bg-white"
                                            value={securityQuestion}
                                            onChange={e => setSecurityQuestion(e.target.value)}
                                        >
                                            <option value="">Selecciona pregunta...</option>
                                            <option value="¿Nombre de tu primera mascota?">¿Nombre de tu primera mascota?</option>
                                            <option value="¿Ciudad de nacimiento?">¿Ciudad de nacimiento?</option>
                                        </select>
                                        <Input
                                            placeholder="Tu respuesta secreta"
                                            className="h-9 rounded-lg text-xs bg-white"
                                            value={securityAnswer}
                                            onChange={e => setSecurityAnswer(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1 rounded-xl h-11 font-bold"
                                    onClick={() => setShowSecurityModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 rounded-xl h-11 bg-[#C86414] hover:bg-[#181615] text-white font-bold"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar PIN"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal 4: Favoritos */}
                <Dialog open={showFavoritesModal} onOpenChange={setShowFavoritesModal}>
                    <DialogContent className="rounded-[2rem] max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-[#181615] flex items-center gap-2">
                                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                                Mis Platos Favoritos
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                            {favorites.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm font-medium">Aún no has guardado platos favoritos.</p>
                                    <Button
                                        onClick={() => { setShowFavoritesModal(false); goToMenu(); }}
                                        className="mt-4 bg-[#C86414] hover:bg-[#181615] text-white font-bold rounded-xl"
                                    >
                                        Explorar la Carta
                                    </Button>
                                </div>
                            ) : (
                                favorites.map((fav, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                                        <span className="font-bold text-sm text-[#181615]">{fav.negocio_nombre || 'Plato Favorito'}</span>
                                        <Button size="sm" onClick={() => { setShowFavoritesModal(false); goToMenu(); }} className="bg-[#C86414] text-white font-bold rounded-lg text-xs">
                                            Pedir
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal 5: Notificaciones */}
                <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
                    <DialogContent className="rounded-[2rem] max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-[#181615] flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-500" />
                                Notificaciones
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center flex flex-col items-center gap-2 text-gray-400">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">No tienes notificaciones</p>
                                    <p className="text-xs text-gray-400">Te avisaremos cuando haya novedades o promociones.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => {
                                    const themeClasses =
                                        notif.theme === 'orange'
                                            ? { box: 'bg-orange-50/60 border-orange-100', dot: 'bg-[#C86414]' }
                                            : notif.theme === 'green'
                                            ? { box: 'bg-green-50/60 border-green-100', dot: 'bg-green-600' }
                                            : { box: 'bg-blue-50/60 border-blue-100', dot: 'bg-blue-600' };

                                    return (
                                        <div
                                            key={notif.id}
                                            className={`p-3 rounded-xl border flex items-start gap-3 ${themeClasses.box}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${themeClasses.dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#181615]">{notif.title}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">{notif.message}</p>
                                                {notif.actionLabel && notif.actionType === 'wheel' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowNotificationsModal(false);
                                                            setShowWheelModal(true);
                                                        }}
                                                        className="text-[11px] font-bold text-[#C86414] mt-1 underline cursor-pointer"
                                                    >
                                                        {notif.actionLabel}
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNotification(notif.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/80 transition-colors shrink-0 cursor-pointer"
                                                title="Eliminar notificación"
                                                aria-label="Eliminar notificación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
