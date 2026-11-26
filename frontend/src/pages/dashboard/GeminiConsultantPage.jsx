import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, ArrowRight, Mic, Square, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function GeminiConsultantPage() {
    const { user, api } = useAuth();
    const { slug = 'vecos' } = useParams();
    const [businessId, setBusinessId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: `¡Hola ${user?.nombre || 'Chef'}! Soy tu Consultor IA potenciado por DeepSeek. Puedo analizar tus ventas, puntos, niveles, ruleta de premios y sugerir estrategias para optimizar tu menú. ¿En qué te puedo ayudar hoy?`,
                timestamp: new Date()
            }
        ]);
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            setBusinessId(user.id);
        }
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Insights States
    const [insights, setInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);

    const fetchInsights = async () => {
        if (!user?.id) return;
        setLoadingInsights(true);
        try {
            const response = await api().get(`/ai/insights/${user.id}`);
            setInsights(response.data);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoadingInsights(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchInsights();
        }
    }, [user?.id]);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const utteranceRef = useRef(null);

    const speak = (text, msgId = null) => {
        if (!text) return;

        if (speakingMsgId === msgId && msgId !== null) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
            return;
        }

        window.speechSynthesis.cancel();
        setSpeakingMsgId(msgId);

        // Sanitize text
        const sanitizedText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');

        const chunks = sanitizedText.split(/([.!?]+|\n)/).reduce((acc, part, i) => {
            if (i % 2 === 0) acc.push(part);
            else acc[acc.length - 1] += part;
            return acc;
        }, []).filter(c => c.trim().length > 0);

        let currentChunk = 0;

        const speakNextChunk = () => {
            if (currentChunk >= chunks.length) {
                setSpeakingMsgId(null);
                return;
            }

            const textToSpeak = chunks[currentChunk].trim();
            if (!textToSpeak) {
                currentChunk++;
                speakNextChunk();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;
            utteranceRef.current = utterance; // Prevent GC

            utterance.onend = () => {
                currentChunk++;
                setTimeout(speakNextChunk, 50);
            };

            utterance.onerror = (e) => {
                console.error("Speech error:", e);
                setSpeakingMsgId(null);
            };

            window.speechSynthesis.speak(utterance);
        };

        speakNextChunk();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleSendAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('No se pudo acceder al micrófono.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendAudio = async (blob) => {
        if (!businessId) return;
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: '🎤 Audio enviado',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const response = await api().post(`/ai/consultant/audio/${businessId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const botMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            speak(response.data.reply);
        } catch (error) {
            console.error('Audio capture error:', error);
            toast.error('Error procesando audio.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            if (!businessId) {
                toast.error('Identificando negocio...');
                throw new Error('No Business ID');
            }
            const response = await api().post(`/ai/consultant/chat/${businessId}`, {
                message: userMessage.content,
                history: messages.slice(-10)
            });

            const botMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Error al conectar con el consultor via IA.');
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'system',
                content: '⚠️ Lo siento, tuve un problema de conexión. Por favor intenta de nuevo.',
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col min-h-screen lg:h-[calc(100vh-8rem)] gap-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-gray-900">Consultor IA</h1>
                        <p className="text-gray-500 text-sm">Insights inteligentes, estrategia de ventas y fidelización con DeepSeek</p>
                    </div>
                </div>

                {/* Main Content Area: Divided in two */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">

                    {/* Left Side: Chat Area */}
                    <Card className="flex flex-col bg-white border-gray-200 shadow-xl overflow-hidden border-t-4 border-t-green-500 h-[600px] lg:h-full">
                        <ScrollArea className="flex-1 p-4 bg-[#FAFAF9]" ref={scrollRef}>
                            <div className="space-y-6">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <Avatar className="h-8 w-8 border border-green-200 shrink-0">
                                                <AvatarFallback className="bg-green-100 text-green-600">
                                                    <Bot className="w-5 h-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={`relative w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm flex flex-col gap-1 group ${msg.role === 'user'
                                                ? 'bg-[#4ADE80]/5 border-2 border-[#4ADE80] text-gray-900 rounded-br-none font-medium self-end'
                                                : msg.isError
                                                    ? 'bg-red-50 text-red-800 border border-red-100 self-start'
                                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 self-start'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <span className={`text-[10px] block mt-1 ${msg.role === 'user' ? 'text-[#22C55E]' : 'text-gray-400'
                                                }`}>
                                                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.role === 'assistant' && !msg.isError && (
                                                <button
                                                    onClick={() => speak(msg.content, msg.id)}
                                                    className={`absolute -right-3 -bottom-3 size-10 rounded-full flex items-center justify-center shadow-lg transition-all z-20 border-4 border-white ${speakingMsgId === msg.id
                                                        ? 'bg-red-500 text-white animate-pulse scale-110'
                                                        : 'bg-[#22C55E] text-white hover:scale-110'
                                                        }`}
                                                >
                                                    {speakingMsgId === msg.id ? <Square className="size-4 fill-white" /> : <Play className="size-4 fill-white ml-0.5" />}
                                                </button>
                                            )}
                                        </div>

                                        {msg.role === 'user' && (
                                            <Avatar className="h-8 w-8 border border-[#22C55E]/30">
                                                <AvatarImage src={user?.avatar_url} />
                                                <AvatarFallback className="bg-[#4ADE80]/10 text-[#22C55E]">
                                                    <User className="w-5 h-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex gap-3 justify-start">
                                        <Avatar className="h-8 w-8 border border-[#22C55E]/20">
                                            <AvatarFallback className="bg-[#4ADE80]/10 text-[#22C55E] animate-pulse">
                                                <Bot className="w-5 h-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu consulta aquí..."
                                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#22C55E] focus-visible:ring-offset-0"
                                    disabled={isTyping}
                                />
                                <Button
                                    id="chat-send-button"
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-[#111814] shadow-lg shadow-[#4ADE80]/10 transition-all font-bold"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    variant="outline"
                                    className={`size-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border-2 ${isRecording
                                        ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                                        : 'bg-white border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E] hover:text-white hover:border-[#22C55E]'}`}
                                >
                                    {isRecording ? <Square className="w-4 h-4 fill-red-500" /> : <Mic className="w-4 h-4" />}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* Right Side: Menu.IA Insights */}
                    <Card className="flex flex-col bg-white border-2 border-[#22C55E] shadow-2xl rounded-[2.5rem] overflow-hidden relative h-[600px] lg:h-full">
                        {/* Subtle Premium Glow Effect */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#4ADE80]/10 rounded-full blur-[100px] -mr-40 -mt-40 opacity-50" />

                        <div className="p-8 pb-4 flex items-center justify-between relative z-10 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#4ADE80] rounded-2xl shadow-lg shadow-[#4ADE80]/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-gray-900">
                                        <span className="text-[#22C55E]">Agente</span> Insights
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Estrategia en tiempo real</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 px-8 py-6 relative z-10 bg-white">
                            {loadingInsights ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#22C55E]/10 border-t-[#22C55E]" />
                                    <p className="text-gray-500 font-medium animate-pulse">Consultando oráculo de datos...</p>
                                </div>
                            ) : insights?.acciones_sugeridas ? (
                                <div className="space-y-10 pb-10">
                                    <p className="text-gray-600 text-sm leading-relaxed bg-[#4ADE80]/5 p-4 rounded-2xl border border-[#4ADE80]/10 italic">
                                        "Basado en el análisis de hoy, he detectado estas oportunidades clave para maximizar tu rentabilidad:"
                                    </p>

                                    <div className="space-y-10">
                                        {insights.acciones_sugeridas.map((tip, idx) => {
                                            const parts = tip.split(/\*\*SOLUCIÓN:\*\*/i);
                                            const problemPart = parts[0].replace(/\*\*PROBLEMA:\*\*/i, '').trim();
                                            const solutionPart = parts[1]?.trim();

                                            const handleDeepDive = () => {
                                                const query = `Hola, me interesa profundizar en esta oportunidad:
                                                
PROBLEMA DETECTADO: ${problemPart.replace(/\*\*/g, '')}
ESTRATEGIA SUGERIDA: ${solutionPart?.replace(/\*\*/g, '') || ''}

¿Podrías darme un paso a paso detallado de cómo implementar esto en mi restaurante y qué resultados esperar?`;

                                                setInput(query);
                                                setTimeout(() => {
                                                    const sendBtn = document.getElementById('chat-send-button');
                                                    sendBtn?.click();
                                                }, 100);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            };

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={handleDeepDive}
                                                    className="relative group cursor-pointer"
                                                >
                                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[#4ADE80]/20 rounded-full group-hover:bg-[#4ADE80] transition-all" />

                                                    <div className="space-y-4 pl-4 transition-all group-hover:translate-x-1">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#22C55E] opacity-60">Oportunidad {idx + 1}</span>
                                                                <span className="text-[9px] font-bold text-[#22C55E] bg-[#4ADE80]/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                    CLICK PARA PROFUNDIZAR <ArrowRight className="w-2 h-2" />
                                                                </span>
                                                            </div>
                                                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl group-hover:border-red-200 transition-colors">
                                                                <h4 className="text-[10px] font-black text-red-600 uppercase mb-1 flex items-center gap-2">
                                                                    <AlertCircle className="w-3 h-3" /> Problema Detectado
                                                                </h4>
                                                                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                                                                    {problemPart.replace(/\*\*/g, '')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {solutionPart && (
                                                            <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/10 p-5 rounded-2xl shadow-sm group-hover:border-[#4ADE80]/30 group-hover:shadow-md transition-all">
                                                                <h4 className="text-[10px] font-black text-[#22C55E] uppercase mb-2 flex items-center gap-2">
                                                                    <Sparkles className="w-3 h-3" /> Estrategia Sugerida
                                                                </h4>
                                                                <p className="text-[15px] font-bold text-gray-900 leading-relaxed">
                                                                    {solutionPart.replace(/\*\*/g, '')}
                                                                </p>
                                                                <div className="mt-4 pt-4 border-t border-[#22C55E]/10 flex justify-end">
                                                                    <div className="text-[10px] font-black text-[#22C55E] flex items-center gap-2">
                                                                        CONSULTAR DETALLES IA <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-70">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#22C55E]/20" />
                                    <p className="font-bold text-gray-400">Sin datos estratégicos disponibles por ahora.</p>
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-8 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 relative z-10">
                            <Button
                                onClick={fetchInsights}
                                disabled={loadingInsights}
                                className="w-full h-15 bg-[#4ADE80] text-[#111814] hover:bg-[#4ADE80]/90 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-lg shadow-[#4ADE80]/20 transition-all active:scale-95 group border-none"
                            >
                                {loadingInsights ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        RE-ANALIZAR NEGOCIO
                                        <Sparkles className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
