import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquareMore, Megaphone, Zap, BarChart, Plus, Copy, Smartphone, Users, Award, AlertCircle, Check, Sparkles, Send, Save, Trash2, LayoutGrid, Calendar, MessageSquare, CheckCircle, ExternalLink, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function WhatsappHubPage() {
    const { user, setUser } = useAuth();
    const [searchParams] = useSearchParams();


    const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'campaigns'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Campañas state
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [campaignMessage, setCampaignMessage] = useState('');

    // Purchase Modals state
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isCreatingLink, setIsCreatingLink] = useState(false);

    // AI Marketing Assistant state
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiType, setAiType] = useState('template'); // 'template' | 'campaign'

    // Lock overlay state
    const [dismissedLockOverlay, setDismissedLockOverlay] = useState(false);

    const getAISuggestion = async (type = 'template') => {
        setAiType(type);
        setIsAILoading(true);
        try {
            const reqData = {
                current_message: type === 'template' ? selectedTemplate?.message : campaignMessage,
                segment_id: type === 'template' ? (selectedTemplate?.trigger_type || selectedTemplate?.id) : selectedSegment?.id,
                segment_name: type === 'template' ? selectedTemplate?.name : selectedSegment?.name,
                segment_desc: type === 'template' ? selectedTemplate?.trigger : selectedSegment?.desc,
                tone: "amigable y persuasivo"
            };
            const response = await api().post('/marketing/ai-suggestion', reqData);
            setAiSuggestions(response.data);
            setIsAIModalOpen(true);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al conectar con el asistente de IA");
        } finally {
            setIsAILoading(false);
        }
    };

    const applyAISuggestion = (msg) => {
        if (aiType === 'template') {
            setSelectedTemplate({ ...selectedTemplate, message: msg });
        } else {
            setCampaignMessage(msg);
        }
        setIsAIModalOpen(false);
    };

    const AISuggestButton = ({ type }) => (
        <Button
            size="sm"
            variant="ghost"
            onClick={() => getAISuggestion(type)}
            disabled={isAILoading}
            className="h-8 gap-2 bg-[#4ADE80]/10 hover:bg-[#4ADE80] hover:text-white text-[#22C55E] rounded-full px-4 border border-[#4ADE80]/20 transition-all font-black text-[9px] uppercase tracking-widest"
        >
            {isAILoading ? (
                <div className="w-3 h-3 border-2 border-[#22C55E] border-t-white rounded-full animate-spin" />
            ) : (
                <Sparkles className="w-3 h-3" />
            )}
            {isAILoading ? 'IA Pensando...' : 'Asistente de IA'}
        </Button>
    );

    // Campaign Wizard state
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [campaignStatus, setCampaignStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
    const [sendingProgress, setSendingProgress] = useState(0);

    // Dynamic segments state
    const [segments, setSegments] = useState([
        {
            id: 'all',
            name: 'Todos los Clientes',
            count: 0,
            desc: 'Envía un mensaje general a toda tu base de datos de clientes registrados.',
            icon: <Users className="w-5 h-5" />,
            defaultMessage: '¡Hola [Nombre]! 👋 Tenemos nuevas sorpresas para ti en [Negocio]. ¡Ven a visitarnos y descubre lo que hemos preparado! ✨'
        },
        {
            id: 'oro',
            name: 'Clientes Oro',
            count: 0,
            desc: 'Dirígete exclusivamente a tus clientes más leales (Nivel Oro) para premiar su fidelidad.',
            icon: <Award className="w-5 h-5" />,
            defaultMessage: '¡Hola [Nombre]! 🌟 Como uno de nuestros Clientes Oro, tienes un beneficio exclusivo esperando por ti. ¡Gracias por tu lealtad! 🏆'
        },
        {
            id: 'plata',
            name: 'Clientes Plata',
            count: 0,
            desc: 'Clientes constantes (Nivel Plata) que están cerca de alcanzar el máximo nivel.',
            icon: <Sparkles className="w-5 h-5" />,
            defaultMessage: '¡Hola [Nombre]! ✨ Sigues sumando en [Negocio]. Tenemos algo especial para que sigas creciendo como Cliente Plata. 🥈'
        },
        {
            id: 'bronce',
            name: 'Clientes Bronce',
            count: 0,
            desc: 'Tus clientes (Nivel Bronce) que están iniciando su camino de fidelización.',
            icon: <LayoutGrid className="w-5 h-5" />,
            defaultMessage: '¡Hola [Nombre]! 🥉 Gracias por elegirnos como tu Cliente Bronce. Queremos verte más seguido, ¡disfruta esto! 🎁'
        },
        {
            id: 'new',
            name: 'Nuevos (Mes)',
            count: 0,
            desc: 'Saluda a los clientes que se unieron en los últimos 30 días para fidelizarlos desde el inicio.',
            icon: <Plus className="w-5 h-5" />,
            defaultMessage: '¡Bienvenido a la familia, [Nombre]! 🚀 Queremos que tu primer mes sea inolvidable. ¡Usa este código en tu próxima visita! 🎁'
        },
        {
            id: 'inactive',
            name: 'Inactivos',
            count: 0,
            desc: 'Recupera a los clientes que no han visitado tu negocio en más de 30 días con una oferta especial.',
            icon: <AlertCircle className="w-5 h-5" />,
            defaultMessage: '¡Te extrañamos, [Nombre]! 🔥 Hace tiempo que no nos vemos en [Negocio]. Te regalamos un beneficio especial para motivar tu regreso. ¡Te esperamos! 🥘'
        }
    ]);

    const tags = ['[Nombre]', '[Puntos]', '[Saldo]', '[Premio]', '[Codigo]', '[Nivel]'];

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await api().get('/marketing/audience-counts');
                const counts = response.data;

                setSegments(prev => prev.map(s => ({
                    ...s,
                    count: counts[s.id] || 0
                })));

                setTemplates(prev => prev.map(t => {
                    if (t.id === 'birthday') {
                        return { ...t, stats: { ...t.stats, alcance: counts.birthdays || 0 } };
                    }
                    return t;
                }));
            } catch (error) {
                console.error("Error fetching audience counts:", error);
            }
        };

        const initialTemplates = [
            {
                id: 'welcome',
                name: 'Bienvenida',
                trigger_type: 'BIENVENIDA',
                trigger: 'Se envía automáticamente cuando un cliente se registra por primera vez.',
                message: '¡Hola [Nombre]! 👋 Bienvenido a [Negocio]. Te regalamos tus primeros 50 puntos para que empieces a disfrutar. 🎁',
                status: true,
                stats: { alcance: 204, apertura: '97%', conversion: '12%', tip: 'El mensaje de bienvenida tiene la mayor tasa de interacción (97%).' }
            },
            {
                id: 'points',
                name: 'Acreditación',
                trigger_type: 'ACREDITACIÓN PUNTOS',
                trigger: 'Se envía cada vez que un cliente acumula nuevos puntos.',
                message: '¡Genial [Nombre]! Has acumulado puntos en tu visita. Tu nuevo saldo es de [Saldo] puntos. 🌟',
                status: true,
                stats: { alcance: 512, apertura: '84%', conversion: '18%', tip: 'Notificar puntos acumulados aumenta la recurrencia un 18%.' }
            },
            {
                id: 'birthday',
                name: 'Cumpleaños Hoy',
                trigger_type: 'DÍA CUMPLEAÑOS',
                trigger: 'Se envía automáticamente a los clientes que cumplen años el día de hoy.',
                message: '¡Feliz cumpleaños [Nombre]! 🎂 En [Negocio] queremos celebrar contigo. Pide hoy y recibe una sorpresa especial. 🎁✨',
                status: true,
                stats: { alcance: 5, apertura: '98%', conversion: '45%', tip: 'Los mensajes de cumpleaños generan la conexión emocional más fuerte con el cliente.' }
            },
            {
                id: 'redemption',
                name: 'Canje',
                trigger_type: 'CONFIRMACIÓN CANJE',
                trigger: 'Se envía inmediatamente después de que un cliente canjea un premio.',
                message: 'Hola [Nombre], confirmamos el canje de tu premio. ¡Esperamos que lo disfrutes! 🥤',
                status: false,
                stats: { alcance: 89, apertura: '95%', conversion: '100%', tip: 'La confirmación inmediata genera confianza y fidelidad extrema.' }
            }
        ];
        initialTemplates.forEach(t => {
            if (t.id === 'birthday') {
                t.stats.alcance = 0; // Will be updated by fetchCounts
            }
        });

        setTemplates(initialTemplates);
        setSelectedTemplate(initialTemplates[0]);
        fetchCounts();

        // Auto-open purchase modal if requested via URL
        if (searchParams.get('purchase') === 'true') {
            setIsSupportModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!selectedSegment && segments && segments.length > 0) {
            setSelectedSegment(segments[0]);
            setCampaignMessage(segments[0].defaultMessage);
        }
    }, [segments, selectedSegment]);

    const handleSaveTemplate = async () => {
        setIsSavingTemplate(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSavingTemplate(false);
        toast.success('Automatización guardada correctamente');
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
    };

    const handleSendCampaign = async () => {
        try {
            setCampaignStatus('sending');
            setSendingProgress(10);

            // Simulation of progress for UI feedback while backend starts
            const interval = setInterval(() => {
                setSendingProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            const response = await api().post('/marketing/send-campaign', {
                segment_id: selectedSegment.id,
                message: campaignMessage
            });

            clearInterval(interval);
            setSendingProgress(100);

            if (response.data.success) {
                setCampaignStatus('success');
                toast.success(response.data.message);

                // Update credits in context
                const updatedUser = { ...user };
                if (response.data.remaining_credits !== undefined) {
                    updatedUser.wa_credits = response.data.remaining_credits;
                }
                setUser(updatedUser);
            } else {
                setCampaignStatus('error');
                toast.error(response.data.message || 'Error al iniciar campaña');
            }
        } catch (error) {
            setCampaignStatus('error');
            const errorMsg = error.response?.data?.detail || 'Error al procesar la campaña';
            toast.error(errorMsg);
        }
    };

    const handleConfirmCampaign = () => {
        if (!campaignMessage.trim()) {
            toast.error("El mensaje de la campaña no puede estar vacío");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleSegmentChange = (segment) => {
        setSelectedSegment(segment);
        setCampaignMessage(segment.defaultMessage);
    };

    const { api } = useAuth();

    // Función para comprar Packs de Venta/Soporte (Uso mensual)
    const handlePurchaseSupportPack = async (amount) => {
        try {
            setIsCreatingLink(true);
            const response = await api().post('/payments/create-support-pack-link', { amount });
            if (response.data.init_point) {
                window.location.href = response.data.init_point;
            } else {
                toast.error("No se pudo generar el link de pago");
            }
        } catch (error) {
            console.error("Error creating support pack payment:", error);
            toast.error("Error al procesar la compra");
        } finally {
            setIsCreatingLink(false);
        }
    };

    // Función para comprar Packs de Campañas (Prepago) - Se usará en la pestaña de campañas
    const handlePurchaseCampaignPack = async (amount) => {
        try {
            setIsCreatingLink(true);
            const response = await api().post('/payments/create-wa-pack-link', { amount });
            if (response.data.init_point) {
                window.location.href = response.data.init_point;
            } else {
                toast.error("No se pudo generar el link de pago");
            }
        } catch (error) {
            console.error("Error creating campaign pack payment:", error);
            toast.error("Error al procesar la compra");
        } finally {
            setIsCreatingLink(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-10 px-2 md:px-6">
                {/* Superior Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div className="space-y-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">WhatsApp Hub</h1>
                        <p className="text-gray-500 font-medium text-sm">Gestiona tus automatizaciones y campañas masivas de fidelización.</p>
                    </div>
                </div>

                {/* Global Marketing Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[1.5rem] border-2 border-gray-100 shadow-sm bg-white overflow-hidden group hover:border-[#4ADE80] transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#22C55E] group-hover:bg-[#4ADE80] group-hover:text-white transition-colors">
                                    <Send className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mensajes Enviados</p>
                                    <h3 className="text-2xl font-black text-gray-900">1,248</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[1.5rem] border-2 border-gray-100 shadow-sm bg-white overflow-hidden group hover:border-[#22B8CF] transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#22B8CF] group-hover:bg-[#22B8CF] group-hover:text-white transition-colors">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa de Apertura</p>
                                    <h3 className="text-2xl font-black text-gray-900">96.4%</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[1.5rem] border-2 border-gray-100 shadow-sm bg-white overflow-hidden group hover:border-amber-400 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-400 group-hover:text-white transition-colors">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retorno de Pedidos</p>
                                    <h3 className="text-2xl font-black text-gray-900">12.8%</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
                    {/* Row 1 Left: Tabs & Selectores */}
                    <div className="lg:col-span-8 order-3 lg:order-1 flex flex-col space-y-6">
                        {/* Tabs Navigation - Pill Style - Left Aligned */}
                        <div className="flex justify-start mb-2">
                            <div className="bg-gray-100 p-1.5 rounded-full flex items-center gap-1 shadow-inner border border-gray-200">
                                <button
                                    onClick={() => setActiveTab('templates')}
                                    className={`px-6 py-2.5 text-[10px] font-black tracking-widest transition-all flex items-center gap-2 rounded-full ${activeTab === 'templates'
                                        ? 'bg-[#4ADE80] text-[#111814] shadow-lg shadow-green-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Zap className={`w-3 h-3 ${activeTab === 'templates' ? 'fill-current' : ''}`} />
                                    MENSAJES AUTOMÁTICOS
                                </button>
                                <button
                                    onClick={() => setActiveTab('campaigns')}
                                    className={`px-6 py-2.5 text-[10px] font-black tracking-widest transition-all flex items-center gap-2 rounded-full relative ${activeTab === 'campaigns'
                                        ? 'bg-[#4ADE80] text-[#111814] shadow-lg shadow-green-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <MessageSquareMore className={`w-3 h-3 ${activeTab === 'campaigns' ? 'fill-current' : ''}`} />
                                    CAMPAÑAS MASIVAS
                                </button>
                            </div>
                        </div>

                        <div className="relative flex flex-col flex-1 mt-2">
                            <div className="flex flex-col flex-1">
                                {activeTab === 'templates' ? (
                                    <>
                                        {/* Selector de Disparadores Atómicos */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[#22C55E]">
                                                <Zap className="w-3.5 h-3.5 fill-current" />
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#23a352]">Disparadores Atómicos</h3>
                                                <div className="ml-auto px-2 py-0.5 bg-green-50 rounded-full text-[9px] font-black border border-green-100 uppercase tracking-tighter">
                                                    {templates.filter(t => t.status).length} ACTIVOS
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 border-2 border-gray-200 p-2 rounded-[1.5rem] bg-gray-50/30">
                                                {templates.map((template) => (
                                                    <button
                                                        key={template.id}
                                                        onClick={() => setSelectedTemplate(template)}
                                                        className={`p-4 rounded-2xl border transition-all flex items-start gap-4 text-left ${selectedTemplate?.id === template.id
                                                            ? 'bg-white border-[#22C55E] border-2 shadow-lg shadow-green-100 ring-4 ring-green-50/50'
                                                            : 'bg-white border-gray-100 border-2 hover:border-gray-200 shadow-sm'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-xl shrink-0 ${selectedTemplate?.id === template.id ? 'bg-[#4ADE80] text-[#111814] shadow-md' : 'bg-gray-50 text-gray-300'}`}>
                                                            <Zap className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`font-black text-[10px] uppercase tracking-tight leading-none mb-2 ${selectedTemplate?.id === template.id ? 'text-[#22C55E]' : 'text-gray-500'}`}>{template.name}</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${template.status ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                    {template.status ? 'EN EXECUCIÓN' : 'PAUSADO'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Selector de Audiencia */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[#22C55E]">
                                                <Users className="w-3.5 h-3.5 fill-current" />
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#23a352]">Audiencia Objetivo</h3>
                                                <div className="ml-auto px-2 py-0.5 bg-green-50 rounded-full text-[9px] font-black border border-green-100 uppercase tracking-tighter text-[#22C55E]">
                                                    {selectedSegment?.count} CLIENTES SELECCIONADOS
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 border-2 border-gray-200 p-2 rounded-[1.5rem] bg-gray-50/30">
                                                {segments.map((segment) => (
                                                    <button
                                                        key={segment.id}
                                                        onClick={() => handleSegmentChange(segment)}
                                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${selectedSegment?.id === segment.id
                                                            ? 'bg-white border-[#22C55E] border-2 shadow-lg shadow-green-100 ring-4 ring-green-50/50'
                                                            : 'bg-white border-transparent border-2 hover:border-gray-200 shadow-sm'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-xl ${selectedSegment?.id === segment.id ? 'bg-[#4ADE80] text-[#111814] shadow-md' : 'bg-gray-50 text-gray-300'}`}>
                                                            {segment.icon}
                                                        </div>
                                                        <div>
                                                            <p className={`font-black text-[9px] uppercase tracking-tighter leading-none mb-1 ${selectedSegment?.id === segment.id ? 'text-[#22C55E]' : 'text-gray-500'}`}>{segment.name}</p>
                                                            <p className="text-[11px] font-black text-gray-900">{segment.count}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 1 Right: Impact Stats */}
                    <div className="lg:col-span-4 order-1 lg:order-2 lg:h-full">
                        {/* Impact Stats */}
                        <Card className="border-2 border-gray-200 shadow-xl bg-white overflow-hidden rounded-[2rem] w-full max-w-[280px] mx-auto border-t-[10px] border-t-[#22C55E] h-full flex flex-col">
                            <div className="p-5 border-b flex items-center justify-between shrink-0">
                                <h4 className="font-black text-gray-900 text-[10px] flex items-center gap-2 uppercase tracking-widest">
                                    <BarChart className="w-3.5 h-3.5 text-[#22C55E]" />
                                    Impacto Estimado
                                </h4>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex justify-between items-center gap-1">
                                        <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Alcance</span>
                                        <span className="font-black text-gray-900 text-sm">
                                            {activeTab === 'templates' ? (selectedTemplate?.stats?.alcance || 0) : (selectedSegment?.count || 0)} Clientes
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1">
                                        <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Apertura</span>
                                        <span className="font-black text-[#22C55E] text-lg">
                                            {activeTab === 'templates' ? (selectedTemplate?.stats?.apertura || '95%') : '96%'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-1">
                                        <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Conversión</span>
                                        <span className="font-black text-[#22C55E] text-lg">
                                            {activeTab === 'templates' ? (selectedTemplate?.stats?.conversion || '10%') : '8%'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 mt-4 border-t-2 border-gray-50 shrink-0">
                                    <p className="text-[10px] text-gray-400 font-bold italic leading-relaxed text-center uppercase tracking-tighter">
                                        {activeTab === 'templates'
                                            ? (selectedTemplate?.stats?.tip || 'Optimización automática activada.')
                                            : `Impactarás al ${selectedSegment ? ((selectedSegment.count / 204) * 100).toFixed(0) : 0}% de tu base.`}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Row 2 Left: Editor Header */}
                    <div className="lg:col-span-8 order-4 lg:order-3">
                        {activeTab === 'templates' ? (
                            selectedTemplate && (
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white border-2 border-[#22C55E] text-[#22C55E] flex items-center justify-center font-black shadow-sm">
                                            <MessageSquareMore className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-base uppercase tracking-tight">Personaliza el mensaje</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest flex items-center gap-2 border transition-colors ${selectedTemplate.status ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            <div className={`w-2 h-2 rounded-full ${selectedTemplate.status ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                            {selectedTemplate.status ? 'ACTIVADO' : 'DESACTIVADO'}
                                        </div>
                                        <Switch
                                            checked={selectedTemplate.status}
                                            onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, status: checked })}
                                            className="data-[state=checked]:bg-[#4ADE80]"
                                        />
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-9 h-9 rounded-full bg-white border-2 border-[#22C55E] text-[#22C55E] flex items-center justify-center font-black shadow-sm">
                                    <Send className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-gray-900 text-base uppercase tracking-tight">Personaliza el mensaje de campaña</h3>
                            </div>
                        )}
                    </div>

                    {/* Row 3 Left: Editor Card */}
                    <div className="lg:col-span-8 order-5 lg:order-5">
                        {activeTab === 'templates' ? (
                            selectedTemplate && (
                                <Card className="border-2 border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden bg-white flex flex-col flex-1 h-full min-h-[580px] rounded-[1.5rem]">
                                    <div className="p-7 flex-1 flex flex-col space-y-6">
                                        <div className="bg-gray-50/80 rounded-2xl p-5 border-2 border-dashed border-gray-200 flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight leading-relaxed">{selectedTemplate.trigger}</p>
                                        </div>

                                        <div className="flex justify-end -my-4 relative z-10 px-4">
                                            <AISuggestButton type="template" />
                                        </div>

                                        <div className="flex-1 border-2 border-gray-50 rounded-2xl p-4 bg-gray-50/10">
                                            <textarea
                                                value={selectedTemplate.message}
                                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, message: e.target.value })}
                                                className="w-full h-full min-h-[180px] bg-transparent resize-none border-none focus:ring-0 text-gray-800 placeholder:text-gray-300 text-lg font-medium leading-relaxed scrollbar-hide"
                                                placeholder="Escribe el mensaje de la automatización..."
                                            />
                                        </div>

                                        <div className="pt-6 border-t-2 border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                                            <div className="space-y-3 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etiquetas Inteligentes</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {tags.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setSelectedTemplate({ ...selectedTemplate, message: selectedTemplate.message + ' ' + tag })}
                                                            className="whitespace-nowrap text-[10px] font-bold px-3 py-1.5 bg-white border-2 border-gray-100 hover:border-[#22C55E] hover:text-[#22C55E] hover:shadow-sm text-gray-600 rounded-xl transition-all"
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="md:pl-6 md:border-l-2 border-gray-100 flex flex-col items-center md:items-end gap-3 shrink-0">
                                                <Button
                                                    onClick={handleSaveTemplate}
                                                    disabled={isSavingTemplate}
                                                    className="h-11 px-6 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black flex items-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-50 text-[11px] tracking-widest"
                                                >
                                                    {isSavingTemplate ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                    GUARDAR CAMBIOS
                                                </Button>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center md:text-right">
                                                    {selectedTemplate.message.length} <span className="text-gray-200">/</span> 500 caract.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        ) : (
                            <Card className="border-2 border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden bg-white flex flex-col flex-1 h-full min-h-[580px] rounded-[1.5rem]">
                                <div className="p-7 flex-1 flex flex-col space-y-6">
                                    <div className="bg-gray-50/80 rounded-2xl p-5 border-2 border-dashed border-gray-200 flex flex-col justify-center">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                                                {selectedSegment?.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end -my-4 relative z-10 px-4">
                                        <AISuggestButton type="campaign" />
                                    </div>

                                    <div className="flex-1 border-2 border-gray-50 rounded-2xl p-4 bg-gray-50/10">
                                        <textarea
                                            value={campaignMessage}
                                            onChange={(e) => setCampaignMessage(e.target.value)}
                                            className="w-full h-full min-h-[180px] bg-transparent resize-none border-none focus:ring-0 text-gray-800 placeholder:text-gray-300 text-lg font-medium leading-relaxed scrollbar-hide"
                                            placeholder="Escribe el mensaje que recibirán todos los clientes seleccionados..."
                                        />
                                    </div>

                                    <div className="pt-6 border-t-2 border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                                        <div className="space-y-3 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etiquetas Inteligentes</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => setCampaignMessage(campaignMessage + ' ' + tag)}
                                                        className="whitespace-nowrap text-[10px] font-bold px-3 py-1.5 bg-white border-2 border-gray-100 hover:border-[#22C55E] hover:text-[#22C55E] hover:shadow-sm text-gray-600 rounded-xl transition-all"
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="md:pl-6 md:border-l-2 border-gray-100 flex flex-col items-center md:items-end gap-3 shrink-0">
                                            <Button
                                                onClick={handleConfirmCampaign}
                                                disabled={campaignStatus === 'sending' || !campaignMessage.trim()}
                                                className="h-11 px-6 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black flex items-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-50 text-[11px] tracking-widest"
                                            >
                                                {campaignStatus === 'sending' ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                ENVIAR CAMPAÑA
                                            </Button>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center md:text-right">
                                                {campaignMessage.length} <span className="text-gray-200">/</span> 500 caract.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Row 3 Right: Phone Mockup */}
                    <div className="lg:col-span-4 order-2 lg:order-6">
                        <div className="bg-white rounded-[1.5rem] border-[5px] border-gray-900 shadow-2xl w-full max-w-[280px] h-full overflow-hidden relative mx-auto transition-all min-h-[580px]">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-gray-900 rounded-b-lg z-20"></div>
                            <div className="w-full h-full bg-[#E5DDD5] flex flex-col relative">
                                <div className="bg-[#075E54] p-4 pt-10 text-white flex items-center gap-3 shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shadow-inner">
                                        {user?.business_name?.[0] || 'M'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight leading-none">{user?.business_name || 'Mi Negocio'}</p>
                                        <p className="text-[10px] opacity-70 font-bold uppercase mt-0.5">En línea</p>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
                                    <div className="max-w-[90%] bg-white rounded-2xl rounded-tl-sm p-4 shadow-md relative border-b-2 border-gray-100">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-[9px] font-black text-[#22C55E] uppercase tracking-widest">OFICIAL</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                                        </div>
                                        <p className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                                            {activeTab === 'templates'
                                                ? (selectedTemplate?.message || 'Escribe tu mensaje...')
                                                : (campaignMessage || 'Escribiendo campaña...')
                                            }
                                        </p>
                                        <div className="flex items-center justify-end gap-1 mt-2">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase">Ahora</p>
                                            <Check className="w-2.5 h-2.5 text-[#22C55E]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-100 p-3 px-4 flex items-center gap-3 shrink-0">
                                    <div className="flex-1 h-9 bg-white rounded-full border-2 border-gray-200"></div>
                                    <div className="w-10 h-10 rounded-full bg-[#075E54] flex items-center justify-center text-white shadow-lg"><Smartphone className="w-5 h-5" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación de Campaña */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-[#111814] p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Megaphone className="w-24 h-24" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Confirmar Envío</DialogTitle>
                            <DialogDescription className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">
                                Estás a un paso de iniciar tu campaña masiva.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        {campaignStatus === 'idle' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2">Segmento</p>
                                        <p className="font-black text-gray-900 uppercase text-xs">{selectedSegment?.name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2">Destinatarios</p>
                                        <p className="font-black text-[#22C55E] text-lg">{selectedSegment?.count} <span className="text-[10px] text-gray-400 italic">Clientes</span></p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-100 flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-tight mb-1">Costo de la Campaña</p>
                                        <p className="text-sm text-amber-900 font-bold leading-relaxed">
                                            Se descontarán <span className="font-black">{selectedSegment?.count} créditos</span> de tu saldo de Campañas Masivas.
                                        </p>
                                        <p className="text-[10px] text-amber-500 mt-2 font-bold italic uppercase tracking-widest">
                                            Saldo disponible: {user?.wa_credits || 0}/{user?.wa_campaign_limit || 0} mensajes
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button
                                        onClick={handleSendCampaign}
                                        className="w-full h-14 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Zap className="w-4 h-4 fill-current" />
                                        INICIAR ENVÍO AHORA
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsConfirmModalOpen(false)}
                                        className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50"
                                    >
                                        CANCELAR Y REVISAR
                                    </Button>
                                </div>
                            </>
                        ) : campaignStatus === 'sending' ? (
                            <div className="py-10 flex flex-col items-center text-center space-y-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-[#4ADE80] rounded-full"
                                        style={{ clipPath: `inset(0 0 0 ${100 - sendingProgress}%)`, transform: 'rotate(-90deg)' }}
                                    />
                                    <Zap className="w-8 h-8 text-[#4ADE80] animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Procesando Envío</h4>
                                    <p className="text-sm text-gray-500 font-medium">Iniciando conexión con la red de WhatsApp...</p>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#4ADE80]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${sendingProgress}%` }}
                                    />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sendingProgress}% COMPLETADO</p>
                            </div>
                        ) : campaignStatus === 'success' ? (
                            <div className="py-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                    <Check className="w-10 h-10 text-[#22C55E]" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">¡Campaña Iniciada!</h4>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                                        Tus mensajes están siendo procesados en segundo plano. Los clientes empezarán a recibirlos en instantes.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        setIsConfirmModalOpen(false);
                                        setCampaignStatus('idle');
                                    }}
                                    className="w-full h-12 bg-gray-900 hover:bg-black text-white font-black rounded-xl uppercase tracking-widest text-[10px]"
                                >
                                    VOLVER AL HUB
                                </Button>
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Error en el Envío</h4>
                                    <p className="text-sm text-gray-500 font-medium px-4">
                                        No pudimos procesar la campaña en este momento. Por favor verifica tus créditos e intenta de nuevo.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setCampaignStatus('idle')}
                                    className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px]"
                                >
                                    REINTENTAR
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Packs VENTAS/SOPORTE */}
            <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
                <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col" aria-describedby="support-modal-description">
                <div className="bg-[#4ADE80] p-6 text-[#111814] relative shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MessageSquare className="w-16 h-16" />
                    </div>
                    <button
                        onClick={() => setIsSupportModalOpen(false)}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white border-2 border-[#22C55E] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                        <X className="w-4 h-4 text-black" />
                    </button>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Packs de Soporte</DialogTitle>
                        <DialogDescription id="support-modal-description" className="text-white/80 font-bold text-[10px] uppercase tracking-widest mt-1">
                            Recarga interacciones para tu servicio
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-3 bg-[#FAFAF9] overflow-y-auto">
                    {[
                        { amount: 1500, price: "$45.000", desc: "Plan Estándar - Ideal mensual" },
                        { amount: 4500, price: "$130.500", desc: "Plan Ultra - Frecuentes", popular: true },
                        { amount: 9000, price: "$252.000", desc: "Plan Extremo - Alto volumen" }
                    ].map((pack) => (
                        <button
                            key={pack.amount}
                            onClick={() => handlePurchaseSupportPack(pack.amount)}
                            disabled={isCreatingLink}
                            className={`w-full p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left group
                                        ${pack.popular ? 'bg-white border-[#22C55E] shadow-lg shadow-green-100' : 'bg-white border-gray-100 hover:border-gray-200'}
                                        ${isCreatingLink ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-gray-900 text-base">{pack.amount.toLocaleString('es-CO')}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">MSJS</span>
                                    {pack.popular && <Badge className="bg-[#4ADE80] text-[#111814] text-[6px] font-black px-1.5 border-none h-4">TOP</Badge>}
                                </div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none">{pack.desc}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-[#22C55E] text-lg leading-none">{pack.price}</p>
                                <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">COP</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="px-6 pb-6 bg-[#FAFAF9] shrink-0">
                    <p className="text-[8px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                        🔒 Pago seguro vía MercadoPago. <br />
                        Mensajes inmediatos en tu cuenta.
                    </p>
                </div>
            </DialogContent>
            </Dialog>

            {/* Modal de Packs CAMPAÑAS (Prepago) - Próximamente integrado en pestaña Campañas */}
            <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
                <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col" aria-describedby="campaign-pack-description">
                    <div className="bg-[#4ADE80] p-6 text-[#111814] relative shrink-0">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquareMore className="w-16 h-16" />
                        </div>
                        <button
                            onClick={() => setIsCampaignModalOpen(false)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white border-2 border-[#22C55E] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <X className="w-4 h-4 text-black" />
                        </button>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Packs de Campañas</DialogTitle>
                            <DialogDescription id="campaign-pack-description" className="text-white/80 font-bold text-[10px] uppercase tracking-widest mt-1">
                                Elige el pack que mejor se adapte a tu campaña.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-3 bg-[#FAFAF9] overflow-y-auto">
                        {[
                            { amount: 1000, price: "$150.000", desc: "Ideal para avisos puntuales" },
                            { amount: 5000, price: "$725.000", desc: "Perfecto para campañas mensuales", popular: true },
                            { amount: 10000, price: "$1.400.000", desc: "Para grandes lanzamientos" }
                        ].map((pack) => (
                            <button
                                key={pack.amount}
                                onClick={() => handlePurchaseCampaignPack(pack.amount)}
                                disabled={isCreatingLink}
                                className={`w-full p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left group
                                    ${pack.popular ? 'bg-white border-[#22C55E] shadow-lg shadow-green-100' : 'bg-white border-gray-100 hover:border-gray-200'}
                                    ${isCreatingLink ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-gray-900 text-base">{pack.amount.toLocaleString()}</span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">MENSAJES</span>
                                        {pack.popular && <Badge className="bg-[#4ADE80] text-[#111814] text-[6px] font-black px-1.5 border-none h-4">TOP</Badge>}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none">{pack.desc}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[#22C55E] text-lg leading-none">{pack.price}</p>
                                    <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">COP</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="px-6 pb-6 bg-[#FAFAF9] shrink-0">
                        <p className="text-[8px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                            🔒 Pago seguro vía MercadoPago. <br />
                            Los mensajes se añaden inmediatamente a tu cuenta.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Suggestion Dialog */}
            <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-[#111814] p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Sparkles className="w-24 h-24" />
                        </div>
                        <button
                            onClick={() => setIsAIModalOpen(false)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white border-2 border-[#22C55E] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <X className="w-4 h-4 text-black" />
                        </button>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                <span className="p-2 bg-[#4ADE80] rounded-xl text-[#111814]">
                                    <Sparkles className="w-5 h-5" />
                                </span>
                                Sugerencias de IA
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">
                                El Consultor IA ha analizado tu audiencia para redactar estos mensajes efectivos.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
                        {aiSuggestions?.opciones?.map((opcion, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-2xl border-2 border-gray-100 p-6 space-y-4 hover:border-[#4ADE80] transition-all group">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-[#4ADE80]/20 text-[#22C55E] font-black text-[10px] uppercase tracking-widest">{opcion.tipo}</Badge>
                                    <Button
                                        size="sm"
                                        className="rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-[9px] uppercase tracking-widest h-8"
                                        onClick={() => applyAISuggestion(opcion.mensaje)}
                                    >
                                        Usar este
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-800 font-medium leading-relaxed italic">{opcion.mensaje}</p>
                            </div>
                        ))}

                        {aiSuggestions?.recomendacion_marketing && (
                            <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-100 flex items-start gap-4">
                                <div className="p-2 bg-blue-500 rounded-lg text-white">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight mb-1">Tip de Marketing</p>
                                    <p className="text-xs text-blue-900 font-bold leading-relaxed">{aiSuggestions.recomendacion_marketing}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
