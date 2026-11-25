import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    Check,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FAFAF9]">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
                                <img src="/logos/logo-bg.png" alt="Menu.IA" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-heading font-black text-xl tracking-tighter">
                                <span className="text-[#22C55E]">Menu</span>
                                <span className="text-[#22B8CF]">.IA</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-1 sm:gap-3">
                            <Link to="/precios" className="text-sm font-bold text-gray-600 hover:bg-[#4ADE80] hover:text-[#111814] px-4 py-2 rounded-xl transition-colors">Precios</Link>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/login')}
                                className="border-[#4ADE80] border-2 sm:border-0 hover:bg-[#4ADE80] hover:text-[#111814] px-4 py-2 rounded-xl text-sm font-bold text-[#22C55E] sm:text-gray-600 transition-colors"
                            >
                                Iniciar sesión
                            </Button>
                            <Button
                                onClick={() => navigate('/register')}
                                className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] hidden sm:flex"
                            >
                                Comenzar gratis
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Pricing Header */}
            {/* Pricing Header */}
            <section className="pt-20 pb-4 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                        Planes para <span className="text-[#22C55E]">cada tamaño</span> de negocio
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Comienza gratis y escala cuando lo necesites. Sin costos ocultos, sin complicaciones.
                    </p>
                </div>
            </section>

            {/* Pricing Grid */}
            {/* Pricing Grid */}
            <section className="pt-0 px-4 pb-16">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PricingCard
                            name="Básico"
                            price="$39.900/mes"
                            features={['100 pedidos/mes', '500 mensajes de WhatsApp', 'Menú QR interactivo', 'Sistema Fidelización (Puntos)', '50 Créditos Menu IA / tipo', 'Agente IA básico', 'Soporte por email']}
                            onSelect={() => navigate('/register')}
                        />
                        <PricingCard
                            name="Pro"
                            price="$111.900/mes"
                            popular
                            features={['400 pedidos/mes', '1.500 mensajes de WhatsApp', 'Sistema Fidelización (Puntos)', '120 Créditos Menu IA / tipo', 'Agente IA avanzado', 'Soporte prioritario']}
                            onSelect={() => navigate('/register')}
                        />
                        <PricingCard
                            name="Premium"
                            price="$209.900/mes"
                            features={['Pedidos ilimitados', '3.000 mensajes de WhatsApp', 'Sistema Fidelización (Puntos)', '300 Créditos Menu IA / tipo', 'Agente IA Personalizado', 'Gerente de cuenta VIP']}
                            onSelect={() => navigate('/register')}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                        ¿Listo para <span className="text-[#22C55E]">transformar tu negocio?</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
                        Únete a cientos de negocios colombianos que ya están modernizando su gestión con Menu.IA.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => navigate('/register')}
                        className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-lg px-10 h-16 rounded-2xl shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all hover:scale-105 active:scale-95"
                    >
                        Comenzar gratis ahora
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-gray-900 text-gray-400">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                                <img src="/logos/logo.png" alt="Menu.IA" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-heading font-bold text-white uppercase tracking-tighter">MENU.IA</span>
                        </div>
                        <p className="text-sm max-w-xs md:max-w-none">
                            © 2026 Menu.IA. Hecho con amor para negocios apasionados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function PricingCard({ name, price, features, popular, onSelect }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative p-6 rounded-2xl bg-white border-2 ${popular ? 'border-[#22C55E] shadow-lg' : 'border-gray-100'}`}
        >
            {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#4ADE80] text-[#111814] text-sm font-medium">
                    Popular
                </span>
            )}
            <h3 className="font-heading font-bold text-xl mb-2">{name}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">{price}</p>
            <ul className="space-y-2 mb-6">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                        <Check className="w-5 h-5 text-[#22C55E]" />
                        {feature}
                    </li>
                ))}
            </ul>
            <Button
                className={`w-full ${popular ? 'bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]' : ''}`}
                variant={popular ? 'default' : 'outline'}
                onClick={onSelect}
            >
                Comenzar
            </Button>
        </motion.div>
    );
}
