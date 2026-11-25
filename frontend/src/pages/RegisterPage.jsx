import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, Loader2, User, Building, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    email: '',
    password: '',
    telefono: '',
    whatsapp: ''
  });

  useEffect(() => {
    const pendingTrial = sessionStorage.getItem('pending_trial');
    const pendingPlan = sessionStorage.getItem('pending_plan');
    if (pendingTrial) {
      toast.info('Completa tu registro para activar tu prueba gratuita de 7 días.');
      sessionStorage.removeItem('pending_trial');
    }
    if (pendingPlan) {
      toast.info('Completa tu registro para activar tu plan.');
    }
  }, []);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const nombre = e.target.value;
    setFormData({
      ...formData,
      nombre,
      slug: generateSlug(nombre)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const business = await register({
        ...formData,
        whatsapp: formData.whatsapp || formData.telefono
      });
      toast.success('¡Cuenta creada exitosamente!');

      const pendingPlan = sessionStorage.getItem('pending_plan');
      if (pendingPlan) {
        const planData = JSON.parse(pendingPlan);
        sessionStorage.removeItem('pending_plan');
        try {
          const response = await api().post('/payments/create-payment-link', {
            plan_id: planData.planId,
            frequency: planData.frequency
          });
          if (response.data.init_point) {
            window.location.href = response.data.init_point;
          } else {
            navigate(`/dashboard/${business.slug}`);
          }
        } catch (error) {
          navigate(`/dashboard/${business.slug}`);
        }
      } else {
        navigate(`/dashboard/${business.slug}`);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al crear la cuenta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Left Panel - Image */}
      {/* Left Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#0F172A] overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A]" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4ADE80]/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10">
          <div className="text-white text-center max-w-2xl mx-auto space-y-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-48 h-48 mx-auto -mb-4 relative"
            >
              <div className="absolute inset-0 bg-[#4ADE80]/20 rounded-full blur-2xl animate-pulse" />
              <img
                src="/logos/logo.png"
                alt="Menu.IA Logo"
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
              />
            </motion.div>

            <div className="space-y-4">
              <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-lg text-balance">
                Únete a <span className="text-[#22C55E]">Menu</span><span className="text-[#22B8CF]">.IA</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-300 font-medium leading-relaxed drop-shadow-md text-balance max-w-lg mx-auto">
                La plataforma líder para la digitalización y fidelización de restaurantes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Button>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
              <img src="/logos/logo-icon-white.png" alt="Menu.IA" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-black text-xl tracking-tighter">
              <span className="text-[#22C55E]">Menu</span>
              <span className="text-[#22B8CF]">.IA</span>
            </span>
          </Link>

          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            Crear cuenta
          </h1>
          <p className="text-gray-600 mb-8">
            Comienza a digitalizar tu restaurante hoy
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del negocio</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="nombre"
                  placeholder="Mi Restaurante"
                  value={formData.nombre}
                  onChange={handleNameChange}
                  className="pl-10 h-12"
                  required
                  data-testid="register-nombre-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL del menú</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  menuia.co/
                </span>
                <Input
                  id="slug"
                  placeholder="mi-restaurante"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="pl-24 h-12"
                  required
                  data-testid="register-slug-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="telefono"
                  placeholder="+57 300 123 4567"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value, whatsapp: e.target.value })}
                  className="pl-10 h-12"
                  data-testid="register-telefono-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-12"
                  required
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] text-base mt-2 font-bold rounded-xl"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta gratis'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#22C55E] hover:text-[#16A34A] font-bold">
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
