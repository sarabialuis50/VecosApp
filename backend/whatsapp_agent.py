import os
import random

import logging
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timezone
from openai import OpenAI
from twilio.rest import Client
from supabase import create_client, Client as SupabaseClient
from ai_base import get_shared_instructions, get_fallback_message
from dotenv import load_dotenv
from whatsapp_templates import get_template_data  # Nueva importación

load_dotenv()

# Configuración de logging (stdout para Railway)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Motor de IA: DeepSeek para el canal web (motor principal), OpenAI para WhatsApp.
import ai_engine
from loyalty_store import _WHEEL_CONFIG_STORE, _WHEEL_HISTORY_STORE, DEFAULT_WHEEL_CONFIG_BACKEND

CHANNEL_WHATSAPP = "whatsapp"
CHANNEL_WEB = "web"
MAX_TOOL_ROUNDS = 5

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend ops
supabase: SupabaseClient = create_client(supabase_url, supabase_key)

logger.info(f"ENV CHECK: TWILIO_ACCOUNT_SID_MENU_IA={'SET' if os.environ.get('TWILIO_ACCOUNT_SID_MENU_IA') else 'MISSING'}")
logger.info(f"ENV CHECK: TWILIO_AUTH_TOKEN_MENU_IA={'SET' if os.environ.get('TWILIO_AUTH_TOKEN_MENU_IA') else 'MISSING'}")
logger.info(f"ENV CHECK: TWILIO_WHATSAPP_FROM_MENU_IA={'SET' if os.environ.get('TWILIO_WHATSAPP_FROM_MENU_IA') else 'MISSING'}")

# Initialize Twilio (Global Fallback - SaaS_MenuIA subaccount)
GLOBAL_TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA") or os.environ.get("TWILIO_ACCOUNT_SID")
GLOBAL_TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA") or os.environ.get("TWILIO_AUTH_TOKEN")
GLOBAL_TWILIO_NUMBER = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA") or os.environ.get("TWILIO_WHATSAPP_NUMBER")

logger.info(f"Twilio Config Loaded: SID={str(GLOBAL_TWILIO_SID)[:6]}... Number={GLOBAL_TWILIO_NUMBER}")

def get_twilio_client(sid: str = None, token: str = None):
    """Returns a Twilio client using provided credentials or global defaults"""
    return Client(sid or GLOBAL_TWILIO_SID, token or GLOBAL_TWILIO_AUTH_TOKEN)

SYSTEM_PROMPT = """
Eres Menu.IA Bot, el asistente virtual del restaurante. Tu objetivo es ayudar a los clientes a realizar pedidos de manera eficiente y amigable.

TU SITUACIÓN ACTUAL:
- Eres un asistente de IA conectado a la base de datos del restaurante.
- Debes usar las funciones disponibles para consultar el menú, buscar platos y crear pedidos.
- NUNCA inventes información sobre el menú o precios. Si no sabes algo, usa una función para averiguarlo.
- Sé conciso y directo, apropiado para WhatsApp.
- Si el cliente quiere "ver el menú", muestra las categorías principales primero o pregunta qué tipo de comida busca.

REGLAS DE INTERACCIÓN:
1. Saluda amablemente si es el inicio de la conversación.
2. Identifica la intención del usuario (ver menú, pedir plato, consultar estado, etc.).
3. Pide aclaraciones si la solicitud es ambigua (ej: "¿Qué tamaño de pizza?").
4. CONFIRMA siempre el pedido con el cliente antes de finalizarlo (items, total, dirección).
5. Solicita la dirección si es domicilio y no la tienes.
6. Solicita el nombre del cliente si no lo tienes.

FUNCIONES DISPONIBLES:
- get_menu_categories(): Obtiene las categorías del menú.
- get_products_by_category(category): Obtiene productos de una categoría.
- search_products(query): Busca productos por nombre.
- get_product_details(product_id): Obtiene detalles de un producto específico.
- create_order(order_details): Crea un nuevo pedido.
- get_order_status(order_id): Consulta el estado de un pedido.
- register_customer(nombre, email, telefono, fecha_nacimiento): Registra a un cliente.

HOY ES: {current_date}
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_menu_categories",
            "description": "Obtiene las categorías principales del menú del restaurante",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_products_by_category",
            "description": "Obtiene la lista de productos de una categoría específica",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "El nombre de la categoría (ej: 'Bebidas', 'Platos fuertes')"
                    }
                },
                "required": ["category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Busca productos en el menú por nombre o descripción",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Término de búsqueda (ej: 'hamburguesa', 'coca cola')"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "register_customer",
            "description": "Registra a un nuevo cliente en el programa de fidelización del negocio para que pueda acumular puntos y recibir beneficios.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre completo del cliente"
                    },
                    "email": {
                        "type": "string",
                        "description": "Correo electrónico del cliente"
                    },
                    "telefono": {
                        "type": "string",
                        "description": "Número de teléfono para el registro (formato internacional ej: 573...)"
                    },
                    "fecha_nacimiento": {
                        "type": "string",
                        "description": "Fecha de nacimiento (opcional, formato AAAA-MM-DD)"
                    }
                },
                "required": ["nombre", "email", "telefono"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_address",
            "description": "Guarda o actualiza la dirección de entrega del cliente. Úsala cuando el cliente proporcione su dirección por texto o comparta su ubicación GPS.",
            "parameters": {
                "type": "object",
                "properties": {
                    "direccion": {
                        "type": "string",
                        "description": "Dirección completa del cliente (calle, número, barrio, ciudad)"
                    },
                    "latitud": {
                        "type": "number",
                        "description": "Latitud GPS (opcional, si el cliente compartió ubicación)"
                    },
                    "longitud": {
                        "type": "number",
                        "description": "Longitud GPS (opcional, si el cliente compartió ubicación)"
                    }
                },
                "required": ["direccion"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_address",
            "description": "Obtiene la dirección guardada del cliente si ya tiene una registrada.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_order",
            "description": "Crea un pedido formal en el sistema una vez que el cliente ha confirmado los productos, el total y el método de entrega.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cliente_nombre": {"type": "string", "description": "Nombre del cliente"},
                    "cliente_telefono": {"type": "string", "description": "Teléfono de contacto"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "nombre": {"type": "string"},
                                "cantidad": {"type": "integer"},
                                "precio": {"type": "number"},
                                "modificadores": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Lista de opciones seleccionadas (ej: ['Grande', 'Extra Queso'])"
                                }
                            }
                        }
                    },
                    "tipo": {"type": "string", "enum": ["domicilio", "llevar", "mesa"]},
                    "direccion": {"type": "string", "description": "Dirección obligatoria si es domicilio"},
                    "metodo_pago": {"type": "string", "enum": ["Efectivo", "Nequi", "Daviplata", "Transferencia", "Tarjeta", "Bre-B", "Link"]}
                },
                "required": ["items", "tipo", "metodo_pago"]
            }
        }
    }
]

LOYALTY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_loyalty_status",
            "description": "Consulta los puntos del cliente (disponibles y acumulados), su nivel actual (Bronce, Plata u Oro) y cuántos puntos le faltan para el siguiente nivel. Úsala cuando el cliente pregunte por sus puntos, su nivel o sus beneficios.",
            "parameters": {
                "type": "object",
                "properties": {
                    "telefono": {
                        "type": "string",
                        "description": "Teléfono del cliente si es distinto al de la conversación (opcional)."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_wheel_status",
            "description": "Consulta la Ruleta de Recompensas para el cliente: si está activa, cuántos giros gratis y con puntos le quedan hoy, el costo en puntos de un giro, los premios posibles y sus últimos premios ganados.",
            "parameters": {
                "type": "object",
                "properties": {
                    "telefono": {
                        "type": "string",
                        "description": "Teléfono del cliente si es distinto al de la conversación (opcional)."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_loyalty_program_info",
            "description": "Devuelve las reglas del programa de fidelización del restaurante: cómo se ganan los puntos, los niveles y sus umbrales, y cómo funciona la ruleta. Úsala cuando pregunten cómo funciona el programa.",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
]

DEFAULT_LEVEL_THRESHOLDS = {"BRONCE": 0, "PLATA": 300, "ORO": 1000}
LEVEL_EMOJI = {"BRONCE": "🥉", "PLATA": "🥈", "ORO": "🥇"}

_MAIN_BUSINESS_CACHE: Dict[str, Any] = {}


def get_main_business() -> Optional[Dict[str, Any]]:
    """El proyecto es de un solo negocio. Se resuelve por BUSINESS_SLUG (si está definido)
    o, en su defecto, por el único/primer registro de la tabla negocios."""
    if _MAIN_BUSINESS_CACHE.get("data"):
        return _MAIN_BUSINESS_CACHE["data"]
    slug = os.environ.get("BUSINESS_SLUG", "").strip()
    query = supabase.table('negocios').select('*')
    res = (query.eq('slug', slug) if slug else query.order('created_at')).limit(1).execute()
    if res.data:
        _MAIN_BUSINESS_CACHE["data"] = res.data[0]
        return res.data[0]
    return None


def _clean_phone(phone: Optional[str]) -> str:
    raw = str(phone or "").replace("whatsapp:", "").replace("web_", "")
    return "".join(ch for ch in raw if ch.isdigit())


def _get_loyalty_config(negocio_id: str) -> Dict[str, Any]:
    try:
        res = supabase.table('fidelizacion_config').select('*').eq('negocio_id', negocio_id).limit(1).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.warning(f"No se pudo leer fidelizacion_config: {e}")
        return {}


def _level_thresholds(config: Dict[str, Any]) -> Dict[str, int]:
    return {
        "BRONCE": int(config.get("nivel_bronce_min") or DEFAULT_LEVEL_THRESHOLDS["BRONCE"]),
        "PLATA": int(config.get("nivel_plata_min") or DEFAULT_LEVEL_THRESHOLDS["PLATA"]),
        "ORO": int(config.get("nivel_oro_min") or DEFAULT_LEVEL_THRESHOLDS["ORO"]),
    }


def _compute_level(total_points: int, thresholds: Dict[str, int]) -> Dict[str, Any]:
    """Misma regla que el panel de clientes: el nivel se calcula con los puntos acumulados."""
    if total_points >= thresholds["ORO"]:
        return {"nivel": "ORO", "siguiente_nivel": None, "puntos_para_siguiente": 0}
    if total_points >= thresholds["PLATA"]:
        return {"nivel": "PLATA", "siguiente_nivel": "ORO", "puntos_para_siguiente": thresholds["ORO"] - total_points}
    return {"nivel": "BRONCE", "siguiente_nivel": "PLATA", "puntos_para_siguiente": thresholds["PLATA"] - total_points}


async def get_loyalty_status(negocio_id: str, sender_phone: str, telefono: Optional[str] = None) -> str:
    phone = _clean_phone(telefono or sender_phone)
    if not phone:
        return json.dumps({"status": "error", "message": "Necesito el número de teléfono del cliente para consultar sus puntos."})
    try:
        res = supabase.table('clientes_puntos').select('*').eq('negocio_id', negocio_id).eq('telefono', phone).limit(1).execute()
        if not res.data:
            return json.dumps({
                "status": "not_registered",
                "telefono": phone,
                "message": "El cliente aún no está inscrito en el programa de fidelización. Invítalo a registrarse."
            })
        c = res.data[0]
        disponibles = int(c.get('puntos_actuales') or 0)
        acumulados = int(c.get('puntos_totales') or 0)
        thresholds = _level_thresholds(_get_loyalty_config(negocio_id))
        level = _compute_level(acumulados, thresholds)
        return json.dumps({
            "status": "success",
            "nombre": c.get('nombre'),
            "telefono": phone,
            "puntos_disponibles": disponibles,
            "puntos_acumulados": acumulados,
            "puntos_canjeados": max(0, acumulados - disponibles),
            "nivel": f"{level['nivel']} {LEVEL_EMOJI[level['nivel']]}",
            "siguiente_nivel": level["siguiente_nivel"],
            "puntos_para_siguiente_nivel": level["puntos_para_siguiente"],
        }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error get_loyalty_status: {e}")
        return json.dumps({"status": "error", "message": "No pude consultar los puntos en este momento."})


async def get_wheel_status(negocio_id: str, sender_phone: str, telefono: Optional[str] = None) -> str:
    phone = _clean_phone(telefono or sender_phone)
    try:
        biz = supabase.table('negocios').select('slug').eq('id', negocio_id).limit(1).execute()
        slug = biz.data[0]['slug'] if biz.data else ""
        cfg = _WHEEL_CONFIG_STORE.get(slug, DEFAULT_WHEEL_CONFIG_BACKEND)
        history = _WHEEL_HISTORY_STORE.get(slug, [])
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        user_today = [h for h in history if h.get("telefono") == phone and h.get("fecha_dia") == today]
        free_used = sum(1 for h in user_today if h.get("modo") == "gratis")
        points_used = sum(1 for h in user_today if h.get("modo") == "puntos")
        allow_points = bool(cfg.get("permitir_tiro_puntos", True))
        return json.dumps({
            "status": "success",
            "activa": bool(cfg.get("activo", True)),
            "titulo": cfg.get("titulo"),
            "giros_gratis_restantes_hoy": max(0, int(cfg.get("tiros_gratis_dia", 1)) - free_used),
            "permite_girar_con_puntos": allow_points,
            "costo_giro_en_puntos": int(cfg.get("costo_tiro_puntos", 30)),
            "giros_con_puntos_restantes_hoy": max(0, int(cfg.get("max_tiros_puntos_dia", 2)) - points_used) if allow_points else 0,
            "compra_minima_para_usar_cupon": int(cfg.get("compra_minima_cupon", 20000)),
            "vigencia_cupon_horas": int(cfg.get("vigencia_horas", 48)),
            "premios_posibles": [f"{s.get('emoji', '')} {s.get('label')}" for s in cfg.get("segmentos", [])],
            "ultimos_premios_del_cliente": [
                {"premio": h.get("premio_label"), "cupon": h.get("codigo_cupon"), "expira": h.get("expira_en")}
                for h in history if h.get("telefono") == phone
            ][:5],
            "como_girar": "El cliente gira la ruleta desde la web del restaurante (sección de premios o su perfil).",
        }, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error get_wheel_status: {e}")
        return json.dumps({"status": "error", "message": "No pude consultar la ruleta en este momento."})


async def get_loyalty_program_info(negocio_id: str) -> str:
    config = _get_loyalty_config(negocio_id)
    thresholds = _level_thresholds(config)
    return json.dumps({
        "status": "success",
        "programa_activo": bool(config.get("activo", True)) if config else True,
        "pesos_por_punto": config.get("pesos_por_punto"),
        "niveles": [
            {"nivel": "BRONCE 🥉", "desde_puntos_acumulados": thresholds["BRONCE"]},
            {"nivel": "PLATA 🥈", "desde_puntos_acumulados": thresholds["PLATA"]},
            {"nivel": "ORO 🥇", "desde_puntos_acumulados": thresholds["ORO"]},
        ],
        "regla_nivel": "El nivel depende de los puntos acumulados históricamente; canjear puntos no baja de nivel.",
        "ruleta": "Hay giros gratis diarios y giros adicionales pagando con puntos. Los premios se entregan como cupón con vigencia limitada.",
        "configuracion_extra": {k: v for k, v in config.items() if k not in ("id", "negocio_id", "created_at", "updated_at")},
    }, ensure_ascii=False, default=str)


async def get_menu_items(negocio_id: str) -> List[Dict]:
    """Helper to fetch all menu items for context or tools"""
    try:
        res = supabase.table('menu_items').select('*').eq('negocio_id', negocio_id).eq('available', True).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching menu_items: {e}")
        return []

async def get_customer_name(phone: str) -> Optional[str]:
    try:
        # Remove 'whatsapp:' prefix if present
        clean_phone = phone.replace('whatsapp:', '').strip()
        res = supabase.table('clientes').select('nombre').eq('telefono', clean_phone).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]['nombre']
        return None
    except Exception:
        return None

# --- HISTORY MANAGEMENT ---

async def get_or_create_conversation(negocio_id: str, phone: str) -> str:
    """Get active conversation ID or create new one"""
    try:
        # Check for active conversation
        res = supabase.table('agent_conversations') \
            .select('id') \
            .eq('negocio_id', negocio_id) \
            .eq('phone_number', phone) \
            .eq('status', 'active') \
            .order('last_message_at', desc=True) \
            .limit(1) \
            .execute()
        
        if res.data:
            return res.data[0]['id']
        
        # Create new conversation
        try:
            supabase.table('agent_conversations').insert({
                "negocio_id": negocio_id,
                "phone_number": phone,
                "status": "active"
            }).execute()
        except Exception as e:
            # PGRST204 means success but no return body, which crashes python client sometimes
            if "PGRST204" not in str(e):
                logger.error(f"Error creating conversation: {e}")
        
        # Fetch the ID again to be sure
        res = supabase.table('agent_conversations') \
            .select('id') \
            .eq('negocio_id', negocio_id) \
            .eq('phone_number', phone) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
            
        if res.data:
            return res.data[0]['id']
        return None
    except Exception as e:
        logger.error(f"Error managing conversation: {e}")
        return None

async def save_message(conversation_id: str, direction: str, content: str):
    """Save message to history"""
    try:
        supabase.table('agent_messages').insert({
            "conversation_id": conversation_id,
            "direction": direction, # 'inbound' or 'outbound'
            "content": content,
            "message_type": "text"
        }).execute()
        
        # Update conversation timestamp
        supabase.table('agent_conversations').update({
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }).eq('id', conversation_id).execute()
        
    except Exception as e:
        logger.error(f"Error saving message: {e}")

async def get_recent_messages(conversation_id: str, limit: int = 10) -> List[Dict]:
    """Get recent messages formatted for OpenAI"""
    try:
        res = supabase.table('agent_messages') \
            .select('direction, content') \
            .eq('conversation_id', conversation_id) \
            .order('created_at', desc=True) \
            .limit(limit) \
            .execute()
        
        history = []
        # Reverse to get chronological order
        for msg in reversed(res.data):
            role = "user" if msg['direction'] == 'inbound' else "assistant"
            history.append({"role": role, "content": msg['content']})
            
        return history
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return []

ALL_TOOLS = TOOLS + LOYALTY_TOOLS


async def _execute_tool(function_name: str, function_args: Dict[str, Any], negocio_id: str, sender_phone: str) -> str:
    if function_name == "get_menu_categories":
        return await get_menu_categories(negocio_id)
    if function_name == "get_products_by_category":
        return await get_products_by_category(negocio_id, function_args.get("category", ""))
    if function_name == "search_products":
        return await search_products(negocio_id, function_args.get("query", ""))
    if function_name == "register_customer":
        return await register_customer(
            negocio_id,
            function_args.get("nombre"),
            function_args.get("email"),
            function_args.get("telefono") or _clean_phone(sender_phone),
            function_args.get("fecha_nacimiento"),
        )
    if function_name == "create_order":
        return await create_order_ai(negocio_id, function_args)
    if function_name == "save_address":
        return await save_address(negocio_id, sender_phone, function_args)
    if function_name == "get_customer_address":
        return await get_customer_address(negocio_id, sender_phone)
    if function_name == "get_loyalty_status":
        return await get_loyalty_status(negocio_id, sender_phone, function_args.get("telefono"))
    if function_name == "get_wheel_status":
        return await get_wheel_status(negocio_id, sender_phone, function_args.get("telefono"))
    if function_name == "get_loyalty_program_info":
        return await get_loyalty_program_info(negocio_id)
    return json.dumps({"status": "error", "message": f"Herramienta desconocida: {function_name}"})


def _resolve_business(negocio_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Resuelve siempre al único negocio de la aplicación."""
    if negocio_id:
        try:
            biz_res = supabase.table('negocios').select('*').eq('id', negocio_id).limit(1).execute()
            if biz_res.data:
                return biz_res.data[0]
        except Exception as e:
            logger.warning(f"No se pudo buscar negocio por id {negocio_id}: {e}")
    return get_main_business()


def _build_payment_block(biz: Dict[str, Any]) -> str:
    metodos_pago = biz.get('metodos_pago') or {}
    datos_pago = biz.get('datos_pago') or {}
    payment_lines = []
    if metodos_pago.get('efectivo'):
        payment_lines.append("- Efectivo: Pago físico al recibir o en caja.")
    if metodos_pago.get('nequi'):
        nequi_data = datos_pago.get('nequi') or {}
        parts = [f"Número: {nequi_data['numero']}"] if nequi_data.get('numero') else []
        if nequi_data.get('qr_url'):
            parts.append(f"QR: {nequi_data['qr_url']}")
        payment_lines.append(f"- Nequi: {', '.join(parts) if parts else 'Disponible'}")
    if metodos_pago.get('daviplata'):
        davi_data = datos_pago.get('daviplata') or {}
        parts = [f"Número: {davi_data['numero']}"] if davi_data.get('numero') else []
        if davi_data.get('qr_url'):
            parts.append(f"QR: {davi_data['qr_url']}")
        payment_lines.append(f"- Daviplata: {', '.join(parts) if parts else 'Disponible'}")
    if metodos_pago.get('transferencia'):
        transf_data = datos_pago.get('transferencia') or {}
        parts = [f"Banco: {transf_data['banco']}"] if transf_data.get('banco') else []
        if transf_data.get('numero_cuenta'):
            parts.append(f"Cuenta: {transf_data['numero_cuenta']}")
        payment_lines.append(f"- Transferencia: {', '.join(parts) if parts else 'Disponible'}")
    if metodos_pago.get('tarjeta'):
        tarjeta_data = datos_pago.get('tarjeta') or {}
        parts = [f"Link de pago: {tarjeta_data['link_pago']}"] if tarjeta_data.get('link_pago') else []
        if tarjeta_data.get('qr_url'):
            parts.append(f"QR: {tarjeta_data['qr_url']}")
        payment_lines.append(f"- Tarjeta / Datáfono: {', '.join(parts) if parts else 'Disponible'}")
    if metodos_pago.get('link'):
        breb_data = datos_pago.get('link') or {}
        parts = [f"Llave: {breb_data['llave']}"] if breb_data.get('llave') else []
        if breb_data.get('qr_url'):
            parts.append(f"QR: {breb_data['qr_url']}")
        payment_lines.append(f"- Bre-B: {', '.join(parts) if parts else 'Disponible'}")
    return "\n".join(payment_lines) if payment_lines else "- Efectivo"


async def process_agent_message(
    message_body: str,
    sender_phone: str,
    negocio_id: Optional[str] = None,
    channel: str = CHANNEL_WEB,
) -> str:
    """
    Agente unificado del restaurante (arquitectura de un solo negocio).
      - channel == 'web'      -> DeepSeek (motor cerebro principal de la aplicación).
      - channel == 'whatsapp' -> OpenAI (agente de WhatsApp).
    Atiende clientes, toma pedidos, registra clientes y consulta puntos, niveles y ruleta.
    """
    try:
        biz = _resolve_business(negocio_id)
        if not biz:
            return "Lo siento, el restaurante aún no está configurado en el sistema."

        negocio_id = biz['id']
        biz_name = biz.get('nombre') or 'Fogón & Mesa'
        biz_slug = biz.get('slug', '')
        ai_habilitado = biz.get('ai_habilitado', True)
        if not ai_habilitado:
            return "El asistente virtual está desactivado en este momento."

        ai_personalidad = biz.get('ai_personalidad', 'Cálido, cercano, ágil y hospitalario')
        ai_conocimiento = biz.get('ai_conocimiento', '')
        payment_info_block = _build_payment_block(biz)
        frontend_url = os.environ.get("FRONTEND_URL", "https://menuia.co").rstrip("/")
        menu_link = f"{frontend_url}/{biz_slug}/menu" if biz_slug else frontend_url

        customer_name = await get_customer_name(_clean_phone(sender_phone))
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

        provider = ai_engine.PROVIDER_OPENAI if channel == CHANNEL_WHATSAPP else ai_engine.PROVIDER_DEEPSEEK

        system_prompt = f"""
Eres el Asistente Inteligente oficial de {biz_name}. Tu objetivo es atender a los clientes con calidez, responder dudas del menú, tomar pedidos, registrar clientes en el programa de fidelización e informar sobre sus puntos, niveles y la ruleta de recompensas.

TU PERSONALIDAD:
{ai_personalidad}

CONOCIMIENTO ESPECIAL SOBRE EL NEGOCIO:
{ai_conocimiento if ai_conocimiento else 'Consulta siempre el menú real con tus herramientas para dar información exacta.'}

MÉTODOS Y DATOS DE PAGO HABILITADOS:
{payment_info_block}
- REGLA DE PAGO: Cuando el cliente seleccione un método de pago digital (Nequi, Daviplata, Transferencia, Tarjeta/Datáfono o Bre-B), proporciónale de inmediato los datos exactos configurados arriba para que pueda realizar el pago y enviar el comprobante.

MANEJO DE UBICACIÓN Y DIRECCIÓN DE ENTREGA (CRÍTICO):
- El cliente puede enviarte su dirección por texto o compartiendo su ubicación GPS ("[UBICACIÓN GPS: lat, lng]").
- Cuando comparta su dirección o GPS, usa 'save_address' para guardarla.
- ANTES de pedir la dirección, usa 'get_customer_address' para verificar si ya tiene una guardada. Si ya tiene, confirma si desea usar esa misma.
- NUNCA vuelvas a pedir la dirección si ya la proporcionó o ya está guardada.

REGISTRO DE CLIENTES, PUNTOS, NIVELES Y RULETA (PRIORIDAD ALTA):
- Si no conoces el nombre del cliente, pregúntaselo amablemente al inicio.
- Si el cliente pregunta por sus puntos, su nivel (Bronce 🥉, Plata 🥈, Oro 🥇) o cuánto le falta para subir de nivel, llama SIEMPRE a 'get_loyalty_status'.
- Si pregunta por la ruleta de premios, sus giros disponibles hoy o cupones ganados, llama SIEMPRE a 'get_wheel_status'.
- Si pregunta cómo funciona el programa de fidelización, niveles o ruleta, llama a 'get_loyalty_program_info'.
- Si el cliente no está registrado, invítalo a unirse para acumular puntos, subir de nivel y girar la ruleta.
- Para registrarlo pide: Nombre completo, Correo electrónico y Fecha de cumpleaños (opcional), y confirma el teléfono ({_clean_phone(sender_phone) or 'su número'}). Una vez tengas Nombre, Email y Teléfono, EJECUTA 'register_customer' antes de confirmar el registro.

REGLAS DE MENÚ Y PEDIDOS:
- NUNCA inventes platos ni precios. Usa 'get_menu_categories', 'get_products_by_category' o 'search_products'.
- Cuando el cliente pida ver el menú, comparte el enlace en una línea independiente (sin Markdown [texto](url)):

{menu_link}

- Al listar productos, agrúpalos por categoría, enuméralos (1, 2, 3...) y muestra el precio con '$' y puntos de miles (ej: $22.000). No incluyas URLs de imágenes.
- CONFIRMA siempre el pedido con el cliente (items, total, dirección y método de pago) antes de llamar a 'create_order'.

REGLAS GENERALES:
- Sé claro, conciso y amable.
- Dirígete al cliente por su nombre si ya lo tienes.
- NUNCA repitas preguntas ya respondidas en el historial.

HOY ES: {now} (UTC)
"""

        # 1. Gestionar historial de conversación
        conversation_id = await get_or_create_conversation(negocio_id, sender_phone)
        if conversation_id:
            await save_message(conversation_id, 'inbound', message_body)

        history_messages = await get_recent_messages(conversation_id, limit=10)

        # Inyectar contexto del cliente (nombre + dirección principal)
        customer_context = ""
        if customer_name:
            customer_context += f"\n- El cliente se llama: {customer_name}"
        try:
            addr_res = supabase.table('clientes_direcciones') \
                .select('*') \
                .eq('negocio_id', negocio_id) \
                .eq('telefono', sender_phone) \
                .eq('es_principal', True) \
                .limit(1) \
                .execute()
            if addr_res.data:
                addr = addr_res.data[0]
                customer_context += f"\n- Dirección guardada del cliente: {addr.get('direccion', '')}"
                if addr.get('latitud') and addr.get('longitud'):
                    customer_context += f" (GPS: {addr['latitud']}, {addr['longitud']})"
        except Exception as addr_err:
            logger.error(f"Error fetching customer address: {addr_err}")

        if customer_context:
            system_prompt += f"\n\nCONTEXTO DEL CLIENTE ACTUAL:{customer_context}\n"

        if not history_messages:
            messages: List[Dict[str, Any]] = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message_body},
            ]
        else:
            messages = [{"role": "system", "content": system_prompt}] + history_messages

        # 2. Ciclo de conversación con herramientas (DeepSeek para Web / OpenAI para WhatsApp)
        final_response = ""
        used_provider = provider
        for _ in range(MAX_TOOL_ROUNDS):
            response_message, used_provider = ai_engine.chat(
                messages=messages,
                provider=provider,
                tools=ALL_TOOLS,
            )
            tool_calls = getattr(response_message, "tool_calls", None)
            if not tool_calls:
                final_response = (response_message.content or "").strip()
                break

            messages.append(ai_engine.message_to_dict(response_message))
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments or "{}")
                except Exception:
                    function_args = {}

                logger.info(f"[{used_provider}/{channel}] Tool call: {function_name} args={function_args}")
                function_response = await _execute_tool(function_name, function_args, negocio_id, sender_phone)
                logger.info(f"Tool {function_name} response: {function_response}")

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response,
                })
        else:
            # Si agotó rondas de herramientas, pedir respuesta final sin tools
            final_msg, used_provider = ai_engine.chat(messages=messages, provider=provider)
            final_response = (final_msg.content or "").strip()

        if conversation_id and final_response:
            await save_message(conversation_id, 'outbound', final_response)

        return final_response

    except Exception as e:
        import traceback
        error_msg = f"Error procesando mensaje ({channel}): {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        with open("agent_errors.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- {datetime.now()} ---\n{error_msg}\n")
        return "Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?"


async def process_whatsapp_message(message_body: str, sender_phone: str, negocio_id: Optional[str] = None) -> str:
    """Agente conversacional de WhatsApp (usa OpenAI)."""
    return await process_agent_message(message_body, sender_phone, negocio_id, channel=CHANNEL_WHATSAPP)


async def process_web_message(message_body: str, sender_phone: str, negocio_id: Optional[str] = None) -> str:
    """Agente cerebro principal de la aplicación web (usa DeepSeek)."""
    return await process_agent_message(message_body, sender_phone, negocio_id, channel=CHANNEL_WEB)

# --- IMPLEMENTACIÓN DE HERRAMIENTAS ---


async def save_address(negocio_id: str, sender_phone: str, args: dict) -> str:
    """Guarda la dirección del cliente asociada al negocio."""
    try:
        direccion = args.get('direccion', '')
        latitud = args.get('latitud')
        longitud = args.get('longitud')
        
        # Buscar si ya tiene dirección guardada
        existing = supabase.table('clientes_direcciones') \
            .select('*') \
            .eq('negocio_id', negocio_id) \
            .eq('telefono', sender_phone) \
            .execute()
        
        address_data = {
            "negocio_id": negocio_id,
            "telefono": sender_phone,
            "direccion": direccion,
            "latitud": latitud,
            "longitud": longitud,
            "es_principal": True
        }
        
        if existing.data:
            # Actualizar existente
            supabase.table('clientes_direcciones') \
                .update(address_data) \
                .eq('id', existing.data[0]['id']) \
                .execute()
            return json.dumps({"status": "updated", "direccion": direccion})
        else:
            # Crear nueva
            supabase.table('clientes_direcciones').insert(address_data).execute()
            return json.dumps({"status": "saved", "direccion": direccion})
    except Exception as e:
        logger.error(f"Error save_address: {e}")
        return json.dumps({"error": str(e)})

async def get_customer_address(negocio_id: str, sender_phone: str) -> str:
    """Obtiene la dirección guardada del cliente."""
    try:
        res = supabase.table('clientes_direcciones') \
            .select('*') \
            .eq('negocio_id', negocio_id) \
            .eq('telefono', sender_phone) \
            .eq('es_principal', True) \
            .limit(1) \
            .execute()
        
        if res.data:
            addr = res.data[0]
            return json.dumps({
                "found": True,
                "direccion": addr.get('direccion', ''),
                "latitud": addr.get('latitud'),
                "longitud": addr.get('longitud')
            })
        else:
            return json.dumps({"found": False})
    except Exception as e:
        logger.error(f"Error get_customer_address: {e}")
        return json.dumps({"error": str(e)})

async def get_menu_categories(negocio_id: str) -> str:
    try:
        response = supabase.table('menu_items') \
            .select('category') \
            .eq('negocio_id', negocio_id) \
            .eq('available', True) \
            .execute()
        
        categories = list(set([item['category'] for item in response.data]))
        return json.dumps(categories)
    except Exception as e:
        logger.error(f"Error get_menu_categories: {e}")
        return json.dumps({"error": str(e)})

async def get_products_by_category(negocio_id: str, category: str) -> str:
    try:
        response = supabase.table('menu_items') \
            .select('*') \
            .eq('negocio_id', negocio_id) \
            .eq('category', category) \
            .eq('available', True) \
            .execute()
        return json.dumps(response.data)
    except Exception as e:
        logger.error(f"Error get_products_by_category: {e}")
        return json.dumps({"error": str(e)})

async def search_products(negocio_id: str, query: str) -> str:
    try:
        response = supabase.table('menu_items') \
            .select('*') \
            .eq('negocio_id', negocio_id) \
            .ilike('name', f'%{query}%') \
            .eq('available', True) \
            .execute()
        return json.dumps(response.data)
    except Exception as e:
        logger.error(f"Error search_products: {e}")
        return json.dumps({"error": str(e)})

async def create_order_ai(negocio_id: str, args: Dict[str, Any]) -> str:
    try:
        # 0. Fetch Business Data for notifications and credits
        biz_res = supabase.table('negocios').select('*').eq('id', negocio_id).execute()
        if not biz_res.data:
            return json.dumps({"status": "error", "message": "Negocio no encontrado"})
        biz_data = biz_res.data[0]
        business_name = biz_data['nombre']
        business_phone = biz_data.get('whatsapp') or biz_data.get('telefono')
        
        # Twilio Config
        twilio_config = {
            "sid": biz_data.get('twilio_sid'),
            "token": biz_data.get('twilio_token'),
            "number": biz_data.get('twilio_number')
        } if biz_data.get('twilio_sid') else None

        # 1. Calculate Total
        items = args.get('items', [])
        total = sum(item.get('precio', 0) * item.get('cantidad', 1) for item in items)
        
        tipo_ai = args.get('tipo', 'delivery')
        if tipo_ai == 'domicilio': tipo_ai = 'delivery'
        elif tipo_ai == 'llevar': tipo_ai = 'whatsapp'
        elif tipo_ai == 'mesa': tipo_ai = 'mesa'
        
        # 2. Insert order
        order_data = {
            "negocio_id": negocio_id,
            "items": items,
            "total": total,
            "cliente_nombre": args.get('cliente_nombre'),
            "cliente_telefono": args.get('cliente_telefono'),
            "tipo": tipo_ai,
            "direccion": args.get('direccion'),
            "metodo_pago": args.get('metodo_pago', 'Efectivo'),
            "estado": "pendiente",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        
        # Generar código de pedido numerico de 6 digitos (solicitado por el usuario)
        # Para asegurar que sea clickeable en WhatsApp
        random_id = random.randint(100000, 999999)
        order_data["numero_secuencial"] = random_id
        print(f"DEBUG order_data: {order_data}")
        
        # Insertar pedido en base de datos (proyecto de un solo negocio, sin modo demo)
        res = supabase.table('pedidos').insert(order_data).execute()
        order_id = res.data[0]['id'] if res.data else "new_order"

        # 3. Actualizar contador de uso y enviar notificaciones
        if True:
            wa_credits = biz_data.get('wa_credits', 0)
            wa_count = biz_data.get('wa_messages_count', 0)
            whatsapp_usados = biz_data.get('whatsapp_usados', 0)
            credits_to_deduct = 2
            
            # Always increment whatsapp_usados (used for dashboard counter)
            supabase.table('negocios').update({"whatsapp_usados": whatsapp_usados + credits_to_deduct}).eq("id", negocio_id).execute()
            
            if wa_credits >= credits_to_deduct:
                supabase.table('negocios').update({"wa_credits": wa_credits - credits_to_deduct}).eq("id", negocio_id).execute()
            else:
                supabase.table('negocios').update({"wa_messages_count": wa_count + credits_to_deduct}).eq("id", negocio_id).execute()

            # 4. Send Notifications using approved template
            # Format date in 12h format (am/pm) as requested (using local time)
            fecha = datetime.now().strftime("%d/%m/%Y, %I:%M %p").lower()
            biz_slug = biz_data.get('slug', '')
            
            # Build cart detail - individual fields for the 19-variable template
            detalle_items = []
            all_tamanos = []
            all_adicionales = []
            all_opciones = []
            product_notes = []
            for idx, item in enumerate(items, 1):
                p_name = item.get('nombre', '?')
                p_qty = item.get('cantidad', 1)
                p_price = item.get('precio', 0)
                line = f"{idx}. {p_name} x{p_qty} (${p_price:,.0f})"
                detalle_items.append(line)
                
                # Process extras into separate categories
                tamanos = item.get('tamanos', [])
                adicionales = item.get('adicionales', [])
                opciones = item.get('opciones', [])
                
                all_tamanos.extend(tamanos)
                all_adicionales.extend(adicionales)
                all_opciones.extend(opciones)
                
                # Also check modificadores for categorized mods
                mods = item.get('modificadores', [])
                for m in mods:
                    if isinstance(m, dict):
                        m_name = m.get('nombre', '')
                        m_cat = (m.get('categoria') or m.get('tipo') or '').lower()
                        m_precio = m.get('precio', 0)
                        m_cant = m.get('cantidad', 1)
                        
                        display = f"{m_cant}x {m_name}" if m_cant > 1 else m_name
                        if m_precio and m_precio > 0:
                            display += f" (+${m_precio:,.0f})"
                            
                        if 'tamañ' in m_cat or 'taman' in m_cat:
                            all_tamanos.append(display)
                        elif 'opci' in m_cat:
                            all_opciones.append(display)
                        else:
                            all_adicionales.append(display)
                    else:
                        all_adicionales.append(str(m))
                
                p_notes = item.get('notas')
                if p_notes and str(p_notes).lower() not in ["no aplica", "ninguna", "", "null", "none"]:
                    product_notes.append(p_notes)
                
            detalle_productos = "\n".join(detalle_items)
            tamanos_str = ", ".join(all_tamanos) if all_tamanos else ""
            adicionales_str = ", ".join(all_adicionales) if all_adicionales else ""
            opciones_str = ", ".join(all_opciones) if all_opciones else ""
            
            # Combine product-level notes (without product name prefix to avoid 'mezcla rara')
            # General notes from 'args.get(notas)' will go to obs_entrega to avoid duplication
            # unless they are explicitly separated, which is handled in server.py
            obs_pedido_list = product_notes.copy()
            obs_pedido = ". ".join(obs_pedido_list) if obs_pedido_list else "Sin observaciones"
            
            # Build business-specific link
            link_negocio = f"https://menuia.co/{biz_slug}" if biz_slug else "https://menuia.co"
            
            # Delivery Info
            direccion_val = args.get('direccion', '')
            distancia_val = f"{args.get('distancia', 0)} Km" if args.get('distancia') else ""
            obs_entrega = args.get('notas_entrega', '') or args.get('notas', '') or "Sin observaciones"
            
            # Usar monoespacio para el ID para facilitar la copia en móviles
            display_pedido_id = f"```{order_data.get('numero_secuencial', '000000')}```"
            
            template_kwargs = {
                "negocio_nombre":     business_name,                                          # {{1}}
                "pedido_id":          display_pedido_id,                                      # {{2}} - ID monoespaciado para copiar
                "cliente_nombre":     args.get('cliente_nombre', 'Cliente'),                   # {{3}}
                "cliente_telefono":   args.get('cliente_telefono', 'N/A'),                     # {{4}}
                "detalle_productos":  detalle_productos,                                       # {{5}}
                "tamanos":            tamanos_str,                                             # {{6}}
                "adicionales":        adicionales_str,                                         # {{7}}
                "opciones":           opciones_str,                                            # {{8}}
                "observacion_pedido": obs_pedido,                                              # {{9}}
                "metodo_entrega":     args.get('tipo', 'Domicilio'),                           # {{10}}
                "direccion":          direccion_val,                                            # {{11}}
                "distancia":          distancia_val,                                           # {{12}}
                "observacion_entrega": obs_entrega,                                            # {{13}}
                "metodo_pago":        args.get('metodo_pago', 'Efectivo'),                     # {{14}}
                "subtotal":           f"${total:,.0f}",                                        # {{15}}
                "costo_envio":        "$0",                                                    # {{16}}
                "total":              f"${total:,.0f}",                                        # {{17}}
                "fecha":              fecha,                                                    # {{18}}
                "link_seguimiento":   f"https://menuia.co/{biz_slug}/mis-pedidos"              # {{19}}
            }
            
            client_phone = args.get('cliente_telefono')
            if client_phone:
                send_whatsapp_template(
                    to_number=client_phone,
                    template_key="resumen_pedido",
                    custom_config=twilio_config,
                    **template_kwargs
                )
                
            if business_phone:
                send_whatsapp_template(
                    to_number=business_phone,
                    template_key="resumen_pedido",
                    custom_config=twilio_config,
                    **template_kwargs
                )
        else:
            logger.info(f"DEMO ORDER via AI: Skipping notifications and credits.")

        return json.dumps({
            "status": "success", 
            "order_id": order_id,
            "message": f"Pedido creado con éxito por un total de ${total:,.0f}."
        })
    except Exception as e:
        logger.error(f"Error create_order_ai: {e}")
        return json.dumps({"status": "error", "message": str(e)})

async def register_customer(negocio_id: str, nombre: str, email: str, telefono: str, fecha_nacimiento: str = None) -> str:
    try:
        # Sanitize phone
        clean_phone = str(telefono).replace('whatsapp:', '').replace('+', '').replace(' ', '').strip()
        
        # Sanitize date
        birth_date = fecha_nacimiento
        import re
        if not birth_date or birth_date.strip() == "":
            birth_date = None
        elif not re.match(r'^\d{4}-\d{2}-\d{2}$', birth_date):
            logger.warning(f"Invalid date format: {birth_date}. Setting to None.")
            birth_date = None
        
        # 1. Update/Insert in 'clientes' (Global)
        try:
            supabase.table('clientes').upsert({
                "telefono": clean_phone,
                "nombre": nombre,
                "email": email
            }, on_conflict='telefono').execute()
        except Exception as e:
            if "PGRST204" not in str(e):
                logger.error(f"Error upserting cliente: {e}")
        
        # 2. Check existence in 'clientes_puntos'
        existing_cp = supabase.table('clientes_puntos') \
            .select('id') \
            .eq('negocio_id', negocio_id) \
            .eq('telefono', clean_phone) \
            .execute()
        
        cp_data = {
            "negocio_id": negocio_id,
            "telefono": clean_phone,
            "nombre": nombre,
            "email": email,
            "fecha_nacimiento": birth_date,
            "puntos_actuales": 0,
            "puntos_totales": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Attempting upsert clientes_puntos: {cp_data}")
        # 2. Update/Insert in 'clientes_puntos' using RPC (safer/atomic)
        try:
            rpc_params = {
                "p_negocio_id": negocio_id,
                "p_telefono": clean_phone,
                "p_nombre": nombre,
                "p_email": email,
                "p_fecha_nacimiento": birth_date
            }
            logger.info(f"Calling RPC register_client_points with: {rpc_params}")
            supabase.rpc("register_client_points", rpc_params).execute()
        except Exception as e:
            logger.error(f"Error executing RPC register_client_points: {e}")
            # If RPC fails, we still consider global registration? 
            # Better to report error
            raise e
        
        return json.dumps({"status": "success", "message": f"¡Excelente! Ya te he registrado como {nombre}. Ahora puedes acumular puntos en tus compras."})
    except Exception as e:
        logger.error(f"Error register_customer: {e}")
        with open("error_log.txt", "a") as f:
            f.write(f"Error register_customer: {str(e)}\n")
        return json.dumps({"status": "error", "message": f"Lo siento, hubo un error al registrarte: {str(e)}"})

async def send_whatsapp_message(to_number: str, body: str):
    """
    Función reutilizable para enviar mensajes de WhatsApp usando la cuenta SaaS_MenuIA.
    to_number: número en formato E.164 (+57xxxxxxxxxx) sin el prefijo 'whatsapp:'
    """
    try:
        client = Client(GLOBAL_TWILIO_SID, GLOBAL_TWILIO_AUTH_TOKEN)
        
        # Asegurar formato E.164 (+...) y luego whatsapp:
        clean_to = str(to_number).strip().replace('whatsapp:', '').replace(' ', '').replace('+', '')
        
        # Validar si es un número de Colombia (10 dígitos empezando por 3)
        if len(clean_to) == 10 and clean_to.startswith('3'):
            formatted_to_e164 = f"+57{clean_to}"
        elif len(clean_to) == 12 and clean_to.startswith('57'):
            formatted_to_e164 = f"+{clean_to}"
        else:
            formatted_to_e164 = f"+{clean_to}" if not str(to_number).startswith('+') else str(to_number)

        formatted_to = f"whatsapp:{formatted_to_e164}"
        logger.info(f"Twilio Send Attempt: From={GLOBAL_TWILIO_NUMBER} To={formatted_to} Body={body}")
        
        message = client.messages.create(
            from_=GLOBAL_TWILIO_NUMBER,
            body=body,
            to=formatted_to
        )
        logger.info(f"Mensaje enviado a {to_number} [SaaS_MenuIA]: {message.sid}")
        return message
    except Exception as e:
        logger.error(f"Error en send_whatsapp_message: {e}")
        raise e

def send_whatsapp_response(to_number: str, body: str, custom_config: Dict[str, Any] = None):
    """
    Sends a WhatsApp message using custom business credentials or global fallback (SaaS_MenuIA).
    custom_config: { 'sid': str, 'token': str, 'number': str }
    """
    try:
        # 1. Determine which credentials to use
        sid = custom_config.get('sid') if custom_config else None
        token = custom_config.get('token') if custom_config else None
        from_number = custom_config.get('number') if custom_config else GLOBAL_TWILIO_NUMBER
        
        # 2. Initialize Client
        client = get_twilio_client(sid, token)
        
        # 3. Sanitize and format destination number
        clean_number = to_number.replace(' ', '').replace('+', '').replace('-', '')
        
        # Default to Colombia (+57) if 10 digits
        if len(clean_number) == 10 and clean_number.startswith('3'):
            formatted_number = f"+57{clean_number}"
        elif len(clean_number) == 12 and clean_number.startswith('57'):
            formatted_number = f"+{clean_number}"
        else:
            # Fallback
            formatted_number = f"+{clean_number}" if not to_number.startswith('+') else to_number

        # 4. Send Message
        message = client.messages.create(
            from_=from_number if from_number.startswith('whatsapp:') else f"whatsapp:{from_number}",
            body=body,
            to=f"whatsapp:{formatted_number}"
        )
        logger.info(f"Mensaje enviado a {formatted_number} [SID: {sid or 'Global'}]: {message.sid}")
        return message.sid
    except Exception as e:
        logger.error(f"Error enviando respuesta WA a {to_number}: {e}")
        return None

def send_whatsapp_template(to_number: str, template_key: str, custom_config: Dict[str, Any] = None, **kwargs):
    """
    Envía un mensaje usando las nuevas plantillas de Twilio aprobadas.
    Si la plantilla no tiene un SID configurado, intenta enviar un fallback de texto.
    """
    try:
        content_sid, content_variables = get_template_data(template_key, **kwargs)
        
        if not content_sid:
            logger.warning(f"Template {template_key} sin SID configurado. Usando fallback de texto.")
            return None

        sid = custom_config.get('sid') if custom_config else None
        token = custom_config.get('token') if custom_config else None
        from_number = custom_config.get('number') if custom_config else GLOBAL_TWILIO_NUMBER
        
        client = get_twilio_client(sid, token)
        
        # Formatear número (misma lógica que send_whatsapp_response)
        clean_number = to_number.replace(' ', '').replace('+', '').replace('-', '').replace('whatsapp:', '')
        
        # Log destination for debugging
        logger.info(f"Target number: {to_number} -> Cleaned: {clean_number}")

        # Default to Colombia (+57) if 10 digits starting with 3
        if len(clean_number) == 10 and clean_number.startswith('3'):
            formatted_to = f"whatsapp:+57{clean_number}"
        elif len(clean_number) == 12 and clean_number.startswith('57'):
            formatted_to = f"whatsapp:+{clean_number}"
        else:
            formatted_to = f"whatsapp:+{clean_number if clean_number.startswith('+') else ('+' + clean_number)}"

        # Twilio SDK 9.x expects a DICT for content_variables, but some versions/proxies might want a JSON string.
        # We ensure it's a dict and all values are strings.
        final_variables = {}
        if isinstance(content_variables, dict):
            final_variables = {str(k): str(v) for k, v in content_variables.items()}
        elif isinstance(content_variables, str):
            try:
                final_variables = json.loads(content_variables)
            except:
                final_variables = {"1": content_variables}

        logger.info(f"Sending Template {template_key} to {formatted_to} (Content SID: {content_sid}) from {from_number}")
        logger.info(f"Variables for {template_key}: {json.dumps(final_variables, indent=2)}")
        
        # Important: content_variables MUST be a JSON string if using REST directly, 
        # but in many modern SDK versions passing a DICT is preferred. 
        # However, to be 100% safe across versions, a JSON string is often the most reliable way 
        # IF the SDK doesn't auto-convert. Let's try sending the dict directly as requested by modern docs.
        try:
            message = client.messages.create(
                from_=from_number if from_number.startswith('whatsapp:') else f"whatsapp:{from_number}",
                to=formatted_to,
                content_sid=content_sid,
                content_variables=json.dumps(final_variables) # Ensuring it's a clean JSON string for safety
            )
            logger.info(f"Plantilla {template_key} enviada exitosamente a {to_number}. Twilio SID: {message.sid}")
            return message.sid
        except Exception as twilio_err:
            logger.error(f"TWILIO API ERROR sending template {template_key} to {to_number}: {twilio_err}")
            # Log the specific error message from Twilio if available
            if hasattr(twilio_err, 'message'):
                logger.error(f"Twilio Message: {twilio_err.message}")
            if hasattr(twilio_err, 'code'):
                logger.error(f"Twilio Error Code: {twilio_err.code}")
            return None
    except Exception as e:
        logger.error(f"Error enviando plantilla {template_key} a {to_number}: {e}")
        return None

# Export for external use
__all__ = ['send_whatsapp_response', 'send_whatsapp_message', 'process_whatsapp_message', 'get_or_create_conversation', 'send_whatsapp_template']
