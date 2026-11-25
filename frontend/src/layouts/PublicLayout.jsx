import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft, User } from 'lucide-react';
import { FloatingWA } from '@/components/FloatingWA';
import { InstallPWAInstructions } from '@/components/InstallPWAInstructions';
import { useAuth } from '@/context/AuthContext';

export const PublicLayout = ({
  children,
  businessName,
  businessLogo,
  slug,
  whatsapp,
  aiEnabled,
  aiSaludo,
  aiUseModal,
  isClosed = false,
  backPath,
  hidden = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // 1. Cambiar el título para que el acceso directo tome el nombre correcto
    if (businessName) {
      document.title = `${businessName}`;
    }

    // 2. Eliminar el manifest global de Menu.IA para forzar a Chrome a usar el "Acceso Directo" tradicional
    // Esto evita que instale la app de Menu.IA en vez del perfil del negocio.
    const manifestNode = document.querySelector('link[rel="manifest"]');
    if (manifestNode) {
      manifestNode.remove();
    }

    // 3. Cambiar icono
    let iconNode = document.querySelector('link[rel="icon"]');
    let appleIconNode = document.querySelector('link[rel="apple-touch-icon"]');

    if (businessLogo) {
      if (iconNode) iconNode.href = businessLogo;
      if (appleIconNode) appleIconNode.href = businessLogo;
    }
  }, [businessName, businessLogo]);

  const handleBack = () => {
    // 1. Prioridad: Path específico inyectado
    if (backPath) {
      navigate(backPath);
      return;
    }

    // 2. Lógica para la raíz del negocio (Perfil)
    // Si estamos en /slug, ir atrás significa salir del flujo del negocio
    if (location.pathname === `/${slug}` || location.pathname === `/${slug}/`) {
      // Si soy el dueño, vuelvo al dashboard
      if (user && user.slug === slug) {
        navigate(`/dashboard/${slug}/configuracion`);
      } else {
        // Si soy cliente, salgo a la landing
        // Usamos replace para no ensuciar el historial y evitar bucles con el botón físico del móvil
        navigate('/', { replace: true });
      }
      return;
    }

    // 3. Lógica para páginas internas (Menú, Mis Pedidos, etc.)
    // Intentamos volver al perfil del negocio
    if (slug) {
      navigate(`/${slug}`, { replace: true });
    } else {
      // Último recurso
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#0F172A] border-b border-slate-800 shadow-sm">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-4">
            {/* Back Arrow Button */}
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white active:scale-90"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <Link to={`/${slug}`} className="flex items-center gap-3 text-white group">
              <div className="size-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                {/* Logo Logic: User provided > Generated Avatar > Default Icon */}
                <img
                  src={businessLogo || `https://ui-avatars.com/api/?name=${businessName || 'Menu.IA'}&background=22C55E&color=fff&bold=true`}
                  alt={businessName || 'Logo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${businessName || 'Menu.IA'}&background=22C55E&color=fff&bold=true`;
                  }}
                />
              </div>
              <h2 className="text-xl font-black leading-tight tracking-tighter truncate max-w-[200px] md:max-w-xs">{businessName || 'Menu.IA'}</h2>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${slug}/mi-cuenta`)}
              className="relative size-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-[#4ADE80]/10 hover:border-[#4ADE80] transition-all active:scale-95 group shadow-sm"
              aria-label="Perfil"
            >
              <User className="w-5 h-5 text-[#111814] group-hover:text-[#22C55E]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Floating WA AI Agent */}
      <FloatingWA
        businessName={businessName}
        whatsapp={whatsapp}
        aiEnabled={aiEnabled}
        aiSaludo={aiSaludo}
        slug={slug}
        aiUseModal={aiUseModal}
        isClosed={isClosed}
        hidden={hidden}
      />

      {/* PWA Install Instructions for Mobile */}
      <InstallPWAInstructions
        businessName={businessName}
        businessLogo={businessLogo}
      />

      {/* Shared Footer or Spacing */}
      <div className="h-24 md:h-28" />
    </div>
  );
};
