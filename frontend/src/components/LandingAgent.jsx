import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Minimize2, Mic, Square, Play, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = (import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';

const QUICK_SUGGESTIONS = [
    '🍲 ¿Cuál es el recomendado de hoy?',
    '🥩 Platos de parrilla y precios',
    '🥗 Opciones saludables o ligeras',
    '🕐 Horarios y domicilios'
];

function getFogonExpertResponse(rawText) {
    const q = (rawText || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (q.includes('recomen') || q.includes('especial') || q.includes('mejor') || q.includes('sugier') || q.includes('antoj') || q.includes('hoy')) {
        return `¡Con gusto! Hoy en **Fogón & Mesa** los favoritos del chef son:\n\n🔥 **Churrasco a la Brasa (250g)** — **$22.000**\nCorte jugoso al carbón con chimichurri de la casa, arroz con cilantro, tajadas maduras y ensalada fresca.\n\n🍲 **Cazuela de Frijoles de la Casa** — **$24.000**\nFrijoles rojos cremosos con chicharrón carnudo, carne desmechada, maduritos, aguacate, arroz y arepa asada.\n\n🌿 **Pechuga al Romero y Limón** — **$18.500**\nMarinada 12 horas en finas hierbas con puré rústico al ajo y vegetales rostizados.\n\nTodos nuestros ejecutivos incluyen **sopa del día y bebida natural**. ¿Cuál te provoca más?`;
    }

    if (q.includes('parrilla') || q.includes('carne') || q.includes('churrasco') || q.includes('punta') || q.includes('costilla') || q.includes('cerdo') || q.includes('asado')) {
        return `En nuestra **Parrilla al Carbón** encendemos leña y brasa desde temprano:\n\n🥩 **Churrasco a la Brasa (250g)** — **$22.000** (Ejecutivo del día con sopa y bebida)\n🥩 **Punta de Anca al Carbón (300g)** — **$32.000** (Corte premium con papa criolla salteada y chimichurri)\n🍖 **Costillas BBQ de Guayaba** — **$28.000** (Glaseadas en reducción artesanal de guayaba con papas rústicas)\n🥩 **Lomo de Cerdo al Carbón** — **$26.000** (Con papas caseras y ensalada agridulce)\n\n¿Qué término prefieres para tu carne: **Medio**, **Tres Cuartos (3/4)** o **Bien Asado**?`;
    }

    if (q.includes('cazuela') || q.includes('sopa') || q.includes('frijol') || q.includes('ajiaco') || q.includes('sancocho') || q.includes('mondongo') || q.includes('olla')) {
        return `Nuestras **Cazuelas & Olla** se cocinan a fuego lento por más de 4 horas:\n\n🍲 **Cazuela de Frijoles de la Casa** — **$24.000** (Con chicharrón carnudo, desmechada, aguacate y maduritos)\n🌽 **Ajiaco Santafereño Tradicional** — **$23.000** (Tres papas, pollo desmechado, guascas, crema y alcaparras)\n🥣 **Sancocho Trifásico en Leña** — **$25.000** (Res, cerdo y pollo con yuca, plátano, mazorca y ají casero)\n🥘 **Mondongo Criollo Paisa** — **$22.000** (Con cerdo, papa criolla, arroz, banano y arepa)\n\nY como **sopa del día** en los ejecutivos hoy tenemos: *Crema de Ahuyama Rostizada*, *Consomé de Pollo* y *Sopa de Lentejas de la Abuela*.`;
    }

    if (q.includes('saludable') || q.includes('liger') || q.includes('fit') || q.includes('dieta') || q.includes('caloria') || q.includes('pollo') || q.includes('pescado') || q.includes('tilapia') || q.includes('bowl') || q.includes('vegetar')) {
        return `Si buscas una opción **balanceada, fresca y ligera**, te recomiendo:\n\n🥗 **Bowl Mediodía Saludable** — **$19.000** *(480 kcal)*\nBase de arroz integral y quinua, pechuga a la plancha (o tofu al ajillo), aguacate, maíz tierno, tomate cherry y vinagreta cítrica.\n\n🍋 **Pechuga al Romero y Limón** — **$18.500** *(540 kcal, 52g proteína)*\nMarinada en finas hierbas con puré rústico y vegetales rostizados.\n\n🐟 **Filete de Tilapia al Ajillo** — **$21.000** *(510 kcal)*\nPesca fresca con arroz con coco, patacones y ensalada de mango.`;
    }

    if (q.includes('bebida') || q.includes('jugo') || q.includes('limonada') || q.includes('postre') || q.includes('dulce') || q.includes('flan') || q.includes('torta')) {
        return `Para acompañar o cerrar con broche de oro:\n\n🥤 **Bebidas Naturales:**\n• **Limonada de Hierbabuena y Panela** — **$6.500**\n• **Jugo Natural de Maracuyá o Mango** — **$7.000** (en agua o leche)\n• **Limonada de Coco Cremosa Frozen** — **$9.500**\n\n🍮 **Postres Artesanales:**\n• **Flan de Caramelo & Café Colombiano** — **$8.500**\n• **Torta Tibia de Almojábana con Bocadillo** — **$9.000**`;
    }

    if (q.includes('armar') || q.includes('ejecutivo') || q.includes('almuerzo del dia') || q.includes('precio') || q.includes('carta') || q.includes('menu')) {
        return `En **Fogón & Mesa** puedes pedir de dos formas:\n\n1️⃣ **Arma tu Almuerzo del Día ($18.900):**\nEliges tu **Sopa** (Crema de Ahuyama, Consomé o Lentejas) + **Proteína** (Carne al Carbón, Pechuga al Romero, Sobrebarriga en Salsa o Pescado) + **2 Acompañamientos** + **Bebida Natural**.\n\n2️⃣ **Platos a la Carta ($18.500 a $32.000):**\nEjecutivos especiales, Cazuelas de Frijoles, Ajiaco, Sancocho, Punta de Anca, Costillas BBQ de Guayaba y Bowls.\n\n¡Puedes agregarlos directamente al carrito desde la pantalla!`;
    }

    if (q.includes('horario') || q.includes('hora') || q.includes('abierto') || q.includes('ubicacion') || q.includes('direccion') || q.includes('donde') || q.includes('domicilio') || q.includes('envio') || q.includes('pago')) {
        return `Aquí tienes toda nuestra información de atención:\n\n🕐 **Horarios:**\n• Lunes a Viernes: **11:30 AM – 3:30 PM**\n• Sábados, Domingos y Festivos: **12:00 PM – 4:30 PM**\n\n📍 **Ubicación:**\nCalle 72 # 10-34, Zona Gastronómica (Bogotá).\n\n🛵 **Domicilios y Pagos:**\nEntregamos en menos de **30 minutos** o puedes pedir para recoger / comer en mesa. Aceptamos **Efectivo, Nequi, Daviplata, Transferencia y Tarjetas**.`;
    }

    if (q.includes('hola') || q.includes('buenos') || q.includes('buenas')) {
        return `¡Hola! Qué alegría saludarte y bienvenido a **Fogón & Mesa** 🔥.\n\nHoy tenemos el fogón encendido con **Churrasco a la Brasa ($22.000)**, **Cazuela de Frijoles ($24.000)**, **Sobrebarriga Criolla ($19.500)** y la opción de **Armar tu Almuerzo completo por $18.900**.\n\n¿Te gustaría que te recomiende un plato según lo que te provoque hoy?`;
    }

    return `En **Fogón & Mesa** preparamos cada día almuerzos caseros al carbón y cazuelas de cocción lenta.\n\n• **Ejecutivos del Día:** desde **$18.500** (incluyen sopa, proteína, acompañamientos y bebida).\n• **Arma tu Almuerzo:** completo a tu gusto por **$18.900**.\n• **Especialidades:** Cazuela de Frijoles (**$24.000**), Ajiaco Santafereño (**$23.000**), Punta de Anca (**$32.000**) y Costillas BBQ de Guayaba (**$28.000**).\n\n¿Quieres conocer los ingredientes de algún plato en especial o deseas una recomendación?`;
}

export default function LandingAgent({ hidden = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [wheelOpen, setWheelOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleWheelToggle = (e) => {
            const isWheelVisible = Boolean(e?.detail?.open);
            setWheelOpen(isWheelVisible);
            if (isWheelVisible) setIsOpen(false);
        };
        window.addEventListener('wheel-modal-toggle', handleWheelToggle);
        return () => window.removeEventListener('wheel-modal-toggle', handleWheelToggle);
    }, []);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([
        {
            role: 'model',
            content: '¡Hola! 👋 Soy el asistente experto de **Fogón & Mesa**. Conozco toda nuestra carta de almuerzos, ingredientes, cazuelas, cortes al carbón y tiempos de entrega. ¿Qué se te antoja almorzar hoy?',
            id: 'welcome'
        }
    ]);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const audioChunksRef = useRef([]);
    const voicesRef = useRef([]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isLoading, isOpen]);

    // Preload speech synthesis voices (required on iOS Safari & Android Chrome)
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        const loadVoices = () => {
            try {
                const list = window.speechSynthesis.getVoices();
                if (list && list.length > 0) voicesRef.current = list;
            } catch {}
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const utteranceRef = useRef(null);

    const pickSpanishVoice = () => {
        const voices = voicesRef.current.length
            ? voicesRef.current
            : (window.speechSynthesis?.getVoices?.() || []);
        if (!voices.length) return null;
        const preferredLangs = ['es-co', 'es-mx', 'es-us', 'es-419', 'es-es'];
        for (const code of preferredLangs) {
            const match = voices.find((v) => v.lang?.toLowerCase() === code);
            if (match) return match;
        }
        return voices.find((v) => v.lang?.toLowerCase().startsWith('es')) || null;
    };

    const speak = (text, msgId = null) => {
        if (!text || typeof window === 'undefined') return;
        if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
            toast.error('Tu navegador no soporta lectura en voz alta.');
            return;
        }

        const synth = window.speechSynthesis;

        // Toggle off if already speaking this message
        if (speakingMsgId === msgId && msgId !== null) {
            try { synth.cancel(); } catch {}
            setSpeakingMsgId(null);
            return;
        }

        const sanitizedText = text
            .replace(/\*\*/g, '')
            .replace(/[•]/g, ', ')
            .replace(/\n+/g, '. ')
            .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!sanitizedText) return;

        // Only cancel if something is actively speaking/pending (avoids iOS Safari silent bug)
        if (synth.speaking || synth.pending) {
            try { synth.cancel(); } catch {}
        }

        const utterance = new window.SpeechSynthesisUtterance(sanitizedText);
        const spanishVoice = pickSpanishVoice();
        if (spanishVoice) {
            utterance.voice = spanishVoice;
            utterance.lang = spanishVoice.lang;
        } else {
            utterance.lang = 'es-CO';
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utteranceRef.current = utterance;

        setSpeakingMsgId(msgId);

        utterance.onend = () => {
            if (utteranceRef.current === utterance) {
                setSpeakingMsgId(null);
            }
        };

        utterance.onerror = (ev) => {
            // 'interrupted' / 'canceled' are normal when user stops or switches message
            if (ev?.error && ev.error !== 'interrupted' && ev.error !== 'canceled') {
                console.warn('SpeechSynthesis error:', ev.error);
            }
            if (utteranceRef.current === utterance) {
                setSpeakingMsgId(null);
            }
        };

        try {
            // Speak directly inside user gesture (critical for iOS Safari & Chrome Mobile)
            synth.speak(utterance);
            if (synth.paused) {
                synth.resume();
            }
        } catch (err) {
            console.error('Error playing TTS:', err);
            setSpeakingMsgId(null);
            toast.error('No se pudo reproducir el audio en este dispositivo.');
        }
    };

    const getSupportedAudioMime = () => {
        if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
            return { mimeType: '', ext: 'webm' };
        }
        const candidates = [
            { mimeType: 'audio/mp4', ext: 'm4a' },
            { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
            { mimeType: 'audio/webm', ext: 'webm' },
            { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
        ];
        for (const c of candidates) {
            if (window.MediaRecorder.isTypeSupported?.(c.mimeType)) {
                return c;
            }
        }
        return { mimeType: '', ext: 'webm' };
    };

    const startRecording = async () => {
        if (typeof window === 'undefined') return;

        // 1. Primary mobile-friendly path: Native Web Speech Recognition (Android Chrome, iOS Safari, Desktop)
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            try {
                const recognition = new SpeechRecognitionAPI();
                recognition.lang = 'es-CO';
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                transcriptRef.current = '';
                recognitionRef.current = recognition;

                recognition.onstart = () => {
                    setIsRecording(true);
                };

                recognition.onresult = (event) => {
                    let combined = '';
                    for (let i = 0; i < event.results.length; i++) {
                        combined += event.results[i][0].transcript;
                    }
                    transcriptRef.current = combined.trim();
                    setMessage(transcriptRef.current);
                };

                recognition.onerror = (event) => {
                    setIsRecording(false);
                    recognitionRef.current = null;
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        toast.error('Permiso de micrófono denegado. Habilítalo en tu navegador.');
                    } else if (event.error === 'no-speech') {
                        toast.info('No se escuchó voz. Intenta hablar más cerca del micrófono.');
                    } else if (event.error !== 'aborted') {
                        console.warn('SpeechRecognition error:', event.error);
                        toast.error('No se pudo capturar el audio. Intenta de nuevo.');
                    }
                };

                recognition.onend = () => {
                    setIsRecording(false);
                    recognitionRef.current = null;
                    const spokenText = transcriptRef.current.trim();
                    transcriptRef.current = '';
                    if (spokenText) {
                        sendUserQuery(spokenText);
                    }
                };

                recognition.start();
                return;
            } catch (err) {
                console.warn('SpeechRecognition fallback to MediaRecorder:', err);
            }
        }

        // 2. Fallback path: MediaRecorder with mobile MIME-type negotiation (iOS mp4 / Android webm)
        if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
            toast.error('Tu navegador móvil requiere HTTPS o no soporta notas de voz.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const { mimeType, ext } = getSupportedAudioMime();
            const mediaRecorder = mimeType
                ? new window.MediaRecorder(stream, { mimeType })
                : new window.MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalType = mediaRecorder.mimeType || mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
                stream.getTracks().forEach((track) => track.stop());
                if (audioBlob.size > 0) {
                    await handleSendAudio(audioBlob, ext);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
                toast.error('Permiso de micrófono denegado. Actívalo en la configuración del navegador.');
            } else {
                toast.error('No se pudo acceder al micrófono en este dispositivo.');
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            setIsRecording(false);
            return;
        }
        if (mediaRecorderRef.current && isRecording) {
            try { mediaRecorderRef.current.stop(); } catch {}
            setIsRecording(false);
        }
    };

    const handleSendAudio = async (blob, ext = 'webm') => {
        setHistory(prev => [...prev, { role: 'user', content: '🎤 Mensaje de voz enviado' }]);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('audio', blob, `recording.${ext}`);

        try {
            const endpoint = API_URL.endsWith('/api') ? `${API_URL}/public/landing-audio` : `${API_URL}/api/public/landing-audio`;
            const response = await axios.post(endpoint, formData);
            const replyText = response.data?.reply && !response.data.reply.includes('mucha demanda')
                ? response.data.reply
                : getFogonExpertResponse('recomendado hoy');
            const newMsg = { role: 'model', content: replyText, id: Date.now() };
            setHistory(prev => [...prev, newMsg]);
        } catch (error) {
            const fallbackReply = getFogonExpertResponse('recomendado hoy');
            const newMsg = { role: 'model', content: fallbackReply, id: Date.now() };
            setHistory(prev => [...prev, newMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendUserQuery = async (userMessage) => {
        if (!userMessage.trim() || isLoading) return;

        const cleanMsg = userMessage.trim();
        setMessage('');
        setHistory(prev => [...prev, { role: 'user', content: cleanMsg }]);
        setIsLoading(true);

        try {
            const endpoint = API_URL.endsWith('/api') ? `${API_URL}/public/landing-chat` : `${API_URL}/api/public/landing-chat`;
            const response = await axios.post(endpoint, {
                message: cleanMsg,
                history: history
            });

            const apiReply = response.data?.reply || '';
            // If backend falls back to generic high-demand message (no live API key in local env), use local Fogón & Mesa expert knowledge
            const finalReply = (!apiReply || apiReply.includes('mucha demanda') || apiReply.includes('Menu.IA'))
                ? getFogonExpertResponse(cleanMsg)
                : apiReply;

            setHistory(prev => [...prev, { role: 'model', content: finalReply, id: Date.now() }]);
        } catch (error) {
            const fallbackReply = getFogonExpertResponse(cleanMsg);
            setHistory(prev => [...prev, { role: 'model', content: fallbackReply, id: Date.now() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        await sendUserQuery(message);
    };

    // Stop speaking on close
    useEffect(() => {
        if ((!isOpen || hidden || wheelOpen) && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
        }
    }, [isOpen, hidden, wheelOpen]);

    if (hidden || wheelOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[92vw] sm:w-[400px] max-h-[80vh] h-[580px] bg-[#FBF9F5] rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-[#E5DEC9] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#181615] via-[#231F1D] to-[#C86414] p-5 flex items-center justify-between text-white shrink-0 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-[#181615] p-1 overflow-hidden border-2 border-[#F59E0B] shadow-md flex items-center justify-center">
                                    <img src="/logos/logo agente.png?v=2" alt="Asistente Fogón & Mesa" className="w-full h-full object-contain object-center scale-110" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-tight text-[#FBF9F5] leading-none flex items-center gap-1.5">
                                        Asistente Fogón & Mesa
                                        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                                        <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">Experto en Carta · En línea</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBF9F5]"
                        >
                            {history.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative w-fit max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm flex flex-col gap-2 ${msg.role === 'user'
                                        ? 'bg-[#C86414] text-white rounded-tr-none self-end shadow-[#C86414]/20'
                                        : 'bg-white text-[#1F1C1A] rounded-tl-none border border-[#E5DEC9] self-start'
                                        }`}>
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return (
                                                        <strong key={idx} className={`font-black ${msg.role === 'user' ? 'text-white' : 'text-[#C86414]'}`}>
                                                            {part.slice(2, -2)}
                                                        </strong>
                                                    );
                                                }
                                                return part;
                                            })}
                                        </div>

                                        {/* Play Button for Assistant Messages */}
                                        {msg.role === 'model' && (
                                            <button
                                                type="button"
                                                onClick={() => speak(msg.content, msg.id || i)}
                                                title="Escuchar respuesta"
                                                className={`absolute -right-3 -bottom-3 size-9 rounded-full flex items-center justify-center shadow-lg transition-all z-20 border-2 border-white ${speakingMsgId === (msg.id || i)
                                                    ? 'bg-red-500 text-white animate-pulse scale-110'
                                                    : 'bg-[#C86414] text-white hover:bg-[#a9520e] hover:scale-110'
                                                    }`}
                                            >
                                                {speakingMsgId === (msg.id || i) ? <Square className="size-3.5 fill-white" /> : <Play className="size-3.5 fill-white ml-0.5" />}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Quick suggestion chips when only welcome message is shown */}
                            {history.length === 1 && !isLoading && (
                                <div className="pt-2 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A7F74] px-1">
                                        Preguntas frecuentes:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_SUGGESTIONS.map((sug, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => sendUserQuery(sug)}
                                                className="text-left text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#E5DEC9] text-[#1F1C1A] hover:border-[#C86414] hover:text-[#C86414] hover:bg-[#C86414]/5 transition-all shadow-xs"
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-[#E5DEC9] shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#C86414]" />
                                        <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-widest">Consultando al fogón...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3.5 bg-white border-t border-[#E5DEC9] shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <div className="relative flex-1 flex items-center">
                                    <Input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Pregunta por platos, precios o ingredientes..."
                                        className="h-11 rounded-xl pr-11 border-[#E5DEC9] bg-[#FBF9F5] text-[#1F1C1A] placeholder:text-[#8A7F74] focus:bg-white focus:ring-[#C86414]/20 text-xs font-medium"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!message.trim() || isLoading}
                                        className="absolute right-1.5 h-8 w-8 bg-[#C86414] hover:bg-[#a9520e] text-white rounded-lg transition-all"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    title={isRecording ? "Detener grabación" : "Enviar nota de voz"}
                                    className={`h-11 w-11 rounded-xl transition-all border-2 flex items-center justify-center shrink-0 ${isRecording
                                        ? 'bg-red-500 border-red-200 text-white animate-pulse'
                                        : 'bg-[#FBF9F5] border-[#C86414]/30 text-[#C86414] hover:bg-[#C86414] hover:text-white hover:border-[#C86414]'
                                        }`}
                                >
                                    {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Mic className="w-4 h-4" />}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Trigger with Floating Animation */}
            <motion.button
                animate={!isOpen ? { y: [0, -8, 0] } : { y: 0 }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-16 w-16 rounded-full shadow-[0_12px_35px_rgba(200,100,20,0.45)] flex items-center justify-center transition-all relative overflow-visible group border-2 ${isOpen
                    ? 'bg-[#181615] border-[#C86414] text-white'
                    : 'bg-[#181615] border-[#F59E0B] text-white'
                    }`}
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-[#F59E0B]" />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-[#C86414]/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                        <img
                            src="/logos/logo agente.png?v=2"
                            alt="Asistente Fogón & Mesa"
                            className="w-12 h-12 object-contain object-center scale-110 relative z-10"
                        />
                    </>
                )}

                {/* Notification Badge */}
                {!isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 z-20">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-[#C86414] text-[11px] items-center justify-center font-black text-white shadow-lg ring-2 ring-[#181615]">
                            1
                        </span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
