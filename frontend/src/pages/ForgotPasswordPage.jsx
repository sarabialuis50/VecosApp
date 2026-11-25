import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
            setSubmitted(true);
            toast.success('Solicitud enviada con éxito');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-8 relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/login')}
                className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-gray-100 rounded-full"
            >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                        Recuperar contraseña
                    </h1>
                    <p className="text-gray-600">
                        Ingresa tu correo y te enviaremos un enlace para restablecer tu cuenta.
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-base font-bold rounded-xl"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar enlace'}
                        </Button>
                    </form>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-[#22C55E]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Correo enviado!</h3>
                        <p className="text-gray-600 mb-6">
                            Si el correo está registrado, recibirás un enlace de recuperación pronto.
                        </p>
                        <Link to="/login">
                            <Button variant="outline" className="w-full h-12 rounded-xl">
                                Volver al inicio de sesión
                            </Button>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
