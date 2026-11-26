import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  TableProperties,
  ChefHat,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Gift,
  Sparkles,
  MessageSquareMore,
  ChevronRight,
  ClipboardList,
  Smartphone,
  ExternalLink,
  Package,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { path: '/catalogo', icon: UtensilsCrossed, label: 'Menú' },
  { path: '/mesas', icon: TableProperties, label: 'Mesas' },
  { path: '/cocina', icon: ChefHat, label: 'Cocina' },
  { path: '/clientes', icon: Users, label: 'Base de Clientes' },
  { path: '/fidelidad', icon: Gift, label: 'Fidelidad' },
  { path: '/empleados', icon: Users, label: 'Empleados' },
  { path: '/inventario', icon: Package, label: 'Inventario', badge: 'NUEVO' },
  { path: '/marketing', icon: MessageSquareMore, label: 'WhatsApp Hub' },
  { path: '/consultor', icon: Sparkles, label: 'Consultor IA' },
  { path: '/perfil', icon: Users, label: 'Mi Perfil' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

const mobileBottomNavItems = [
  { path: '/cocina', icon: ChefHat, label: 'Cocina' },
  { path: '/fidelidad', icon: Gift, label: 'Fidelidad' },
  { path: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { path: '/empleados', icon: Users, label: 'Empleados' },
  { path: '/mesas', icon: TableProperties, label: 'Mesas' },
];

const superAdminOnlyPaths = [
  // Originally restricted, but branches are independent and need to manage 
  // their own catalog, inventory, config, etc.
];

export const DashboardLayout = ({ children }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => {
    if (isSuperAdmin) return true; // Super admin sees everything
    // Branch admin: hide super-admin-only sections
    return !superAdminOnlyPaths.includes(item.path);
  });

  const visibleMobileItems = mobileBottomNavItems.filter(item => {
    if (isSuperAdmin) return true;
    return !superAdminOnlyPaths.includes(item.path);
  });

  const basePath = `/dashboard/${user?.slug}`;

  return (
    <div className="min-h-screen bg-[#f6f8f7] font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F172A] border-b border-slate-800 z-50 flex items-center px-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
            <img src="/logos/logo-icon-transparent.png" alt="Menu.IA" className="size-8 object-contain" />
          </div>
          <span className="font-heading font-black text-xl tracking-tighter text-white">
            {user?.nombre || 'Mi Negocio'}
          </span>
        </div>
        <div className="size-10 invisible" />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-[100dvh] lg:h-screen w-72 bg-[#0F172A] border-r border-slate-800 z-50 shadow-2xl lg:shadow-none
        transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header Section (Logo + Business Info) */}
          <div className="shrink-0 p-4 lg:p-5 border-b border-slate-800 relative group">
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 p-2 hover:bg-slate-800 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <Link to={basePath} className="flex items-center gap-3 group/sidebar" onClick={() => setSidebarOpen(false)}>
              {/* Business Logo */}
              <div className="size-11 shrink-0 rounded-xl bg-white shadow-md border border-slate-100/10 flex items-center justify-center overflow-hidden transition-transform group-hover/sidebar:scale-105 duration-500">
                {(user?.logo_url || (typeof window !== 'undefined' && localStorage.getItem('fogon_mesa_logo')) || '/images/vecos-logo.jpg') ? (
                  <img
                    src={user?.logo_url || (typeof window !== 'undefined' && localStorage.getItem('fogon_mesa_logo')) || '/images/vecos-logo.jpg'}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg uppercase">
                    {user?.nombre?.[0] || 'M'}
                  </div>
                )}
              </div>

              {/* Business Identity */}
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-black text-sm text-white truncate leading-tight tracking-tight mb-0.5">
                  {user?.nombre || 'Mi Negocio'}
                </h2>

                <div className="flex items-center gap-1.5">


                  {/* Role Badge */}
                  <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border whitespace-nowrap bg-[#DAA520]/10 text-[#DAA520] border-[#DAA520]/20">
                    RESTAURANTE
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-1">
              {visibleNavItems.map((item) => {
                const fullPath = `${basePath}${item.path}`;
                const isActive = location.pathname === fullPath ||
                  (item.path === '' && location.pathname === basePath);

                return (
                  <Link
                    key={item.path}
                    to={fullPath}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-bold text-[12px] lg:text-[13px] transition-all duration-300 group
                      ${isActive
                        ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-600/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-[#DAA520]/20 text-[#DAA520] uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/50 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-[12px] lg:text-[13px] text-red-400 hover:bg-red-500/10 transition-all active:scale-95 group"
              >
                <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
                Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen pb-20 lg:pb-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F172A] border-t border-slate-800 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {visibleMobileItems.map((item) => {
          const fullPath = `${basePath}${item.path}`;
          const isActive = location.pathname === fullPath;

          return (
            <Link
              key={item.path}
              to={fullPath}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full h-full ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#D4AF37]/10 scale-110 shadow-sm shadow-[#D4AF37]/10' : ''}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
