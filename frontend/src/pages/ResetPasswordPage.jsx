import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        if (!token) {
            toast.error('Token de recuperación no encontrado');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
                token,
                new_password: formData.new_password
            });
            setSuccess(true);
            toast.success('Contraseña actualizada con éxito');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-8 relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
                            <img src="/logos/logo-icon-white.png" alt="Menu.IA" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tighter">
                            <span className="text-[#22C55E]">Menu</span>
                            <span className="text-[#22B8CF]">.IA</span>
                        </span>
                    </Link>
                    <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                        Restablecer contraseña
                    </h1>
                    <p className="text-gray-600">
                        Crea una nueva contraseña segura para tu cuenta.
                    </p>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Nueva contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    id="new_password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.new_password}
                                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                    className="pl-10 pr-10 h-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    id="confirm_password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.confirm_password}
                                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                    className="pl-10 pr-10 h-12"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar contraseña'}
                        </Button>
                    </form>
                ) : (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Todo listo!</h3>
                        <p className="text-gray-600 mb-6">
                            Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.
                        </p>
                        <Link to="/login">
                            <Button className="w-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl">
                                Iniciar sesión
                            </Button>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
