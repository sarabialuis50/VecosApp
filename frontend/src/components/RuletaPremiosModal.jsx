import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Gift,
  Sparkles,
  Copy,
  Check,
  X,
  Coins,
  Clock,
  Phone,
  RotateCw,
  Ticket,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DEFAULT_WHEEL_CONFIG,
  loadWheelConfigLocal,
  loadWheelHistoryLocal,
  saveWheelHistoryLocal,
  getTodayDateStr,
  generateCouponCode,
  pickWeightedSegment,
} from '@/utils/wheelDefaults';

const polarToCartesian = (cx, cy, r, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
};

const describeSlice = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
};

const wrapWheelLabel = (rawLabel = '') => {
  const label = String(rawLabel).trim();
  if (label.length <= 13) return [label];
  const words = label.split(/\s+/);
  if (words.length >= 2) {
    let bestSplit = 1;
    let bestDiff = Infinity;
    for (let idx = 1; idx < words.length; idx++) {
      const l1 = words.slice(0, idx).join(' ');
      const l2 = words.slice(idx).join(' ');
      const diff = Math.abs(l1.length - l2.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSplit = idx;
      }
    }
    return [
      words.slice(0, bestSplit).join(' '),
      words.slice(bestSplit).join(' '),
    ];
  }
  const mid = Math.ceil(label.length / 2);
  return [label.slice(0, mid), label.slice(mid)];
};

export default function RuletaPremiosModal({
  open,
  onOpenChange,
  slug = 'demo-restaurante',
  businessName = "Veco's Restaurante",
  configOverride = null,
  previewMode = false,
  onSpinComplete = null,
  userPhone = null,
}) {
  const navigate = useNavigate();
  const [wheelConfig, setWheelConfig] = useState(() => configOverride || loadWheelConfigLocal());
  const [phone, setPhone] = useState('');
  const [identified, setIdentified] = useState(previewMode);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [customerStatus, setCustomerStatus] = useState({
    puntos_disponibles: 0,
    tiros_gratis_restantes: 1,
    tiros_puntos_restantes: 2,
    costo_tiro_puntos: 30,
    permitir_tiro_puntos: true,
    historial_cliente: [],
  });

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winResult, setWinResult] = useState(null);
  const [pendingDeliveryRecord, setPendingDeliveryRecord] = useState(null);
  const [rejectedDeliveryThisSession, setRejectedDeliveryThisSession] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Notify floating widgets (e.g. LandingAgent) when the wheel modal opens/closes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('wheel-modal-toggle', { detail: { open: Boolean(open) } }));
    return () => {
      window.dispatchEvent(new CustomEvent('wheel-modal-toggle', { detail: { open: false } }));
    };
  }, [open]);

  // Sync config & authenticated client phone automatically whenever modal opens
  useEffect(() => {
    if (!open) return;

    const cfg = configOverride || loadWheelConfigLocal();
    setWheelConfig(cfg);
    setWinResult(null);
    setCopiedCode(false);

    if (previewMode) {
      setIdentified(true);
      setCheckingAuth(false);
      setCustomerStatus({
        puntos_disponibles: 120,
        tiros_gratis_restantes: cfg.tiros_gratis_dia ?? 1,
        tiros_puntos_restantes: cfg.permitir_tiro_puntos ? (cfg.max_tiros_puntos_dia ?? 2) : 0,
        costo_tiro_puntos: cfg.costo_tiro_puntos ?? 30,
        permitir_tiro_puntos: !!cfg.permitir_tiro_puntos,
        historial_cliente: [],
      });
      return;
    }

    const resolveAuthenticatedPhone = async () => {
      let token = null;
      try {
        token = localStorage.getItem('client_token');
      } catch {}

      if (!token) {
        setPhone('');
        setIdentified(false);
        setCheckingAuth(false);
        return;
      }

      if (userPhone && String(userPhone).replace(/\D/g, '').length >= 7) {
        setPhone(String(userPhone));
        refreshLocalCustomerStatus(userPhone, cfg);
        setIdentified(true);
        setCheckingAuth(false);
        return;
      }

      if (token && token.startsWith('vecos-client-session:')) {
        const last10 = token.replace('vecos-client-session:', '');
        setPhone(last10);
        refreshLocalCustomerStatus(last10, cfg);
        setIdentified(true);
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(true);
      try {
        const rawApi =
          (import.meta.env &&
            (import.meta.env.VITE_API_URL ||
              import.meta.env.VITE_BACKEND_URL ||
              import.meta.env.REACT_APP_BACKEND_URL)) ||
          '';
        const apiBase = rawApi ? (rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`) : '/api';
        const res = await axios.get(`${apiBase}/client/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedPhone = res.data?.telefono || '';
        if (fetchedPhone && fetchedPhone.replace(/\D/g, '').length >= 7) {
          setPhone(fetchedPhone);
          refreshLocalCustomerStatus(fetchedPhone, cfg);
          setIdentified(true);
        } else {
          setPhone('');
          setIdentified(false);
        }
      } catch {
        setPhone('');
        setIdentified(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    resolveAuthenticatedPhone();
  }, [open, configOverride, previewMode, userPhone]);

  const refreshLocalCustomerStatus = (rawPhone, cfgInput) => {
    const cfg = cfgInput || wheelConfig;
    const cleanPhone = String(rawPhone).replace(/\D/g, '');
    const history = loadWheelHistoryLocal();
    const today = getTodayDateStr();
    const userToday = history.filter((h) => h.telefono === cleanPhone && h.fecha_dia === today);
    const freeUsed = userToday.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userToday.filter((h) => h.modo === 'puntos').length;

    // Read real customer points balance (defaults to 0 for newly registered customers)
    let pointsBalance = 0;
    try {
      const savedPts = localStorage.getItem(`fogon_mesa_pts_${cleanPhone}`);
      const customers = JSON.parse(localStorage.getItem('vecos_customers') || '[]');
      const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const match = (Array.isArray(customers) ? customers : []).find((c) => {
        const d = String(c.telefono || c.phone || '').replace(/\D/g, '');
        return d.slice(-10) === last10;
      });
      const dbPts = Number(match?.puntos_totales ?? match?.puntos ?? 0);
      const localPts = savedPts !== null ? Number(savedPts) : 0;
      pointsBalance = Math.max(dbPts, localPts);
    } catch {}

    setCustomerStatus({
      puntos_disponibles: pointsBalance,
      tiros_gratis_restantes: Math.max(0, (cfg.tiros_gratis_dia ?? 1) - freeUsed),
      tiros_puntos_restantes: cfg.permitir_tiro_puntos
        ? Math.max(0, (cfg.max_tiros_puntos_dia ?? 2) - pointsUsed)
        : 0,
      costo_tiro_puntos: cfg.costo_tiro_puntos ?? 30,
      permitir_tiro_puntos: !!cfg.permitir_tiro_puntos,
      historial_cliente: history.filter((h) => h.telefono === cleanPhone).slice(0, 5),
    });
  };

  const handleGoToAccount = () => {
    onOpenChange(false);
    navigate(`/${slug}/mi-cuenta`);
  };

  const handleSpin = (usePoints = false) => {
    if (isSpinning) return;

    const cfg = wheelConfig || DEFAULT_WHEEL_CONFIG;
    const segments = cfg.segmentos || DEFAULT_WHEEL_CONFIG.segmentos;
    const cleanPhone = previewMode ? 'preview' : phone.replace(/\D/g, '');
    const costPoints = Number(cfg.costo_tiro_puntos ?? 30);

    if (!previewMode) {
      if (!usePoints && customerStatus.tiros_gratis_restantes <= 0) {
        toast.info('Ya usaste tu giro gratis de hoy. Puedes girar usando tus puntos.');
        return;
      }
      if (usePoints) {
        if (!cfg.permitir_tiro_puntos) {
          toast.error('Los giros con puntos no están activos.');
          return;
        }
        if (customerStatus.tiros_puntos_restantes <= 0) {
          toast.error(`Alcanzaste el límite de ${cfg.max_tiros_puntos_dia} giros con puntos por hoy.`);
          return;
        }
        if (customerStatus.puntos_disponibles < costPoints) {
          toast.error(`Necesitas ${costPoints} puntos para girar (tienes ${customerStatus.puntos_disponibles} pts).`);
          return;
        }
      }
    }

    const history = loadWheelHistoryLocal();
    const today = getTodayDateStr();
    const todayAll = history.filter((h) => h.fecha_dia === today);
    const excludeTypes = rejectedDeliveryThisSession ? ['domicilio_gratis'] : [];
    const { segment, index } = pickWeightedSegment(segments, todayAll, excludeTypes);

    // Calculate target rotation angle so pointer at 12 o'clock lands inside winning slice
    const sliceAngle = 360 / segments.length; // 45 deg for 8 slices
    const sliceCenter = index * sliceAngle + sliceAngle / 2;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.45);
    const desiredMod = (360 - (sliceCenter + jitter) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (desiredMod - currentMod + 360) % 360;
    const nextRotation = rotation + 5 * 360 + delta;

    setIsSpinning(true);
    setWinResult(null);
    setPendingDeliveryRecord(null);
    setRotation(nextRotation);

    const couponCode = generateCouponCode(segment);
    const expiresAt = new Date(Date.now() + (cfg.vigencia_horas || 48) * 3600 * 1000).toISOString();

    const record = {
      id: `spin-${Date.now()}`,
      telefono: cleanPhone,
      cliente_nombre: previewMode ? 'Vista Previa' : `Cliente ${cleanPhone.slice(-4)}`,
      segmento_id: segment.id,
      segmento_index: index,
      premio_label: segment.label,
      premio_emoji: segment.emoji,
      premio_tipo: segment.tipo,
      premio_valor: segment.valor,
      regalo_detalle: segment.tipo === 'regalo' ? (cfg.regalo_sorpresa_detalle || 'Regalo sorpresa de Veco\'s') : '',
      codigo_cupon: couponCode,
      modo: usePoints ? 'puntos' : 'gratis',
      puntos_usados: usePoints ? costPoints : 0,
      compra_minima: ['puntos', 'nada', 'reintento'].includes(segment.tipo) ? 0 : (cfg.compra_minima_cupon || 0),
      expira_en: expiresAt,
      fecha_dia: today,
      created_at: new Date().toISOString(),
    };

    // Wait for wheel spin animation (4.4s) to finish before revealing prize
    setTimeout(() => {
      setIsSpinning(false);

      // Caso especial: Domicilio Gratis -> preguntar si lo acepta o si está en mesa (otra oportunidad)
      if (segment.tipo === 'domicilio_gratis') {
        setPendingDeliveryRecord({ record, usePoints, costPoints, cleanPhone, cfg });
        setWinResult(record);
        return;
      }

      // Caso especial: Un intento más -> NO consume el giro ni puntos
      if (segment.tipo === 'reintento') {
        setWinResult(record);
        toast.success('🔄 ¡Ganaste un intento más! Puedes girar de nuevo gratis.');
        return;
      }

      setWinResult(record);

      if (!previewMode) {
        let nextPoints = customerStatus.puntos_disponibles;
        if (usePoints) nextPoints = Math.max(0, nextPoints - costPoints);
        if (segment.tipo === 'puntos') nextPoints += Number(segment.valor || 5);

        try {
          localStorage.setItem(`fogon_mesa_pts_${cleanPhone}`, String(nextPoints));
          // Sincronizar puntos reales con vecos_customers si existe
          const custRaw = localStorage.getItem('vecos_customers');
          if (custRaw) {
            const custs = JSON.parse(custRaw);
            const idx = custs.findIndex((c) => String(c.telefono || c.phone || '').replace(/\D/g, '') === cleanPhone);
            if (idx >= 0) {
              custs[idx].puntos = nextPoints;
              custs[idx].points = nextPoints;
              custs[idx].puntos_disponibles = nextPoints;
              if (segment.tipo === 'puntos') {
                custs[idx].puntos_totales = Number(custs[idx].puntos_totales || 0) + Number(segment.valor || 5);
              }
              localStorage.setItem('vecos_customers', JSON.stringify(custs));
              window.dispatchEvent(new CustomEvent('vecos-data-updated', { detail: { key: 'vecos_customers' } }));
            }
          }
        } catch {}

        const updatedHistory = [record, ...history];
        saveWheelHistoryLocal(updatedHistory);
        refreshLocalCustomerStatus(cleanPhone, cfg);
        if (onSpinComplete) onSpinComplete(record);
      }

      if (segment.tipo !== 'nada') {
        try {
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.55 },
            colors: ['#4ADE80', '#F59E0B', '#3B82F6', '#EC4899', '#FFFFFF'],
          });
        } catch {}
      }
    }, 4500);
  };

  const handleAcceptDeliveryPrize = () => {
    if (!pendingDeliveryRecord) return;
    const { record, usePoints, costPoints, cleanPhone, cfg } = pendingDeliveryRecord;
    if (!previewMode) {
      let nextPoints = customerStatus.puntos_disponibles;
      if (usePoints) nextPoints = Math.max(0, nextPoints - costPoints);
      try {
        localStorage.setItem(`fogon_mesa_pts_${cleanPhone}`, String(nextPoints));
      } catch {}
      const updatedHistory = [record, ...loadWheelHistoryLocal()];
      saveWheelHistoryLocal(updatedHistory);
      refreshLocalCustomerStatus(cleanPhone, cfg);
      if (onSpinComplete) onSpinComplete(record);
    }
    setPendingDeliveryRecord(null);
    toast.success('🛵 ¡Domicilio Gratis activado! Usa tu cupón en el checkout.');
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#14B8A6', '#4ADE80', '#F59E0B', '#FFFFFF'],
      });
    } catch {}
  };

  const handleRejectDeliveryPrize = () => {
    setRejectedDeliveryThisSession(true);
    setPendingDeliveryRecord(null);
    setWinResult(null);
    toast.info('🔄 ¡Perfecto! Como estás en mesa, tienes otra oportunidad (y no te volverá a salir Domicilio Gratis).');
  };

  const handleCopyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    toast.success('¡Código de cupón copiado!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const segments = wheelConfig?.segmentos || DEFAULT_WHEEL_CONFIG.segmentos;
  const sliceAngle = 360 / segments.length;

  const formatCOP = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));

  return (
    <Dialog open={open} onOpenChange={(val) => !isSpinning && onOpenChange(val)}>
      <DialogContent className="w-[94vw] sm:max-w-md md:max-w-lg rounded-[2rem] p-0 overflow-hidden border-none bg-gradient-to-b from-[#0F172A] via-[#131F35] to-[#0F172A] text-white max-h-[92dvh] overflow-y-auto">
        {/* Top Glowing Banner */}
        <div className="relative px-4 pt-4 pb-1.5 sm:px-6 sm:pt-6 sm:pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {previewMode ? 'Modo Vista Previa (Admin)' : `${businessName} • Premios Diarios`}
          </div>
          <DialogHeader className="space-y-0.5 sm:space-y-1">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-black text-center tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-[#4ADE80] bg-clip-text text-transparent">
              {wheelConfig?.titulo || 'Ruleta del Día'}
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-slate-300 text-center font-medium max-w-xs mx-auto">
              {wheelConfig?.subtitulo || '¡Gira y gana premios instantáneos para tu próximo pedido!'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step 1: Require Registered Account (Customer Mode) */}
        {checkingAuth && !previewMode ? (
          <div className="px-6 py-10 flex flex-col items-center justify-center gap-3 text-slate-300">
            <RotateCw className="w-6 h-6 animate-spin text-[#4ADE80]" />
            <p className="text-xs font-semibold">Cargando tu cuenta...</p>
          </div>
        ) : !identified && !previewMode ? (
          <div className="px-4 pb-6 pt-1 space-y-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="size-10 sm:size-11 rounded-2xl bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-white">Inicia sesión para girar la ruleta</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Tienes <strong className="text-[#4ADE80]">{wheelConfig.tiros_gratis_dia || 1} tiro gratis hoy</strong>. Tus premios y puntos se guardan automáticamente en tu perfil.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoToAccount}
                className="w-full h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] hover:brightness-110 text-[#0F172A] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#4ADE80]/30"
              >
                <Gift className="w-4 h-4 mr-2" />
                Iniciar sesión / Crear cuenta
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" /> 100% Premios reales</span>
              <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-400" /> Suma puntos siempre</span>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4 sm:px-5 sm:pb-6 space-y-3 sm:space-y-4">
            {/* Customer Balance & Spins Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-slate-300 font-medium text-[11px] sm:text-xs">Tus puntos:</span>
                <span className="font-black text-amber-300 text-xs sm:text-sm">{customerStatus.puntos_disponibles} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                {customerStatus.tiros_gratis_restantes > 0 ? (
                  <Badge className="bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 text-[9px] sm:text-[10px] font-black py-0.5 px-2">
                    {customerStatus.tiros_gratis_restantes} Giro Gratis Hoy
                  </Badge>
                ) : (
                  <Badge className="bg-white/10 text-slate-300 border-none text-[9px] sm:text-[10px] font-bold py-0.5 px-2">
                    Giro gratis usado
                  </Badge>
                )}
              </div>
            </div>

            {/* THE WHEEL */}
            <div className="relative flex items-center justify-center py-1 sm:py-2">
              {/* Top Pointer Arrow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                <svg width="28" height="32" viewBox="0 0 34 38" className="sm:w-[34px] sm:h-[38px]">
                  <polygon
                    points="17,36 2,4 32,4"
                    fill="#FACC15"
                    stroke="#0F172A"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <circle cx="17" cy="11" r="4" fill="#EF4444" />
                </svg>
              </div>

              {/* Outer Glowing Rim */}
              <div className="relative p-2 sm:p-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_35px_rgba(250,204,21,0.25)] flex items-center justify-center">
                {/* Spinning SVG Wheel */}
                <div
                  className="w-[225px] h-[225px] xs:w-[255px] xs:h-[255px] sm:w-[290px] sm:h-[290px] rounded-full overflow-hidden border-[3px] sm:border-4 border-[#0F172A]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning
                      ? 'transform 4.4s cubic-bezier(0.15, 0.72, 0.12, 0.99)'
                      : 'none',
                  }}
                >
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {segments.map((seg, i) => {
                      const startAngle = i * sliceAngle;
                      const endAngle = startAngle + sliceAngle;
                      const midAngle = startAngle + sliceAngle / 2;
                      const emojiPos = polarToCartesian(150, 150, 131, midAngle);
                      const textPos = polarToCartesian(150, 150, 81, midAngle);
                      const displayLabel = String(seg.label || '').trim();
                      const labelFontSize =
                        displayLabel.length > 16
                          ? '7.2'
                          : displayLabel.length > 13
                            ? '7.9'
                            : displayLabel.length > 10
                              ? '8.6'
                              : '9.4';

                      return (
                        <g key={seg.id || i}>
                          <path
                            d={describeSlice(150, 150, 150, startAngle, endAngle)}
                            fill={seg.color || '#10B981'}
                            stroke="#0F172A"
                            strokeWidth="2"
                          />
                          <text
                            x={emojiPos.x}
                            y={emojiPos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="16"
                            transform={`rotate(${midAngle}, ${emojiPos.x}, ${emojiPos.y})`}
                          >
                            {seg.emoji || '🎁'}
                          </text>
                          <text
                            x={textPos.x}
                            y={textPos.y}
                            fill="#FFFFFF"
                            fontSize={labelFontSize}
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midAngle - 90}, ${textPos.x}, ${textPos.y})`}
                          >
                            {displayLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Center Hub Spin Button */}
                <button
                  type="button"
                  disabled={
                    isSpinning ||
                    (!previewMode &&
                      customerStatus.tiros_gratis_restantes <= 0 &&
                      (!customerStatus.permitir_tiro_puntos ||
                        customerStatus.tiros_puntos_restantes <= 0 ||
                        customerStatus.puntos_disponibles < customerStatus.costo_tiro_puntos))
                  }
                  onClick={() => handleSpin(customerStatus.tiros_gratis_restantes <= 0 && !previewMode)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 sm:size-16 rounded-full bg-gradient-to-b from-[#0F172A] to-slate-900 border-2 sm:border-4 border-amber-300 shadow-xl flex flex-col items-center justify-center text-amber-300 hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 z-10"
                >
                  <RotateCw className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-0.5">
                    {isSpinning ? '...' : 'GIRAR'}
                  </span>
                </button>
              </div>
            </div>

            {/* Win Result Banner */}
            <AnimatePresence>
              {winResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-4 rounded-3xl border-2 text-center space-y-3 ${
                    winResult.premio_tipo === 'nada'
                      ? 'bg-slate-800/90 border-slate-600'
                      : winResult.premio_tipo === 'reintento'
                        ? 'bg-amber-500/15 border-amber-400/60'
                        : 'bg-gradient-to-r from-[#4ADE80]/20 via-emerald-500/15 to-amber-400/20 border-[#4ADE80]/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 w-full px-1">
                    <span className="text-3xl shrink-0">{winResult.premio_emoji}</span>
                    <div className="text-left min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        winResult.premio_tipo === 'nada'
                          ? 'text-slate-400'
                          : winResult.premio_tipo === 'reintento'
                            ? 'text-amber-300'
                            : 'text-[#4ADE80]'
                      }`}>
                        {winResult.premio_tipo === 'nada'
                          ? '¡Suerte para la próxima!'
                          : winResult.premio_tipo === 'reintento'
                            ? '¡Nueva oportunidad!'
                            : '¡Felicidades, ganaste!'}
                      </p>
                      <p className="text-lg sm:text-xl font-black text-white leading-snug break-words">
                        {winResult.premio_label}
                      </p>
                    </div>
                  </div>

                  {winResult.premio_tipo === 'nada' ? (
                    <p className="text-xs font-medium text-slate-300">
                      Ya usaste tu intento gratis de hoy. Vuelve mañana o compra otro intento usando tus puntos acumulados.
                    </p>
                  ) : winResult.premio_tipo === 'reintento' ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-200">
                        Este giro no consumió tu intento. ¡Vuelve a girar ahora mismo!
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          setWinResult(null);
                          handleSpin(false);
                        }}
                        className="w-full h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider"
                      >
                        🔄 Girar de nuevo ahora
                      </Button>
                    </div>
                  ) : pendingDeliveryRecord ? (
                    <div className="space-y-2.5">
                      <p className="text-xs font-medium text-slate-200">
                        ¿Vas a pedir a domicilio o estás comiendo en mesa? Si estás en mesa puedes rechazarlo y girar otra vez.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          onClick={handleAcceptDeliveryPrize}
                          className="h-10 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F172A] font-black text-[11px] uppercase tracking-wider"
                        >
                          ✅ Aceptar Domicilio
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRejectDeliveryPrize}
                          className="h-10 rounded-xl border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 font-black text-[11px] uppercase tracking-wider"
                        >
                          🔄 Estoy en mesa (Girar)
                        </Button>
                      </div>
                    </div>
                  ) : winResult.codigo_cupon ? (
                    <div className="space-y-2">
                      {winResult.premio_tipo === 'regalo' && winResult.regalo_detalle && (
                        <p className="text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
                          🎁 Regalo asignado: {winResult.regalo_detalle}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#0F172A]/80 border border-white/15">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-amber-300 shrink-0" />
                          <span className="font-mono font-black text-sm tracking-wider text-amber-300">
                            {winResult.codigo_cupon}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleCopyCoupon(winResult.codigo_cupon)}
                          className="h-8 px-3 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#0F172A] font-black text-[10px] uppercase gap-1"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode ? 'Copiado' : 'Copiar'}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-300 font-medium flex items-center justify-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-300" />
                          Válido por {wheelConfig.vigencia_horas || 48}h
                        </span>
                        {winResult.compra_minima > 0 && (
                          <span>• Consumo mín. {formatCOP(winResult.compra_minima)}</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-[#4ADE80]">
                      ✨ Se sumaron +{winResult.premio_valor || 5} puntos automáticamente a tu cuenta.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons: Option A (Free Daily) & Option B (Extra Spin with Points) */}
            <div className="space-y-2.5">
              {previewMode ? (
                <Button
                  type="button"
                  disabled={isSpinning}
                  onClick={() => handleSpin(false)}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-[#4ADE80] text-[#0F172A] font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-105"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isSpinning ? 'Girando ruleta...' : 'Probar Giro de Ruleta'}
                </Button>
              ) : customerStatus.tiros_gratis_restantes > 0 ? (
                <Button
                  type="button"
                  disabled={isSpinning}
                  onClick={() => handleSpin(false)}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#0F172A] font-black text-sm uppercase tracking-wider shadow-lg shadow-[#4ADE80]/30 hover:brightness-110"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {isSpinning ? '¡Buena suerte! Girando...' : '¡Girar Gratis Ahora!'}
                </Button>
              ) : customerStatus.permitir_tiro_puntos && customerStatus.tiros_puntos_restantes > 0 ? (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    disabled={isSpinning || customerStatus.puntos_disponibles < customerStatus.costo_tiro_puntos}
                    onClick={() => handleSpin(true)}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-[#0F172A] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:brightness-110 disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {isSpinning
                      ? 'Girando con puntos...'
                      : customerStatus.puntos_disponibles >= customerStatus.costo_tiro_puntos
                      ? `Girar de nuevo por ${customerStatus.costo_tiro_puntos} puntos`
                      : `Necesitas ${customerStatus.costo_tiro_puntos} puntos para otro giro`}
                  </Button>
                  <p className="text-[11px] text-center text-slate-300 font-medium">
                    {customerStatus.tiros_puntos_restantes === 1
                      ? 'Te queda 1 intento extra por hoy'
                      : `Te quedan ${customerStatus.tiros_puntos_restantes} intentos extra por hoy`}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs font-black text-amber-300">¡Has completado tus giros de hoy!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vuelve mañana por un nuevo giro gratis o redime tus cupones en tu pedido.
                  </p>
                </div>
              )}

              {!previewMode && phone && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 px-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span>Cuenta vinculada: <strong className="text-slate-300">{phone}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
