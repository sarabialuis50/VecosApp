import React, { useState, useEffect } from 'react';
import { Clock, Calendar, PartyPopper, Timer, X } from 'lucide-react';

export function BusinessClosedModal({ isOpen, onClose, scheduleData }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isOpen || !scheduleData?.nextOpenTime) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = scheduleData.nextOpenTime - now;

            if (difference <= 0) {
                // Business should be open now!
                setTimeLeft('¡Ya abrimos!');
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ hours, minutes, seconds });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [isOpen, scheduleData?.nextOpenTime]);

    if (!isOpen || !scheduleData || !scheduleData.isClosed) return null;

    const { parsedSchedule, todayScheduleStr, overridesClosed } = scheduleData;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative pb-6 pt-10 px-6 sm:px-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                <h2 className="text-2xl font-black text-[#111814] mb-6 leading-tight">
                    ¡Ups! Estamos cerrados por ahora
                </h2>

                {overridesClosed && (
                    <div className="bg-red-50 text-red-700 py-3 rounded-2xl font-semibold mb-6">
                        El negocio se encuentra cerrado temporalmente.
                    </div>
                )}

                {parsedSchedule && !overridesClosed && (
                    <>
                        <div className="bg-[#FFF8E7] rounded-2xl p-4 mb-4 text-left border border-amber-100">
                            <div className="flex items-center gap-2 text-amber-900 font-bold mb-1 justify-center">
                                <Clock className="w-4 h-4 text-amber-600" />
                                Horarios de atención
                            </div>
                            <div className="text-amber-800 text-sm text-center">
                                {parsedSchedule.semana && <div>Lun a Vie: {parsedSchedule.semana}</div>}
                                {parsedSchedule.sabado && <div>Sábados: {parsedSchedule.sabado}</div>}
                                {parsedSchedule.domingos && <div>Dom/Festivos: {parsedSchedule.domingos}</div>}
                            </div>
                        </div>

                        {timeLeft && typeof timeLeft === 'object' && (
                            <div className="mt-8 mb-6">
                                <div className="flex items-center justify-center gap-2 text-[#111814] font-black mb-4">
                                    <Timer className="w-5 h-5 text-[#EAB308]" />
                                    Volvemos en:
                                </div>
                                <div className="flex justify-center gap-3">
                                    <div className="bg-gray-50 rounded-2xl w-20 flex flex-col items-center justify-center p-3 border border-gray-100">
                                        <span className="text-2xl font-black text-gray-900">{String(timeLeft.hours).padStart(2, '0')}</span>
                                        <span className="text-xs text-gray-500 font-medium">Horas</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl w-20 flex flex-col items-center justify-center p-3 border border-gray-100">
                                        <span className="text-2xl font-black text-gray-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                        <span className="text-xs text-gray-500 font-medium">Minutos</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl w-20 flex flex-col items-center justify-center p-3 border border-gray-100">
                                        <span className="text-2xl font-black text-gray-900">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        <span className="text-xs text-gray-500 font-medium">Segundos</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {timeLeft === '¡Ya abrimos!' && (
                            <div className="text-[#22C55E] font-bold mt-4">{timeLeft}</div>
                        )}
                    </>
                )}

                <button
                    onClick={onClose}
                    className="w-full bg-[#EAB308] hover:bg-[#CA8A04] text-white font-black py-4 rounded-2xl mt-4 shadow-lg shadow-[#EAB308]/20 transition-all active:scale-95"
                >
                    Explorar la tienda
                </button>
            </div>
        </div>
    );
}
