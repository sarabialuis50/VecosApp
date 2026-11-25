import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const PromoModal = ({ business }) => {
    const { addItem } = useCart();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only show if enabled and has image
        if (business?.promo_habilitado && business?.promo_imagen_url) {
            // Check session storage to avoid showing it multiple times per session
            const hasSeenModal = sessionStorage.getItem(`promo_seen_${business.id}`);
            if (!hasSeenModal) {
                // Add a small delay for better UX
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    sessionStorage.setItem(`promo_seen_${business.id}`, 'true');
                }, 800);
                return () => clearTimeout(timer);
            }
        }
    }, [business]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleBuy = () => {
        if (business?.promo_precio) {
            addItem(
                {
                    id: `promo_${business.id}`,
                    nombre: 'Promoción Especial',
                    descripcion: 'Promoción desde el banner inicial',
                    precio: business.promo_precio,
                    imagen: business.promo_imagen_url
                },
                1
            );
        }
        setIsOpen(false);
        // Trigger generic open cart event if any component listens to it
        // Or simply wait for the user to navigate the floating cart button
        window.dispatchEvent(new CustomEvent('open-cart'));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden bg-[#111814] z-10 flex flex-col"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black">
                            <img
                                src={business.promo_imagen_url}
                                alt="Promoción"
                                className="w-full h-auto object-contain max-h-[70vh]"
                            />
                        </div>

                        {business?.promo_precio && (
                            <div className="p-3 bg-white border-t border-gray-100">
                                <button
                                    onClick={handleBuy}
                                    className="w-full py-4 px-6 bg-[#F97316] hover:bg-[#EA580C] active:scale-95 transition-all text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/30"
                                >
                                    Ver más
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
