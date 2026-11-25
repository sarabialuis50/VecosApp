import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Bot, Sparkles, SendHorizontal, Mic, Square, Play, Volume2 } from 'lucide-react';
import axios from 'axios';

const API = (import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';

export const ChatModal = ({ isOpen, onClose, businessName, slug, aiSaludo }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState(localStorage.getItem('chat_phone') || '');
    const [askingPhone, setAskingPhone] = useState(!localStorage.getItem('chat_phone'));
    const scrollRef = useRef(null);

    const [speakingMsgId, setSpeakingMsgId] = useState(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: aiSaludo || `¡Hola! 👋 Soy el asistente de ${businessName}. ¿En qué puedo ayudarte hoy?`,
                id: 'welcome'
            }]);
        }
    }, [isOpen, businessName, aiSaludo]);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const utteranceRef = useRef(null);

    const speak = (text, msgId = null) => {
        if (!text) return;

        // If clicking the same message that is already speaking, stop it
        if (speakingMsgId === msgId && msgId !== null) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
            return;
        }

        window.speechSynthesis.cancel();
        setSpeakingMsgId(msgId);

        // Sanitize text: remove emojis and cleanup whitespace for better voice synth
        const sanitizedText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');

        // Split by clauses and sentences to keep chunks short and natural
        const chunks = sanitizedText.split(/([.!?]+|\n)/).reduce((acc, part, i) => {
            if (i % 2 === 0) acc.push(part);
            else acc[acc.length - 1] += part;
            return acc;
        }, []).filter(c => c.trim().length > 0);

        let currentChunk = 0;

        const speakNextChunk = () => {
            if (currentChunk >= chunks.length || !isOpen) {
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
                // Small delay between chunks for more natural flow and browser stability
                setTimeout(speakNextChunk, 50);
            };

            utterance.onerror = (e) => {
                console.error("SpeechSynthesis error:", e);
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
            alert('No se pudo acceder al micrófono. Por favor verifica los permisos.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendAudio = async (blob) => {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('phone', phone);

        setMessages(prev => [...prev, { role: 'user', content: '🎤 Audio enviado', type: 'audio' }]);
        setLoading(true);

        try {
            const response = await axios.post(`${API}/chat/audio/${slug}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newMsg = { role: 'assistant', content: response.data.response, id: Date.now() };
            setMessages(prev => [...prev, newMsg]);
            // Auto play the AI response
            speak(newMsg.content, newMsg.id);
        } catch (error) {
            console.error('Error sending audio:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, no pude procesar el audio. ¿Podrías intentar de nuevo o escribir tu mensaje?' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await axios.post(`${API}/chat/web/${slug}`, {
                message: userMsg,
                phone: phone
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.response, id: Date.now() }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo?' }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        if (phone.length >= 7) {
            localStorage.setItem('chat_phone', phone);
            setAskingPhone(false);
        }
    };

    // Stop speaking on close
    useEffect(() => {
        if (!isOpen) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 md:p-6 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9, rotate: 2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9, rotate: 2 }}
                    className="w-full max-w-[400px] h-[600px] max-h-[85vh] bg-white/95 dark:bg-[#0F172A]/98 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col pointer-events-auto ring-1 ring-black/5"
                >
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-br from-[#22C55E] to-[#1db954] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Bot className="w-24 h-24 rotate-12" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="size-12 rounded-2xl bg-[#22C55E] flex items-center justify-center shadow-lg shadow-[#22C55E]/20 border-2 border-white">
                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Asistente IA</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-[#4ADE80] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">En línea ahora</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10 active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth" ref={scrollRef}>
                        {askingPhone ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-full text-center space-y-6"
                            >
                                <div className="size-20 rounded-[2rem] bg-[#f0f4f2] flex items-center justify-center text-[#22C55E]">
                                    <User className="w-10 h-10" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl text-[#111814]">¡Bienvenido!</h4>
                                    <p className="text-[#618972] text-sm mt-2 max-w-[240px]">Para darte una atención personalizada, indícanos tu número de WhatsApp.</p>
                                </div>
                                <form onSubmit={handlePhoneSubmit} className="w-full space-y-3">
                                    <input
                                        type="tel"
                                        placeholder="Tu WhatsApp (ej: 3001234567)"
                                        className="w-full h-14 px-6 rounded-2xl bg-[#f6f8f7] border-2 border-transparent focus:border-[#22C55E] focus:bg-white text-lg font-bold outline-none transition-all placeholder:text-gray-400"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="w-full h-14 bg-[#22C55E] text-white rounded-2xl font-black tracking-wide hover:bg-[#1db954] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/20"
                                    >
                                        EMPEZAR A CHATEAR
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        key={i}
                                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`relative w-fit max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm flex flex-col gap-2 group ${msg.role === 'user'
                                                ? 'bg-[#22C55E] text-white rounded-tr-none self-end'
                                                : 'bg-white border border-gray-100 text-[#111814] rounded-tl-none font-bold self-start'
                                                }`}
                                        >
                                            <div className="pr-4 whitespace-pre-wrap">
                                                {msg.content.split(/((?:https?:\/\/[^\s]+)|(?:\*\*.*?\*\*))/g).map((part, i) => {
                                                    if (part.startsWith('http')) {
                                                        return (
                                                            <a
                                                                key={i}
                                                                href={part}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 underline hover:text-blue-700 break-all transition-colors"
                                                            >
                                                                {part}
                                                            </a>
                                                        );
                                                    }
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={i} className="font-black text-[#111814]">{part.slice(2, -2)}</strong>;
                                                    }
                                                    return part;
                                                })}
                                            </div>
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => speak(msg.content, msg.id || i)}
                                                    className={`absolute -right-3 -bottom-3 size-10 rounded-full flex items-center justify-center shadow-lg transition-all z-20 border-4 border-white ${speakingMsgId === (msg.id || i)
                                                        ? 'bg-red-500 text-white animate-pulse scale-110'
                                                        : 'bg-[#22C55E] text-white hover:scale-110'
                                                        }`}
                                                >
                                                    {speakingMsgId === (msg.id || i) ? <Square className="size-4 fill-white" /> : <Play className="size-4 fill-white ml-0.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="bg-[#f0f4f2] p-4 rounded-3xl rounded-tl-none flex gap-1 items-center">
                                            <div className="size-1.5 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="size-1.5 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="size-1.5 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Input */}
                    {!askingPhone && (
                        <div className="p-6 pt-0">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center bg-white border border-[#22C55E]/30 rounded-2xl p-2 pl-6 focus-within:ring-2 ring-[#22C55E] ring-offset-2 transition-all shadow-sm"
                            >
                                <input
                                    type="text"
                                    placeholder="Escribe tu mensaje..."
                                    className="flex-1 bg-transparent py-3 outline-none font-bold text-sm text-[#111814] placeholder:text-gray-400"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="size-10 bg-[#22C55E] text-white rounded-xl flex items-center justify-center hover:bg-[#1db954] disabled:opacity-40 disabled:hover:bg-[#22C55E] transition-all active:scale-90 shadow-lg shadow-[#22C55E]/20"
                                >
                                    <SendHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`ml-2 size-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg border-2 ${isRecording
                                        ? 'bg-red-500 border-red-200 text-white animate-pulse'
                                        : 'bg-white border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E] hover:text-white hover:border-[#22C55E]'
                                        }`}
                                >
                                    {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
                                </button>
                            </form>
                            <p className="text-[9px] text-center text-[#618972] mt-4 font-black uppercase tracking-[0.2em] opacity-40">
                                Powered by Burger Full
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
