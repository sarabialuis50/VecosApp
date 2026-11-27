import { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Loader2,
  Play,
  Coins,
  Gift,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Ticket,
  RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import RuletaPremiosModal from '@/components/RuletaPremiosModal';
import {
  DEFAULT_WHEEL_CONFIG,
  loadWheelConfigLocal,
  saveWheelConfigLocal,
  loadWheelHistoryLocal,
} from '@/utils/wheelDefaults';

const PRIZE_TYPE_LABELS = {
  puntos: 'Puntos directos',
  regalo: 'Regalo sorpresa',
  nada: 'Inténtalo mañana',
  descuento: 'Descuento %',
  domicilio_gratis: 'Domicilio gratis',
  reintento: 'Un intento más',
  producto: 'Producto gratis',
  multiplicador: 'Doble puntos',
  upgrade: 'Upgrade',
};

export default function RuletaAdminSection({ slug, api, businessName = "Veco's Restaurante" }) {
  const [wheelConfig, setWheelConfig] = useState(() => loadWheelConfigLocal());
  const [history, setHistory] = useState(() => loadWheelHistoryLocal());
  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchWheelData = async () => {
      try {
        const [cfgRes, histRes] = await Promise.all([
          api().get(`/loyalty/${slug}/wheel/config`).catch(() => null),
          api().get(`/loyalty/${slug}/wheel/history`).catch(() => null),
        ]);
        if (cfgRes?.data && Array.isArray(cfgRes.data.segmentos)) {
          setWheelConfig({ ...DEFAULT_WHEEL_CONFIG, ...cfgRes.data });
        }
        if (Array.isArray(histRes?.data)) {
          setHistory(histRes.data);
        }
      } catch {
        // Fallback already loaded from localStorage
      }
    };
    if (slug && api) fetchWheelData();
  }, [slug]);

  const totalProbability = (wheelConfig.segmentos || []).reduce(
    (sum, s) => sum + (Number(s.probabilidad) || 0),
    0
  );

  const updateSegment = (index, field, value) => {
    setWheelConfig((prev) => {
      const nextSegments = prev.segmentos.map((seg, i) =>
        i === index ? { ...seg, [field]: value } : seg
      );
      return { ...prev, segmentos: nextSegments };
    });
  };

  const handleSaveWheel = async () => {
    if (totalProbability !== 100) {
      toast.error(`La suma de probabilidades debe ser exactamente 100% (actualmente es ${totalProbability}%).`);
      return;
    }

    setSaving(true);
    try {
      saveWheelConfigLocal(wheelConfig);
      await api().post(`/loyalty/${slug}/wheel/config`, wheelConfig).catch(() => {});
      toast.success('¡Configuración de la Ruleta guardada correctamente!');
    } catch {
      toast.error('Error al guardar la configuración de la ruleta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
      <CardHeader className="px-6 md:px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50/70 via-white to-emerald-50/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-400/25 shrink-0">
              <RotateCw className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <CardTitle className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">
                  Ruleta de Recompensas (Diaria + Puntos)
                </CardTitle>
                <Badge className="bg-amber-500/15 text-amber-700 border border-amber-300 text-[9px] font-black uppercase shrink-0">
                  Presupuesto Controlado
                </Badge>
              </div>
              <CardDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                1 giro gratis diario para todos los clientes + giros extra canjeando puntos, con probabilidades reales y topes diarios.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap self-start xl:self-auto">
            <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Switch
                id="wheel-active-switch"
                checked={!!wheelConfig.activo}
                onCheckedChange={(checked) => setWheelConfig({ ...wheelConfig, activo: checked })}
                className="scale-90"
              />
              <Label htmlFor="wheel-active-switch" className="text-[10px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap">
                {wheelConfig.activo ? 'Activa' : 'Pausada'}
              </Label>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreviewOpen(true)}
              className="h-9 px-3 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 font-black text-[11px] uppercase tracking-wide gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Play className="w-3 h-3 fill-amber-600" />
              Probar Ruleta
            </Button>

            <Button
              type="button"
              onClick={handleSaveWheel}
              disabled={saving}
              className="h-9 px-3.5 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-[11px] uppercase tracking-wide shadow-md shadow-[#4ADE80]/20 gap-1.5 whitespace-nowrap"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar Ruleta
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-10 space-y-8">
        {/* Control Panels: Option A + Option B + Budget Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Opción A: Tiro diario gratis */}
          <div className="p-5 rounded-3xl border-2 border-emerald-100 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#22C55E]" />
              <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                Opción A: Giro Gratis Diario
              </p>
            </div>
            <p className="text-[11px] text-gray-500">
              Cada cliente con su WhatsApp recibe un giro gratuito al día para generar hábito.
            </p>
            <div className="space-y-1 pt-1">
              <Label className="h-5 flex items-center text-[9px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap">
                Giros gratis por día / cliente
              </Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={wheelConfig.tiros_gratis_dia ?? 1}
                onChange={(e) =>
                  setWheelConfig({ ...wheelConfig, tiros_gratis_dia: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="h-11 rounded-xl bg-white border-emerald-200 font-black text-center"
              />
            </div>
          </div>

          {/* Opción B: Giros extra con puntos */}
          <div className="p-5 rounded-3xl border-2 border-amber-100 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Opción B: Giros con Puntos
                </p>
              </div>
              <Switch
                checked={!!wheelConfig.permitir_tiro_puntos}
                onCheckedChange={(checked) =>
                  setWheelConfig({ ...wheelConfig, permitir_tiro_puntos: checked })
                }
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Permite que el cliente canjee puntos acumulados para girar nuevamente hoy.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="h-5 flex items-center text-[9px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap">
                  Costo (Puntos)
                </Label>
                <Input
                  type="number"
                  min="5"
                  disabled={!wheelConfig.permitir_tiro_puntos}
                  value={wheelConfig.costo_tiro_puntos ?? 30}
                  onChange={(e) =>
                    setWheelConfig({ ...wheelConfig, costo_tiro_puntos: Math.max(1, parseInt(e.target.value) || 0) })
                  }
                  className="h-11 rounded-xl bg-white border-amber-200 font-black text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="h-5 flex items-center text-[9px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap">
                  Máx. / día
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  disabled={!wheelConfig.permitir_tiro_puntos}
                  value={wheelConfig.max_tiros_puntos_dia ?? 2}
                  onChange={(e) =>
                    setWheelConfig({ ...wheelConfig, max_tiros_puntos_dia: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="h-11 rounded-xl bg-white border-amber-200 font-black text-center"
                />
              </div>
            </div>
          </div>

          {/* Control de Presupuesto y Vigencia */}
          <div className="p-5 rounded-3xl border-2 border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                Reglas Redención de Premios
              </p>
            </div>
            <p className="text-[11px] text-gray-500">
              Protege tu margen exigiendo consumo mínimo y expiración corta del cupón.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="h-5 flex items-center text-[9px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap" title="Compra mín. ($)">
                  Compra mín. ($)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={wheelConfig.compra_minima_cupon ?? 20000}
                  onChange={(e) =>
                    setWheelConfig({ ...wheelConfig, compra_minima_cupon: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="h-11 rounded-xl bg-white border-slate-200 font-black text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="h-5 flex items-center text-[9px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap" title="Vigencia (Horas)">
                  Vigencia (Horas)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={wheelConfig.vigencia_horas ?? 48}
                  onChange={(e) =>
                    setWheelConfig({ ...wheelConfig, vigencia_horas: Math.max(1, parseInt(e.target.value) || 24) })
                  }
                  className="h-11 rounded-xl bg-white border-slate-200 font-black text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Activity Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-xs font-black text-gray-800 uppercase tracking-wider">Período de actividad (Opcional)</p>
              <p className="text-[10px] text-gray-500">Déjalo vacío para mantener la ruleta activa de forma continua.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={wheelConfig.fecha_inicio || ''}
              onChange={(e) => setWheelConfig({ ...wheelConfig, fecha_inicio: e.target.value })}
              className="h-9 rounded-xl bg-white text-xs font-semibold w-36"
            />
            <span className="text-xs text-gray-400 font-bold">a</span>
            <Input
              type="date"
              value={wheelConfig.fecha_fin || ''}
              onChange={(e) => setWheelConfig({ ...wheelConfig, fecha_fin: e.target.value })}
              className="h-9 rounded-xl bg-white text-xs font-semibold w-36"
            />
          </div>
        </div>

        {/* Regalo Sorpresa Configurable por el Admin */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              🎉 Regalo Sorpresa Actual
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              Define qué premio recibirá el cliente cuando caiga en la casilla <b>Regalo sorpresa</b> (ej. Postre del día, Limonada natural, Papas).
            </p>
          </div>
          <Input
            type="text"
            value={wheelConfig.regalo_sorpresa_detalle || ''}
            onChange={(e) => setWheelConfig({ ...wheelConfig, regalo_sorpresa_detalle: e.target.value })}
            placeholder="Ej: Postre o bebida del día"
            className="h-10 rounded-xl bg-white border-emerald-200 text-xs font-bold sm:w-72"
          />
        </div>

        {/* 7 Segments Editor */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                Estructura de los 7 Segmentos y Probabilidades
              </h3>
              <p className="text-[11px] text-gray-500">
                Premios absolutos: +5 Puntos, Regalo sorpresa, Inténtalo mañana, 10% y 15% descuento, Domicilio Gratis y Un intento más.
              </p>
            </div>
            <Badge
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                totalProbability === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {totalProbability === 100 ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Total: 100%
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Total: {totalProbability}% (Debe sumar 100%)
                </span>
              )}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Premio Visible</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-center">Probabilidad (%)</th>
                  <th className="py-3.5 px-4 text-center">Tope Diario</th>
                  <th className="py-3.5 px-4 text-center">Costo Aprox.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {(wheelConfig.segmentos || []).map((seg, idx) => (
                  <tr key={seg.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-black text-gray-400">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-sm shadow-sm"
                        style={{ backgroundColor: `${seg.color}22`, border: `2px solid ${seg.color}` }}
                      >
                        {seg.emoji}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        value={seg.label}
                        onChange={(e) => updateSegment(idx, 'label', e.target.value)}
                        className="h-9 rounded-xl bg-white border-gray-200 text-xs font-bold min-w-[170px]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-bold bg-white border-gray-200 whitespace-nowrap">
                        {PRIZE_TYPE_LABELS[seg.tipo] || seg.tipo}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={seg.probabilidad}
                          onChange={(e) => updateSegment(idx, 'probabilidad', Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-9 w-16 rounded-xl bg-white border-gray-200 text-xs font-black text-center"
                        />
                        <span className="text-[10px] font-black text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={seg.limite_diario}
                        onChange={(e) => updateSegment(idx, 'limite_diario', Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-9 w-20 mx-auto rounded-xl bg-white border-gray-200 text-xs font-black text-center"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold text-gray-500">{seg.costo_aprox || 'Bajo'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Spins Log */}
        {history.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#22C55E]" />
              Últimos Premios Entregados ({history.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{h.premio_emoji || '🎁'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{h.premio_label}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {h.telefono} • {h.modo === 'puntos' ? `-${h.puntos_usados} pts` : 'Giro gratis'}
                      </p>
                    </div>
                  </div>
                  {h.codigo_cupon ? (
                    <Badge className="bg-amber-100 text-amber-800 border-none font-mono text-[9px] font-black shrink-0">
                      {h.codigo_cupon}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black shrink-0">
                      Acreditado
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Admin Live Preview Modal */}
      <RuletaPremiosModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        slug={slug}
        businessName={businessName}
        configOverride={wheelConfig}
        previewMode={true}
      />
    </Card>
  );
}
