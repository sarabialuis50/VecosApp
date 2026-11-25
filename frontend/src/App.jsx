import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import TrialLockedOverlay from "@/components/TrialLockedOverlay";
import CookieBanner from "@/components/CookieBanner";

// Pages
import DemoRestaurante from './pages/public/DemoRestaurante';
import LandingPage from "@/pages/LandingPage";
import PresentationPage from "@/pages/PresentationPage";
import PresentationPrintPage from "@/pages/PresentationPrintPage";
import PreciosPage from "@/pages/PreciosPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CustomersPage from "@/pages/dashboard/CustomersPage";
import AllCustomersPage from "@/pages/dashboard/AllCustomersPage";
import CatalogoPage from "@/pages/dashboard/CatalogoPage";
import AllProductsPage from "@/pages/dashboard/AllProductsPage";
import MesasPage from "@/pages/dashboard/MesasPage";
import PedidosPage from "@/pages/dashboard/PedidosPage";
import HistorialPedidosPage from "@/pages/dashboard/HistorialPedidosPage";
import CocinaPage from "@/pages/dashboard/CocinaPage";
import EmpleadosPage from "@/pages/dashboard/EmpleadosPage";
import FidelidadPage from "@/pages/dashboard/FidelidadPage";
import FidelidadHistoryPage from "@/pages/dashboard/FidelidadHistoryPage";
import InsightsPage from "@/pages/dashboard/InsightsPage";
import GeminiConsultantPage from "@/pages/dashboard/GeminiConsultantPage";
import WhatsappHubPage from "@/pages/dashboard/WhatsappHubPage";
import MiPerfilPage from "@/pages/dashboard/MiPerfilPage";
import ConfiguracionPage from "@/pages/dashboard/ConfiguracionPage";
import CatalogoMaestroPage from "@/pages/dashboard/CatalogoMaestroPage";
import InventarioPage from "@/pages/dashboard/InventarioPage";
import BusinessHomePage from "@/pages/public/BusinessHomePage";
import CustomerDetailsPage from "@/pages/dashboard/CustomerDetailsPage";
import EditCustomerPage from "@/pages/dashboard/EditCustomerPage";
import CustomerHistoryPage from "@/pages/dashboard/CustomerHistoryPage";
import MenuPublico from "@/pages/public/MenuPublico";
import MisPedidos from "@/pages/public/MisPedidos";
import MeseroApp from "@/pages/waiter/MeseroApp";
import DespachoPage from "@/pages/delivery/DespachoPage";
import ClientProfilePage from "@/pages/public/ClientProfilePage";
import ClientEditProfilePage from "@/pages/public/ClientEditProfilePage";
import ClientOrdersPage from "@/pages/public/ClientOrdersPage";
import LegalPage from "@/pages/public/LegalPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Auth Route (redirect if already logged in)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/dashboard/${user.slug}`} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/presentacion" element={<PresentationPage />} />
      <Route path="/presentacion/pdf" element={<PresentationPrintPage />} />
      <Route path="/precios" element={<PreciosPage />} />
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
      <Route path="/reset-password" element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />

      {/* Dashboard Routes (Protected) */}
      <Route path="/dashboard/:slug" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/clientes" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/clientes/todos" element={<ProtectedRoute><AllCustomersPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/clientes/:customerId" element={<ProtectedRoute><CustomerDetailsPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/clientes/:customerId/editar" element={<ProtectedRoute><EditCustomerPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/clientes/:customerId/historial" element={<ProtectedRoute><CustomerHistoryPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/catalogo" element={<ProtectedRoute><CatalogoPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/catalogo/todos" element={<ProtectedRoute><AllProductsPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/mesas" element={<ProtectedRoute><MesasPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/pedidos" element={<ProtectedRoute><PedidosPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/pedidos/historial" element={<ProtectedRoute><HistorialPedidosPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/cocina" element={<ProtectedRoute><CocinaPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/cocina/domicilios" element={<ProtectedRoute><CocinaPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/cocina/salon" element={<ProtectedRoute><CocinaPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/empleados" element={<ProtectedRoute><EmpleadosPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/fidelidad" element={<ProtectedRoute><FidelidadPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/fidelidad/historial" element={<ProtectedRoute><FidelidadHistoryPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/consultor" element={<ProtectedRoute><GeminiConsultantPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/marketing" element={<ProtectedRoute><WhatsappHubPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/perfil" element={<ProtectedRoute><MiPerfilPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
      <Route path="/dashboard/:slug/catalogo-maestro" element={<Navigate to="../inventario" replace />} />
      <Route path="/dashboard/:slug/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />

      {/* Waiter App */}
      <Route path="/mesero/:slug" element={<MeseroApp />} />

      {/* Delivery App */}
      <Route path="/reparto/:slug/:orderId" element={<DespachoPage />} />

      {/* Public Menu Routes — CartProvider wraps all public pages so the cart persists across navigation */}
      <Route path="/demo-restaurante/menu" element={<Navigate to="/demo-restaurante" replace />} />
      <Route path="/:slug" element={<CartProvider><BusinessHomePage /></CartProvider>} />
      <Route path="/:slug/menu" element={<CartProvider><MenuPublico /></CartProvider>} />
      <Route path="/:slug/mesa/:mesa" element={<CartProvider><MenuPublico /></CartProvider>} />
      <Route path="/:slug/mis-pedidos" element={<CartProvider><MisPedidos /></CartProvider>} />
      <Route path="/:slug/mi-cuenta" element={<CartProvider><ClientProfilePage /></CartProvider>} />
      <Route path="/:slug/mi-cuenta/editar" element={<CartProvider><ClientEditProfilePage /></CartProvider>} />
      <Route path="/:slug/mi-cuenta/pedidos" element={<CartProvider><ClientOrdersPage /></CartProvider>} />

      {/* Demo routes */}
      <Route path="/demo" element={<Navigate to="/demo-restaurante" replace />} />
      <Route path="/demo-restaurante" element={<DemoRestaurante />} />
      <Route path="/demo-negocio" element={<DemoRestaurante />} />

      {/* Legal Routes */}
      <Route path="/legal/autorizacion-datos" element={<LegalPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <TrialLockedOverlay />
          <CookieBanner />
        </BrowserRouter>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </div>
  );
}

export default App;
