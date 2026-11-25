"""
Estado compartido de la Ruleta de Recompensas.

Vive en un módulo propio para que tanto server.py (endpoints) como el agente de IA
(whatsapp_agent.py) lean la misma configuración e historial sin importaciones circulares.

Nota: el almacenamiento es en memoria (igual que antes); se reinicia al reiniciar el backend.
"""
from typing import Any, Dict, List

_WHEEL_CONFIG_STORE: Dict[str, Dict[str, Any]] = {}
_WHEEL_HISTORY_STORE: Dict[str, List[Dict[str, Any]]] = {}

DEFAULT_WHEEL_CONFIG_BACKEND = {
    "activo": True,
    "titulo": "Ruleta del Día",
    "subtitulo": "¡Gira y gana premios instantáneos para tu próximo pedido!",
    "tiros_gratis_dia": 1,
    "permitir_tiro_puntos": True,
    "costo_tiro_puntos": 30,
    "max_tiros_puntos_dia": 2,
    "compra_minima_cupon": 20000,
    "vigencia_horas": 48,
    "fecha_inicio": "",
    "fecha_fin": "",
    "segmentos": [
        {"id": 1, "label": "Bebida gratis", "emoji": "🥤", "tipo": "producto", "valor": 0, "probabilidad": 5, "limite_diario": 5, "color": "#10B981", "textColor": "#FFFFFF", "costo_aprox": "Bajo"},
        {"id": 2, "label": "Postre gratis", "emoji": "🍮", "tipo": "producto", "valor": 0, "probabilidad": 5, "limite_diario": 5, "color": "#F59E0B", "textColor": "#111814", "costo_aprox": "Bajo"},
        {"id": 3, "label": "Papas o acompañ.", "emoji": "🍟", "tipo": "producto", "valor": 0, "probabilidad": 10, "limite_diario": 10, "color": "#EF4444", "textColor": "#FFFFFF", "costo_aprox": "Bajo"},
        {"id": 4, "label": "10% de descuento", "emoji": "🏷️", "tipo": "descuento", "valor": 10, "probabilidad": 20, "limite_diario": 30, "color": "#3B82F6", "textColor": "#FFFFFF", "costo_aprox": "Variable"},
        {"id": 5, "label": "15% de descuento", "emoji": "🔥", "tipo": "descuento", "valor": 15, "probabilidad": 10, "limite_diario": 15, "color": "#8B5CF6", "textColor": "#FFFFFF", "costo_aprox": "Variable"},
        {"id": 6, "label": "Doble puntos", "emoji": "⚡", "tipo": "multiplicador", "valor": 2, "probabilidad": 20, "limite_diario": 30, "color": "#EC4899", "textColor": "#FFFFFF", "costo_aprox": "Bajo"},
        {"id": 7, "label": "Upgrade bebida/plato", "emoji": "⭐", "tipo": "upgrade", "valor": 0, "probabilidad": 10, "limite_diario": 10, "color": "#14B8A6", "textColor": "#FFFFFF", "costo_aprox": "Bajo-medio"},
        {"id": 8, "label": "+5 Puntos", "emoji": "🎁", "tipo": "puntos", "valor": 5, "probabilidad": 20, "limite_diario": 999, "color": "#F97316", "textColor": "#FFFFFF", "costo_aprox": "Muy bajo"},
    ],
}
