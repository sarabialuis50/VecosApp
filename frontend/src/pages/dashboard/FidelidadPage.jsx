import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Users, User, Award, Settings, Loader2, Check, TrendingUp, ArrowRight, Save, Calculator, Landmark, Search, Camera, Minus, Plus, Filter, Clock, Trophy, Package, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import RuletaAdminSection from '@/components/RuletaAdminSection';

export default function FidelidadPage() {
  const { slug = 'vecos' } = useParams();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [config, setConfig] = useState({
    activo: false,
    pesos_por_punto: 0,
    puntos_minimo_canje: 0,
    valor_punto_descuento: 0,
    nivel_bronce_min: 0,
    nivel_plata_min: 300,
    nivel_oro_min: 1000
  });
  const [tierConfig, setTierConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('fogon_mesa_loyalty_tiers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { nivel_bronce_min: 0, nivel_plata_min: 300, nivel_oro_min: 1000 };
  });
  const [originalConfig, setOriginalConfig] = useState(null);

  // Search & Award State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditMode, setCreditMode] = useState('compra'); // 'compra' | 'manual'
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [manualPoints, setManualPoints] = useState(0);
  const [awarding, setAwarding] = useState(false);
  const [recentCredits, setRecentCredits] = useState([
    { id: '1', nombre: 'Cliente Ejemplo', puntos: 20, fecha: 'Hace 5 minutos', estado: 'Completado' }
  ]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = recentCredits.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(recentCredits.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Simulator State
  const [simVenta, setSimVenta] = useState(0);
  const [simCashback, setSimCashback] = useState(0);
  const [simPuntos, setSimPuntos] = useState(0);
  const [tempConfigValue, setTempConfigValue] = useState('');

  // Sync points with cashback for a "live" simulator experience (1pt = $1 default)
  useEffect(() => {
    const calculatedPuntos = Math.round((simVenta * simCashback) / 100);
    setSimPuntos(calculatedPuntos);
  }, [simVenta, simCashback]);

  // Sync Amount -> Points in Award Section
  useEffect(() => {
    if (creditMode === 'compra') {
      if (config.pesos_por_punto > 0) {
        const calculated = Math.floor(purchaseAmount / (config.pesos_por_punto));
        setManualPoints(calculated);
      } else {
        setManualPoints(0);
      }
    }
  }, [purchaseAmount, config.pesos_por_punto, creditMode]);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const [configRes, customersRes, transactionsRes] = await Promise.all([
        api().get(`/loyalty/${slug}/config`),
        api().get(`/loyalty/${slug}/customers`).catch(() => ({ data: [] })),
        api().get(`/loyalty/${slug}/recent-transactions?limit=50`).catch(() => ({ data: [] }))
      ]);
      if (configRes.data) {
        setConfig(configRes.data);
        setOriginalConfig(configRes.data);
        if (configRes.data.nivel_bronce_min !== undefined || configRes.data.nivel_plata_min || configRes.data.nivel_oro_min) {
          const loadedTiers = {
            nivel_bronce_min: configRes.data.nivel_bronce_min ?? 0,
            nivel_plata_min: configRes.data.nivel_plata_min || 300,
            nivel_oro_min: configRes.data.nivel_oro_min || 1000,
          };
          setTierConfig(loadedTiers);
          localStorage.setItem('fogon_mesa_loyalty_tiers', JSON.stringify(loadedTiers));
        }
        // Show the real value from DB in the config input
        setTempConfigValue(configRes.data.pesos_por_punto > 0 ? configRes.data.pesos_por_punto : '');
      }
      setCustomers(customersRes.data || []);

      if (transactionsRes.data) {
        const formatted = transactionsRes.data.map(t => ({
          ...t,
          fecha: new Date(t.fecha).toLocaleString()
        }));
        setRecentCredits(formatted);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTiers = async () => {
    const bronce = tierConfig.nivel_bronce_min ?? 0;
    const plata = tierConfig.nivel_plata_min ?? 300;
    const oro = tierConfig.nivel_oro_min ?? 1000;

    if (bronce < 0) {
      toast.error('El nivel Bronce no puede requerir puntos negativos');
      return;
    }
    if (plata <= bronce) {
      toast.error('El nivel Plata debe requerir más puntos que el nivel Bronce');
      return;
    }
    if (oro <= plata) {
      toast.error('El nivel Oro debe requerir más puntos que el nivel Plata');
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem('fogon_mesa_loyalty_tiers', JSON.stringify(tierConfig));
      const payload = { ...config, ...tierConfig };
      setConfig(payload);
      await api().post(`/loyalty/${slug}/config`, payload).catch(() => {});
      toast.success('¡Rangos de niveles guardados correctamente!');
    } catch (error) {
      toast.error('Error al guardar los rangos de niveles');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Validate: Can't activate the program without proper configuration
    if (config.activo && (!config.pesos_por_punto || config.pesos_por_punto <= 0)) {
      toast.error('No puedes activar el programa sin configurar el valor de pesos por punto. Define la "Configuración Técnica Definitiva" primero.');
      setConfig({ ...config, activo: false });
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem('fogon_mesa_loyalty_tiers', JSON.stringify(tierConfig));
      const payload = { ...config, ...tierConfig };
      const res = await api().post(`/loyalty/${slug}/config`, payload);
      setOriginalConfig(res.data || payload);
      toast.success('¡Configuración guardada exitosamente!');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error(detail || 'Hubo un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  const getButtonStyle = (hasPendingChanges) => {
    if (hasPendingChanges) {
      return "h-14 rounded-full border-2 border-transparent bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black uppercase text-[10px] tracking-widest px-10 transition-all flex items-center gap-2 group shadow-lg shadow-[#4ADE80]/20 active:scale-95";

    }
    return "h-14 rounded-full border-2 border-[#4ADE80] bg-transparent text-[#22C55E] font-black uppercase text-[10px] tracking-widest px-10 transition-all flex items-center gap-2 group active:scale-95 hover:bg-[#4ADE80]/5";
  };

  const applySimulator = () => {
    if (simPuntos <= 0) return;

    // Logic from image:
    // 1. Calculate suggested Pesos Per Point
    let pesosPunto = simVenta / simPuntos;

    // 2. Calculate the corresponding Value per point to satisfy the cashback %
    const targetBenficio = simVenta * (simCashback / 100);
    let valorPunto = targetBenficio / simPuntos;

    // Scale optimization: find integer values that preserve the cashback %
    if (valorPunto > 0 && valorPunto < 1) {
      const factor = Math.ceil(1 / valorPunto);
      pesosPunto = Math.round(pesosPunto * factor);
      valorPunto = Math.round(valorPunto * factor);
    } else {
      pesosPunto = Math.round(pesosPunto);
      valorPunto = Math.round(valorPunto);
    }

    setConfig({
      ...config,
      pesos_por_punto: pesosPunto,
      valor_punto_descuento: valorPunto
    });
    setTempConfigValue(pesosPunto);

    toast.success('Estrategia aplicada a la configuración real');
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await api().get(`/loyalty/${slug}/customers?q=${searchQuery}`);
      setSearchResults(res.data);
      if (res.data.length === 0) {
        toast.info('No se encontraron clientes');
      }
    } catch (error) {
      toast.error('Error al buscar clientes');
    } finally {
      setSearching(false);
    }
  };

  const handleAwardPoints = async () => {
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente primero');
      return;
    }

    let points = 0;
    let description = '';
    let amount = 0;

    if (!config || !config.activo) {
      toast.error('El programa de fidelidad está pausado. Actívalo primero.');
      return;
    }

    if (!config.pesos_por_punto || config.pesos_por_punto <= 0) {
      toast.error('Configuración de fidelidad no detectada. Define el valor de pesos por punto primero.');
      return;
    }

    if (creditMode === 'compra') {
      if (purchaseAmount <= 0) {
        toast.error('Ingresa un monto de compra válido');
        return;
      }
      points = Math.floor(purchaseAmount / config.pesos_por_punto);
      amount = purchaseAmount;
      description = `Acreditación por compra de $${purchaseAmount.toLocaleString()}`;
    } else {
      if (manualPoints <= 0) {
        toast.error('Ingresa una cantidad de puntos válida');
        return;
      }
      points = manualPoints;
      amount = manualPoints * config.pesos_por_punto;
      description = `Acreditación manual de ${points} puntos`;
    }

    if (points <= 0) {
      toast.error('La cantidad de puntos debe ser mayor a 0');
      return;
    }

    setAwarding(true);
    try {
      await api().post(`/loyalty/${slug}/award`, {
        telefono: selectedCustomer.telefono,
        puntos: points,
        descripcion: description,
        monto: amount
      });

      // Update recent credits locally
      setRecentCredits([
        {
          id: Date.now().toString(),
          nombre: selectedCustomer.nombre || selectedCustomer.telefono,
          puntos: points,
          monto: amount,
          fecha: 'Ahora mismo',
          estado: 'Completado'
        },
        ...recentCredits
      ]);

      toast.success(`¡${points} puntos acreditados correctamente!`);
      // Reset
      setPurchaseAmount(0);
      setManualPoints(0);
      setSelectedCustomer(null);
      setSearchQuery('');
      setSearchResults([]);
      fetchData();
    } catch (error) {
      toast.error('Error al acreditar puntos');
    } finally {
      setAwarding(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v));

  const totalPuntos = customers.reduce((sum, c) => sum + (c.puntos_disponibles || 0), 0);
  const totalClientes = customers.length;

  // Final effective cashback % calculated from real config
  const cashbackPorcentaje = config.pesos_por_punto > 0
    ? ((config.valor_punto_descuento / config.pesos_por_punto) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin" />
            <p className="text-sm font-medium text-gray-400">Cargando ecosistema de fidelidad...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate suggested values reactively for the UI
  const getOptimizedSuggestions = () => {
    if (simPuntos <= 0) return { spend: 0, value: 0 };

    let spend = simVenta / simPuntos;
    const targetProfit = simVenta * (simCashback / 100);
    let value = targetProfit / simPuntos;

    // Scale optimization: find integer values that preserve the cashback %
    if (value > 0 && value < 1) {
      const factor = Math.ceil(1 / value);
      spend = Math.round(spend * factor);
      value = Math.round(value * factor);
    } else {
      spend = Math.round(spend);
      value = Math.round(value);
    }
    return { spend, value };
  };

  const { spend: suggestedSpend, value: suggestedValue } = getOptimizedSuggestions();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-20">

        {/* SECTION: CONFIGURACIÓN DE PUNTOS Y SIMULADOR */}
        <Card className="border-none shadow-xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white order-3 lg:order-2">
          <CardHeader className="px-6 md:px-10 pt-8 pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-white to-gray-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-white shadow-lg shadow-[#4ADE80]/25 shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base font-black text-gray-900 uppercase tracking-widest">
                    Configuración de Puntos
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Diseña la estrategia de rentabilidad y fidelización de tu negocio
                  </CardDescription>
                </div>
              </div>

              {/* Switch Estado Programa */}
              <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                <div className="pr-3 border-r border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Estado
                </div>
                <div className="flex items-center gap-2.5">
                  <Switch
                    id="activo-header"
                    checked={config.activo}
                    onCheckedChange={(checked) => setConfig({ ...config, activo: checked })}
                    className="data-[state=checked]:bg-[#4ADE80]"
                  />
                  <Label htmlFor="activo-header" className="font-black text-[10px] uppercase cursor-pointer whitespace-nowrap">
                    {config.activo ? 'Programa Activo' : 'Programa Pausado'}
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-8 md:px-10 md:py-12 space-y-10 md:space-y-12">
            {/* Sub-cabecera: Simulador de Puntos */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#22C55E] shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Simulador de Puntos
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Define tu inversión antes de configurar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-end">

              {/* Step 1: VENTA */}
              <div className="space-y-2 md:space-y-4">
                <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">1. VENTA DE</Label>
                <div className="h-14 md:h-16 rounded-[1.25rem] md:rounded-3xl border-2 border-[#22C55E]/30 bg-white px-3 md:px-6 flex items-center group focus-within:border-[#22C55E] transition-all shadow-sm">
                  <span className="font-black text-gray-900 text-lg md:text-xl mr-1.5 h-full flex items-center">$</span>
                  <Input
                    type="number"
                    value={simVenta === 0 ? '' : simVenta}
                    onChange={(e) => setSimVenta(parseInt(e.target.value) || 0)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="border border-[#22C55E]/20 bg-green-50/30 px-2 md:px-3 text-lg md:text-xl font-black focus-visible:ring-1 focus-visible:ring-[#22C55E]/30 w-full h-9 md:h-10 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Step 2: EQUIVALENCIA (CASHBACK) */}
              <div className="space-y-2 md:space-y-4 relative group">
                <div className="hidden md:flex absolute -left-6 top-2/3 -translate-y-1/2 z-10 items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#22C55E]/40" />
                </div>
                <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">2. EQUIVALENCIA</Label>
                <div className="h-14 md:h-16 rounded-[1.25rem] md:rounded-3xl border-2 border-[#22C55E]/30 bg-white px-3 md:px-5 flex items-center group focus-within:border-[#22C55E] transition-all shadow-sm">
                  <Input
                    type="number"
                    value={simCashback === 0 ? '' : simCashback}
                    onChange={(e) => setSimCashback(parseInt(e.target.value) || 0)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="border border-[#22C55E]/20 bg-green-50/30 p-0 text-xl md:text-2xl font-black text-[#22C55E] focus-visible:ring-1 focus-visible:ring-[#22C55E]/30 w-16 md:w-20 text-center h-9 md:h-10 rounded-xl transition-all"
                  />
                  <div className="flex items-baseline gap-1 ml-auto shrink-0">
                    <span className="text-[9px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-tighter">%</span>
                    <span className="text-[6px] md:text-[7px] font-black text-[#22C55E]/60 uppercase tracking-tighter whitespace-nowrap">CASHBACK</span>
                  </div>
                </div>
              </div>

              {/* Step 3: PUNTOS (Reactive) */}
              <div className="space-y-2 md:space-y-4 relative">
                <div className="hidden md:flex absolute -left-6 top-2/3 -translate-y-1/2 z-10 items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#22C55E]/40" />
                </div>
                <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">3. CLIENTE RECIBE</Label>
                <div className="h-14 md:h-16 rounded-[1.25rem] md:rounded-3xl border-2 border-[#22C55E]/30 bg-white px-3 md:px-5 flex items-center group focus-within:border-[#22C55E] transition-all shadow-md shadow-[#22C55E]/5">
                  <Input
                    type="number"
                    value={simPuntos === 0 ? '' : simPuntos}
                    onChange={(e) => setSimPuntos(parseInt(e.target.value) || 0)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="border border-[#22C55E]/20 bg-green-50/30 p-0 text-xl md:text-2xl font-black text-[#22C55E] focus-visible:ring-1 focus-visible:ring-[#22C55E]/30 w-16 md:w-20 text-center h-9 md:h-10 rounded-xl transition-all"
                  />
                  <span className="text-[7px] md:text-[8px] font-black text-[#22C55E] uppercase tracking-widest ml-auto shrink-0">PUNTOS</span>
                </div>
              </div>

              {/* Step 4: RESULTADO (CONFIGURACIÓN SUGERIDA) */}
              <div className="space-y-2 md:space-y-4 relative text-center">
                <div className="hidden md:flex absolute -left-6 top-2/3 -translate-y-1/2 z-10 items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#22C55E]/40" />
                </div>
                <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">4. RESULTADO (SUGERIDO)</Label>
                <div className="h-14 md:h-16 rounded-[1.25rem] md:rounded-3xl border-2 border-[#22C55E]/40 bg-white px-3 md:px-6 flex items-center justify-between group shadow-xl shadow-[#22C55E]/5">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg md:text-xl font-black text-[#22C55E] leading-none">{suggestedSpend}</span>
                    </div>
                  </div>
                  <Button
                    onClick={applySimulator}
                    className="bg-[#4ADE80] hover:bg-[#1da850] text-[#111814] font-black text-[9px] md:text-[10px] uppercase h-9 md:h-10 rounded-xl md:rounded-2xl px-3 md:px-5 transition-transform active:scale-95 shadow-lg shadow-[#4ADE80]/20 flex items-center gap-1.5 md:gap-2"
                  >
                    <Package className="w-3.5 h-3.5 md:w-4 h-4" />
                    USAR
                  </Button>
                </div>
              </div>
            </div>

            {/* SECTION: CONFIGURACIÓN TÉCNICA DEFINITIVA */}
            <div className="pt-8 md:pt-12 border-t border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10">

                <div className="space-y-2 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">CONFIGURACIÓN TÉCNICA DEFINITIVA</h3>
                  </div>
                  <p className="text-[10px] font-medium text-gray-400">Usa el "Resultado Sugerido" de arriba como guía, pero escribe aquí el valor final.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full lg:w-auto">
                  <div className="space-y-3 w-full sm:w-auto flex flex-col items-center sm:items-start text-center sm:text-left">
                    <Label className="text-[9px] font-black text-[#22C55E] uppercase tracking-widest px-1">5. COLOCA AQUÍ TU VALOR ($)</Label>
                    <div className="h-12 md:h-14 bg-gray-50 border-2 border-[#22C55E]/40 rounded-full flex items-center p-1.5 pr-4 md:pr-5 group focus-within:border-[#22C55E] focus-within:bg-white transition-all w-fit mx-auto sm:mx-0">
                      <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-[#22C55E] text-base md:text-lg">$</div>
                      <Input
                        type="number"
                        value={tempConfigValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempConfigValue(val);
                          setConfig({ ...config, pesos_por_punto: parseInt(val) || 0 });
                        }}
                        className="border border-[#22C55E]/20 bg-white px-2 md:px-3 text-lg md:text-xl font-black text-gray-900 focus-visible:ring-1 focus-visible:ring-[#22C55E]/30 w-16 md:w-24 h-8 md:h-10 rounded-xl text-center transition-all"
                        placeholder="0"
                        id="loyalty-config-input"
                        onWheel={(e) => e.target.blur()}
                      />
                      <span className="text-[9px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-tighter whitespace-nowrap ml-1">/ 1 PUNTO</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={`${getButtonStyle(hasChanges())} w-fit mx-auto sm:mx-0 px-8 h-12 md:h-16 text-[10px] md:text-xs`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    GUARDAR CAMBIOS
                  </Button>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION: CONFIGURACIÓN DE NIVELES (TIERS) */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="px-6 md:px-10 pt-8 pb-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base font-black text-gray-900 uppercase tracking-widest">
                    Escala y Rangos de Niveles de Clientes
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Configura la cantidad de puntos acumulados necesarios para cada nivel en tu restaurante.
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleSaveTiers}
                disabled={saving}
                className="h-11 px-6 rounded-2xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#4ADE80]/20 gap-2 shrink-0"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Rangos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronce */}
              <div className="p-6 rounded-3xl border-2 border-orange-100 bg-orange-50/30 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🥉</span>
                    <Badge variant="outline" className="bg-orange-600/10 text-orange-700 border-orange-200 text-[10px] font-black uppercase tracking-wider">
                      Base Inicial
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Nivel Bronce</h4>
                    <p className="text-xs text-gray-500 mt-1 min-h-[2.25rem] flex items-center">Clientes nuevos o con compras iniciales.</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-orange-100/60">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-orange-800">Puntos requeridos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={tierConfig.nivel_bronce_min ?? 0}
                      onChange={(e) => setTierConfig({ ...tierConfig, nivel_bronce_min: parseInt(e.target.value) || 0 })}
                      className="h-12 rounded-2xl bg-white border-2 border-orange-200 font-black text-base text-gray-900 text-center"
                    />
                    <span className="text-xs font-bold text-gray-500">PTS</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Rango: {tierConfig.nivel_bronce_min ?? 0} a {(tierConfig.nivel_plata_min - 1) >= (tierConfig.nivel_bronce_min ?? 0) ? (tierConfig.nivel_plata_min - 1) : (tierConfig.nivel_bronce_min ?? 0)} pts
                  </p>
                </div>
              </div>

              {/* Plata */}
              <div className="p-6 rounded-3xl border-2 border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🥈</span>
                    <Badge variant="outline" className="bg-gray-300/30 text-gray-700 border-gray-300 text-[10px] font-black uppercase">
                      Recurrente
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Nivel Plata</h4>
                    <p className="text-xs text-gray-500 mt-1 min-h-[2.25rem] flex items-center">Clientes frecuentes que compran regularmente.</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-gray-600">Puntos requeridos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={tierConfig.nivel_plata_min}
                      onChange={(e) => setTierConfig({ ...tierConfig, nivel_plata_min: parseInt(e.target.value) || 0 })}
                      className="h-12 rounded-2xl bg-white border-2 border-slate-200 font-black text-base text-gray-900 text-center"
                    />
                    <span className="text-xs font-bold text-gray-500">PTS</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Rango: {tierConfig.nivel_plata_min} a {(tierConfig.nivel_oro_min - 1) > tierConfig.nivel_plata_min ? (tierConfig.nivel_oro_min - 1) : tierConfig.nivel_plata_min} pts
                  </p>
                </div>
              </div>

              {/* Oro */}
              <div className="p-6 rounded-3xl border-2 border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🥇</span>
                    <Badge variant="outline" className="bg-yellow-400/20 text-yellow-800 border-yellow-300 text-[10px] font-black uppercase">
                      VIP Exclusivo
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Nivel Oro</h4>
                    <p className="text-xs text-gray-500 mt-1 min-h-[2.25rem] flex items-center">Tus mejores comensales y clientes VIP.</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-amber-200/60">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-amber-800">Puntos requeridos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={tierConfig.nivel_oro_min}
                      onChange={(e) => setTierConfig({ ...tierConfig, nivel_oro_min: parseInt(e.target.value) || 0 })}
                      className="h-12 rounded-2xl bg-white border-2 border-amber-200 font-black text-base text-gray-900 text-center"
                    />
                    <span className="text-xs font-bold text-gray-500">PTS</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Rango: Desde {tierConfig.nivel_oro_min} pts en adelante
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION: RULETA DE RECOMPENSAS (OPCIÓN A + B) */}
        <RuletaAdminSection slug={slug} api={api} />

        {/* SECTION: BUSCADOR Y ACREDITACIÓN (REPLACING OLD RULE CARDS) */}
        <Card className="border-none shadow-xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white order-2 lg:order-3">
          <CardHeader className="px-6 md:px-10 pt-8 pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-white to-gray-50/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-white shadow-lg shadow-[#4ADE80]/25 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-black text-gray-900 uppercase tracking-widest">
                  Acreditación de Puntos
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  Busca un cliente y asigna puntos manualmente o calculados según el monto de su compra
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

          {/* Card Buscar Cliente */}
          <Card className="rounded-3xl border-2 border-gray-100 shadow-sm bg-gray-50/30 overflow-hidden group order-1 lg:order-none">
            <CardHeader className="px-5 md:px-8 pt-6 md:pt-8 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Search className="w-6 h-6 text-[#22C55E]" />
                  </div>
                  <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest">Buscar Cliente</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 md:px-8 pb-8 md:pb-10 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre, Email o WhatsApp</Label>
                <div className="flex gap-3">
                  <div className="h-16 flex-1 rounded-3xl border-2 border-gray-200 bg-white px-6 flex items-center group focus-within:border-[#22C55E] focus-within:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all overflow-hidden shadow-inner">
                    <User className="w-5 h-5 text-[#22C55E]/40 group-focus-within:text-[#22C55E] mr-3 transition-colors" />
                    <Input
                      placeholder="Nombre, Email o WhatsApp"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="border-none bg-transparent p-0 text-sm font-black text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 w-full h-full"
                    />
                  </div>

                </div>
                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full h-16 rounded-3xl bg-[#4ADE80] hover:bg-[#1da850] text-[#111814] font-black uppercase text-xs tracking-widest shadow-lg shadow-[#4ADE80]/20 flex items-center justify-center gap-2"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  BUSCAR CLIENTE
                </Button>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-4"
                  >
                    <p className="text-[10px] font-black text-[#22C55E] uppercase tracking-widest ml-1">Selecciona al cliente correcto ({searchResults.length})</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {searchResults.map((customer, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedCustomer(customer)}
                          className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all cursor-pointer shadow-sm ${selectedCustomer?.telefono === customer.telefono
                            ? 'border-[#22C55E] bg-green-50 shadow-[#22C55E]/10'
                            : 'border-transparent bg-gray-50/80 hover:border-green-200 hover:bg-white hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                              <img src={`https://ui-avatars.com/api/?name=${customer.nombre || customer.telefono}&background=22C55E&color=fff`} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 leading-none mb-1">{customer.nombre || 'Comensal Anónimo'}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{customer.telefono}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge className="bg-[#4ADE80] text-[#111814] text-[10px] font-black rounded-lg px-2 py-0.5">
                              {customer.puntos_disponibles.toLocaleString()} PTS
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {/* Selected Customer Card (Inside Column) */}
                {selectedCustomer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-5 rounded-[2rem] border-2 border-[#22C55E]/30 bg-green-50 flex items-center gap-4 relative"
                  >
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={`https://ui-avatars.com/api/?name=${selectedCustomer.nombre || selectedCustomer.telefono}&background=22C55E&color=fff`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase leading-none mb-1">{selectedCustomer.nombre || 'Cliente'}</h4>
                      <p className="text-[10px] font-bold text-[#22C55E] animate-pulse">CLIENTE SELECCIONADO</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Card Acreditar Puntos */}
          <Card className="rounded-3xl border-2 border-gray-100 shadow-sm bg-gray-50/30 overflow-hidden group order-2 lg:order-none">
            <CardHeader className="px-5 md:px-8 pt-6 md:pt-8 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <CardTitle className="text-[11px] font-black text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    {creditMode === 'compra' ? 'Calculadora' : 'Manual'}
                  </CardTitle>
                </div>
                <div className="flex p-1 bg-gray-100 rounded-xl shadow-inner shrink-0">
                  <button
                    onClick={() => setCreditMode('compra')}
                    className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${creditMode === 'compra'
                      ? 'bg-white text-[#22C55E] shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    $ COMPRA
                  </button>
                  <button
                    onClick={() => setCreditMode('manual')}
                    className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${creditMode === 'manual'
                      ? 'bg-white text-[#22C55E] shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    MANUAL
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 md:px-8 pb-8 md:pb-10 flex flex-col items-center justify-center min-h-[380px] md:min-h-[420px]">


              <div className="w-full space-y-12 animate-in fade-in zoom-in duration-500">
                {(!config.pesos_por_punto || config.pesos_por_punto <= 0) ? (
                  <div className="flex flex-col items-center justify-center space-y-6 text-center h-full min-h-[300px]">
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-2 shadow-sm border border-green-100">
                      <Trophy className="w-8 h-8 text-[#22C55E]" />
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configuración Requerida</h3>
                      <p className="text-gray-400 text-[10px] font-medium leading-relaxed">
                        Aún no has definido cuánto dinero equivale a 1 punto. Configura esto para usar la calculadora.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const el = document.getElementById('loyalty-config-input');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setTimeout(() => el.focus(), 500);
                        }
                      }}
                      className="bg-[#4ADE80] text-[#111814] font-black text-[10px] tracking-widest px-8 py-6 rounded-full hover:bg-[#1da850] shadow-xl shadow-green-200 transition-all hover:scale-105 active:scale-95"
                    >
                      IR A CONFIGURACIÓN
                    </Button>
                  </div>
                ) : (
                  <>
                    {creditMode === 'compra' ? (
                      <div className="flex flex-col items-center w-full max-w-sm space-y-10 mx-auto">
                        <div className="space-y-4 text-center w-full">
                          <label className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Monto de la Compra</label>
                          <div className="relative group flex justify-center">
                            <div className="absolute left-8 h-full flex items-center z-10">
                              <span className="text-3xl font-black text-[#22C55E] leading-none">$</span>
                            </div>
                            <Input
                              type="number"
                              value={purchaseAmount || ''}
                              onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                              onWheel={(e) => e.target.blur()}
                              placeholder="0"
                              className="w-full h-20 md:h-24 bg-white border-2 border-gray-200 rounded-[2rem] md:rounded-[2.5rem] py-6 pl-14 pr-14 md:pl-16 md:pr-16 text-4xl md:text-5xl font-black text-gray-900 text-center focus-visible:ring-0 focus:border-[#22C55E] focus:shadow-[0_0_30px_rgba(34,197,94,0.1)] outline-none transition-all placeholder:text-gray-100 shadow-inner"
                            />
                            <div className="absolute right-8 h-full flex flex-col justify-center gap-1.5 z-10">
                              <button onClick={() => setPurchaseAmount(prev => prev + 1000)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-[#22C55E] text-gray-300 transition-all border border-gray-300">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => setPurchaseAmount(prev => Math.max(0, prev - 1000))} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-green-50 hover:text-[#22C55E] text-gray-300 transition-all border border-gray-300">
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center">
                          <div className="text-7xl font-black text-[#22C55E] leading-none">
                            {Math.floor(purchaseAmount / (config.pesos_por_punto || 1))}
                          </div>
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mt-4 mb-2">Puntos Calculados</span>
                          <div className="bg-green-50 px-4 py-1.5 rounded-full text-[9px] font-bold text-[#22C55E] tracking-tight border border-green-100">
                            Rate: ${config.pesos_por_punto} = 1 Pt
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-12">
                        <div className="flex items-center gap-6 md:gap-12">
                          <button
                            onClick={() => setManualPoints(Math.max(0, manualPoints - 1))}
                            className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center text-gray-300 hover:bg-green-50 hover:border-[#22C55E] hover:text-[#22C55E] transition-all active:scale-90 hover:shadow-md"
                          >
                            <Minus className="w-6 h-6 md:w-10 md:h-10" />
                          </button>

                          <div className="text-center group relative">
                            <div className="absolute inset-0 bg-[#4ADE80]/5 blur-3xl rounded-full transition-all group-hover:bg-[#4ADE80]/10" />
                            <span className="text-7xl md:text-9xl font-black text-[#22C55E] leading-none relative z-10 drop-shadow-sm">
                              {manualPoints}
                            </span>
                            <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] mt-4 md:mt-6 relative z-10">Puntos a otorgar</p>
                          </div>

                          <button
                            onClick={() => setManualPoints(manualPoints + 1)}
                            className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center text-gray-300 hover:bg-green-50 hover:border-[#22C55E] hover:text-[#22C55E] transition-all active:scale-90 hover:shadow-md"
                          >
                            <Plus className="w-6 h-6 md:w-10 md:h-10" />
                          </button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 pt-6">
                          {[5, 10, 20, 50, 100].map(val => (
                            <button
                              key={val}
                              onClick={() => setManualPoints(prev => prev + val)}
                              className="w-[70px] h-14 rounded-2xl border-2 border-gray-200 bg-white text-xs font-black text-gray-400 hover:bg-[#4ADE80] hover:text-[#111814] hover:border-[#4ADE80] transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-lg hover:shadow-[#4ADE80]/20 flex items-center justify-center"
                            >
                              +{val}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleAwardPoints}
                      disabled={awarding || !selectedCustomer || (creditMode === 'compra' ? purchaseAmount <= 0 : manualPoints <= 0)}
                      className={`w-full h-20 md:h-24 rounded-[2rem] md:rounded-[3rem] font-black uppercase text-xs md:text-sm tracking-[0.2em] md:tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-4 md:gap-6 group overflow-hidden ${selectedCustomer && (creditMode === 'compra' ? purchaseAmount > 0 : manualPoints > 0)
                        ? 'bg-[#4ADE80] text-[#111814] hover:bg-[#22C55E] shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-95 border-none'
                        : 'bg-transparent text-[#22C55E] border-4 border-[#22C55E]/20 cursor-not-allowed opacity-40'
                        }`}
                    >
                      {awarding ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <div className={`p-3 rounded-full transition-colors duration-500 ${selectedCustomer && (creditMode === 'compra' ? purchaseAmount > 0 : manualPoints > 0) ? 'bg-[#111814]/10' : 'bg-[#4ADE80]/10'}`}>
                          <Check className="w-8 h-8" />
                        </div>
                      )}
                      <span className="flex flex-col items-start leading-none text-left">
                        <span className="text-[10px] opacity-60 mb-1">Confirmar Operación</span>
                        <span className="tracking-tight">
                          ACREDITAR {creditMode === 'compra' ? Math.floor(purchaseAmount / (config.pesos_por_punto || 1)) : manualPoints} PUNTOS
                        </span>
                      </span>
                    </Button>
                  </>
                )}

                {!selectedCustomer && (
                  <p className="text-center text-[9px] font-black text-gray-600 uppercase tracking-widest animate-pulse">
                    ⚠️ Selecciona un cliente para habilitar la acreditación
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
            </div>
          </CardContent>
        </Card>

        {/* SECTION: ACREDITACIONES RECIENTES */}
        <Card className="border-none shadow-xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white order-4">
          <CardHeader className="px-6 md:px-10 pt-8 pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-white to-gray-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-white shadow-lg shadow-[#4ADE80]/25 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base font-black text-gray-900 uppercase tracking-widest">
                    Acreditaciones Recientes
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Historial de los últimos puntos otorgados a tus comensales
                  </CardDescription>
                </div>
              </div>
              <Link to={`/dashboard/${slug}/fidelidad/historial`} className="shrink-0">
                <Button
                  variant="outline"
                  className="h-10 px-4 bg-white border-2 border-green-100 text-[#22C55E] hover:bg-green-50 hover:border-green-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                >
                  <span className="hidden sm:inline">VER HISTORIAL COMPLETO</span>
                  <span className="sm:hidden">HISTORIAL</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/30">
                    <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Cliente</th>
                    <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Monto</th>
                    <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Puntos</th>
                    <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Fecha</th>
                    <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.length > 0 ? (
                    currentItems.map((credit, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-50 flex items-center justify-center text-[#22C55E] font-black text-[9px] md:text-[10px] uppercase shrink-0">
                              {(credit.nombre || 'C').split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[80px] md:max-w-none">{credit.nombre}</span>
                          </div>
                        </td>
                        <td className="px-5 md:px-8 py-4 md:py-5">
                          <span className="text-gray-900 font-bold text-xs md:text-sm whitespace-nowrap">
                            {credit.monto ? formatCurrency(credit.monto) : '-'}
                          </span>
                        </td>
                        <td className="px-5 md:px-8 py-4 md:py-5">
                          <span className="text-[#22C55E] font-black text-xs md:text-sm whitespace-nowrap">+{credit.puntos} pts</span>
                        </td>
                        <td className="px-5 md:px-8 py-4 md:py-5 text-gray-400 font-bold text-[10px] md:text-xs italic whitespace-nowrap">
                          {credit.fecha}
                        </td>
                        <td className="px-5 md:px-8 py-4 md:py-5 text-right">
                          <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest border-green-100 text-[#22C55E] whitespace-nowrap">
                            {credit.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">No hay acreditaciones recientes</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Footer */}
            {recentCredits.length > 0 && (
              <div className="px-8 py-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  MOSTRANDO {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, recentCredits.length)} DE {recentCredits.length} CLIENTES
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-200 text-gray-400 hover:text-[#22C55E] hover:border-[#22C55E] hover:bg-white transition-all disabled:opacity-50"
                  >
                    ANTERIOR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-[#4ADE80] text-[#22C55E] hover:bg-[#4ADE80] hover:text-[#111814] transition-all shadow-sm shadow-green-100 disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none"
                  >
                    SIGUIENTE
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout >
  );
}
