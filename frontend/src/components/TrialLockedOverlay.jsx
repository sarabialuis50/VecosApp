import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react';

const TrialLockedOverlay = () => {
    const { trialLocked, logout } = useAuth();

    if (!trialLocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-red-500 p-8 flex justify-center">
                    <div className="bg-white/20 p-4 rounded-full">
                        <ShieldAlert className="w-12 h-12 text-white" />
                    </div>
                </div>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Acceso Restringido
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {trialLocked}
                    </p>

                    <div className="space-y-3">
                        <a
                            href="https://wa.me/573000000000" // Replace with real support number
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full gap-2 bg-[#22C55E] hover:bg-[#1ea34d] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/20"
                        >
                            <MessageSquare size={18} />
                            Contactar Soporte
                        </a>

                        <button
                            onClick={logout}
                            className="flex items-center justify-center w-full gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 text-xs text-gray-400 text-center border-t border-gray-100">
                    Burger Full Inteligentes para tu Negocio
                </div>
            </div>
        </div>
    );
};

export default TrialLockedOverlay;
