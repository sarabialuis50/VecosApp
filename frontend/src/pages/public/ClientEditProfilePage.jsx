
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Camera, User, Mail, Phone, Lock, Loader2, ShieldCheck, MessageCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

const RAW_API = (import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '';
const API_BASE = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`) : '/api';

export default function ClientEditProfilePage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [businessId, setBusinessId] = useState(null);
    const [initialData, setInitialData] = useState(null);

    // Auth
    const [token, setToken] = useState(localStorage.getItem('client_token'));

    // Change Phone Modal State
    const [phoneModalOpen, setPhoneModalOpen] = useState(false);
    const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'otp'
    const [newPhone, setNewPhone] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [demoOtpCode, setDemoOtpCode] = useState('');
    const [phoneSubmitting, setPhoneSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        avatar_url: ""
    });

    useEffect(() => {
        if (!token) {
            navigate(`/${slug}/mi-cuenta`);
            return;
        }
        fetchProfile();
    }, [token, slug]);

    const fetchProfile = async () => {
        if (token && token.startsWith('vecos-client-session:')) {
            const last10 = token.replace('vecos-client-session:', '');
            let customers = [];
            try {
                customers = JSON.parse(localStorage.getItem('vecos_customers') || '[]');
            } catch {}
            const match = (Array.isArray(customers) ? customers : []).find((c) => {
                const d = String(c.telefono || c.phone || '').replace(/\D/g, '');
                return d.slice(-10) === last10;
            });
            const profileData = {
                nombre: match?.nombre || match?.name || "",
                email: match?.email || "",
                telefono: match?.telefono || last10,
                avatar_url: match?.avatar_url || ""
            };
            setFormData(profileData);
            setInitialData(profileData);
            setLoading(false);
            return;
        }
        try {
            try {
                const businessRes = await axios.get(`${API_BASE}/business/${slug}`);
                if (businessRes.data?.id) setBusinessId(businessRes.data.id);
            } catch (err) {
                console.error("Could not fetch business context:", err);
            }

            const res = await axios.get(`${API_BASE}/client/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = {
                nombre: res.data.nombre || "",
                email: res.data.email || "",
                telefono: res.data.telefono || "",
                avatar_url: res.data.avatar_url || ""
            };
            setFormData(profileData);
            setInitialData(profileData);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                navigate('/mi-cuenta');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        if (token && token.startsWith('vecos-client-session:')) {
            const last10 = token.replace('vecos-client-session:', '');
            try {
                let customers = JSON.parse(localStorage.getItem('vecos_customers') || '[]');
                if (!Array.isArray(customers)) customers = [];
                let found = false;
                customers = customers.map((c) => {
                    const d = String(c.telefono || c.phone || '').replace(/\D/g, '');
                    if (d.slice(-10) === last10) {
                        found = true;
                        return { ...c, nombre: formData.nombre, name: formData.nombre, email: formData.email, avatar_url: formData.avatar_url };
                    }
                    return c;
                });
                if (!found) {
                    customers.unshift({
                        id: `cli-${last10}`,
                        nombre: formData.nombre || `Cliente ${last10.slice(-4)}`,
                        name: formData.nombre || `Cliente ${last10.slice(-4)}`,
                        telefono: last10,
                        phone: last10,
                        email: formData.email || '',
                        avatar_url: formData.avatar_url || '',
                        puntos: 0,
                        puntos_totales: 0,
                        total_gastado: 0,
                        pedidos_count: 0,
                        created_at: new Date().toISOString(),
                    });
                }
                localStorage.setItem('vecos_customers', JSON.stringify(customers));
                window.dispatchEvent(new Event('vecos-data-updated'));
            } catch {}
            toast.success("Perfil actualizado correctamente");
            setSaving(false);
            navigate('/mi-cuenta');
            return;
        }

        try {
            await axios.put(`${API_BASE}/client/me`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Perfil actualizado correctamente");
            navigate('/mi-cuenta');
        } catch (error) {
            toast.error("Error al actualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = () => {
        document.getElementById('avatar-upload').click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
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

        if (token === 'universal-client-token') {
            try {
                const dataUrl = await readAsDataUrl();
                setFormData(prev => {
                    const next = { ...prev, avatar_url: dataUrl };
                    localStorage.setItem('universal_client_profile', JSON.stringify(next));
                    return next;
                });
                toast.success("Foto actualizada correctamente", { id: toastId });
            } catch {
                toast.error("No se pudo leer la imagen", { id: toastId });
            }
            return;
        }

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            let url = `${API_BASE}/client/upload-avatar`;
            if (businessId) {
                url += `?negocio_id=${businessId}`;
            }

            const res = await axios.post(url, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setFormData(prev => ({ ...prev, avatar_url: res.data.url }));
            toast.success("Imagen subida correctamente", { id: toastId });
        } catch (error) {
            console.warn("Avatar upload fallback to local DataURL:", error);
            try {
                const dataUrl = await readAsDataUrl();
                setFormData(prev => ({ ...prev, avatar_url: dataUrl }));
                toast.success("Foto cargada correctamente", { id: toastId });
            } catch {
                toast.error("Error al subir imagen", { id: toastId });
            }
        }
    };

    const handleOpenPhoneModal = () => {
        setNewPhone('');
        setPhoneOtp('');
        setDemoOtpCode('');
        setPhoneStep('input');
        setPhoneModalOpen(true);
    };

    const handleRequestPhoneChangeOtp = async (e) => {
        e.preventDefault();
        const digits = newPhone.replace(/\D/g, '');
        const currentDigits = (formData.telefono || '').replace(/\D/g, '');

        if (digits.length < 10) {
            toast.error("Ingresa un número de celular válido (mínimo 10 dígitos)");
            return;
        }
        if (digits === currentDigits || (digits.length >= 10 && currentDigits.length >= 10 && digits.slice(-10) === currentDigits.slice(-10))) {
            toast.error("El nuevo número debe ser diferente al actual");
            return;
        }

        setPhoneSubmitting(true);
        try {
            if (token === 'universal-client-token') {
                const simulatedCode = String(Math.floor(100000 + Math.random() * 900000));
                setDemoOtpCode(simulatedCode);
                setPhoneStep('otp');
                toast.success(`Código de prueba generado: ${simulatedCode}`, {
                    description: "En producción este código llega por WhatsApp al nuevo número."
                });
                return;
            }

            const res = await axios.post(
                `${API_BASE}/client/change-phone/request-otp`,
                { nuevo_telefono: newPhone, negocio_slug: slug },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.otp_debug) {
                setDemoOtpCode(res.data.otp_debug);
            }
            setPhoneStep('otp');
            toast.success("Código enviado por WhatsApp al nuevo número");
        } catch (error) {
            const msg = error.response?.data?.detail || "Error al enviar el código por WhatsApp";
            toast.error(msg);
        } finally {
            setPhoneSubmitting(false);
        }
    };

    const handleVerifyPhoneChangeOtp = async (e) => {
        e.preventDefault();
        const cleanOtp = phoneOtp.trim();
        if (cleanOtp.length !== 6) {
            toast.error("Ingresa el código de 6 dígitos");
            return;
        }

        setPhoneSubmitting(true);
        try {
            if (token === 'universal-client-token') {
                if (demoOtpCode && cleanOtp !== demoOtpCode) {
                    toast.error("Código incorrecto. Verifica el código enviado.");
                    setPhoneSubmitting(false);
                    return;
                }
                const formattedPhone = newPhone.trim();
                const updatedProfile = { ...formData, telefono: formattedPhone };
                setFormData(updatedProfile);
                setInitialData(updatedProfile);
                localStorage.setItem('universal_client_profile', JSON.stringify(updatedProfile));
                setPhoneModalOpen(false);
                toast.success("¡Número de celular actualizado!", {
                    description: "Tus puntos, pedidos y direcciones se conservan intactos."
                });
                return;
            }

            const res = await axios.post(
                `${API_BASE}/client/change-phone/verify`,
                { nuevo_telefono: newPhone, otp: cleanOtp },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { access_token, cliente } = res.data;
            if (access_token) {
                localStorage.setItem('client_token', access_token);
                setToken(access_token);
            }
            const updatedPhone = cliente?.telefono || newPhone.trim();
            setFormData(prev => ({ ...prev, telefono: updatedPhone }));
            setInitialData(prev => prev ? { ...prev, telefono: updatedPhone } : prev);
            setPhoneModalOpen(false);
            toast.success("¡Número de celular actualizado!", {
                description: "Tus puntos, pedidos y direcciones fueron transferidos al nuevo número."
            });
        } catch (error) {
            const msg = error.response?.data?.detail || "Código inválido o expirado";
            toast.error(msg);
        } finally {
            setPhoneSubmitting(false);
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
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/${slug}/mi-cuenta`)}
                        className="rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                    <h1 className="text-xl font-black tracking-tight text-[#111814]">Editar Perfil</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <div className="relative group cursor-pointer" onClick={handleAvatarChange}>
                            <div className="w-32 h-32 rounded-full p-1 bg-white shadow-xl border border-gray-100 relative overflow-hidden">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={formData.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-gray-100 text-gray-400 font-bold text-3xl">
                                        {formData.nombre?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-2 w-10 h-10 bg-[#4ADE80] rounded-full flex items-center justify-center border-4 border-white shadow-lg text-[#111814]">
                                <Camera className="w-5 h-5" />
                            </div>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-sm font-medium text-gray-400">PNG, JPG hasta 5MB</p>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-[#22C55E]" />
                            <h3 className="text-lg font-black text-[#111814]">Información Personal</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700">Nombre Completo</Label>
                                <Input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="h-12 rounded-xl bg-white border-gray-200 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                                    placeholder="Tu nombre"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-gray-700">Correo Electrónico</Label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-12 pl-10 rounded-xl bg-white border-gray-200 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-gray-700">Número de Teléfono</Label>
                                        <button
                                            type="button"
                                            onClick={handleOpenPhoneModal}
                                            className="text-xs font-bold text-[#C86414] hover:text-[#181615] flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Cambiar número
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            value={formData.telefono}
                                            disabled
                                            className="h-12 pl-10 rounded-xl bg-gray-50 border-gray-200 text-gray-600 font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Verificado por WhatsApp. Al cambiarlo conservas tus puntos y pedidos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-8 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(`/${slug}/mi-cuenta`)}
                            className="flex-1 h-12 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-white transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 h-12 rounded-xl border-2 border-[#22C55E] font-black transition-all shadow-md active:scale-95 ${initialData && JSON.stringify(initialData) !== JSON.stringify(formData)
                                ? "bg-[#4ADE80] text-[#111814] shadow-[#4ADE80]/20"
                                : "bg-white text-[#111814] hover:bg-[#4ADE80] hover:text-[#111814]"
                                }`}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                        </Button>
                    </div>

                </form>
            </main>

            {/* Change Phone Verification Modal */}
            <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-[#181615] flex items-center gap-2">
                            <span className="w-9 h-9 rounded-full bg-orange-50 text-[#C86414] flex items-center justify-center">
                                <MessageCircle className="w-5 h-5" />
                            </span>
                            Cambiar número de celular
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 pt-1">
                            {phoneStep === 'input'
                                ? "Te enviaremos un código de verificación por WhatsApp a tu nuevo número. Tus puntos, direcciones y pedidos se conservarán."
                                : `Ingresa el código de 6 dígitos que enviamos por WhatsApp al número ${newPhone}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {phoneStep === 'input' ? (
                        <form onSubmit={handleRequestPhoneChangeOtp} className="space-y-4 mt-2">
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                                <span>Número actual:</span>
                                <span className="font-bold text-[#181615]">{formData.telefono || 'Sin registrar'}</span>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700">Nuevo número de WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-[#C86414] absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        type="tel"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                        placeholder="Ej: +57 310 555 1234"
                                        className="h-12 pl-10 rounded-xl bg-white border-gray-200 focus:border-[#C86414] font-semibold"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPhoneModalOpen(false)}
                                    className="flex-1 h-11 rounded-xl font-bold"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={phoneSubmitting}
                                    className="flex-1 h-11 rounded-xl bg-[#C86414] hover:bg-[#181615] text-white font-bold transition-colors"
                                >
                                    {phoneSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Enviar código"
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyPhoneChangeOtp} className="space-y-4 mt-2">
                            {demoOtpCode && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                                    <span>Código de verificación (modo prueba):</span>
                                    <span className="font-black text-sm tracking-widest">{demoOtpCode}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="font-bold text-gray-700">Código de 6 dígitos</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={phoneOtp}
                                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl bg-white border-gray-200 focus:border-[#C86414]"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPhoneStep('input');
                                        setPhoneOtp('');
                                    }}
                                    className="flex-1 h-11 rounded-xl font-bold"
                                >
                                    Volver
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={phoneSubmitting || phoneOtp.length !== 6}
                                    className="flex-1 h-11 rounded-xl bg-[#C86414] hover:bg-[#181615] text-white font-bold transition-colors"
                                >
                                    {phoneSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verificar y cambiar
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
