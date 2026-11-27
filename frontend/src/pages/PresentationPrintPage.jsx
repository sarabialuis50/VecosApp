import React, { useEffect } from 'react';
import { 
  Bot, Store, TrendingUp, Users, ChefHat, 
  MessageSquare, ArrowRight, ArrowLeft,
  Smartphone, Zap, ShieldCheck, Target,
  UtensilsCrossed, Gift, BarChart3, Clock, CheckCircle2,
  LayoutDashboard, ShoppingBag, Grid2X2, Database,
  UserCog, BookOpen, PackageSearch, Sparkles, Settings,
  Flame
} from 'lucide-react';

const slides = [
  {
    id: 'hero',
    content: (
      <div className="flex flex-col items-center text-center justify-center h-full max-w-4xl mx-auto px-6">
        <div className="w-32 h-32 sm:w-48 sm:h-48 mb-8 relative flex items-center justify-center">
          <img src="/logos/burger-full-logo.jpg" alt="Burger Full" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(250,204,21,0.3)] rounded-full" />
        </div>
        <h1 className="text-6xl sm:text-8xl font-black text-white mb-6 leading-tight uppercase tracking-tighter">
          BURGER <span className="text-yellow-400">FULL</span>
        </h1>
        <p className="text-xl sm:text-3xl text-gray-300 font-medium tracking-wide">
          La evolución digital impulsada por Menu.IA.
        </p>
      </div>
    )
  },
  {
    id: 'problema',
    content: (
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 py-12 justify-center">
        <h2 className="text-4xl sm:text-5xl font-black mb-16 text-center text-white">El Problema de la Gestión Tradicional</h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            { icon: <MessageSquare className="w-10 h-10" />, title: "Ventas Perdidas", desc: "Tiempos de respuesta lentos en WhatsApp y mala atención en horas pico." },
            { icon: <Clock className="w-10 h-10" />, title: "Caos en Cocina", desc: "Desorden entre pedidos de salón y domicilios. Errores humanos constantes." },
            { icon: <Users className="w-10 h-10" />, title: "Sin Retención", desc: "No hay base de datos de clientes ni estrategias para que vuelvan a comprar." }
          ].map((item, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-gray-800 p-8 rounded-3xl">
              <div className="w-16 h-16 bg-yellow-400/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'solucion',
    content: (
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 justify-center items-center">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 font-bold mb-6 border border-yellow-400/20">
            <ShieldCheck className="w-5 h-5" />
            La Solución Todo-en-Uno
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-8">Un Ecosistema Tecnológico<br/><span className="text-yellow-400">Sin Límites</span></h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Burger Full ya no necesita 5 herramientas distintas. Hemos integrado toda la operación, el marketing y la administración en un solo lugar.</p>
        </div>
      </div>
    )
  },
  {
    id: 'modulos-operacion',
    content: (
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 justify-center">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-4">Módulos de <span className="text-yellow-400">Operación</span></h2>
          <p className="text-gray-400 text-xl">Velocidad y control absoluto en el día a día de Burger Full.</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: <LayoutDashboard />, title: "Dashboard", desc: "Métricas y gráficas de ventas en tiempo real." },
            { icon: <ShoppingBag />, title: "Pedidos", desc: "Gestor centralizado de órdenes web, WhatsApp y caja." },
            { icon: <Grid2X2 />, title: "Mesas", desc: "Mapa interactivo para control del salón y meseros." },
            { icon: <ChefHat />, title: "Cocina Dual", desc: "Pantallas KDS separadas para Domicilios y Salón." }
          ].map((item, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-[2rem]">
              <div className="w-14 h-14 bg-yellow-400/10 text-yellow-400 rounded-xl flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'modulos-marketing',
    content: (
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 justify-center">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-4">Módulos de <span className="text-yellow-400">Marketing & Clientes</span></h2>
          <p className="text-gray-400 text-xl">Herramientas para fidelizar y aumentar la recompra.</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: <Database />, title: "Base de Clientes", desc: "Directorio automático de todos tus clientes, su historial de compras y preferencias." },
            { icon: <Gift />, title: "Fidelidad", desc: "Sistema de puntos y recompensas automáticas para premiar a los clientes frecuentes." },
            { icon: <MessageSquare />, title: "Marketing", desc: "Envío de campañas masivas por WhatsApp para promociones y reactivación de clientes." }
          ].map((item, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-gray-800 p-8 rounded-[2rem]">
              <div className="w-16 h-16 bg-yellow-400/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'modulos-admin',
    content: (
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 justify-center">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-4">Módulos de <span className="text-yellow-400">Administración</span></h2>
          <p className="text-gray-400 text-xl">El back-office robusto para escalar tu negocio.</p>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[
            { icon: <BookOpen />, title: "Catálogo", desc: "Menú digital interactivo con variantes." },
            { icon: <PackageSearch />, title: "Inventario", desc: "Control de stock de insumos." },
            { icon: <UserCog />, title: "Empleados", desc: "Accesos y permisos por roles." },
            { icon: <Sparkles />, title: "Consultor IA", desc: "IA analizando tus ventas y dando consejos." },
            { icon: <Settings />, title: "Configuración", desc: "Horarios, pagos y datos." }
          ].map((item, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-3xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-400/10 text-yellow-400 rounded-xl flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'ia',
    content: (
      <div className="flex flex-row h-full max-w-6xl mx-auto px-6 py-12 items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 font-bold border border-yellow-400/20">
            <Bot className="w-5 h-5" />
            La Joya de la Corona
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">Recepcionista IA 24/7</h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Un empleado que nunca duerme. Contesta WhatsApp, responde preguntas, sugiere productos y cierra ventas automáticamente.
          </p>
          <ul className="space-y-4">
            {[
              "Toma pedidos en múltiples chats a la vez",
              "Acepta audios de voz naturales",
              "Envía links de pago o código QR"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-lg text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 w-full max-w-sm relative">
          <div className="bg-[#1A1A1A] border border-gray-800 p-4 rounded-[2.5rem] shadow-2xl relative">
            <div className="bg-black rounded-[2rem] p-6 space-y-4 h-[400px] overflow-hidden flex flex-col justify-end">
              <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-none text-gray-300 text-sm self-start max-w-[80%]">
                ¡Hola! Quiero 2 hamburguesas Burger Full clásicas pero sin cebolla por favor. Y para enviar a San José.
              </div>
              <div className="bg-yellow-500 p-4 rounded-2xl rounded-br-none text-black font-medium text-sm self-end max-w-[85%] shadow-lg shadow-yellow-500/20">
                ¡Claro! 🍔 2 Hamburguesas Burger Full (Sin cebolla). Total: $30.000 COP. ¿Añadimos papas o bebida a tu pedido?
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'supersede',
    content: (
      <div className="flex flex-row h-full max-w-6xl mx-auto px-6 py-12 items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 font-bold border border-yellow-400/20">
            <Store className="w-5 h-5" />
            Crecimiento
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">Control Multi-Sede</h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Burger Full está diseñado para expandirse. Gestiona todas tus sucursales futuras desde un solo panel maestro.
          </p>
          <ul className="space-y-4">
            {[
              "Rol Super Admin para dueños",
              "Métricas consolidadas por sede",
              "Administración central de catálogos"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-lg text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-yellow-400 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 w-full bg-[#1A1A1A] rounded-3xl border border-gray-800 p-6 overflow-hidden relative shadow-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center text-yellow-400 font-bold">👑</div>
              <div>
                <h4 className="font-bold text-white">Burger Full - Control Central</h4>
                <p className="text-xs text-gray-400">Todas las sucursales</p>
              </div>
            </div>
            <BarChart3 className="text-gray-500" />
          </div>
          <div className="space-y-4">
            {['Sede Norte (Activa)', 'Sede Sur (Activa)', 'Sede Centro (Pausada)'].map((s, i) => (
              <div key={i} className="bg-black p-4 rounded-xl flex items-center justify-between">
                <span className="text-gray-300 font-medium">{s}</span>
                <div className={`w-3 h-3 rounded-full ${i < 2 ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'roi',
    content: (
      <div className="flex flex-col h-full max-w-4xl mx-auto px-6 justify-center items-center text-center">
        <div className="mb-12">
          <div className="w-24 h-24 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <TrendingUp className="w-12 h-12" />
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">El Retorno de Inversión</h2>
          <p className="text-2xl text-gray-300 mb-12">Digitalizar Burger Full no es un gasto, es una <span className="text-yellow-400 font-bold border-b-2 border-yellow-400">máquina de utilidades</span>.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full text-left mb-16">
          <div className="bg-yellow-400/10 border border-yellow-400/30 p-6 rounded-2xl">
            <h4 className="font-bold text-yellow-400 text-xl mb-2">Más Ingresos</h4>
            <p className="text-gray-300">Ventas en piloto automático 24/7, reactivación de clientes y up-selling constante de la IA.</p>
          </div>
          <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-2xl">
            <h4 className="font-bold text-white text-xl mb-2">Menos Costos</h4>
            <p className="text-gray-400">Adiós a las altas comisiones de apps de terceros, optimización de staff y menos errores en cocina.</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function PresentationPrintPage() {
  useEffect(() => {
    // Automatically open print dialog when loaded
    setTimeout(() => {
      window.print();
    }, 1000);
  }, []);

  return (
    <div className="bg-[#0A0A0A] text-white w-full min-h-screen">
      <style>{`
        @media print {
          /* Force exact colors so backgrounds print perfectly */
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #0A0A0A !important;
          }
          /* Remove header/footer injected by browser */
          @page {
            size: landscape;
            margin: 0mm;
          }
        }
      `}</style>

      {slides.map((slide, index) => {
        // We only break after the slide if it is NOT the last slide
        const isLast = index === slides.length - 1;
        return (
          <div 
            key={slide.id} 
            className="w-full h-screen overflow-hidden flex items-center justify-center relative"
            style={{ 
              pageBreakAfter: isLast ? 'auto' : 'always', 
              breakAfter: isLast ? 'auto' : 'page',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            {/* Background decorations for each page */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[120px]"></div>
            </div>
            
            <div className="w-full h-full flex items-center justify-center">
              {slide.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
