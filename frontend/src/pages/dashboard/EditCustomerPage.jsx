import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    User,
    Mail,
    Phone,
    Lock,
    Camera,
    Save,
    X,
    ArrowLeft,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function EditCustomerPage() {
    const { slug, customerId } = useParams();
    const navigate = useNavigate();

    // Form states
    const [formData, setFormData] = useState({
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '3001234567',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [phoneError, setPhoneError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, phone: digits });

        if (digits.length > 0 && digits.length < 10) {
            setPhoneError('Faltan dígitos (se requieren 10)');
        } else {
            setPhoneError('');
        }
    };

    const handleSave = () => {
        if (formData.phone.length !== 10) {
            setPhoneError('El número debe tener exactamente 10 dígitos');
            toast.error('Número de teléfono incompleto');
            return;
        }

        toast.success('Cambios guardados correctamente');
        navigate(`/dashboard/${slug}/clientes/${customerId}`);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20 mt-4">
                {/* Header Section */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(`/dashboard/${slug}/clientes/${customerId}`)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group px-1"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold tracking-tight">Volver a Mi Cuenta</span>
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Editar Perfil</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Actualiza tu información personal y configuración de seguridad.</p>
                    </div>
                </div>

                {/* Edit Form Card */}
                <Card className="border-2 border-gray-100 shadow-xl shadow-gray-100/20 rounded-[2rem] overflow-hidden bg-white">
                    <CardContent className="p-8 md:p-12 space-y-12">

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-md overflow-hidden bg-gray-50 flex items-center justify-center relative">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=f3f4f6&color=374151&size=128&bold=true`}
                                        alt="Profile"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <button className="absolute bottom-1 right-1 p-2.5 bg-[#00E676] rounded-full shadow-lg border-2 border-white text-white hover:scale-110 transition-transform">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-center">
                                <p className="font-black text-gray-900 text-sm">Foto de Perfil</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PNG, JPG hasta 5MB</p>
                            </div>
                        </div>

                        {/* Personal Info Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-4">
                                <div className="p-2 bg-green-50 rounded-xl">
                                    <User className="w-5 h-5 text-[#00E676]" />
                                </div>
                                <h3 className="font-black text-gray-900 text-lg tracking-tight">Información Personal</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="h-14 pl-12 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50 transition-all font-bold text-gray-900"
                                            placeholder="Juan Pérez"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <Input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="h-14 pl-12 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50 transition-all font-bold text-gray-900"
                                                placeholder="juan.perez@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Número de Teléfono</label>
                                            <AnimatePresence mode="wait">
                                                {phoneError && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="text-[10px] font-black text-red-500 uppercase tracking-tighter"
                                                    >
                                                        {phoneError}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                                                <Phone className={`w-4 h-4 transition-colors ${phoneError ? 'text-red-400' : 'text-gray-400'}`} />
                                                <span className="text-sm font-black text-gray-900 border-r-2 border-gray-100 pr-2">+57</span>
                                            </div>
                                            <Input
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                className={`h-14 pl-24 rounded-2xl border-2 transition-all font-bold text-gray-900 ${phoneError
                                                        ? 'border-red-100 bg-red-50/30 focus:bg-white focus:border-red-400 focus:ring-red-50'
                                                        : 'border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50'
                                                    }`}
                                                placeholder="300 123 4567"
                                            />
                                            {formData.phone.length === 10 && !phoneError && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#00E676] rounded-full p-1"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-4">
                                <div className="p-2 bg-green-50 rounded-xl">
                                    <Lock className="w-5 h-5 text-[#00E676]" />
                                </div>
                                <h3 className="font-black text-gray-900 text-lg tracking-tight">Cambiar Contraseña</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
                                    <Input
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        className="h-14 px-6 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50 transition-all font-bold text-gray-900 tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                        <Input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="h-14 px-6 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50 transition-all font-bold text-gray-900 tracking-widest"
                                            placeholder="Nueva contraseña"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                                        <Input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="h-14 px-6 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white focus:border-[#00E676] focus:ring-4 focus:ring-green-50 transition-all font-bold text-gray-900 tracking-widest"
                                            placeholder="Confirmar contraseña"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-8 border-t-2 border-gray-50">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/dashboard/${slug}/clientes/${customerId}`)}
                                className="w-full md:w-auto h-12 px-10 rounded-2xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="w-full md:w-auto h-12 px-10 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-white font-black text-xs uppercase tracking-widest border-none flex items-center gap-3 shadow-lg shadow-green-100"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
