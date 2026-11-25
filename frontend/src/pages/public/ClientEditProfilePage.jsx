
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Camera, User, Mail, Phone, Lock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    const [token] = useState(localStorage.getItem('client_token'));

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
        if (token === 'universal-client-token') {
            const saved = localStorage.getItem('universal_client_profile');
            const profileData = saved
                ? JSON.parse(saved)
                : {
                    nombre: "Cliente de Prueba",
                    email: "cliente@fogonmesa.com",
                    telefono: "+57 300 123 4567",
                    avatar_url: ""
                };
            setFormData(profileData);
            setInitialData(profileData);
            setLoading(false);
            return;
        }
        try {
            // First get business ID from slug to have context
            try {
                const businessRes = await axios.get(`${API_BASE}/business/${slug}`);
                setBusinessId(businessRes.data.id);
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
                navigate(`/${slug}/mi-cuenta`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        if (token === 'universal-client-token') {
            localStorage.setItem('universal_client_profile', JSON.stringify(formData));
            toast.success("Perfil actualizado correctamente");
            setSaving(false);
            navigate(`/${slug}/mi-cuenta`);
            return;
        }

        try {
            await axios.put(`${API_BASE}/client/me`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Perfil actualizado correctamente");
            navigate(`/${slug}/mi-cuenta`);
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
                                    <Label className="font-bold text-gray-700">Número de Teléfono</Label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            value={formData.telefono}
                                            disabled
                                            className="h-12 pl-10 rounded-xl bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">El teléfono no se puede cambiar.</p>
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
        </div>
    );
}
