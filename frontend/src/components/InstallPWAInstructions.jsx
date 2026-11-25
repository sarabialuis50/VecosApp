import React, { useState, useEffect } from 'react';
import { X, Share, MoreVertical, PlusSquare } from 'lucide-react';

export const InstallPWAInstructions = ({ businessName, businessLogo }) => {
    const [show, setShow] = useState(false);
    const [os, setOs] = useState(null);

    useEffect(() => {
        // Check if user has already dismissed the prompt
        const hasDismissed = localStorage.getItem(`hideInstallPWA_${businessName}`);
        if (hasDismissed) return;

        // Check if the app is already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) return;

        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) setOs('ios');
        else if (isAndroid) setOs('android');

        // Show only on mobile
        if (isIOS || isAndroid) {
            // Delay showing the prompt slightly to not interrupt immediate actions
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [businessName]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem(`hideInstallPWA_${businessName}`, 'true');
    };

    if (!show || !os) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:hidden transition-opacity">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl animate-slide-up relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mt-2">
                    <div className="size-16 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 mb-4 p-1">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <img
                                src={businessLogo || `https://ui-avatars.com/api/?name=${businessName || 'Menu.IA'}&background=22C55E&color=fff&bold=true`}
                                alt={businessName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        ¡Agrega {businessName} a tu inicio!
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed px-2">
                        Llévate nuestro menú digital en tu celular para pedir más rápido y fácil la próxima vez.
                    </p>

                    <div className="bg-slate-50 rounded-2xl w-full p-5 border border-slate-100/50">
                        {os === 'ios' && (
                            <div className="flex flex-col gap-4 text-left">
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</span>
                                    <p className="text-sm text-slate-700 leading-snug">
                                        Toca el ícono de <strong className="font-semibold text-slate-900">Compartir</strong> <Share className="inline-block w-4 h-4 ml-1 mb-1 text-slate-600" /> en la barra inferior de tu navegador.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</span>
                                    <p className="text-sm text-slate-700 leading-snug">
                                        Busca y selecciona <strong className="font-semibold text-slate-900">"Agregar a inicio"</strong> <PlusSquare className="inline-block w-4 h-4 ml-1 mb-1 text-slate-600" /> en el menú.
                                    </p>
                                </div>
                            </div>
                        )}

                        {os === 'android' && (
                            <div className="flex flex-col gap-4 text-left">
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">1</span>
                                    <p className="text-sm text-slate-700 leading-snug">
                                        Toca el ícono <MoreVertical className="inline-block w-4 h-4 mx-1 mb-1 text-slate-600" /> (los tres puntos) en la esquina superior derecha.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">2</span>
                                    <p className="text-sm text-slate-700 leading-snug">
                                        Selecciona <strong className="font-semibold text-slate-900">"Agregar a la pantalla principal"</strong> <PlusSquare className="inline-block w-4 h-4 w ml-1 mb-1 text-slate-600" /> o "Instalar App".
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="mt-6 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 active:scale-95 transition-all text-sm"
                    >
                        ¡Entendido!
                    </button>
                </div>
            </div>
        </div>
    );
};
