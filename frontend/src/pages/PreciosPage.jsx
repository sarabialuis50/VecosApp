import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Check,
    X,
    Plus,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import LandingAgent from '@/components/LandingAgent';

export default function PreciosPage() {
    const navigate = useNavigate();
    const { user, api } = useAuth();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(null);

    const plans = [
        {
            id: 'impulso',
            name: "Básico",
            badge: "Inicial",
            description: "Ideal para iniciar tu transformación digital",
            price: 45000,
            priceAnnual: 45000 * 10,
            popular: false,
            features: [
                { name: "150 Pedidos / mes", included: true },
                { name: "1,500 Mensajes Venta/Soporte", included: true },
                { name: "Menú Digital Interactivo", included: true },
                { name: "Código QR Personalizado", included: true },
                { name: "Pedidos en Mesa y Domicilio", included: true },
                { name: "Seguimiento de pedidos", included: true },
                { name: "Agente IA WhatsApp (Básico)", included: true },
                { name: "Sistema Fidelización (Puntos)", included: true },
                { name: "50 Créditos Menu IA / tipo", included: true },
                { name: "Consultor IA (Básico)", included: true },
                { name: "Soporte", value: "Por Email" }
            ]
        },
        {
            id: 'pro',
            name: "Pro",
            badge: "Más Popular",
            description: "Potencia tu negocio con fidelización",
            price: 126000,
            priceAnnual: 126000 * 10,
            popular: true,
            features: [
                { name: "450 Pedidos / mes", included: true },
                { name: "4,500 Mensajes Venta/Soporte", included: true },
                { name: "Menú Digital Interactivo", included: true },
                { name: "Código QR Personalizado", included: true },
                { name: "Pedidos en Mesa y Domicilio", included: true },
                { name: "Seguimiento de pedidos", included: true },
                { name: "Agente IA WhatsApp (Avanzado)", included: true },
                { name: "Sistema Fidelización (Puntos)", included: true },
                { name: "120 Créditos Menu IA / tipo", included: true },
                { name: "Consultor IA (Avanzado)", included: true },
                { name: "Soporte", value: "Prioritario WhatsApp" }
            ]
        },
        {
            id: 'elite',
            name: "Premium",
            badge: "Elite",
            description: "Para negocios que van por todo",
            price: 234000,
            priceAnnual: 234000 * 10,
            popular: false,
            features: [
                { name: "Pedidos ILIMITADOS", included: true },
                { name: "9,000 Mensajes Venta/Soporte", included: true },
                { name: "Menú Digital Interactivo", included: true },
                { name: "Código QR Personalizado", included: true },
                { name: "Pedidos en Mesa y Domicilio", included: true },
                { name: "Seguimiento de pedidos", included: true },
                { name: "Agente IA WhatsApp (Personalizado)", included: true },
                { name: "Sistema Fidelización (Puntos)", included: true },
                { name: "300 Créditos Menu IA / tipo", included: true },
                { name: "Consultor IA (Experto)", included: true },
                { name: "Soporte", value: "Gerente de Cuenta VIP" }
            ]
        }
    ];

    const marketingPacks = [
        { id: 1000, name: "Pack Inicial", messages: "1.000", price: 150000, desc: "Para pymes que inician en marketing." },
        { id: 5000, name: "Pack Crecimiento", messages: "5.000", price: 725000, desc: "Ideal para campañas de impacto medio.", popular: true },
        { id: 10000, name: "Pack Masivo", messages: "10.000", price: 1400000, desc: "Lo mejor para grandes comunidades." }
    ];

    const supportPacks = [
        { id: 'sup_1500', messagesRaw: 1500, name: "Estándar", messages: "1.500", price: 45000, desc: "Extra ideal para cubrir tu demanda mensual." },
        { id: 'sup_4500', messagesRaw: 4500, name: "Ultra", messages: "4.500", price: 130500, desc: "Mayor soporte a clientes frecuentes.", popular: true },
        { id: 'sup_9000', messagesRaw: 9000, name: "Extremo", messages: "9.000", price: 252000, desc: "Operación de muy alto volumen." }
    ];

    const handleSelectPlan = async (planId) => {
        if (!user) {
            sessionStorage.setItem('pending_plan', JSON.stringify({
                planId,
                frequency: isAnnual ? 'annual' : 'monthly'
            }));
            toast.info("¡Excelente elección! Regístrate primero para activar tu plan.");
            navigate('/register');
            return;
        }

        try {
            setLoadingPlan(planId);
            const response = await api().post('/payments/create-payment-link', {
                plan_id: planId,
                frequency: isAnnual ? 'annual' : 'monthly'
            });

            if (response.data.init_point) {
                window.location.href = response.data.init_point;
            } else {
                toast.error("Error al generar el link de pago");
            }
        } catch (error) {
            toast.error("Error al conectar con el sistema de pagos");
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleSelectPack = async (amount) => {
        if (!user) {
            toast.info("Regístrate o inicia sesión para comprar packs de marketing.");
            navigate('/login');
            return;
        }

        try {
            setLoadingPlan(`pack-${amount}`);
            const response = await api().post('/payments/create-wa-pack-link', { amount });
            if (response.data.init_point) {
                window.location.href = response.data.init_point;
            } else {
                toast.error("Error al generar el link de pago");
            }
        } catch (error) {
            toast.error("Error al conectar con el sistema de pagos");
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleSelectSupportPack = async (amount) => {
        if (!user) {
            toast.info("Regístrate o inicia sesión para comprar packs de soporte.");
            navigate('/login');
            return;
        }

        try {
            setLoadingPlan(`sup-${amount}`);
            const response = await api().post('/payments/create-support-pack-link', { amount });
            if (response.data.init_point) {
                window.location.href = response.data.init_point;
            } else {
                toast.error("Error al generar el link de pago");
            }
        } catch (error) {
            toast.error("Error al conectar con el sistema de pagos");
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleActivateTrial = async () => {
        if (!user) {
            sessionStorage.setItem('pending_trial', 'true');
            toast.info("¡Regístrate primero para activar tu prueba gratuita!");
            navigate('/register');
            return;
        }

        const currentPlan = (user.plan || 'trial').toLowerCase();
        if (currentPlan !== 'trial' && currentPlan !== 'free') {
            toast.info(`Ya tienes un plan activo (${user.plan}). No necesitas prueba gratuita.`);
            return;
        }

        try {
            setLoadingPlan('trial');
            const response = await api().post('/auth/activate-trial');
            if (response.data.success) {
                toast.success(response.data.message);
                setTimeout(() => navigate(`/dashboard/${user.slug}`), 1500);
            }
        } catch (error) {
            const detail = error.response?.data?.detail || "Error al activar la prueba gratuita";
            toast.error(detail);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] font-sans">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="font-heading font-black text-xl tracking-tighter">
                                <span className="text-[#22C55E]">Menu</span>
                                <span className="text-[#22B8CF]">.IA</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            {!user && (
                                <>
                                    <Link to="/login" className="text-sm font-bold text-gray-600 hover:bg-[#4ADE80] hover:text-[#111814] px-4 py-2 rounded-xl transition-colors">Iniciar sesión</Link>
                                    <Button onClick={() => navigate('/register')} className="bg-[#4ADE80] hover:bg-green-600">Registrarse</Button>
                                </>
                            )}
                            {user && (
                                <Button onClick={() => navigate(`/dashboard/${user.slug}`)} variant="outline">Mi Dashboard</Button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight mb-6">
                        Planes para <span className="text-[#22C55E]">vender más</span>
                    </h1>
                    <div className="flex items-center justify-center gap-4 mb-10">
                        <span className={`text-sm font-bold ${!isAnnual ? 'text-[#0F172A]' : 'text-gray-400'}`}>Mensual</span>
                        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-[#4ADE80]" />
                        <span className={`text-sm font-bold ${isAnnual ? 'text-[#0F172A]' : 'text-gray-400'}`}>Anual (-20%)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                        {plans.map((plan) => (
                            <motion.div
                                key={plan.id}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className={`relative p-8 bg-white rounded-3xl border-2 transition-all duration-300 hover:border-[#22C55E] hover:shadow-2xl hover:shadow-green-100 ${plan.popular ? 'border-[#22C55E] shadow-xl shadow-green-100' : 'border-gray-100'} flex flex-col cursor-default`}
                            >
                                {plan.badge && (
                                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${plan.id === 'impulso' ? 'bg-white border-2 border-[#22C55E] text-[#22C55E]' :
                                        plan.id === 'elite' ? 'bg-[#22B8CF] text-white' :
                                            'bg-[#4ADE80] text-[#111814]'
                                        }`}>
                                        {plan.badge}
                                    </div>
                                )}
                                <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                                <div className="text-4xl font-black mb-6">
                                    ${(isAnnual ? Math.round(plan.priceAnnual / 12) : plan.price).toLocaleString()}
                                    <span className="text-sm text-gray-400">/mes</span>
                                </div>
                                <div className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((f, i) => (
                                        <div key={i} className="flex gap-2 text-sm">
                                            {f.included !== false ? <Check className="w-4 h-4 text-[#22C55E]" /> : <X className="w-4 h-4 text-gray-300" />}
                                            <span className={f.included !== false ? 'text-gray-700' : 'text-gray-400 line-through'}>
                                                {f.name}{f.value ? `: ${f.value}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loadingPlan !== null}
                                    className={`h-12 rounded-xl font-bold transition-all ${plan.popular
                                        ? 'bg-[#4ADE80] text-[#111814] hover:bg-green-600'
                                        : 'bg-white border-2 border-[#4ADE80] text-[#22C55E] hover:bg-[#4ADE80] hover:text-[#111814]'}`}
                                >
                                    {loadingPlan === plan.id ? <Loader2 className="animate-spin" /> : `Activar ${plan.name}`}
                                </Button>
                                <Button
                                    onClick={handleActivateTrial}
                                    disabled={loadingPlan !== null}
                                    variant="outline"
                                    className="h-10 rounded-xl font-bold text-xs uppercase tracking-wider mt-3 border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-green-50 transition-all w-full"
                                >
                                    {loadingPlan === 'trial' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Prueba x 7 días'}
                                </Button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="max-w-7xl mx-auto border-t pt-24 text-center">
                        <Badge className="bg-[#4ADE80]/10 text-[#22C55E] border-none px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 transition-all hover:bg-[#4ADE80] hover:text-[#111814] cursor-default">
                            RECARGAS PREPAGO
                        </Badge>
                        <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] mb-4 uppercase tracking-tight">Packs de Campañas <span className="text-[#22C55E]">WhatsApp</span></h2>
                        <p className="text-gray-500 mb-16 max-w-2xl mx-auto font-medium">Los planes mensuales incluyen mensajes de gestión. Para llegar a miles de clientes, adquiere un pack de marketing.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {marketingPacks.map((pack) => (
                                <motion.div
                                    key={pack.id}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col hover:border-[#22C55E] hover:shadow-2xl hover:shadow-green-50 ${pack.popular ? 'border-[#22C55E] bg-white shadow-2xl scale-105 z-10' : 'border-gray-100 bg-white'}`}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#4ADE80] text-[#111814] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                                            Mejor Valor
                                        </div>
                                    )}
                                    {pack.id === 10000 && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#22B8CF] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                                            Mayor alcance
                                        </div>
                                    )}
                                    <h3 className="text-sm font-black text-black uppercase tracking-widest mb-4">{pack.name}</h3>
                                    <div className="text-4xl font-black mb-2">{pack.messages} <span className="text-sm">MSJS</span></div>
                                    <p className="text-sm text-gray-500 mb-8">{pack.desc}</p>
                                    <div className="bg-gray-50 p-4 rounded-2xl mb-8 border-2 border-transparent group-hover:border-[#22C55E] group-hover:bg-white transition-all duration-300 cursor-default">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-2xl font-black text-[#22C55E]">${pack.price.toLocaleString()}</span>
                                            <span className="text-[10px] font-black text-black">COP</span>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400">PAGO ÚNICO</div>
                                    </div>
                                    <Button
                                        onClick={() => handleSelectPack(pack.id)}
                                        disabled={loadingPlan !== null}
                                        className={`h-12 rounded-xl font-black transition-all ${pack.popular
                                            ? 'bg-[#4ADE80] text-[#111814] hover:bg-green-600'
                                            : 'bg-white border-2 border-[#4ADE80] text-[#22C55E] hover:bg-[#4ADE80] hover:text-[#111814]'
                                            }`}
                                    >
                                        {loadingPlan === `pack-${pack.id}` ? <Loader2 className="animate-spin" /> : "Comprar Pack"}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto border-t pt-24 mt-24 text-center">
                        <Badge className="bg-[#4ADE80]/10 text-[#22C55E] border-none px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 transition-all hover:bg-[#4ADE80] hover:text-[#111814] cursor-default">
                            ADD-ONS MENSUALES
                        </Badge>
                        <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] mb-4 uppercase tracking-tight">Packs de <span className="text-[#22C55E]">Venta/Soporte</span></h2>
                        <p className="text-gray-500 mb-16 max-w-2xl mx-auto font-medium">Incrementa tu límite de interacciones para no detener nunca las comunicaciones diarias con tus clientes reales.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {supportPacks.map((pack) => (
                                <motion.div
                                    key={pack.id}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col hover:border-[#22C55E] hover:shadow-2xl hover:shadow-green-50 ${pack.popular ? 'border-[#22C55E] bg-white shadow-2xl scale-105 z-10' : 'border-gray-100 bg-white'}`}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#4ADE80] text-[#111814] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                                            Recomendado
                                        </div>
                                    )}
                                    <h3 className="text-sm font-black text-black uppercase tracking-widest mb-4">{pack.name}</h3>
                                    <div className="text-4xl font-black mb-2">{pack.messages} <span className="text-sm">MSJS</span></div>
                                    <p className="text-sm text-gray-500 mb-8">{pack.desc}</p>
                                    <div className="bg-gray-50 p-4 rounded-2xl mb-8 border-2 border-transparent group-hover:border-[#22C55E] group-hover:bg-white transition-all duration-300 cursor-default">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-2xl font-black text-[#22C55E]">${pack.price.toLocaleString()}</span>
                                            <span className="text-[10px] font-black text-black">COP</span>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400">PAGO ÚNICO</div>
                                    </div>
                                    <Button
                                        onClick={() => handleSelectSupportPack(pack.messagesRaw)}
                                        disabled={loadingPlan !== null}
                                        className={`h-12 rounded-xl font-black transition-all ${pack.popular
                                            ? 'bg-[#4ADE80] text-[#111814] hover:bg-green-600'
                                            : 'bg-white border-2 border-[#4ADE80] text-[#22C55E] hover:bg-[#4ADE80] hover:text-[#111814]'
                                            }`}
                                    >
                                        {loadingPlan === `sup-${pack.messagesRaw}` ? <Loader2 className="animate-spin" /> : "Comprar Pack"}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-4xl mx-auto mt-40">
                        <div className="text-center mb-16">
                            <Badge className="bg-[#22B8CF]/10 text-[#22B8CF] border-none px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 transition-all hover:bg-[#22B8CF] hover:text-white cursor-default">
                                Centro de Ayuda
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] mb-4 uppercase tracking-tight">
                                Preguntas <span className="text-[#22B8CF]">Frecuentes</span>
                            </h2>
                            <p className="text-gray-500 font-medium tracking-tight">
                                Todo lo que necesitas saber sobre nuestros planes y el sistema de WhatsApp.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <FaqItem
                                question="¿Cuál es la diferencia entre mensajes de plan vs. packs de marketing?"
                                answer="Los mensajes incluidos en tu plan (desde 1.500 hasta 9.000) son para la operación diaria: notificaciones de pedidos, soporte al cliente y respuestas del agente IA. Los packs de marketing son créditos adicionales específicos para enviar campañas masivas a toda tu base de datos de clientes."
                            />
                            <FaqItem
                                question="¿Los créditos de WhatsApp expiran?"
                                answer="No. A diferencia de tu plan mensual que se renueva cada 30 días, los créditos de los packs de marketing que compres NO expiran. Permanecerán en tu cuenta hasta que decidas usarlos en una campaña."
                            />
                            <FaqItem
                                question="¿Por qué las campañas tienen un costo extra?"
                                answer="Al enviar campañas masivas de marketing, Meta (dueño de WhatsApp) cobra una tarifa significativamente más alta por cada conversación iniciada. Tu pago cubre estos costos de Meta + la infraestructura segura de Twilio + nuestra plataforma de envío masivo."
                            />
                            <FaqItem
                                question="¿Necesito un número de WhatsApp propio?"
                                answer="En el plan Básico y Pro usamos un número oficial compartido para tus notificaciones. En el plan Premium, tienes la opción de integrar tu propio número oficial a través de la API de WhatsApp Business."
                            />
                            <FaqItem
                                question="¿Puedo cambiar de plan en cualquier momento?"
                                answer="¡Claro! Puedes subir o bajar de nivel según el crecimiento de tu negocio. Si cambias a un plan superior, la diferencia se prorrateará para que solo pagues el tiempo restante."
                            />
                            <FaqItem
                                question="¿Qué métodos de pago aceptan?"
                                answer="Procesamos todos nuestros cobros a través de MercadoPago, permitiéndote pagar con PSE (Nequi, Daviplata), tarjetas de crédito nacionales e internacionales, y efectivo en puntos físicos."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <footer className="py-12 px-4 bg-[#0F172A] text-slate-400 text-center">
                <p className="text-sm">© 2026 Menu.IA. Impulsando el crecimiento de restaurantes en Colombia.</p>
            </footer>
            <LandingAgent />
        </div>
    );
}

function FaqItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 font-bold">
                {question} {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            {isOpen && <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">{answer}</div>}
        </div>
    );
}
