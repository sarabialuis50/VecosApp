import React from 'react';
import { UtensilsCrossed, AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PublicTrialLocked = ({ message }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8f7] p-6 text-center">
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center border border-[#f0f4f2]">
                    <UtensilsCrossed className="w-12 h-12 text-[#22C55E]/20" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                    <AlertCircle className="w-5 h-5" />
                </div>
            </div>

            <h1 className="text-3xl font-black text-[#111814] mb-4 tracking-tighter">
                Servicio No Disponible
            </h1>

            <p className="text-[#618972] max-w-sm mb-10 leading-relaxed font-medium">
                {message || "Este establecimiento no está recibiendo pedidos ni mostrando su menú en este momento. Por favor, intenta más tarde."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <Button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-[#111814] hover:bg-black text-white h-12 rounded-xl font-bold gap-2"
                >
                    <Home size={18} />
                    Ir al Inicio
                </Button>
            </div>

            <p className="mt-12 text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">
                Potenciado por <span className="text-[#22C55E]">Menu.IA</span>
            </p>
        </div>
    );
};

export default PublicTrialLocked;
