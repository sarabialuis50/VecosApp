import { useState, useEffect } from 'react';
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

export default function RuletaPremiosModal({
  open,
  onOpenChange,
  slug = 'demo-restaurante',
  businessName = 'Fogón & Mesa',
  configOverride = null,
  previewMode = false,
  onSpinComplete = null,
}) {
  const [wheelConfig, setWheelConfig] = useState(() => configOverride || loadWheelConfigLocal());
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('fogon_mesa_customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [identified, setIdentified] = useState(previewMode);
  const [customerStatus, setCustomerStatus] = useState({
    puntos_disponibles: 50,
    tiros_gratis_restantes: 1,
    tiros_puntos_restantes: 2,
    costo_tiro_puntos: 30,
    permitir_tiro_puntos: true,
    historial_cliente: [],
  });

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winResult, setWinResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync config whenever modal opens or configOverride changes
  useEffect(() => {
    if (open) {
      const cfg = configOverride || loadWheelConfigLocal();
      setWheelConfig(cfg);
      setWinResult(null);
      setCopiedCode(false);
      if (previewMode) {
        setIdentified(true);
        setCustomerStatus({
          puntos_disponibles: 120,
          tiros_gratis_restantes: cfg.tiros_gratis_dia ?? 1,
          tiros_puntos_restantes: cfg.permitir_tiro_puntos ? (cfg.max_tiros_puntos_dia ?? 2) : 0,
          costo_tiro_puntos: cfg.costo_tiro_puntos ?? 30,
          permitir_tiro_puntos: !!cfg.permitir_tiro_puntos,
          historial_cliente: [],
        });
      } else if (phone && phone.replace(/\D/g, '').length >= 7) {
        refreshLocalCustomerStatus(phone, cfg);
        setIdentified(true);
      } else {
        setIdentified(false);
      }
    }
  }, [open, configOverride, previewMode]);

  const refreshLocalCustomerStatus = (rawPhone, cfgInput) => {
    const cfg = cfgInput || wheelConfig;
    const cleanPhone = String(rawPhone).replace(/\D/g, '');
    const history = loadWheelHistoryLocal();
    const today = getTodayDateStr();
    const userToday = history.filter((h) => h.telefono === cleanPhone && h.fecha_dia === today);
    const freeUsed = userToday.filter((h) => h.modo === 'gratis').length;
    const pointsUsed = userToday.filter((h) => h.modo === 'puntos').length;

    // Read customer points from localStorage or default 60 pts welcome balance in demo
    let pointsBalance = 60;
    try {
      const savedPts = localStorage.getItem(`fogon_mesa_pts_${cleanPhone}`);
      if (savedPts !== null) pointsBalance = Number(savedPts);
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

  const handleIdentify = (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      toast.error('Ingresa un número de WhatsApp válido (mínimo 7 dígitos)');
      return;
    }
    try {
      localStorage.setItem('fogon_mesa_customer_phone', cleanPhone);
    } catch {}
    setPhone(cleanPhone);
    refreshLocalCustomerStatus(cleanPhone, wheelConfig);
    setIdentified(true);
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
    const { segment, index } = pickWeightedSegment(segments, todayAll);

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
    setRotation(nextRotation);

    const couponCode = segment.tipo === 'puntos' ? null : generateCouponCode(segment);
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
      codigo_cupon: couponCode,
      modo: usePoints ? 'puntos' : 'gratis',
      puntos_usados: usePoints ? costPoints : 0,
      compra_minima: segment.tipo === 'puntos' ? 0 : (cfg.compra_minima_cupon || 0),
      expira_en: expiresAt,
      fecha_dia: today,
      created_at: new Date().toISOString(),
    };

    // Wait for wheel spin animation (4.4s) to finish before revealing prize
    setTimeout(() => {
      setIsSpinning(false);
      setWinResult(record);

      if (!previewMode) {
        let nextPoints = customerStatus.puntos_disponibles;
        if (usePoints) nextPoints = Math.max(0, nextPoints - costPoints);
        if (segment.tipo === 'puntos') nextPoints += Number(segment.valor || 5);

        try {
          localStorage.setItem(`fogon_mesa_pts_${cleanPhone}`, String(nextPoints));
        } catch {}

        const updatedHistory = [record, ...history];
        saveWheelHistoryLocal(updatedHistory);
        refreshLocalCustomerStatus(cleanPhone, cfg);
        if (onSpinComplete) onSpinComplete(record);
      }

      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#4ADE80', '#F59E0B', '#3B82F6', '#EC4899', '#FFFFFF'],
        });
      } catch {}
    }, 4500);
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
      <DialogContent className="sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border-none bg-gradient-to-b from-[#0F172A] via-[#131F35] to-[#0F172A] text-white max-h-[94vh] overflow-y-auto">
        {/* Top Glowing Banner */}
        <div className="relative px-6 pt-6 pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {previewMode ? 'Modo Vista Previa (Admin)' : `${businessName} • Premios Diarios`}
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl md:text-3xl font-black text-center tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-[#4ADE80] bg-clip-text text-transparent">
              {wheelConfig?.titulo || 'Ruleta del Día'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 text-center font-medium">
              {wheelConfig?.subtitulo || '¡Gira y gana premios instantáneos para tu próximo pedido!'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step 1: Quick WhatsApp Identification (Customer Mode) */}
        {!identified && !previewMode ? (
          <form onSubmit={handleIdentify} className="px-6 pb-8 pt-2 space-y-5">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Ingresa tu WhatsApp para girar</p>
                  <p className="text-[11px] text-slate-400">
                    Tienes <strong className="text-[#4ADE80]">{wheelConfig.tiros_gratis_dia || 1} tiro gratis hoy</strong> y nunca pierdes.
                  </p>
                </div>
              </div>

              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 300 123 4567"
                className="h-12 rounded-2xl bg-white/10 border-white/15 text-white placeholder:text-slate-400 text-center font-black text-base tracking-wider focus-visible:ring-[#4ADE80]"
                required
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] hover:brightness-110 text-[#0F172A] font-black text-sm uppercase tracking-wider shadow-lg shadow-[#4ADE80]/30"
              >
                <Gift className="w-4 h-4 mr-2" />
                Desbloquear mi Giro Gratis
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" /> 100% Premios reales</span>
              <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-400" /> Suma puntos siempre</span>
            </div>
          </form>
        ) : (
          <div className="px-5 pb-6 space-y-5">
            {/* Customer Balance & Spins Bar */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-medium">Tus puntos:</span>
                <span className="font-black text-amber-300">{customerStatus.puntos_disponibles} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                {customerStatus.tiros_gratis_restantes > 0 ? (
                  <Badge className="bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 text-[10px] font-black">
                    {customerStatus.tiros_gratis_restantes} Giro Gratis Hoy
                  </Badge>
                ) : (
                  <Badge className="bg-white/10 text-slate-300 border-none text-[10px] font-bold">
                    Giro gratis usado
                  </Badge>
                )}
              </div>
            </div>

            {/* THE WHEEL */}
            <div className="relative flex items-center justify-center py-2">
              {/* Top Pointer Arrow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                <svg width="34" height="38" viewBox="0 0 34 38">
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
              <div className="relative p-3 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(250,204,21,0.3)]">
                {/* Decorative Rim Lights */}
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i * 360) / 16;
                  return (
                    <span
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${
                        i % 2 === 0 ? 'bg-white animate-pulse' : 'bg-[#4ADE80]'
                      }`}
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-150px)`,
                      }}
                    />
                  );
                })}

                {/* Spinning SVG Wheel */}
                <div
                  className="w-[280px] h-[280px] sm:w-[292px] sm:h-[292px] rounded-full overflow-hidden border-4 border-[#0F172A]"
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
                      const emojiPos = polarToCartesian(150, 150, 114, midAngle);
                      const textPos = polarToCartesian(150, 150, 78, midAngle);
                      const shortLabel =
                        seg.label.length > 14 ? `${seg.label.slice(0, 13)}…` : seg.label;

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
                            fontSize="20"
                            transform={`rotate(${midAngle}, ${emojiPos.x}, ${emojiPos.y})`}
                          >
                            {seg.emoji || '🎁'}
                          </text>
                          <text
                            x={textPos.x}
                            y={textPos.y}
                            fill={seg.textColor || '#FFFFFF'}
                            fontSize="9.5"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midAngle - 90}, ${textPos.x}, ${textPos.y})`}
                          >
                            {shortLabel}
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
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-b from-[#0F172A] to-slate-900 border-4 border-amber-300 shadow-xl flex flex-col items-center justify-center text-amber-300 hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 z-10"
                >
                  <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">
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
                  className="p-4 rounded-3xl bg-gradient-to-r from-[#4ADE80]/20 via-emerald-500/15 to-amber-400/20 border-2 border-[#4ADE80]/50 text-center space-y-3"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">{winResult.premio_emoji}</span>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4ADE80]">
                        ¡Felicidades, ganaste!
                      </p>
                      <p className="text-lg font-black text-white leading-tight">
                        {winResult.premio_label}
                      </p>
                    </div>
                  </div>

                  {winResult.codigo_cupon ? (
                    <div className="space-y-2">
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
                    ? `Girar de nuevo por ${customerStatus.costo_tiro_puntos} pts (${customerStatus.tiros_puntos_restantes} disp. hoy)`
                    : `Necesitas ${customerStatus.costo_tiro_puntos} pts para otro giro`}
                </Button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs font-black text-amber-300">¡Has completado tus giros de hoy!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vuelve mañana por un nuevo giro gratis o redime tus cupones en tu pedido.
                  </p>
                </div>
              )}

              {!previewMode && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
                  <span>WhatsApp: {phone}</span>
                  <button
                    type="button"
                    onClick={() => setIdentified(false)}
                    className="underline hover:text-white"
                  >
                    Cambiar número
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
