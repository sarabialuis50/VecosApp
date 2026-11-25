import React, { useState, useEffect } from 'react';
const motion = { div: ({ initial, animate, exit, transition, ...props }) => <div {...props} /> };
const AnimatePresence = ({ children }) => <>{children}</>;
import { Cookie, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verificar si el usuario ya aceptó las cookies
        const consent = localStorage.getItem('menuia_cookie_consent');
        if (!consent) {
            // Mostrar después de un pequeño delay para mejor UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('menuia_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('menuia_cookie_consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6"
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                            {/* Decorative background gradients */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#22C55E]/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#22B8CF]/5 blur-3xl translate-x-1/2 translate-y-1/2" />

                            <div className="flex flex-col md:flex-row items-center gap-5 relative z-10 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                                    <Cookie className="w-6 h-6 text-[#22C55E]" />
                                </div>

                                <div className="text-center md:text-left">
                                    <h3 className="text-base font-black text-[#0F172A] mb-0.5">
                                        ¿Nos invitas a una cookie? 🍪
                                    </h3>
                                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-2xl">
                                        Utilizamos cookies para mejorar tu experiencia y analizar el tráfico. Al hacer clic en "Aceptar", consientes su uso. Lee más en nuestra{" "}
                                        <Link to="/legal/autorizacion-datos" className="text-[#22B8CF] hover:underline font-bold transition-all">
                                            Política de Cookies
                                        </Link>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                                <Button
                                    variant="ghost"
                                    onClick={handleDecline}
                                    className="flex-1 md:flex-none text-slate-700 font-bold hover:bg-emerald-50 rounded-xl border-2 border-[#22C55E]/30 hover:border-[#22C55E] transition-all"
                                >
                                    Rechazar
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    className="flex-1 md:flex-none bg-[#22C55E] text-white rounded-xl font-bold px-8 py-5 shadow-lg shadow-emerald-500/20 group/btn h-auto overflow-hidden relative"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Aceptar todo
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#22C55E] to-[#22B8CF] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                </Button>

                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="absolute top-0 right-0 p-2 text-white hover:text-slate-200 hidden md:block"
                                >
                                    <X className="w-5 h-5 drop-shadow-md" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
