from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, File, UploadFile, Form
import random
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import time
import asyncio
import uuid
from pathlib import Path
import secrets
import requests

# Force deploy trigger
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import Request
from openai import OpenAI
import ai_engine
from ai_base import get_shared_instructions, get_fallback_message
import traceback

logger = logging.getLogger(__name__)

# Import Agent Functions (now env vars are loaded)
from whatsapp_agent import (
    process_whatsapp_message,
    process_web_message,
    get_main_business,
    send_whatsapp_response,
    send_whatsapp_message,
    get_or_create_conversation,
    send_whatsapp_template,
)

from models import Business, BusinessCreate, BusinessLogin, BusinessPublic, BusinessAnalytics, DailyStats, MonthlyAnalytics
from models import ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest
from models import Product, ProductCreate, ProductUpdate
from models import Table, TableCreate, TableUpdate, TableStatus
from models import Employee, EmployeeCreate, EmployeeLogin, EmployeeRole
from models import Order, OrderCreate, OrderUpdate, OrderStatus, OrderItem
from models import TokenResponse, EmployeeTokenResponse, WhatsAppConfig
from models import LoyaltyConfig, LoyaltyConfigCreate, LoyaltyConfigUpdate
from models import CustomerPoints, CustomerPointsPublic, CustomerCreate, PointsTransaction
from models import RedeemPointsRequest, RedeemPointsResponse, AwardPointsRequest
from models import MenuItem, MenuItemCreate, MenuItemOption, MenuItemOptionCreate, MenuItemTag, MenuItemTagCreate, MarketingAISuggestionRequest
from models import (
    Brand, GlobalCategory, GlobalProduct, SedeProduct,
    GlobalIngredient, GlobalRecipe, RecipeIngredient,
    SedeInventory, InventoryTransaction,
    LoyaltyAccount, LoyaltyTransaction,
    # New catalog response/request models
    SedeMenuItemResponse,
    GlobalProductCreate, GlobalProductUpdate,
    SedeProductUpsert,
    GlobalCategoryCreate, GlobalCategoryUpdate,
)
from models_client import Cliente, ClienteCreate, ClienteUpdate
from models_client import Address, AddressCreate, AddressUpdate
from models_client import OTPRequest, OTPVerify, ClientTokenResponse, PINLogin, UpdatePINRequest, ResetPINRequest, RecoveryInfo

# Supabase connection
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

import mercadopago

# --- CONFIG ---
SECRET_KEY = os.environ.get("JWT_SECRET", "secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 days
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 30

# --- AI CREDIT CONFIG ---
# --- PLAN CONFIG ---
PLAN_CONFIG = {
    "trial": {
        "img": 0,
        "nutri": 0,
        "desc": 0,
        "wa": 0,
        "campaign": 0,
        "hub": 0
    },
    "impulso": {
        "img": 50,
        "nutri": 50,
        "desc": 50,
        "wa": 1500,
        "campaign": 0,
        "hub": 0
    },
    "basic": {
        "img": 50,
        "nutri": 50,
        "desc": 50,
        "wa": 1500,
        "campaign": 0,
        "hub": 0
    },
    "pro": {
        "img": 120,
        "nutri": 120,
        "desc": 120,
        "wa": 4500,
        "campaign": 0,
        "hub": 0
    },
    "elite": {
        "img": 300,
        "nutri": 300,
        "desc": 300,
        "wa": 9000,
        "campaign": 0,
        "hub": 0
    },
    "premium": {
        "img": 300,
        "nutri": 300,
        "desc": 300,
        "wa": 9000,
        "campaign": 0,
        "hub": 0
    },
    "free": {
        "img": 5,
        "nutri": 5,
        "desc": 5,
        "wa": 5,
        "campaign": 0,
        "hub": 0
    }
}

# Initialize MercadoPago SDK
mp_access_token = os.environ.get("MERCADOPAGO_ACCESS_TOKEN")
if not mp_access_token:
    logger.warning("MERCADOPAGO_ACCESS_TOKEN not found in environment variables. MercadoPago features will be disabled.")
    # Initialize with a dummy string to avoid ValueError if the SDK is called, 
    # but we should handle this in the payment routes too.
    mp_sdk = mercadopago.SDK("MISSING_TOKEN")
else:
    mp_sdk = mercadopago.SDK(mp_access_token)

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Menu.IA API", version="1.0.0")

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Menu.IA API is running"}

@app.get("/api/geocoding/reverse")
async def reverse_geocode_api(lat: float, lng: float):
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {"error": "config_error", "message": "Google Maps API Key not found"}
    
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
    try:
        res = requests.get(url).json()
        if res.get("status") == "OK":
            return {"address": res["results"][0]["formatted_address"]}
        return {"error": res.get("status"), "message": res.get("error_message")}
    except Exception as e:
        return {"error": "request_error", "message": str(e)}

def _populate_business_wa_fields(business_doc: dict):
    """Internal helper to populate dynamic campaign & whatsapp fields based on plan."""
    plan_key = (business_doc.get('plan') or 'trial').lower()
    plan_limits = PLAN_CONFIG.get(plan_key, PLAN_CONFIG['trial'])
    
    # 1. Campaign Credits (Marketing)
    db_campaign_limit = business_doc.get('wa_campaign_limit') or 0
    # HARDCODE TEMP: Regalo 1000 a Don Jediondo
    if business_doc.get('slug') == 'don-jediondo':
        db_campaign_limit += 1000
    business_doc['wa_campaign_limit'] = db_campaign_limit + plan_limits.get('campaign', 0)
    business_doc['wa_campaign_count'] = business_doc.get('ai_credits_campaign_used', 0)
    
    # 2. Support/Sales Credits (IA/Chat) - Map official columns
    # Fields like whatsapp_incluidos should be 1500 for basic
    business_doc['whatsapp_incluidos'] = business_doc.get('whatsapp_incluidos') or plan_limits.get('wa', 500)
    business_doc['whatsapp_usados'] = business_doc.get('whatsapp_usados', 0)
    
    # Legacy/Compatibility fields
    business_doc['wa_messages_limit'] = business_doc['whatsapp_incluidos']
    business_doc['wa_messages_count'] = business_doc['whatsapp_usados']
    business_doc['wa_credits'] = business_doc['wa_campaign_limit'] - business_doc['wa_campaign_count']

    return business_doc

# Configure CORS based on environment variables
cors_origins_str = os.environ.get("CORS_ORIGINS", "")
if cors_origins_str:
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
else:
    # Fallback to hardcoded list if env var is missing
    cors_origins = [
        "https://menuia.co",
        "https://www.menuia.co",
        "https://menuia.co/",
        "https://www.menuia.co/",
        "https://menuia-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000"
    ]

# Include FRONTEND_URL automatically in CORS origins (for Render / custom domains)
frontend_url_env = (os.environ.get("FRONTEND_URL") or "").strip().rstrip("/")
if frontend_url_env and "*" not in cors_origins:
    for candidate in (frontend_url_env, f"{frontend_url_env}/"):
        if candidate not in cors_origins:
            cors_origins.append(candidate)

# Add "*" to origins if explicitly allowed in env or as a fallback for testing
if os.environ.get("ALLOW_ALL_CORS") == "True":
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.onrender\.com" if "*" not in cors_origins else None,
    allow_credentials=True if "*" not in cors_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    logger.info(f"Incoming request: {method} {path} from origin: {origin}")
    
    # Handle preflight manually if needed (FastAPI should do it, but logging helps)
    if method == "OPTIONS":
        logger.info(f"Preflight request for {path} from {origin}")
        
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code} for {method} {path}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {method} {path} - Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

logger.info(f"Allowed CORS origins: {cors_origins}")


# WebSocket Manager for Real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, negocio_id: str):
        await websocket.accept()
        if negocio_id not in self.active_connections:
            self.active_connections[negocio_id] = []
        self.active_connections[negocio_id].append(websocket)
        logger.info(f"WebSocket connected for business: {negocio_id}")

    def disconnect(self, websocket: WebSocket, negocio_id: str):
        if negocio_id in self.active_connections:
            if websocket in self.active_connections[negocio_id]:
                self.active_connections[negocio_id].remove(websocket)
            logger.info(f"WebSocket disconnected for business: {negocio_id}")

    async def broadcast(self, negocio_id: str, message: dict):
        if negocio_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[negocio_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, negocio_id)


manager = ConnectionManager()


@api_router.websocket("/ws/{negocio_id}")
async def websocket_endpoint(websocket: WebSocket, negocio_id: str):
    await manager.connect(websocket, negocio_id)
    try:
        while True:
            # Keep connection alive and listen for any client messages
            # For now we just echo or ignore, but it keeps the loop running
            data = await websocket.receive_text()
            # logger.info(f"Client {negocio_id} sent: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, negocio_id)




# --- AI Nutrition Estimation (DeepSeek) ---
async def estimate_nutrition(product_name: str, description: str = ""):
    try:
        prompt = f"""
        Como un experto nutricionista, estima la información nutricional aproximada para el siguiente plato de un restaurante. 
        Devuelve SOLO un objeto JSON con los campos exactos: "kcal" (número entero), "proteina" (string con 'g'), "carbohidratos" (string con 'g'), "grasa" (string con 'g').
        
        Plato: {product_name}
        Descripción: {description}
        
        Ejemplo de salida: {{"kcal": 450, "proteina": "25g", "carbohidratos": "40g", "grasa": "15g"}}
        """
        data, _ = ai_engine.complete_json(
            system="Eres un nutricionista experto. Responde únicamente en JSON válido.",
            user=prompt,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return data
    except Exception as e:
        logger.warning(f"Error estimating nutrition for {product_name}: {e}")
        return None


# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def deduct_ai_credit(business_id: str, credit_type: str, current_business: Business):
    """
    credit_type: 'desc', 'img', 'nutri'
    """
    plan = (current_business.plan or "free").lower()
    if plan not in PLAN_CONFIG:
        plan = "free"
        
    plan_limits = PLAN_CONFIG[plan]
    limit = plan_limits.get(credit_type, 5)
    
    field_name = f"ai_credits_{credit_type}_used"
    used = getattr(current_business, field_name)
    
    if used >= limit:
        raise HTTPException(
            status_code=403, 
            detail=f"Has agotado tus créditos de IA para {credit_type}. Límite del plan ({plan}): {limit}."
        )
    
    # Deduct (increment used count)
    new_used = used + 1
    try:
        supabase.table('negocios').update({field_name: new_used}).eq('id', business_id).execute()
    except Exception as e:
        logger.error(f"Error deducting AI credit ({credit_type}) for {business_id}: {e}")


async def get_current_business(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Business:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        business_id = payload.get("sub")
        if not business_id:
            logger.error("Token missing 'sub' claim")
            raise HTTPException(status_code=401, detail="Token inválido")
        
        response = supabase.table('negocios').select('*').eq('id', business_id).execute()
        if not response.data:
            logger.error(f"Business not found for ID: {business_id}")
            raise HTTPException(status_code=401, detail="Negocio no encontrado")
        
        business_doc = response.data[0]
        current_plan = business_doc.get('plan', 'trial')
        plan_expires_at = business_doc.get('plan_expires_at')
        
        # TRIAL LOCKOUT ENFORCEMENT
        if current_plan == 'trial':
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            # Date Check only - trial has 0 credits for messaging/campaigns/IA
            # but AI agents and core features remain functional
            if plan_expires_at:
                try:
                    expires_dt = datetime.fromisoformat(plan_expires_at.replace('Z', '+00:00'))
                    if expires_dt < now:
                        logger.warning(f"Trial expired for {business_id}: {plan_expires_at}")
                        raise HTTPException(
                            status_code=403, 
                            detail="Tu periodo de prueba de 7 días ha terminado. Por favor, comunícate con soporte o adquiere un plan para continuar."
                        )
                except (ValueError, TypeError) as e:
                    logger.error(f"Error parsing plan_expires_at: {e}")

        # PLAN EXPIRATION CHECK (Non-trial)
        elif plan_expires_at:
            from datetime import datetime, timezone
            try:
                # Handle ISO format strings from Supabase
                expires_dt = datetime.fromisoformat(plan_expires_at.replace('Z', '+00:00'))
                if expires_dt < datetime.now(timezone.utc):
                    logger.info(f"Plan for business {business_id} has expired ({plan_expires_at}). Downgrading to trial.")
                    # Update DB
                    seven_days_later = datetime.now(timezone.utc) + timedelta(days=7)
                    supabase.table('negocios').update({
                        'plan': 'trial',
                        'plan_expires_at': seven_days_later.isoformat()
                    }).eq('id', business_id).execute()
                    # Update local object
                    business_doc['plan'] = 'trial'
                    business_doc['plan_expires_at'] = seven_days_later.isoformat()
            except Exception as exp_err:
                logger.error(f"Error checking plan expiration: {exp_err}")

        # AI CREDITS RESET CHECK (30 DAYS)
        from datetime import datetime, timezone
        last_reset = business_doc.get('ai_credits_last_reset')
        needs_reset = False
        now = datetime.now(timezone.utc)
        
        if not last_reset:
            needs_reset = True
        else:
            try:
                # Handle possible string or already datetime types
                if isinstance(last_reset, str):
                    last_reset_dt = datetime.fromisoformat(last_reset.replace('Z', '+00:00'))
                else:
                    last_reset_dt = last_reset
                    
                if (now - last_reset_dt).days >= 30:
                    needs_reset = True
            except Exception as e:
                logger.warning(f"Error parsing last_reset date: {e}")
                needs_reset = True
                
        if needs_reset:
            logger.info(f"Resetting AI credits for business {business_id}")
            update_data = {
                'ai_credits_desc_used': 0,
                'ai_credits_img_used': 0,
                'ai_credits_nutri_used': 0,
                'ai_credits_last_reset': now.isoformat()
            }
            try:
                supabase.table('negocios').update(update_data).eq('id', business_id).execute()
            except Exception as e:
                logger.error(f"Fallo al actualizar créditos de IA en DB: {e}")
                
            # Update local doc for the current request
            business_doc.update(update_data)

        # 5. Populate Dynamic Campaign & WhatsApp Fields
        _populate_business_wa_fields(business_doc)

        if 'password_hash' in business_doc:
            del business_doc['password_hash']
            
        try:
            return Business(**business_doc)
        except Exception as e:
            logger.error(f"Error parsing Business model: {e}")
            logger.error(f"Data: {business_doc}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail="Error interno al procesar datos del negocio")

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in auth: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error interno de autenticación")



async def get_current_employee(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Employee:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id = payload.get("sub")
        employee_type = payload.get("type")
        
        if not employee_id or employee_type != "employee":
            raise HTTPException(status_code=401, detail="Token de empleado inválido")
        
        response = supabase.table('empleados').select('*').eq('id', employee_id).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Empleado no encontrado")
        
        employee_doc = response.data[0]
        return Employee(**employee_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_current_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Cliente:
    token = credentials.credentials
    try:
        # Check payload first
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone = payload.get("sub")
        role = payload.get("role")
        
        if not phone or role != "client":
            # Continue to next handler if needed or raise specific error
            # But here this is the only client auth dependency
            raise HTTPException(status_code=401, detail="Credenciales de cliente inválidas")

        response = supabase.table('clientes').select('*').eq('telefono', phone).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Cliente no encontrado")
            
        return Cliente(**response.data[0])
        
    except jwt.PyJWTError as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Token de cliente inválido o expirado")
    except Exception as e:
        logger.error(f"Error validating client token: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno validando sesión: {str(e)}")


def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def serialize_doc(doc: dict) -> dict:
    result = {}
    for key, value in doc.items():
        if key == '_id':
            continue
        result[key] = serialize_datetime(value)
    return result


def format_order_summary_wa(business_name: str, order: Order, slug: str = None) -> str:
    fecha = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    
    items_text = ""
    subtotal_items = 0
    for i, item in enumerate(order.items, 1):
        item_total = item.cantidad * item.precio_unitario
        subtotal_items += item_total
        items_text += f"  * Nombre producto: {i}. {item.nombre} x{item.cantidad} (${item_total:,.0f})\n"
        
        if item.modificadores:
            # Try to categorize modifiers if possible
            tamanos = []
            adicionales = []
            opciones = []
            
            for m in item.modificadores:
                if isinstance(m, dict):
                    m_name = m.get('nombre', '')
                    m_price = m.get('precio', 0)
                    m_cat = (m.get('categoria') or m.get('tipo', '')).lower()
                    m_display = f"{m_name} (+${m_price:,.0f})" if m_price > 0 else m_name
                    
                    if 'tama' in m_cat: tamanos.append(m_display)
                    elif 'opci' in m_cat: opciones.append(m_display)
                    else: adicionales.append(m_display)
                else:
                    adicionales.append(str(m))
            
            if tamanos: items_text += f"  * Tamaños: {', '.join(tamanos)}\n"
            if adicionales: items_text += f"  * Adicionales: {', '.join(adicionales)}\n"
            if opciones: items_text += f"  * Opciones: {', '.join(opciones)}\n"

        if item.notas and item.notas.lower() not in ["no aplica", "ninguna", "", "null"]:
            items_text += f"  * Observaciones del producto: {item.notas}\n"
        
        items_text += "\n"
    
    delivery_info = ""
    if order.metodo_entrega == "domicilio" or order.tipo == "domicilio":
        delivery_info = (
            f"🛵 ENTREGA\n"
            f"*Dirección: {order.direccion or 'N/A'}\n"
            f"*Distancia: {order.distancia or 0} Km\n"
            f"*Observación de entrega: {order.observaciones_entrega or 'Ninguna'}\n\n"
        )
    else:
        metodo = order.metodo_entrega or ("Mesa" if order.tipo == "mesa" else "Para Recoger")
        delivery_info = f"🛒 Retiro: {metodo}\n\n"
    
    # Random food emoji
    import random
    emojis = ["🍔", "🍕", "🥤", "🌮", "🥘", "🥗", "🍣", "🍦", "🍪", "☕️", "🍗", "🥟"]
    emoji = random.choice(emojis)

    # Note
    raw_notes = order.notas or ""
    obs_pedido = ""
    if ". Observaciones de entrega: " in raw_notes:
        obs_pedido = raw_notes.split(". Observaciones de entrega: ")[0]
    else:
        obs_pedido = raw_notes

    cliente_notas = f"\n* Observaciones del pedido: {obs_pedido}" if obs_pedido and obs_pedido.lower() not in ["sin notas", "none", ""] else ""

    link_text = ""
    if slug:
        link_text = f"🔗 Ver mi pedido / Pedir de nuevo: https://menuia.co/{slug}/menu\n\n"

    order_id_display = f"`{str(order.numero_secuencial).zfill(8)}`" if order.numero_secuencial else f"`{order.id[:8].upper()}`" if isinstance(order.id, str) else f"`{str(order.id)}`"

    summary = (
        f"🔔 Nuevo Pedido - {business_name}\n\n"
        f"🆔 ID del Pedido: {order_id_display}\n\n"
        f"👤 DATOS DEL CLIENTE\n"
        f"*Nombre: {order.cliente_nombre or 'Usuario'}\n"
        f"*Tel: {order.cliente_telefono or 'N/A'}{cliente_notas}\n\n"
        f"🛒 DETALLE DEL PEDIDO\n"
        f"{items_text}"
        f"{delivery_info}"
        f"💳 RESUMEN DE PAGO\n"
        f"*Método de Pago: {order.metodo_pago or 'Efectivo'}\n"
        f"*Subtotal: ${subtotal_items:,.0f}\n"
        f"*Costo del envío: ${order.costo_envio or 0:,.0f}\n"
        f"*TOTAL: ${order.total:,.0f}\n\n"
        f"⏰ Realizado: {fecha}\n\n"
        f"{link_text}"
        f"¡Gracias por tu pedido! {emoji}"
    )
    return summary


# ============ HEALTH CHECK ============
@api_router.get("/")
async def root():
    return {"message": "Menu.IA API v1.0", "status": "running"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ============ AUTH ROUTES ============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register_business(data: BusinessCreate):
    try:
        # Check if email exists
        response = supabase.table('negocios').select('id').eq('email', data.email).execute()
        if response.data:
            raise HTTPException(status_code=400, detail="Email ya registrado")
        
        # Check if slug exists
        response = supabase.table('negocios').select('id').eq('slug', data.slug).execute()
        if response.data:
            raise HTTPException(status_code=400, detail="Slug ya en uso")
        
        # Create business
        business = Business(
            nombre=data.nombre,
            slug=data.slug,
            descripcion=data.descripcion,
            slogan=data.slogan,
            direccion=data.direccion,
            telefono=data.telefono,
            whatsapp=data.whatsapp,
            horarios=data.horarios,
            logo_url=data.logo_url,
            banner_url=data.banner_url,
            email=data.email,
            plan="trial",
            plan_expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        # Store with password hash
        business_dict = serialize_doc(business.model_dump())
        business_dict['password_hash'] = hash_password(data.password)
        
        # Remove fields not in DB schema to prevent errors
        try:
             cols_res = supabase.table('negocios').select('*').limit(1).execute()
             db_cols = cols_res.data[0].keys() if cols_res.data else []
        except:
             db_cols = []
             
        # Fallback if we can't get columns easily - but we know the core ones
        core_cols = ['id', 'nombre', 'slug', 'slogan', 'descripcion', 'direccion', 'telefono', 'whatsapp', 'horarios', 'logo_url', 'banner_url', 'email', 'password_hash']
        
        target_cols = set(list(db_cols) + core_cols)
        
        filtered_dict = {k: v for k, v in business_dict.items() if (k in target_cols or not target_cols) and v is not None}
        
        # Explicitly remove known problematic fields if they leak
        for field in ['is_active', 'plan', 'subscription_plan', 'ai_use_modal']:
            if field in filtered_dict and field not in db_cols:
                del filtered_dict[field]

        # Insert into Supabase
        logger.info(f"Insertando negocio: {filtered_dict}")
        insert_response = supabase.table('negocios').insert(filtered_dict).execute()
        logger.info(f"Respuesta Supabase: {insert_response}")

        # Create token
        token = create_token({"sub": business.id, "type": "business"})
        
        return TokenResponse(
            access_token=token,
            business=BusinessPublic(**business.model_dump())
        )
    except Exception as e:
        logger.error(f"Error en registro: {str(e)}")
        # Check for Supabase specific errors if possible
        if hasattr(e, 'message'):
             logger.error(f"Detalle error: {e.message}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@api_router.post("/auth/login", response_model=TokenResponse)
async def login_business(data: BusinessLogin):
    logger.info(f"Login attempt for email: {data.email}")
    response = supabase.table('negocios').select('*').eq('email', data.email).execute()
    if not response.data:
        logger.warning(f"Login failed: User {data.email} not found")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    business_doc = response.data[0]
    if not verify_password(data.password, business_doc.get('password_hash', '')):
        logger.warning(f"Login failed: Incorrect password for {data.email}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if 'password_hash' in business_doc:
        del business_doc['password_hash']
        
    _populate_business_wa_fields(business_doc)
    business = Business(**business_doc)
    token = create_token({"sub": business.id, "type": "business"})
    
    return TokenResponse(
        access_token=token,
        business=BusinessPublic(**business.model_dump())
    )


@api_router.get("/auth/me", response_model=BusinessPublic)
async def get_current_business_info(business: Business = Depends(get_current_business)):
    return BusinessPublic(**business.model_dump())


@api_router.post("/auth/activate-trial")
async def activate_trial(business: Business = Depends(get_current_business)):
    """
    Activa o reactiva el periodo de prueba de 7 días para un negocio.
    Solo se puede activar si el negocio no tiene un plan pagado activo.
    """
    current_plan = (business.plan or 'trial').lower()
    
    if current_plan not in ('trial', 'free'):
        raise HTTPException(
            status_code=403,
            detail="Solo puedes activar la prueba gratuita si no tienes un plan activo."
        )
    
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=7)
    
    try:
        supabase.table('negocios').update({
            'plan': 'trial',
            'plan_expires_at': expires.isoformat(),
            'ai_credits_img_used': 0,
            'ai_credits_nutri_used': 0,
            'ai_credits_desc_used': 0,
            'ai_credits_wa_used': 0,
            'ai_credits_campaign_used': 0,
            'ai_credits_last_reset': now.isoformat()
        }).eq('id', business.id).execute()
        
        logger.info(f"Trial activated for business {business.id}, expires {expires.isoformat()}")
        
        return {
            "success": True,
            "message": "¡Prueba gratuita de 7 días activada!",
            "expires_at": expires.isoformat()
        }
    except Exception as e:
        logger.error(f"Error activating trial for {business.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al activar la prueba gratuita.")


# ============ EMPLOYEE AUTH ============
@api_router.post("/employee/login/{slug}", response_model=EmployeeTokenResponse)
async def login_employee(slug: str, data: EmployeeLogin):
    # Find business by slug (lowercase comparison)
    business_slug = slug.lower().strip()
    response = supabase.table('negocios').select('*').eq('slug', business_slug).execute()
    if not response.data:
        logger.warning(f"Login mesero fallido: Negocio no encontrado para slug '{business_slug}'")
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_doc = response.data[0]
    
    # Find employee by PIN (trimmed)
    clean_pin = data.pin.strip()
    response = supabase.table('empleados').select('*').match({
        "negocio_id": business_doc['id'],
        "pin": clean_pin,
        "activo": True
    }).execute()
    
    if not response.data:
        logger.warning(f"Login mesero fallido: PIN '{clean_pin}' no coincide para negocio '{business_slug}'")
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    
    employee_doc = response.data[0]
    employee = Employee(**employee_doc)
    token = create_token({"sub": employee.id, "type": "employee", "negocio_id": business_doc['id']})
    
    return EmployeeTokenResponse(access_token=token, employee=employee)


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    try:
        # Usar el servicio nativo de Supabase Auth
        # Esto enviará automáticamente el correo desde Supabase
        supabase.auth.reset_password_for_email(data.email)
        
        logger.info(f"Correo de recuperación solicitado para: {data.email} vía Supabase Auth")
        
        return {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}
    except Exception as e:
        logger.error(f"Error al solicitar recuperación en Supabase: {e}")
        # Por seguridad, devolvemos el mismo mensaje aunque falle (si el usuario no existe)
        return {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    # Verify token
    res = supabase.table('password_reset_tokens').select('*').eq('token', data.token).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    token_doc = res.data[0]
    expires_at = datetime.fromisoformat(token_doc['expires_at'].replace('Z', '+00:00'))
    
    if expires_at < datetime.now(timezone.utc):
        supabase.table('password_reset_tokens').delete().eq('token', data.token).execute()
        raise HTTPException(status_code=400, detail="Token expirado")
    
    # Update password
    new_hash = hash_password(data.new_password)
    supabase.table('negocios').update({"password_hash": new_hash}).eq('email', token_doc['email']).execute()
    
    # Delete token
    supabase.table('password_reset_tokens').delete().eq('token', data.token).execute()
    
    return {"message": "Contraseña actualizada con éxito"}


@api_router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, business: Business = Depends(get_current_business)):
    # Verify old password
    # We need the hash from DB because the 'business' object from Depends doesn't have it
    res = supabase.table('negocios').select('password_hash').eq('id', business.id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    curr_hash = res.data[0]['password_hash']
    if not verify_password(data.old_password, curr_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    
    # Update to new password
    new_hash = hash_password(data.new_password)
    supabase.table('negocios').update({"password_hash": new_hash}).eq('id', business.id).execute()
    
    return {"message": "Contraseña actualizada correctamente"}


@api_router.post("/client/change-password")
async def client_change_password(data: ChangePasswordRequest, client: Cliente = Depends(get_current_client)):
    # If they have a password_hash, verify it. If not (first time setting), allow it?
    # Actually, if old_password is provided in model, we use it.
    res = supabase.table('clientes').select('password_hash').eq('id', client.id).execute()
    curr_hash = res.data[0].get('password_hash') if res.data else None
    
    if curr_hash and data.old_password:
        if not verify_password(data.old_password, curr_hash):
            raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    elif curr_hash and not data.old_password:
        raise HTTPException(status_code=401, detail="Se requiere la contraseña actual")
        
    # Update to new password
    new_hash = hash_password(data.new_password)
    supabase.table('clientes').update({
        "password_hash": new_hash,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq('id', client.id).execute()
    
    return {"message": "Contraseña actualizada correctamente"}


# ============ BUSINESS ROUTES ============
@api_router.get("/business/{slug}", response_model=BusinessPublic)
@api_router.get("/public/business/{slug}", response_model=BusinessPublic)
async def get_business_by_slug(slug: str):
    # Normalize slug
    slug = slug.lower().strip().rstrip('/')
    logger.info(f"Fetching business with slug: {slug}")
    response = supabase.table('negocios').select('*').match({"slug": slug}).execute()
    if not response.data:
        logger.warning(f"Business not found: {slug}")
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    business_doc = response.data[0]
    
    # TRIAL LOCKOUT CHECK
    current_plan = business_doc.get('plan', 'trial')
    if current_plan == 'trial':
        from datetime import datetime, timezone
        plan_expires_at = business_doc.get('plan_expires_at')
        now = datetime.now(timezone.utc)
        
        # 1. Date Check
        if plan_expires_at:
            try:
                expires_dt = datetime.fromisoformat(plan_expires_at.replace('Z', '+00:00'))
                if expires_dt < now:
                    raise HTTPException(status_code=403, detail="Este menú no está disponible por el momento (periodo de prueba finalizado).")
            except: pass

        # 2. Credits Check
        trial_limits = PLAN_CONFIG['trial']
        if (business_doc.get('ai_credits_img_used', 0) >= trial_limits['img'] or 
            business_doc.get('ai_credits_nutri_used', 0) >= trial_limits['nutri'] or 
            business_doc.get('ai_credits_desc_used', 0) >= trial_limits['desc'] or 
            business_doc.get('ai_credits_wa_used', 0) >= trial_limits['wa']):
            raise HTTPException(status_code=403, detail="Este menú no está disponible por el momento (limite de prueba alcanzado).")

    if 'password_hash' in business_doc:
        del business_doc['password_hash']
        
    return BusinessPublic(**business_doc)


@api_router.put("/business/{slug}", response_model=BusinessPublic)
async def update_business(slug: str, data: Dict[str, Any], business: Business = Depends(get_current_business)):
    target_res = supabase.table('negocios').select('id, slug, parent_id').eq('slug', slug).execute()
    if not target_res.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
    target_business = target_res.data[0]
    if business.slug != slug and target_business.get('parent_id') != business.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Filter data to only allowed fields
    allowed_fields = [
        'nombre', 'descripcion', 'slogan', 'direccion', 'telefono', 
        'whatsapp', 'horarios', 'logo_url', 'banner_url',
        'banner_tag', 'banner_title', 'banner_description',
        'promo_habilitado', 'promo_imagen_url', 'promo_precio',
        'precio_km', 'costo_minimo_domicilio', 'lat', 'lng',
        'metodos_pago', 'datos_pago', 'metodos_entrega',
        'ai_habilitado', 'ai_personalidad', 'ai_saludo', 'ai_conocimiento',
        'ai_use_modal', 'google_maps_review_url', 'twilio_sid', 'twilio_token', 'twilio_number', 'abierto',
        'instagram_url', 'facebook_url', 'tiktok_url',
        'cocinas_duales_activo'
    ]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    response = supabase.table('negocios').update(update_data).eq('id', business.id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Error al actualizar")
    
    return BusinessPublic(**response.data[0])


@api_router.get("/business/{slug}/analytics", response_model=BusinessAnalytics)
async def get_business_analytics(slug: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get today's orders
    response = supabase.table('pedidos').select('*').match({"negocio_id": business.id}).gte("created_at", today_start.isoformat()).execute()
    today_orders = response.data
    
    # Filter out canceled orders for financial stats
    active_today_orders = [o for o in today_orders if o.get('estado') != 'cancelado']
    
    ventas_hoy = sum(float(o.get('total', 0)) for o in active_today_orders)
    pedidos_hoy = len(active_today_orders)
    pedidos_activos = len([o for o in active_today_orders if o.get('estado') in ['pendiente', 'preparando']])
    domicilios_hoy = len([o for o in active_today_orders if o.get('tipo') in ['domicilio', 'delivery']])
    
    # Clientes nuevos hoy
    response = supabase.table('clientes_puntos').select('id').match({"negocio_id": business.id}).gte("created_at", today_start.isoformat()).execute()
    clientes_nuevos_hoy = len(response.data) if response.data else 0
    
    # Puntos otorgados hoy
    clients_res = supabase.table('clientes_puntos').select('id').eq('negocio_id', business.id).execute()
    client_ids = [c['id'] for c in clients_res.data] if clients_res.data else []
    puntos_otorgados_hoy = 0
    if client_ids:
        points_res = supabase.table('transacciones_puntos').select('puntos').match({"tipo": "ganado"}).in_('cliente_puntos_id', client_ids).gte("created_at", today_start.isoformat()).execute()
        puntos_otorgados_hoy = sum(int(p.get('puntos', 0)) for p in points_res.data) if points_res.data else 0

    # Mensajes enviados (Total count from business profile)
    mensajes_enviados_hoy = business.wa_messages_count
    
    # Get tables
    response = supabase.table('mesas').select('*').eq("negocio_id", business.id).execute()
    tables = response.data
    mesas_ocupadas = len([t for t in tables if t.get('estado') != 'libre'])
    mesas_totales = len(tables)
    
    # Get unavailable products
    response = supabase.table('menu_items').select('id', count='exact').match({
        "negocio_id": business.id,
        "available": False
    }).execute()
    productos_agotados = response.count if response.count is not None else 0
    
    # Get last 7 days stats
    ultimos_7_dias = []
    for i in range(7):
        day = today_start - timedelta(days=i)
        day_end = day + timedelta(days=1)
        
        response = supabase.table('pedidos').select('*').match({"negocio_id": business.id}).gte("created_at", day.isoformat()).lt("created_at", day_end.isoformat()).execute()
        day_orders = response.data
        
        ultimos_7_dias.append(DailyStats(
            fecha=day.strftime("%Y-%m-%d"),
            total_pedidos=len(day_orders),
            total_ventas=sum(float(o.get('total', 0)) for o in day_orders),
            pedidos_completados=len([o for o in day_orders if o.get('estado') == 'entregado']),
            pedidos_cancelados=len([o for o in day_orders if o.get('estado') == 'cancelado'])
        ))
    
    # --- NUEVA LÓGICA HISTORICA ---
    # Todos los pedidos del historial
    response_hist = supabase.table('pedidos').select('total', 'tipo', 'estado').eq('negocio_id', business.id).execute()
    all_orders = response_hist.data or []
    
    # Filter out canceled for historic totals
    completed_orders = [o for o in all_orders if o.get('estado') != 'cancelado']
    
    ventas_total = sum(float(o.get('total', 0)) for o in completed_orders)
    pedidos_total = len(completed_orders)
    domicilios_total = len([o for o in completed_orders if o.get('tipo') in ['domicilio', 'delivery']])
    ticket_promedio_total = ventas_total / pedidos_total if pedidos_total > 0 else 0
    
    # Clientes totales
    response_clients = supabase.table('clientes_puntos').select('id', count='exact').eq('negocio_id', business.id).execute()
    clientes_total = response_clients.count if response_clients.count is not None else 0
    
    # Puntos totales
    puntos_total = 0
    if client_ids:
        points_res_total = supabase.table('transacciones_puntos').select('puntos').match({"tipo": "ganado"}).in_('cliente_puntos_id', client_ids).execute()
        puntos_total = sum(int(p.get('puntos', 0)) for p in points_res_total.data) if points_res_total.data else 0
        
    mensajes_total = business.wa_messages_count # Esto ya es el total histórico en la tabla business
    # ------------------------------

    return BusinessAnalytics(
        ventas_hoy=ventas_hoy,
        pedidos_hoy=pedidos_hoy,
        pedidos_activos=pedidos_activos,
        mesas_ocupadas=mesas_ocupadas,
        mesas_totales=mesas_totales,
        productos_agotados=productos_agotados,
        clientes_nuevos_hoy=clientes_nuevos_hoy,
        puntos_otorgados_hoy=puntos_otorgados_hoy,
        mensajes_enviados_hoy=mensajes_enviados_hoy,
        domicilios_hoy=domicilios_hoy,
        ventas_total=ventas_total,
        pedidos_total=pedidos_total,
        domicilios_total=domicilios_total,
        clientes_total=clientes_total,
        puntos_total=puntos_total,
        mensajes_total=mensajes_total,
        ticket_promedio_total=ticket_promedio_total,
        ultimos_7_dias=ultimos_7_dias
    )


@api_router.get("/business/{slug}/analytics/month", response_model=MonthlyAnalytics)
async def get_business_analytics_month(slug: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    now = datetime.now(timezone.utc)
    month_start = now - timedelta(days=30)
    
    # Get last 30 days orders
    response = supabase.table('pedidos').select('*').match({"negocio_id": business.id}).gte("created_at", month_start.isoformat()).execute()
    month_orders_raw = response.data or []
    
    # Filter out canceled for monthly totals
    month_orders = [o for o in month_orders_raw if o.get('estado') != 'cancelado']
    
    ventas_mes = sum(float(o.get('total', 0)) for o in month_orders)
    pedidos_mes = len(month_orders)
    domicilios_mes = len([o for o in month_orders if o.get('tipo') in ['domicilio', 'delivery']])
    ticket_promedio_mes = ventas_mes / pedidos_mes if pedidos_mes > 0 else 0
    
    # Clientes nuevos mes
    response = supabase.table('clientes_puntos').select('id').match({"negocio_id": business.id}).gte("created_at", month_start.isoformat()).execute()
    clientes_nuevos_mes = len(response.data) if response.data else 0
    
    # Puntos otorgados mes
    puntos_otorgados_mes = 0
    # First get customer IDs for this business
    clients_res = supabase.table('clientes_puntos').select('id').eq('negocio_id', business.id).execute()
    client_ids = [c['id'] for c in clients_res.data] if clients_res.data else []
    
    if client_ids:
        # Get transactions for these clients in the last 30 days
        points_res = supabase.table('transacciones_puntos').select('puntos').match({"tipo": "ganado"}).in_('cliente_puntos_id', client_ids).gte("created_at", month_start.isoformat()).execute()
        puntos_otorgados_mes = sum(int(p.get('puntos', 0)) for p in points_res.data) if points_res.data else 0

    # Mensajes enviados (Using current count as a proxy or if we had history... for now current total for the month)
    # Ideally we'd have messages history, but for now we follow the 'hoys' pattern
    mensajes_enviados_mes = business.wa_messages_count
    
    # Tables (Current status, as requested)
    response = supabase.table('mesas').select('*').eq("negocio_id", business.id).execute()
    tables = response.data
    mesas_ocupadas = len([t for t in tables if t.get('estado') != 'libre'])
    mesas_totales = len(tables)
    
    return MonthlyAnalytics(
        ventas_mes=ventas_mes,
        pedidos_mes=pedidos_mes,
        domicilios_mes=domicilios_mes,
        ticket_promedio_mes=ticket_promedio_mes,
        clientes_nuevos_mes=clientes_nuevos_mes,
        puntos_otorgados_mes=puntos_otorgados_mes,
        mensajes_enviados_mes=mensajes_enviados_mes,
        mesas_ocupadas=mesas_ocupadas,
        mesas_totales=mesas_totales
    )


# ============ UPLOAD ROUTES ============
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), business: Business = Depends(get_current_business)):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
            
        # Create a unique filename with business context
        file_ext = file.filename.split('.')[-1]
        file_name = f"{business.id}/{uuid.uuid4()}.{file_ext}"
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        # Note: bucket 'menupro' was pre-created as public
        res = supabase.storage.from_('menupro').upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('menupro').get_public_url(file_name)
        
        return {"url": public_url}
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {str(e)}")


# ============ PRODUCTS ROUTES ============
@api_router.get("/products/{slug}", response_model=List[Product])
async def get_products(slug: str, categoria: Optional[str] = None):
    # Normalize slug
    slug = slug.lower().strip().rstrip('/')
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    query = supabase.table('menu_items').select('*').eq('negocio_id', business_id)
    if categoria:
        query = query.eq('category', categoria)
    
    try:
        response = query.execute()
        items = response.data
        # Map menu_items fields back to Product model for compatibility
        products = []
        for item in items:
            p_dict = {
                "id": item.get("id"),
                "negocio_id": item.get("negocio_id"),
                "nombre": item.get("name"),
                "descripcion": item.get("description"),
                "precio": float(item.get("base_price", 0)),
                "categoria": item.get("category"),
                "imagen": item.get("image_url"),
                "disponible": item.get("available"),
                "destacado": item.get("is_recommended", False),
                "precio_original": float(item.get("precio_original")) if item.get("precio_original") else None,
                "oferta_porcentaje": item.get("oferta_porcentaje"),
                "etiqueta": item.get("etiqueta"),
                "modificadores": item.get("modificadores"),
                "tamanos": item.get("tamanos"),
                "opciones": item.get("opciones"),
                "nutri_kcal": item.get("nutri_kcal"),
                "nutri_proteina": item.get("nutri_proteina"),
                "nutri_carbohidratos": item.get("nutri_carbohidratos"),
                "nutri_grasa": item.get("nutri_grasa"),
                "prep_time_minutes": item.get("prep_time_minutes"),
                "is_vegan": item.get("is_vegan", False),
                "is_vegetarian": item.get("is_vegetarian", False),
                "is_gluten_free": item.get("is_gluten_free", False),
                "is_spicy": item.get("is_spicy", False)
            }
            products.append(Product(**p_dict))
        return products
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        # Log traceback if possible, but at least detailed message
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener productos: {str(e)}")


@api_router.post("/products/{slug}", response_model=Product)
async def create_product(slug: str, data: ProductCreate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    product = Product(
        **data.model_dump(),
        negocio_id=business.id
    )

    # Estimate nutrition if not provided
    if not any([product.nutri_kcal, product.nutri_proteina, product.nutri_carbohidratos, product.nutri_grasa]):
        try:
            deduct_ai_credit(business.id, 'nutri', business)
            nutrition = await estimate_nutrition(product.nombre, product.descripcion or "")
            if nutrition:
                product.nutri_kcal = nutrition.get('kcal')
                product.nutri_proteina = nutrition.get('proteina')
                product.nutri_carbohidratos = nutrition.get('carbohidratos')
                product.nutri_grasa = nutrition.get('grasa')
        except HTTPException:
            logger.info(f"Skipping auto-nutrition for {slug} due to no credits or limit reached")
        except Exception as e:
            logger.error(f"Error in auto-nutrition: {e}")
    
    # Map Product fields to menu_items table fields
    menu_item_dict = {
        "id": product.id,
        "negocio_id": business.id,
        "name": product.nombre,
        "description": product.descripcion,
        "base_price": product.precio,
        "category": product.categoria,
        "image_url": product.imagen,
        "available": product.disponible,
        "is_recommended": product.destacado,
        "precio_original": product.precio_original,
        "oferta_porcentaje": product.oferta_porcentaje,
        "etiqueta": product.etiqueta,
        "modificadores": product.modificadores,
        "tamanos": product.tamanos,
        "opciones": product.opciones,
        "nutri_kcal": product.nutri_kcal,
        "nutri_proteina": product.nutri_proteina,
        "nutri_carbohidratos": product.nutri_carbohidratos,
        "nutri_grasa": product.nutri_grasa,
        "prep_time_minutes": product.prep_time_minutes,
        "is_vegan": product.is_vegan,
        "is_vegetarian": product.is_vegetarian,
        "is_gluten_free": product.is_gluten_free,
        "is_spicy": product.is_spicy,
        "currency": "COP" # Default
    }

    try:
        data_dict = serialize_doc(menu_item_dict)
        res = supabase.table('menu_items').insert(data_dict).execute()
        return product
    except Exception as e:
        error_str = str(e)
        logger.error(f"Error creating product in menu_items: {error_str}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear producto: {error_str}")

        logger.error(f"Error creating product: {error_str}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear producto: {error_str}")


@api_router.put("/products/{slug}/{product_id}", response_model=Product)
async def update_product(slug: str, product_id: str, data: ProductUpdate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Map ProductUpdate fields to menu_items table fields
    mapping = {
        'nombre': 'name',
        'descripcion': 'description',
        'precio': 'base_price',
        'categoria': 'category',
        'imagen': 'image_url',
        'disponible': 'available',
        'destacado': 'is_recommended'
    }
    
    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            target_key = mapping.get(k, k)
            update_data[target_key] = v

    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    # If name or description changed, and no nutrition info provided in update, re-estimate?
    has_name_change = 'name' in update_data or 'description' in update_data
    has_nutri_input = any(k in update_data for k in ['nutri_kcal', 'nutri_proteina', 'nutri_carbohidratos', 'nutri_grasa'])
    
    if has_name_change and not has_nutri_input:
        # Get current data from menu_items
        curr_res = supabase.table('menu_items').select('name, description').eq('id', product_id).execute()
        if curr_res.data:
            current = curr_res.data[0]
            new_name = update_data.get('name', current.get('name'))
            new_desc = update_data.get('description', current.get('description'))
            
            try:
                deduct_ai_credit(business.id, 'nutri', business)
                nutrition = await estimate_nutrition(new_name, new_desc or "")
                if nutrition:
                    update_data['nutri_kcal'] = nutrition.get('kcal')
                    update_data['nutri_proteina'] = nutrition.get('proteina')
                    update_data['nutri_carbohidratos'] = nutrition.get('carbohidratos')
                    update_data['nutri_grasa'] = nutrition.get('grasa')
                    logger.info(f"Re-estimated nutrition for updated menu item {product_id}")
            except HTTPException:
                logger.info(f"Skipping re-estimation for {product_id} due to no credits")
            except Exception as e:
                logger.error(f"Error in re-estimation: {e}")
    
    try:
        response = supabase.table('menu_items').update(update_data).match({
            "id": product_id, 
            "negocio_id": business.id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        # Map menu_items fields back to Product model for compatibility
        item = response.data[0]
        p_dict = {
            "id": item.get("id"),
            "negocio_id": item.get("negocio_id"),
            "nombre": item.get("name"),
            "descripcion": item.get("description"),
            "precio": float(item.get("base_price", 0)),
            "categoria": item.get("category"),
            "imagen": item.get("image_url"),
            "disponible": item.get("available"),
            "destacado": item.get("is_recommended", False),
            "precio_original": float(item.get("precio_original")) if item.get("precio_original") else None,
            "oferta_porcentaje": item.get("oferta_porcentaje"),
            "etiqueta": item.get("etiqueta"),
            "modificadores": item.get("modificadores"),
            "tamanos": item.get("tamanos"),
            "opciones": item.get("opciones"),
            "nutri_kcal": item.get("nutri_kcal"),
            "nutri_proteina": item.get("nutri_proteina"),
            "nutri_carbohidratos": item.get("nutri_carbohidratos"),
            "nutri_grasa": item.get("nutri_grasa"),
            "prep_time_minutes": item.get("prep_time_minutes"),
            "is_vegan": item.get("is_vegan", False),
            "is_vegetarian": item.get("is_vegetarian", False),
            "is_gluten_free": item.get("is_gluten_free", False),
            "is_spicy": item.get("is_spicy", False)
        }
        return Product(**p_dict)
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar producto: {str(e)}")


@api_router.delete("/products/{slug}/{product_id}")
async def delete_product(slug: str, product_id: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    response = supabase.table('menu_items').delete().match({
        "id": product_id, 
        "negocio_id": business.id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Producto eliminado"}




# ============ CATALOG ROUTES (Multi-Sede Architecture) ============

@api_router.get("/menu-items/{slug}", response_model=List[SedeMenuItemResponse])
async def get_menu_items(slug: str):
    """
    Endpoint principal del menú público para una sede.
    Lee del catálogo maestro (global_products) aplicando los overrides locales
    de sede_products (precio_local, activo, disponible, config_adicional).
    El campo 'id' en la respuesta siempre es el global_product_id para que
    el motor de inventario (process_inventory_for_order) funcione correctamente.
    """
    # 1. Resolver la sede (negocio) a partir del slug
    negocio_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not negocio_res.data:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    sede_id = negocio_res.data[0]['id']

    # 2. Obtener todos los sede_products activos para esta sede,
    #    con JOIN implícito a global_products y su categoría
    try:
        sp_res = supabase.table('sede_products').select(
            'id, activo, disponible, precio_local, config_adicional, '
            'global_products(id, nombre, descripcion, imagen, precio_base, category_id, '
            'global_categories(id, nombre))'
        ).eq('sede_id', sede_id).eq('activo', True).execute()
    except Exception as e:
        logger.error(f"Error fetching sede menu for slug '{slug}': {e}")
        raise HTTPException(status_code=500, detail="Error al obtener el menú de la sede")

    if not sp_res.data:
        # Si no hay sede_products configurados aún, intentar fallback a menu_items clásico
        # para mantener compatibilidad con sedes que aún no han migrado
        logger.warning(f"No sede_products found for sede {sede_id} (slug: {slug}). Falling back to legacy menu_items.")
        legacy_res = supabase.table('menu_items').select('*').eq('negocio_id', sede_id).order('created_at', desc=True).execute()
        return [MenuItem(**item) for item in legacy_res.data]

    # 3. Mapear cada fila al DTO de respuesta SedeMenuItemResponse
    items: List[SedeMenuItemResponse] = []
    for row in sp_res.data:
        gp = row.get('global_products') or {}
        cat = gp.get('global_categories') or {}
        config = row.get('config_adicional') or {}

        precio_base = float(gp.get('precio_base', 0))
        precio_local = float(row['precio_local']) if row.get('precio_local') is not None else None
        precio_vigente = precio_local if precio_local is not None else precio_base

        item = SedeMenuItemResponse(
            id=gp['id'],
            sede_product_id=row['id'],
            nombre=gp.get('nombre', ''),
            descripcion=gp.get('descripcion'),
            imagen=gp.get('imagen'),
            category_id=gp.get('category_id'),
            category_nombre=cat.get('nombre') if cat else None,
            precio_base=precio_base,
            precio_local=precio_local,
            precio_vigente=precio_vigente,
            activo=row.get('activo', True),
            disponible=row.get('disponible', True),
            # Extended config comes from sede_products.config_adicional
            modificadores=config.get('modificadores'),
            tamanos=config.get('tamanos'),
            opciones=config.get('opciones'),
            etiqueta=config.get('etiqueta'),
            is_recommended=config.get('is_recommended', False),
            is_spicy=config.get('is_spicy', False),
            is_vegan=config.get('is_vegan', False),
            is_vegetarian=config.get('is_vegetarian', False),
            is_gluten_free=config.get('is_gluten_free', False),
            allergens=config.get('allergens', []),
            prep_time_minutes=config.get('prep_time_minutes'),
        )
        items.append(item)

    return items


# --- Legacy endpoints (deprecated, kept for backward compatibility) ---
@api_router.post("/menu-items/{slug}", deprecated=True)
async def create_menu_item_legacy(slug: str):
    raise HTTPException(
        status_code=501,
        detail="Este endpoint está deprecado. Usa POST /catalog/global-products para crear productos en el catálogo maestro, y PUT /catalog/sedes/{sede_slug}/products/{product_id} para configurar la disponibilidad por sede."
    )


@api_router.put("/menu-items/{slug}/{item_id}", deprecated=True)
async def update_menu_item_legacy(slug: str, item_id: str):
    raise HTTPException(
        status_code=501,
        detail="Este endpoint está deprecado. Usa PATCH /catalog/global-products/{product_id} para actualizar el catálogo maestro, o PUT /catalog/sedes/{sede_slug}/products/{product_id} para overrides locales."
    )


@api_router.delete("/menu-items/{slug}/{item_id}", deprecated=True)
async def delete_menu_item_legacy(slug: str, item_id: str):
    raise HTTPException(
        status_code=501,
        detail="Este endpoint está deprecado. Desactiva el producto en la sede usando PUT /catalog/sedes/{sede_slug}/products/{product_id} con activo=false."
    )


# ============ CATALOG ADMIN ROUTES ============

# --- Global Categories ---
@api_router.get("/catalog/categories/{brand_slug}", response_model=List[GlobalCategory])
async def get_global_categories(brand_slug: str, business: Business = Depends(get_current_business)):
    """Lista todas las categorías del catálogo maestro para una marca."""
    brand_res = supabase.table('brands').select('id').eq('slug', brand_slug).execute()
    if not brand_res.data:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    brand_id = brand_res.data[0]['id']
    res = supabase.table('global_categories').select('*').eq('brand_id', brand_id).order('orden').execute()
    return [GlobalCategory(**c) for c in res.data]


@api_router.post("/catalog/categories", response_model=GlobalCategory)
async def create_global_category(data: GlobalCategoryCreate, business: Business = Depends(get_current_business)):
    """Crea una nueva categoría en el catálogo maestro."""
    row = data.model_dump()
    row['id'] = str(uuid.uuid4())
    row['created_at'] = datetime.now(timezone.utc).isoformat()
    row['updated_at'] = datetime.now(timezone.utc).isoformat()
    try:
        res = supabase.table('global_categories').insert(row).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Error al crear categoría")
        return GlobalCategory(**res.data[0])
    except Exception as e:
        logger.error(f"Error creating global category: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/catalog/categories/{category_id}", response_model=GlobalCategory)
async def update_global_category(category_id: str, data: GlobalCategoryUpdate, business: Business = Depends(get_current_business)):
    """Actualiza nombre u orden de una categoría del catálogo maestro."""
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()
    try:
        res = supabase.table('global_categories').update(update).eq('id', category_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        return GlobalCategory(**res.data[0])
    except Exception as e:
        logger.error(f"Error updating category {category_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/catalog/categories/{category_id}")
async def delete_global_category(category_id: str, business: Business = Depends(get_current_business)):
    """Elimina una categoría del catálogo maestro."""
    try:
        supabase.table('global_categories').delete().eq('id', category_id).execute()
        return {"message": "Categoría eliminada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Global Products (Catálogo Maestro) ---
@api_router.get("/catalog/products/{brand_slug}", response_model=List[GlobalProduct])
async def get_global_products(brand_slug: str, business: Business = Depends(get_current_business)):
    """Lista todos los productos del catálogo maestro para una marca."""
    brand_res = supabase.table('brands').select('id').eq('slug', brand_slug).execute()
    if not brand_res.data:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    brand_id = brand_res.data[0]['id']
    res = supabase.table('global_products').select('*').eq('brand_id', brand_id).order('created_at', desc=True).execute()
    return [GlobalProduct(**p) for p in res.data]


@api_router.post("/catalog/products", response_model=GlobalProduct)
async def create_global_product(data: GlobalProductCreate, business: Business = Depends(get_current_business)):
    """Crea un nuevo producto en el catálogo maestro."""
    row = data.model_dump()
    row['id'] = str(uuid.uuid4())
    row['created_at'] = datetime.now(timezone.utc).isoformat()
    row['updated_at'] = datetime.now(timezone.utc).isoformat()
    try:
        res = supabase.table('global_products').insert(row).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Error al crear producto")
        return GlobalProduct(**res.data[0])
    except Exception as e:
        logger.error(f"Error creating global product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/catalog/products/{product_id}", response_model=GlobalProduct)
async def update_global_product(product_id: str, data: GlobalProductUpdate, business: Business = Depends(get_current_business)):
    """Actualiza datos del catálogo maestro (nombre, descripción, precio_base, imagen)."""
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()
    try:
        res = supabase.table('global_products').update(update).eq('id', product_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return GlobalProduct(**res.data[0])
    except Exception as e:
        logger.error(f"Error updating global product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/catalog/products/{product_id}")
async def delete_global_product(product_id: str, business: Business = Depends(get_current_business)):
    """Elimina un producto del catálogo maestro (y en cascada sus sede_products)."""
    try:
        supabase.table('global_products').delete().eq('id', product_id).execute()
        return {"message": "Producto eliminado del catálogo maestro"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Sede Product Overrides ---
@api_router.get("/catalog/sedes/{sede_slug}/products", response_model=List[SedeMenuItemResponse])
async def get_sede_products(sede_slug: str, business: Business = Depends(get_current_business)):
    """Lista todos los productos configurados para una sede (vista de administrador)."""
    return await get_menu_items(sede_slug)


@api_router.put("/catalog/sedes/{sede_slug}/products/{product_id}", response_model=SedeProduct)
async def upsert_sede_product(sede_slug: str, product_id: str, data: SedeProductUpsert, business: Business = Depends(get_current_business)):
    """
    Crea o actualiza el override local de un producto global para una sede específica.
    Si el par (sede_id, global_product_id) ya existe, lo actualiza.
    Si no existe, lo crea (activando el producto en la sede).
    """
    negocio_res = supabase.table('negocios').select('id').eq('slug', sede_slug).execute()
    if not negocio_res.data:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    sede_id = negocio_res.data[0]['id']

    upsert_row = {
        'sede_id': sede_id,
        'global_product_id': product_id,
        'activo': data.activo,
        'disponible': data.disponible,
        'precio_local': data.precio_local,
        'config_adicional': data.config_adicional or {},
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    try:
        res = supabase.table('sede_products').upsert(upsert_row, on_conflict='sede_id,global_product_id').execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Error al configurar producto en sede")
        return SedeProduct(**res.data[0])
    except Exception as e:
        logger.error(f"Error upserting sede_product for sede {sede_slug}, product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/catalog/sedes/{sede_slug}/products/{product_id}")
async def remove_sede_product(sede_slug: str, product_id: str, business: Business = Depends(get_current_business)):
    """Desvincula (elimina el override de) un producto de una sede. El producto sigue existiendo en el catálogo maestro."""
    negocio_res = supabase.table('negocios').select('id').eq('slug', sede_slug).execute()
    if not negocio_res.data:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    sede_id = negocio_res.data[0]['id']
    try:
        supabase.table('sede_products').delete().eq('sede_id', sede_id).eq('global_product_id', product_id).execute()
        return {"message": "Producto desvinculado de la sede"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── INVENTORY ADMIN ENDPOINTS ────────────────────────────────────────────────

@api_router.get("/catalog/sedes/{sede_slug}/inventory")
async def get_sede_inventory(sede_slug: str, business: Business = Depends(get_current_business)):
    """
    Devuelve el inventario actual de ingredientes para una sede,
    enriquecido con el nombre y unidad del ingrediente global.
    """
    negocio_res = supabase.table('negocios').select('id').eq('slug', sede_slug).execute()
    if not negocio_res.data:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    sede_id = negocio_res.data[0]['id']

    try:
        inv_res = supabase.table('sede_inventory').select(
            'id, sede_id, stock_actual, stock_minimo, costo_unitario, '
            'global_ingredients(id, nombre, unidad_medida)'
        ).eq('sede_id', sede_id).execute()
    except Exception as e:
        logger.error(f"Error fetching inventory for sede {sede_slug}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener inventario")

    result = []
    for row in inv_res.data:
        gi = row.get('global_ingredients') or {}
        result.append({
            'id': row['id'],
            'sede_id': row['sede_id'],
            'global_ingredient_id': gi.get('id'),
            'nombre': gi.get('nombre', 'Ingrediente desconocido'),
            'unidad_medida': gi.get('unidad_medida', 'unidades'),
            'stock_actual': float(row.get('stock_actual', 0)),
            'stock_minimo': float(row.get('stock_minimo', 0)),
            'costo_unitario': float(row.get('costo_unitario', 0)),
        })
    return result


class InventoryTransactionCreate(BaseModel):
    sede_id: str
    global_ingredient_id: str
    tipo: str  # 'entrada' | 'ajuste' | 'merma'
    cantidad: float
    notas: Optional[str] = None


@api_router.post("/catalog/sedes/inventory/transaction")
async def register_inventory_transaction(
    data: InventoryTransactionCreate,
    business: Business = Depends(get_current_business)
):
    """
    Registra un movimiento manual de inventario (entrada, ajuste, merma)
    y actualiza el stock en sede_inventory.
    """
    try:
        # 1. Record the transaction
        tx_row = {
            'id': str(uuid.uuid4()),
            'sede_id': data.sede_id,
            'global_ingredient_id': data.global_ingredient_id,
            'tipo': data.tipo,
            'cantidad': data.cantidad,
            'notas': data.notas,
            'created_at': datetime.now(timezone.utc).isoformat(),
        }
        supabase.table('inventory_transactions').insert(tx_row).execute()

        # 2. Update or insert the stock in sede_inventory
        existing = supabase.table('sede_inventory').select('id, stock_actual').eq(
            'sede_id', data.sede_id).eq('global_ingredient_id', data.global_ingredient_id).execute()

        if existing.data:
            new_stock = float(existing.data[0]['stock_actual']) + data.cantidad
            supabase.table('sede_inventory').update({
                'stock_actual': new_stock,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', existing.data[0]['id']).execute()
        else:
            supabase.table('sede_inventory').insert({
                'id': str(uuid.uuid4()),
                'sede_id': data.sede_id,
                'global_ingredient_id': data.global_ingredient_id,
                'stock_actual': data.cantidad,
                'stock_minimo': 0,
                'costo_unitario': 0,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }).execute()

        return {"message": "Movimiento registrado correctamente", "cantidad": data.cantidad, "tipo": data.tipo}

    except Exception as e:
        logger.error(f"Error registering inventory transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Options ---
@api_router.get("/menu-items/{item_id}/options", response_model=List[MenuItemOption])
async def get_menu_item_options(item_id: str):
    response = supabase.table('menu_item_options').select('*').eq('menu_item_id', item_id).execute()
    return [MenuItemOption(**opt) for opt in response.data]


@api_router.post("/menu-items/{item_id}/options", response_model=MenuItemOption)
async def create_menu_item_option(item_id: str, data: MenuItemOptionCreate, business: Business = Depends(get_current_business)):
    # Verify item belongs to business
    item_res = supabase.table('menu_items').select('negocio_id').eq('id', item_id).execute()
    if not item_res.data or item_res.data[0]['negocio_id'] != business.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    option = MenuItemOption(**data.model_dump(), menu_item_id=item_id)
    response = supabase.table('menu_item_options').insert(serialize_doc(option.model_dump())).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al crear la opción")
    
    return MenuItemOption(**response.data[0])


@api_router.delete("/menu-items/options/{option_id}")
async def delete_menu_item_option(option_id: str, business: Business = Depends(get_current_business)):
    # In a real app we'd verify ownership via join
    # For now, let's just delete
    response = supabase.table('menu_item_options').delete().eq('id', option_id).execute()
    return {"message": "Opción eliminada"}


# --- Tags ---
@api_router.get("/menu-items/{item_id}/tags", response_model=List[MenuItemTag])
async def get_menu_item_tags(item_id: str):
    response = supabase.table('menu_item_tags').select('*').eq('menu_item_id', item_id).execute()
    return [MenuItemTag(**tag) for tag in response.data]


@api_router.post("/menu-items/{item_id}/tags", response_model=MenuItemTag)
async def create_menu_item_tag(item_id: str, data: MenuItemTagCreate, business: Business = Depends(get_current_business)):
    item_res = supabase.table('menu_items').select('negocio_id').eq('id', item_id).execute()
    if not item_res.data or item_res.data[0]['negocio_id'] != business.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    tag = MenuItemTag(**data.model_dump(), menu_item_id=item_id)
    response = supabase.table('menu_item_tags').insert(serialize_doc(tag.model_dump())).execute()
    
    return MenuItemTag(**response.data[0])


# ============ CATEGORIES ROUTES ============
@api_router.get("/categories/{slug}")
async def get_categories(slug: str):
    # Normalize slug
    slug = slug.lower().strip().rstrip('/')
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    # Try to get from 'categorias' table first
    try:
        res_cats = supabase.table('categorias').select('nombre, icono').eq('negocio_id', business_id).order('orden').execute()
        if res_cats.data:
            return [{"nombre": c["nombre"], "icono": c.get("icono")} for c in res_cats.data]
    except Exception as e:
        logger.warning(f"Error fetching categories from table: {e}")
        pass # Table might not exist yet

    # Fallback: distinct from products
    response = supabase.table('productos').select('categoria').eq('negocio_id', business_id).execute()
    categories = sorted(list(set(p['categoria'] for p in response.data if p.get('categoria'))))
    # Return as objects for consistency
    return [{"nombre": c, "icono": None} for c in categories]

@api_router.post("/categories/{slug}")
async def create_category(slug: str, data: Dict[str, str], business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    nombre = data.get("nombre")
    icono = data.get("icono")
    
    if not nombre:
        raise HTTPException(status_code=400, detail="Nombre requerido")
        
    try:
        # Check if exists
        logger.info(f"Checking for category: {nombre} in business {business.id}")
        res = supabase.table('categorias').select('id, nombre, icono').match({"negocio_id": business.id, "nombre": nombre}).execute()
        
        if not res.data:
            logger.info(f"Category not found, creating new: {nombre}, icon: {icono}")
            payload = {"negocio_id": business.id, "nombre": nombre}
            if icono:
                payload["icono"] = icono
            supabase.table('categorias').insert(payload).execute()
        else:
            cat_id = res.data[0]['id']
            curr_icon = res.data[0].get('icono')
            logger.info(f"Category found: {cat_id}, current icon: {curr_icon}. Updating to: {icono}")
            # Update icon if provided
            if icono:
                supabase.table('categorias').update({"icono": icono}).eq("id", cat_id).execute()
                logger.info("Icon updated.")

    except Exception as e:
        logger.error(f"Error saving category: {e}")
        error_msg = str(e)
        if "column" in error_msg.lower() and "icono" in error_msg.lower():
             logger.error("CRITICAL: 'icono' column missing in 'categorias' table. Please run: ALTER TABLE categories ADD COLUMN IF NOT EXISTS icono TEXT;")
        # If table doesn't exist, ignore (frontend will rely on product saving)
        pass
        
    return {"message": "Categoría guardada"}

@api_router.delete("/categories/{slug}")
async def delete_category(slug: str, nombre: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    try:
        supabase.table('categorias').delete().match({"negocio_id": business.id, "nombre": nombre}).execute()
    except:
        pass
    return {"message": "Categoría eliminada"}


# ============ TAGS ROUTES ============
@api_router.get("/tags/{slug}")
async def get_tags(slug: str):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    # Try to get from 'etiquetas' table first
    try:
        res_tags = supabase.table('etiquetas').select('nombre').eq('negocio_id', business_id).execute()
        if res_tags.data:
            return [t['nombre'] for t in res_tags.data]
    except:
        pass

    # Fallback
    # Safe get: select all columns and use .get() to avoid crash if column is missing
    try:
        response = supabase.table('menu_items').select('name, etiqueta').eq('negocio_id', business_id).execute()
        tags = sorted(list(set(p['etiqueta'] for p in response.data if p.get('etiqueta'))))
        return tags
    except:
        return []

@api_router.post("/tags/{slug}")
async def create_tag(slug: str, data: Dict[str, str], business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    nombre = data.get("nombre")
    if not nombre:
        raise HTTPException(status_code=400, detail="Nombre requerido")
        
    try:
        # Check if exists
        res = supabase.table('etiquetas').select('id').match({"negocio_id": business.id, "nombre": nombre}).execute()
        if not res.data:
            supabase.table('etiquetas').insert({"negocio_id": business.id, "nombre": nombre}).execute()
    except Exception as e:
        logger.error(f"Error saving tag: {e}")
        pass
        
    return {"message": "Etiqueta guardada"}

@api_router.delete("/tags/{slug}")
async def delete_tag(slug: str, nombre: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    try:
        supabase.table('etiquetas').delete().match({"negocio_id": business.id, "nombre": nombre}).execute()
    except:
        pass
    return {"message": "Etiqueta eliminada"}


# ============ TABLES ROUTES ============
@api_router.get("/tables/{slug}", response_model=List[Table])
async def get_tables(slug: str):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    response = supabase.table('mesas').select('*').eq('negocio_id', business_id).order('numero').execute()
    tables = response.data
    return [Table(**t) for t in tables]


@api_router.post("/tables/{slug}", response_model=Table)
async def create_table(slug: str, data: TableCreate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Check if table number exists
    response = supabase.table('mesas').select('id').match({"negocio_id": business.id, "numero": data.numero}).execute()
    if response.data:
        raise HTTPException(status_code=400, detail="Número de mesa ya existe")
    
    table = Table(
        **data.model_dump(),
        negocio_id=business.id,
        qr_code=f"/{slug}/mesa/{data.numero}"
    )
    
    supabase.table('mesas').insert(serialize_doc(table.model_dump())).execute()
    
    # Broadcast table update
    await manager.broadcast(business.id, {
        "type": "table_created",
        "data": serialize_doc(table.model_dump())
    })
    
    return table


@api_router.put("/tables/{slug}/{table_id}", response_model=Table)
async def update_table(slug: str, table_id: str, data: TableUpdate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    update_data = {k: v.value if hasattr(v, 'value') else v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    response = supabase.table('mesas').update(update_data).match({
        "id": table_id, 
        "negocio_id": business.id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    table_doc = response.data[0]
    table = Table(**table_doc)
    
    # Broadcast table update
    await manager.broadcast(business.id, {
        "type": "table_updated",
        "data": serialize_doc(table.model_dump())
    })
    
    return table


@api_router.delete("/tables/{slug}/{table_id}")
async def delete_table(slug: str, table_id: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    response = supabase.table('mesas').delete().match({
        "id": table_id, 
        "negocio_id": business.id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    # Broadcast table deletion
    await manager.broadcast(business.id, {
        "type": "table_deleted",
        "data": {"id": table_id}
    })
    
    return {"message": "Mesa eliminada"}


@api_router.get("/tables/{slug}/{table_number}/info")
async def get_table_by_number(slug: str, table_number: int):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    response = supabase.table('mesas').select('*').match({"negocio_id": business_id, "numero": table_number}).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    return Table(**response.data[0])


# ============ EMPLOYEES ROUTES ============
@api_router.get("/employees/{slug}", response_model=List[Employee])
async def get_employees(slug: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    response = supabase.table('empleados').select('*').eq('negocio_id', business.id).execute()
    employees = response.data
    return [Employee(**e) for e in employees]


@api_router.post("/employees/{slug}", response_model=Employee)
async def create_employee(slug: str, data: EmployeeCreate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Check if PIN exists
    response = supabase.table('empleados').select('id').match({"negocio_id": business.id, "pin": data.pin}).execute()
    if response.data:
        raise HTTPException(status_code=400, detail="PIN ya en uso")
    
    employee = Employee(
        **data.model_dump(),
        negocio_id=business.id
    )
    
    supabase.table('empleados').insert(serialize_doc(employee.model_dump())).execute()
    return employee


@api_router.put("/employees/{slug}/{employee_id}", response_model=Employee)
async def update_employee(slug: str, employee_id: str, data: EmployeeCreate, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Check if PIN exists (excluding current employee)
    # We first find if any OTHER employee has this PIN
    response = supabase.table('empleados').select('id').match({"negocio_id": business.id, "pin": data.pin}).neq('id', employee_id).execute()
    if response.data:
        raise HTTPException(status_code=400, detail="PIN ya en uso")
    
    update_data = data.model_dump()
    
    response = supabase.table('empleados').update(update_data).match({
        "id": employee_id, 
        "negocio_id": business.id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return Employee(**response.data[0])


@api_router.delete("/employees/{slug}/{employee_id}")
async def delete_employee(slug: str, employee_id: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    response = supabase.table('empleados').delete().match({
        "id": employee_id, 
        "negocio_id": business.id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return {"message": "Empleado eliminado"}


# ============ ORDERS ROUTES ============
@api_router.get("/orders/{slug}", response_model=List[Order])
async def get_orders(
    slug: str,
    estado: Optional[str] = None,
    limit: int = Query(50, le=1000),
    skip: int = 0
):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    query = supabase.table('pedidos').select('*').eq('negocio_id', business_id).order('created_at', desc=True).range(skip, skip + limit - 1)
    if estado:
        query = query.eq('estado', estado)
    
    response = query.execute()
    orders = response.data
    return [Order(**o) for o in orders]


@api_router.get("/orders/{slug}/active", response_model=List[Order])
async def get_active_orders(slug: str, kitchen_type: Optional[str] = None):
    """
    Returns active kitchen orders for a slug.
    - If the slug belongs to a Super Admin (parent_id IS NULL), fetches orders from
      ALL child sedes plus the parent itself so the unified kitchen view works.
    - If the slug belongs to a branch admin (parent_id IS NOT NULL), fetches only
      that branch's orders.
    - Optional query param `kitchen_type`:
        - "delivery" → only delivery orders
        - "salon"    → only mesa/takeaway orders
        - None       → all orders (default)
    """
    # Resolve the negocio
    response = supabase.table('negocios').select('id, parent_id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    negocio = response.data[0]
    business_id = negocio['id']
    parent_id = negocio.get('parent_id')

    if parent_id:
        # Branch admin — only their own orders
        negocio_ids = [business_id]
    else:
        # Super admin — their own orders + all child branches
        children_res = supabase.table('negocios').select('id').eq('parent_id', business_id).execute()
        child_ids = [c['id'] for c in (children_res.data or [])]
        negocio_ids = [business_id] + child_ids

    if len(negocio_ids) == 1:
        query = supabase.table('pedidos').select('*').eq('negocio_id', negocio_ids[0])
    else:
        query = supabase.table('pedidos').select('*').in_('negocio_id', negocio_ids)

    query = query.in_('estado', ["pendiente", "aceptado", "preparando", "listo"]).order('created_at')
    orders_res = query.execute()

    # Enrich each order with the sede name for the unified kitchen UI
    sede_map = {}
    if len(negocio_ids) > 1:
        all_negocios = supabase.table('negocios').select('id, nombre, slug').in_('id', negocio_ids).execute()
        sede_map = {n['id']: {'nombre': n['nombre'], 'slug': n['slug']} for n in (all_negocios.data or [])}

    result = []
    for o in (orders_res.data or []):
        # Apply kitchen_type filter
        if kitchen_type == 'delivery' and o.get('tipo') not in ['delivery']:
            continue
        if kitchen_type == 'salon' and o.get('tipo') not in ['mesa', 'takeaway']:
            continue

        order = Order(**o)
        # Attach sede info as extra metadata if available (used by kitchen UI)
        if sede_map:
            sede_info = sede_map.get(o.get('negocio_id'), {})
            order_dict = order.model_dump()
            order_dict['sede_nombre'] = sede_info.get('nombre', '')
            order_dict['sede_slug'] = sede_info.get('slug', slug)
            result.append(Order(**order_dict))
        else:
            result.append(order)

    return result




from fastapi import BackgroundTasks

@api_router.post("/orders/{slug}", response_model=Order)
async def create_order(slug: str, data: OrderCreate, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Creating order for slug: {slug}")
        
        response = supabase.table('negocios').select('*').eq('slug', slug).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
        business_data = response.data[0]
        business_id = business_data['id']
        business_name = business_data['nombre']
        business_phone = business_data.get('whatsapp') or business_data.get('telefono')
        
        # Twilio Config for this business
        twilio_config = {
            "sid": business_data.get('twilio_sid'),
            "token": business_data.get('twilio_token'),
            "number": business_data.get('twilio_number')
        } if business_data.get('twilio_sid') else None

        # Validate Plan Limits (Orders)
        # Count orders for this business in the current month
        # Get start/end of current month
        today = datetime.now(timezone.utc)
        start_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        count_res = supabase.table('pedidos').select('id', count='exact')\
            .eq('negocio_id', business_id)\
            .gte('created_at', start_month.isoformat())\
            .execute()
            
        order_count = count_res.count or 0
        biz_plan = business_data.get('plan', 'trial') # Default to trial
        
        # Plan Limits
        LIMITS = {
            'trial': 50,      # Trial limit (optional, user said trial allows functionality but no WA)
            'impulso': 150,
            'pro': 450,
            'elite': 999999,
            'business': 999999 # Alias for elite
        }
        
        limit = LIMITS.get(biz_plan, 50) # Default to lowest if unknown
        
        if order_count >= limit:
             raise HTTPException(status_code=402, detail=f"Has alcanzado el límite de {limit} pedidos de tu plan {biz_plan}. Actualiza tu plan para seguir vendiendo.")

        # Calculate total
        subtotal = sum((item.cantidad or 0) * (item.precio_unitario or 0) for item in data.items)
        total = subtotal + (data.costo_envio or 0)
            
        # Generar código de pedido numerico de 6 digitos (solicitado por el usuario)
        # Para asegurar que sea clickeable en WhatsApp y de 6 digitos
        random_id = random.randint(100000, 999999)
            
        order = Order(
            **data.model_dump(),
            negocio_id=business_id,
            total=total,
            numero_secuencial=random_id
        )
        
        order_dict = serialize_doc(order.model_dump())
        
        # Filter for DB columns (Remove mesero_id and ensure compatibility)
        order_dict.pop('mesero_id', None)
        order_dict.pop('mesero_nombre', None)
        order_dict.pop('negocio_nombre', None)
        order_dict.pop('negocio_logo', None)

        logger.info(f"Inserting into DB: {order_dict.get('id')} with seq: {order_dict['numero_secuencial']}")
        
        # Proyecto de un solo negocio: siempre registrar pedido real (sin modo demo)
        supabase.table('pedidos').insert(order_dict).execute()
        
        # Update table status if mesa_id provided
        if data.mesa_id:
            supabase.table('mesas').update({"estado": "ocupada"}).eq("id", data.mesa_id).execute()
        
        # Broadcast new order to kitchen
        await manager.broadcast(business_id, {
            "type": "new_order",
            "data": order_dict
        })

        # 2. Credits Deduction Logic
        # Notificaciones WA: 2 Créditos (Cliente + Negocio)
        # El cargo por Sesión IA (1 crédito) ya fue realizado por el Agente.
        credits_to_deduct = 2
        
        wa_credits = business_data.get('wa_credits', 0)
        wa_count = business_data.get('wa_messages_count', 0)
        whatsapp_usados = business_data.get('whatsapp_usados', 0)
        
        if True:
            # Always increment whatsapp_usados (used for dashboard counter)
            supabase.table('negocios').update({"whatsapp_usados": whatsapp_usados + credits_to_deduct}).eq("id", business_id).execute()
            
            if wa_credits >= credits_to_deduct:
                supabase.table('negocios').update({"wa_credits": wa_credits - credits_to_deduct}).eq("id", business_id).execute()
            else:
                supabase.table('negocios').update({"wa_messages_count": wa_count + credits_to_deduct}).eq("id", business_id).execute()

            # Send WhatsApp notifications (Client + Business)
            background_tasks.add_task(send_order_wa_background, business_name, order, business_phone, twilio_config, slug)
        else:
            logger.info(f"DEMO ORDER: Skipping credits deduction and WhatsApp notifications.")
        
        return order
    except Exception as e:
        logger.error(f"ERROR in create_order: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creando pedido: {str(e)}")

def format_order_notification_business(order: Order, business_name: str) -> str:
    """Format notification message for the business owner"""
    fecha = datetime.now().strftime("%d/%m/%Y, %H:%M")
    cliente = order.cliente_nombre or "Cliente"
    telefono = order.cliente_telefono or "No registrado"
    
    msg = f"🔔 *NUEVO PEDIDO RECIBIDO*\n"
    msg += f"🏢 *{business_name}*\n"
    msg += f"📅 {fecha}\n\n"
    
    msg += f"👤 *Cliente:* {cliente}\n"
    msg += f"📱 *Teléfono:* {telefono}\n"
    
    if order.tipo == "delivery":
         msg += f"🛵 *Domicilio*\n"
         msg += f"📍 *Dirección:* {order.direccion or 'No especificada'}\n"
         if order.notas:
             msg += f"📝 *Notas:* {order.notas}\n"
    elif order.tipo == "mesa":
         msg += f"🍽️ *Mesa:* {order.mesa_numero or 'Sin numero'}\n"
    elif order.tipo == "takeaway":
         msg += f"🛍️ *Para Recoger*\n"
         
    msg += "\n*--- DETALLE DEL PEDIDO ---*\n"
    for item in order.items:
        msg += f"• {item.cantidad}x {item.nombre}\n"
        if item.modificadores:
            mods = []
            for m in item.modificadores:
                if isinstance(m, dict):
                    name = m.get('nombre', '')
                    price = m.get('precio', 0)
                    if price and price > 0:
                        mods.append(f"{name} (+${price:,.0f})")
                    else:
                        mods.append(name)
                else:
                    mods.append(str(m))
            msg += f"  (Opciones: {', '.join(mods)})\n"
        if item.notas and item.notas != "No aplica":
            msg += f"  (Nota: {item.notas})\n"
        
    msg += f"\n💰 *TOTAL: ${order.total:,.0f}*\n"
    msg += f"💳 *Pago:* {order.metodo_pago}\n"
    
    return msg

def reverse_geocode_address(direccion: str) -> str:
    """Convert GPS coordinates to a human-readable address using Google Maps API"""
    import re
    import requests as http_requests
    
    if not direccion:
        return "No especificada"
    
    # Detect GPS coordinate patterns
    gps_patterns = [
        r'Ubicación GPS\s*\(?\s*([+-]?\d+\.?\d*)[,\s]+([+-]?\d+\.?\d*)\s*\)?',
        r'^\s*([+-]?\d+\.\d{3,})[,\s]+([+-]?\d+\.\d{3,})\s*$',
    ]
    
    lat, lng = None, None
    for pattern in gps_patterns:
        match = re.search(pattern, direccion)
        if match:
            lat, lng = float(match.group(1)), float(match.group(2))
            break
    
    if lat is None or lng is None:
        return direccion  # Already a text address
    
    try:
        api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
        if not api_key:
            return direccion
        
        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}&language=es"
        response = http_requests.get(url, timeout=5)
        data = response.json()
        
        if data.get('results'):
            return data['results'][0]['formatted_address']
    except Exception as e:
        logger.error(f"Error reverse geocoding: {e}")
    
    return direccion

def send_order_wa_background(business_name: str, order: Order, business_phone: str = None, twilio_config: Dict[str, Any] = None, slug: str = None):
    """Send order notifications to Client and Business using approved templates"""
    
    # Format date in 12h format (am/pm) as requested, adjusted for Colombia (GMT-5)
    bogota_tz = timezone(timedelta(hours=-5))
    fecha = datetime.now(bogota_tz).strftime("%d/%m/%Y, %I:%M %p").lower()
    
    # ── Build individual fields for the 19-variable template ──
    
    # {{5}} Product detail lines
    detalle_items = []
    all_tamanos = []
    all_adicionales = []
    all_opciones = []
    subtotal = 0
    
    for idx, item in enumerate(order.items, 1):
        item_subtotal = (item.cantidad or 0) * (item.precio_unitario or 0)
        subtotal += item_subtotal
        
        line = f"{idx}. {item.nombre} x{item.cantidad} (${item.precio_unitario:,.0f})"
        detalle_items.append(line)
        
        # Process modifiers into separate categories
        if item.modificadores:
            for m in item.modificadores:
                if isinstance(m, dict):
                    m_name = m.get('nombre', '')
                    m_cat = (m.get('categoria') or m.get('tipo') or '').lower()
                    m_precio = m.get('precio', 0)
                    m_cant = m.get('cantidad', 1)
                    
                    display = f"{m_cant}x {m_name}" if m_cant > 1 else m_name
                    if m_precio and m_precio > 0:
                        display += f" (${m_precio:,.0f})"
                    
                    if 'tamañ' in m_cat or 'taman' in m_cat:
                        all_tamanos.append(display)
                    elif 'opci' in m_cat:
                        all_opciones.append(display)
                    else:
                        all_adicionales.append(display)
                else:
                    all_adicionales.append(str(m))
    
    detalle_productos = "\n".join(detalle_items)
    tamanos_str = ", ".join(all_tamanos) if all_tamanos else ""
    adicionales_str = ", ".join(all_adicionales) if all_adicionales else ""
    opciones_str = ", ".join(all_opciones) if all_opciones else ""
    
    # ── Collect observations into a cleaner structure ──
    # 1. Product-level notes (Item specific)
    product_notes = []
    for item in order.items:
        if item.notas and str(item.notas).lower() not in ["no aplica", "ninguna", "sin notas", "", "null"]:
            # Usar una pequeña viñeta para listar las notas de los productos
            product_notes.append(f"• {item.notas}")
    
    # 2. General order notes
    raw_notes = order.notas or ""
    pedido_notes = []
    entrega_notes = []
    
    if ". Observaciones de entrega: " in raw_notes:
        parts = raw_notes.split(". Observaciones de entrega: ")
        if parts[0].strip() and parts[0].strip().lower() not in ["sin observaciones", ""]:
            pedido_notes.append(parts[0].strip())
        if len(parts) > 1 and parts[1].strip() and parts[1].strip().lower() not in ["sin observaciones", ""]:
            entrega_notes.append(parts[1].strip())
    elif raw_notes and raw_notes.lower() not in ["sin observaciones", ""]:
        # Solo lo ponemos en entrega para evitar el reporte de "mezcla rara"
        entrega_notes.append(raw_notes)
        
    # Combine everything for the template
    all_obs_pedido = product_notes + pedido_notes
    obs_pedido = "\n".join(all_obs_pedido) if all_obs_pedido else "Sin observaciones"
    obs_entrega = ". ".join(entrega_notes) if entrega_notes else "Sin observaciones"
    
    # Reverse geocode GPS coordinates to readable address
    direccion_legible = reverse_geocode_address(order.direccion) if order.direccion else ""
    
    # Determine delivery method display name 
    metodo_entrega = order.metodo_entrega or ("Domicilio" if order.tipo == "delivery" else ("Mesa" if order.tipo == "mesa" else "Para Recoger"))
    
    # Distance
    distancia_str = f"{order.distancia:.1f} Km" if order.distancia else ""
    
    # Payment
    costo_envio = order.costo_envio or 0
    
    # Usar monoespacio para el ID para facilitar la copia en móviles y asegurar 8 dígitos
    padded_id = str(order.numero_secuencial).zfill(8) if order.numero_secuencial else (order.id[:8].upper() if isinstance(order.id, str) else str(order.id))
    display_pedido_id = f"`{padded_id}`"
    
    # ── TEMPLATE VARIABLE MAPPING (19 variables) ──
    template_kwargs = {
        "negocio_nombre":     business_name,                           # {{1}}
        "pedido_id":          display_pedido_id,                       # {{2}} - ID monoespaciado para copiar
        "cliente_nombre":     order.cliente_nombre or "Cliente",       # {{3}}
        "cliente_telefono":   order.cliente_telefono or "N/A",         # {{4}}
        "detalle_productos":  detalle_productos,                       # {{5}}
        "tamanos":            tamanos_str,                             # {{6}}
        "adicionales":        adicionales_str,                         # {{7}}
        "opciones":           opciones_str,                            # {{8}}
        "observacion_pedido": obs_pedido,                              # {{9}}
        "metodo_entrega":     metodo_entrega,                          # {{10}}
        "direccion":          direccion_legible,                        # {{11}}
        "distancia":          distancia_str,                           # {{12}}
        "observacion_entrega": obs_entrega,                            # {{13}}
        "metodo_pago":        order.metodo_pago or "Efectivo",         # {{14}}
        "subtotal":           f"${subtotal:,.0f}",                     # {{15}}
        "costo_envio":        f"${costo_envio:,.0f}",                  # {{16}}
        "total":              f"${order.total:,.0f}",                  # {{17}}
        "fecha":              fecha,                                    # {{18}}
        "link_seguimiento":   f"https://menuia.co/{slug}/mis-pedidos"  # {{19}}
    }

    # 1. Send to Client (using approved template)
    if order.cliente_telefono:
        try:
            result = send_whatsapp_template(
                to_number=order.cliente_telefono,
                template_key="resumen_pedido",
                custom_config=twilio_config,
                **template_kwargs
            )
            if result:
                logger.info(f"WhatsApp template 'resumen_pedido' sent to client {order.cliente_telefono}: {result}")
            else:
                # Fallback to freeform text (only works within 24h window)
                logger.warning(f"Template failed for client, trying freeform fallback...")
                wa_message = format_order_summary_wa(business_name, order, slug=slug)
                send_whatsapp_response(order.cliente_telefono, wa_message, twilio_config)
                logger.info(f"WhatsApp freeform summary sent to client {order.cliente_telefono}")
        except Exception as wa_err:
            logger.error(f"Error sending WhatsApp to client: {wa_err}")
            logger.error(traceback.format_exc())

    # 2. Send to Business (using approved template)
    if business_phone:
        try:
            result = send_whatsapp_template(
                to_number=business_phone,
                template_key="resumen_pedido",
                custom_config=twilio_config,
                **template_kwargs
            )
            if result:
                logger.info(f"WhatsApp template 'resumen_pedido' sent to business {business_phone}: {result}")
            else:
                # Fallback to freeform text
                logger.warning(f"Template failed for business, trying freeform fallback...")
                # Use same identical format for the business fallback so they see the exact structure they expect
                biz_message = format_order_summary_wa(business_name, order, slug=slug)
                send_whatsapp_response(business_phone, biz_message, twilio_config)
                logger.info(f"WhatsApp freeform notification sent to business {business_phone}")
        except Exception as wa_err:
            logger.error(f"Error sending WhatsApp to business: {wa_err}")
            logger.error(traceback.format_exc())

def clean_wa_phone(phone: str) -> str:
    """Limpia y normaliza el número de teléfono para WhatsApp (ej: +573...)"""
    if not phone: return None
    clean = str(phone).replace(' ', '').replace('-', '').replace('+', '').replace('whatsapp:', '').strip()
    if len(clean) == 10 and clean.startswith('3'):
        return f"+57{clean}"
    if not clean.startswith('+'):
        return f"+{clean}"
    return f"+{clean.replace('+', '')}"

def notify_delivery_update_background(slug: str, order_id: str, type: str, data: dict = None):
    """
    Background task to handle delivery notifications.
    type: 'assignment' (to messenger), 'enviado' (to customer), 'entregado' (to customer/admin)
    Deducts wa_messages_count for each WhatsApp message sent.
    """
    try:
        # Fetch fresh data
        res_order = supabase.table('pedidos').select('*').eq('id', order_id).execute()
        if not res_order.data: return
        order = res_order.data[0]
        
        # Get display ID (numero_secuencial padded to 8 digits or first 8 chars of UUID)
        numero_secuencial = order.get('numero_secuencial')
        if numero_secuencial:
            display_id = str(numero_secuencial).zfill(8)
        else:
            display_id = order_id[:8].upper() if isinstance(order_id, str) else str(order_id)
        
        res_biz = supabase.table('negocios').select('*').eq('slug', slug).execute()
        if not res_biz.data: return
        biz = res_biz.data[0]
        negocio_id = biz['id']
        wa_count = biz.get('wa_messages_count', 0)
        wa_credits = biz.get('wa_credits', 0)
        whatsapp_usados = biz.get('whatsapp_usados', 0)
        
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        
        # Limpieza de teléfonos y logs previos
        logger.info(f"--- DELIVERY_NOTIF_START: {type} para Pedido {order_id} ---")
        
        twilio_config = {
            "sid": biz.get('twilio_sid'),
            "token": biz.get('twilio_token'),
            "number": biz.get('twilio_number')
        } if biz.get('twilio_sid') else None
        
        if twilio_config:
            logger.info(f"Usando configuración custom de Twilio: {twilio_config['sid'][:6]}...")
        else:
            logger.info("Usando configuración Global de Twilio")

        if type == 'assignment':
            # Notificación al Repartidor Y al Cliente (Asignación)
            # USAMOS PLANTILLA para que llegue sin necesidad de conversación previa
            rep_id = order.get('repartidor_id')
            if not rep_id: 
                logger.warning(f"No hay repartidor_id en el pedido {order_id}")
                return
                
            res_rep = supabase.table('empleados').select('*').eq('id', rep_id).execute()
            if not res_rep.data: 
                logger.error(f"No se encontró repartidor {rep_id}")
                return
            rep = res_rep.data[0]
            
            # Links diferentes para cada destinatario
            link_repartidor = f"{frontend_url}/reparto/{slug}/{order_id}"
            link_cliente = f"{frontend_url}/{slug}/mis-pedidos?order={order_id}"
            
            # Parámetros comunes de la plantilla
            common_params = dict(
                repartidor_nombre=rep.get('nombre', 'Repartidor'),
                repartidor_telefono=rep.get('telefono', 'N/A'),
                negocio_nombre=biz.get('nombre', 'Nuestro Negocio'),
                cliente_nombre=order.get('cliente_nombre', 'Cliente'),
                cliente_telefono=order.get('cliente_telefono', 'N/A'),
                direccion_entrega=order.get('direccion', 'Ver en mapa'),
                order_id_corto=display_id
            )
            
            messages_sent = 0
            
            # 1. Enviar al Repartidor (con link a su interfaz de despacho)
            rep_phone = clean_wa_phone(rep.get('telefono'))
            if rep_phone:
                logger.info(f"Enviando plantilla asignacion_repartidor a repartidor {rep['nombre']} ({rep_phone})")
                res_tmpl = send_whatsapp_template(
                    to_number=rep_phone,
                    template_key="asignacion_repartidor",
                    custom_config=twilio_config,
                    link_seguimiento=link_repartidor,
                    **common_params
                )
                if res_tmpl:
                    logger.info(f"Asignación enviada al repartidor via plantilla. SID: {res_tmpl}")
                    messages_sent += 1
                else:
                    logger.error(f"Error al enviar plantilla asignacion_repartidor a repartidor {rep_phone}")
            else:
                logger.warning(f"Repartidor {rep['nombre']} sin teléfono")
            
            # 2. Enviar al Cliente (con link a seguimiento en tiempo real)
            cust_phone = clean_wa_phone(order.get('cliente_telefono'))
            if cust_phone:
                logger.info(f"Enviando plantilla seguimiento_cliente a cliente {order.get('cliente_nombre')} ({cust_phone})")
                res_tmpl_cust = send_whatsapp_template(
                    to_number=cust_phone,
                    template_key="seguimiento_cliente",
                    custom_config=twilio_config,
                    link_seguimiento=link_cliente,
                    **common_params
                )
                if res_tmpl_cust:
                    logger.info(f"Seguimiento enviado al cliente via plantilla. SID: {res_tmpl_cust}")
                    messages_sent += 1
                else:
                    logger.error(f"Error al enviar plantilla seguimiento_cliente a cliente {cust_phone}")
            else:
                logger.warning(f"Cliente sin teléfono registrado")
            
            # 3. Deduct credits for messages sent (assignment = 2 messages: repartidor + cliente)
            if messages_sent > 0:
                # Always increment whatsapp_usados (used for dashboard counter)
                supabase.table('negocios').update({"whatsapp_usados": whatsapp_usados + messages_sent}).eq("id", negocio_id).execute()
                if wa_credits >= messages_sent:
                    supabase.table('negocios').update({"wa_credits": wa_credits - messages_sent}).eq("id", negocio_id).execute()
                else:
                    supabase.table('negocios').update({"wa_messages_count": wa_count + messages_sent}).eq("id", negocio_id).execute()
                logger.info(f"Deducted {messages_sent} credits for delivery assignment notification")
            
        # Estado 'enviado': No se envía notificación adicional.
        # El repartidor ya fue notificado con 'asignacion_repartidor' al pasar a 'listo'.
        elif type == 'enviado':
            logger.info(f"Pedido {order_id} marcado como enviado. Sin notificación adicional.")
            
        elif type == 'entregado':
            messages_sent = 0
            
            # Notificar Cliente
            msg_cust = f"✅ *¡Pedido Entregado!* (#ID: {display_id})\n\nEsperamos que lo disfrutes. ¡Vuelve pronto a {biz.get('nombre', 'nuestro local')}!"
            cust_phone = clean_wa_phone(order.get('cliente_telefono'))
            if cust_phone:
                logger.info(f"Enviando notificación de entrega al cliente: {cust_phone}")
                result = send_whatsapp_response(cust_phone, msg_cust, custom_config=twilio_config)
                if result:
                    logger.info(f"Mensaje de entrega enviado al cliente {cust_phone}. SID: {result}")
                    messages_sent += 1
                else:
                    logger.error(f"Error al enviar mensaje de entrega al cliente {cust_phone}")
            else:
                logger.warning(f"No hay teléfono del cliente para enviar notificación de entrega")
            
            # Notificar Admin
            msg_admin = f"💰 *ENTREGA COMPLETADA*\n\nEl pedido #{display_id} ha sido registrado como entregado al cliente {order.get('cliente_nombre', 'N/A')}."
            biz_phone = clean_wa_phone(biz.get('whatsapp') or biz.get('telefono'))
            if biz_phone:
                logger.info(f"Enviando notificación de entrega al negocio: {biz_phone}")
                result = send_whatsapp_response(biz_phone, msg_admin, custom_config=twilio_config)
                if result:
                    logger.info(f"Mensaje de entrega enviado al negocio {biz_phone}. SID: {result}")
                    messages_sent += 1
                else:
                    logger.error(f"Error al enviar mensaje de entrega al negocio {biz_phone}")
            else:
                logger.warning(f"No hay teléfono del negocio para enviar notificación de entrega")
            
            # Deduct credits for messages sent (entregado = up to 2 messages)
            if messages_sent > 0:
                # Always increment whatsapp_usados (used for dashboard counter)
                supabase.table('negocios').update({"whatsapp_usados": whatsapp_usados + messages_sent}).eq("id", negocio_id).execute()
                current_wa_count = biz.get('wa_messages_count', 0)
                current_wa_credits = biz.get('wa_credits', 0)
                if current_wa_credits >= messages_sent:
                    supabase.table('negocios').update({"wa_credits": current_wa_credits - messages_sent}).eq("id", negocio_id).execute()
                else:
                    supabase.table('negocios').update({"wa_messages_count": current_wa_count + messages_sent}).eq("id", negocio_id).execute()
                logger.info(f"Deducted {messages_sent} credits for delivery completed notification")

    except Exception as e:
        logger.error(f"Error in delivery notification background: {str(e)}")


async def process_inventory_for_order(order_id: str, sede_id: str, action: str):
    try:
        if action == 'deduct':
            # Check idempotency
            check = supabase.table('inventory_transactions').select('id').eq('reference_id', order_id).eq('tipo', 'venta').execute()
            if check.data:
                logger.info(f"Inventory already deducted for order {order_id}")
                return
                
            order_res = supabase.table('pedidos').select('items').eq('id', order_id).execute()
            if not order_res.data: return
            items = order_res.data[0].get('items', [])
            
            for item in items:
                prod_id = item.get('producto_id')
                qty = item.get('cantidad', 1)
                if not prod_id: continue
                
                recipe_res = supabase.table('global_recipes').select('id').eq('global_product_id', prod_id).execute()
                if not recipe_res.data: continue
                recipe_id = recipe_res.data[0]['id']
                
                ing_res = supabase.table('recipe_ingredients').select('global_ingredient_id, cantidad').eq('recipe_id', recipe_id).execute()
                for ing in ing_res.data:
                    ing_id = ing['global_ingredient_id']
                    deduct_qty = float(ing['cantidad']) * float(qty)
                    
                    inv_res = supabase.table('sede_inventory').select('id, stock_actual').eq('sede_id', sede_id).eq('global_ingredient_id', ing_id).execute()
                    if inv_res.data:
                        new_stock = float(inv_res.data[0]['stock_actual']) - deduct_qty
                        supabase.table('sede_inventory').update({'stock_actual': new_stock}).eq('id', inv_res.data[0]['id']).execute()
                    else:
                        supabase.table('sede_inventory').insert({
                            'sede_id': sede_id,
                            'global_ingredient_id': ing_id,
                            'stock_actual': -deduct_qty
                        }).execute()
                        
                    supabase.table('inventory_transactions').insert({
                        'sede_id': sede_id,
                        'global_ingredient_id': ing_id,
                        'tipo': 'venta',
                        'cantidad': -deduct_qty,
                        'reference_id': order_id,
                        'notas': f"Venta de producto {prod_id}"
                    }).execute()
                    
        elif action == 'revert':
            check_deduct = supabase.table('inventory_transactions').select('id').eq('reference_id', order_id).eq('tipo', 'venta').execute()
            if not check_deduct.data: return 
                
            check_revert = supabase.table('inventory_transactions').select('id').eq('reference_id', order_id).eq('tipo', 'reverso_cancelacion').execute()
            if check_revert.data: return 
                
            trans_res = supabase.table('inventory_transactions').select('global_ingredient_id, cantidad').eq('reference_id', order_id).eq('tipo', 'venta').execute()
            for trans in trans_res.data:
                ing_id = trans['global_ingredient_id']
                revert_qty = abs(float(trans['cantidad']))
                
                inv_res = supabase.table('sede_inventory').select('id, stock_actual').eq('sede_id', sede_id).eq('global_ingredient_id', ing_id).execute()
                if inv_res.data:
                    new_stock = float(inv_res.data[0]['stock_actual']) + revert_qty
                    supabase.table('sede_inventory').update({'stock_actual': new_stock}).eq('id', inv_res.data[0]['id']).execute()
                
                supabase.table('inventory_transactions').insert({
                    'sede_id': sede_id,
                    'global_ingredient_id': ing_id,
                    'tipo': 'reverso_cancelacion',
                    'cantidad': revert_qty,
                    'reference_id': order_id,
                    'notas': "Reverso por cancelación de pedido"
                }).execute()
                
    except Exception as e:
        logger.error(f"Error processing inventory for order {order_id}: {str(e)}")

@api_router.put("/orders/{slug}/{order_id}", response_model=Order)
async def update_order(slug: str, order_id: str, data: OrderUpdate, background_tasks: BackgroundTasks):
    try:
        response = supabase.table('negocios').select('id').eq('slug', slug).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        business_id = response.data[0]['id']
        
        # Create update dict
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        
        if not update_data:
             raise HTTPException(status_code=400, detail="No data to update")
            
        res = supabase.table('pedidos').update(update_data).eq('id', order_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
            
        updated_order = res.data[0]
        order = Order(**updated_order)
        
        # Inventory Management triggers
        if data.estado == OrderStatus.PREPARANDO:
            asyncio.create_task(process_inventory_for_order(order_id, business_id, 'deduct'))
        elif data.estado == OrderStatus.CANCELADO:
            asyncio.create_task(process_inventory_for_order(order_id, business_id, 'revert'))
        
        # If order is delivered or cancelled, free the table
        if data.estado in [OrderStatus.ENTREGADO, OrderStatus.CANCELADO] and order.mesa_id:
            supabase.table('mesas').update({"estado": "libre"}).eq("id", order.mesa_id).execute()
        
        # Award loyalty points when order is delivered
        points_info = None
        if data.estado == OrderStatus.ENTREGADO and order.cliente_telefono:
            logger.info(f"[LOYALTY] Order {order.id} delivered. Checking loyalty for business {business_id}...")
            points_info = await award_loyalty_points(
                negocio_id=business_id,
                telefono=order.cliente_telefono,
                nombre=order.cliente_nombre,
                total=order.total,
                pedido_id=order.id
            )
            if points_info:
                logger.info(f"[LOYALTY] Awarded {points_info['puntos_ganados']} points for order {order.id}")
            else:
                logger.info(f"[LOYALTY] No points awarded for order {order.id} (program inactive or not configured)")
        
        # Broadcast order update
        broadcast_data = serialize_doc(Order(**updated_order).model_dump())
        if points_info:
            broadcast_data['puntos_ganados'] = points_info
        
        if 'repartidor_id' in update_data:
            # Al asignar repartidor, cambiar automáticamente a "enviado"
            supabase.table('pedidos').update({"estado": "enviado"}).eq('id', order_id).execute()
            logger.info(f"Pedido {order_id}: repartidor asignado → estado cambiado a 'enviado' automáticamente")
            # Refrescar el order con el nuevo estado
            res_fresh = supabase.table('pedidos').select('*').eq('id', order_id).execute()
            if res_fresh.data:
                updated_order = res_fresh.data[0]
                order = Order(**updated_order)
                broadcast_data = serialize_doc(order.model_dump())
                if points_info:
                    broadcast_data['puntos_ganados'] = points_info
            # Enviar notificación al repartidor y al cliente
            asyncio.create_task(asyncio.to_thread(notify_delivery_update_background, slug, order_id, 'assignment'))
        
        if data.estado == OrderStatus.ENVIADO:
            asyncio.create_task(asyncio.to_thread(notify_delivery_update_background, slug, order_id, 'enviado'))
        
        if data.estado == OrderStatus.ENTREGADO:
            asyncio.create_task(asyncio.to_thread(notify_delivery_update_background, slug, order_id, 'entregado'))

        return order
    except Exception as e:
        logger.error(f"Error in update_order: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/orders/{slug}/{order_id}")
async def delete_order(slug: str, order_id: str, business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        response = supabase.table('pedidos').delete().match({
            "id": order_id,
            "negocio_id": business.id
        }).execute()
        
        if not response.data:
            # Check if it exists at all to give better error
            check = supabase.table('pedidos').select('id').eq('id', order_id).execute()
            if not check.data:
                raise HTTPException(status_code=404, detail="Pedido no encontrado")
            else:
                raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este pedido")
                
        return {"message": "Pedido eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar pedido: {str(e)}")


@api_router.get("/orders/{slug}/track/{order_id}", response_model=Order)
async def track_order(slug: str, order_id: str):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    response = supabase.table('pedidos').select('*').match({"id": order_id, "negocio_id": business_id}).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    order_doc = response.data[0]
    
    # Inject business coordinates for tracking
    biz_res = supabase.table('negocios').select('lat, lng').eq('id', business_id).execute()
    if biz_res.data:
        order_doc['business_lat'] = biz_res.data[0].get('lat')
        order_doc['business_lng'] = biz_res.data[0].get('lng')
        
    return Order(**order_doc)


@api_router.get("/orders/{slug}/my-orders")
async def get_customer_orders(slug: str, query: str = None):
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    if not query:
        return []

    # ilike on UUID fields fails in Supabase. Fetch recent and filter in python.
    # We fetch up to 1000 to ensure we catch recent active orders.
    response = supabase.table('pedidos').select('*').eq('negocio_id', business_id)\
        .order('created_at', desc=True).limit(1000).execute()
    
    orders = []
    if response.data:
        clean_q = query.lstrip('0')
        q_lower = clean_q.lower()
        # Search by UUID prefix OR by numeric sequential ID (for 8-digit numbers, ignoring leading zeros)
        matched = [o for o in response.data if (q_lower != "" and str(o.get('id', '')).lower().startswith(q_lower)) or (clean_q != "" and str(o.get('numero_secuencial', '')).startswith(clean_q))]
        orders = matched[:15]
        
    return [Order(**o) for o in orders]


# ============ LOYALTY PROGRAM ============
@api_router.get("/loyalty/{slug}/config", response_model=LoyaltyConfig)
async def get_loyalty_config(slug: str):
    """Get loyalty program configuration for a business"""
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    response = supabase.table('fidelizacion_config').select('*').eq('negocio_id', business_id).execute()
    if not response.data:
        # Return default config if none exists (all zeros = not configured)
        return LoyaltyConfig(
            negocio_id=business_id,
            activo=False,
            pesos_por_punto=0,
            puntos_minimo_canje=0,
            valor_punto_descuento=0,
            nivel_bronce_min=0,
            nivel_plata_min=300,
            nivel_oro_min=1000
        )
    
    # Check plan for loyalty access
    # We need to fetch the business plan first if not joined in previous query
    # Since we already fetched business_id from slug, let's just assume we can get plan easily or check it here
    # Optimization: The initial query for business_id could fetch the plan.
    
    return LoyaltyConfig(**response.data[0])


@api_router.post("/loyalty/{slug}/config", response_model=LoyaltyConfig)
async def create_or_update_loyalty_config(slug: str, data: LoyaltyConfigCreate, business: Business = Depends(get_current_business)):
    """Create or update loyalty program configuration"""
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")

    # PLAN CHECK: Loyalty requires 'pro' or 'elite'/'business'
    if business.plan in ['trial', 'impulso']:
         raise HTTPException(status_code=403, detail="Esta función requiere el plan Crecimiento Pro o superior.")
    
    # VALIDATION: Can't activate without proper pesos_por_punto configuration
    if data.activo and (not data.pesos_por_punto or data.pesos_por_punto <= 0):
        raise HTTPException(
            status_code=400, 
            detail="No puedes activar el programa sin configurar el valor de pesos por punto. Define la 'Configuración Técnica Definitiva' primero."
        )
    
    existing_response = supabase.table('fidelizacion_config').select('*').eq('negocio_id', business.id).execute()
    
    if existing_response.data:
        # Update existing
        update_data = data.model_dump()
        response = supabase.table('fidelizacion_config').update(update_data).eq('negocio_id', business.id).execute()
        config_doc = response.data[0]
    else:
        # Create new
        config = LoyaltyConfig(
            **data.model_dump(),
            negocio_id=business.id
        )
        response = supabase.table('fidelizacion_config').insert(serialize_doc(config.model_dump())).execute()
        config_doc = response.data[0]
    
    return LoyaltyConfig(**config_doc)


@api_router.put("/loyalty/{slug}/config", response_model=LoyaltyConfig)
async def update_loyalty_config(slug: str, data: LoyaltyConfigUpdate, business: Business = Depends(get_current_business)):
    """Update loyalty program configuration"""
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")

    # PLAN CHECK: Loyalty requires 'pro' or 'elite'/'business'
    if business.plan in ['trial', 'impulso']:
         raise HTTPException(status_code=403, detail="Esta función requiere el plan Crecimiento Pro o superior.")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    # VALIDATION: If trying to activate, ensure pesos_por_punto is configured
    if update_data.get('activo') is True:
        # Check if pesos_por_punto is being set in this request or exists in DB
        ppp = update_data.get('pesos_por_punto')
        if ppp is None:
            # Not in this update, check current DB value
            existing = supabase.table('fidelizacion_config').select('pesos_por_punto').eq('negocio_id', business.id).execute()
            if existing.data:
                ppp = existing.data[0].get('pesos_por_punto', 0)
        if not ppp or ppp <= 0:
            raise HTTPException(
                status_code=400,
                detail="No puedes activar el programa sin configurar el valor de pesos por punto."
            )
    
    response = supabase.table('fidelizacion_config').update(update_data).eq('negocio_id', business.id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Configuración no encontrada. Cree una primero.")
    
    return LoyaltyConfig(**response.data[0])


# ============ REWARDS WHEEL (RULETA DE RECOMPENSAS - OPCIÓN A + B) ============
# El estado de la ruleta vive en loyalty_store.py para compartirlo con el agente de IA.
from loyalty_store import _WHEEL_CONFIG_STORE, _WHEEL_HISTORY_STORE, DEFAULT_WHEEL_CONFIG_BACKEND

@api_router.get("/loyalty/{slug}/wheel/config")
async def get_wheel_config(slug: str):
    return _WHEEL_CONFIG_STORE.get(slug, DEFAULT_WHEEL_CONFIG_BACKEND)

@api_router.post("/loyalty/{slug}/wheel/config")
async def save_wheel_config(slug: str, data: Dict[str, Any], business: Business = Depends(get_current_business)):
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    merged = {**DEFAULT_WHEEL_CONFIG_BACKEND, **data}
    _WHEEL_CONFIG_STORE[slug] = merged
    return merged

@api_router.get("/loyalty/{slug}/wheel/history")
async def get_wheel_history(slug: str):
    return _WHEEL_HISTORY_STORE.get(slug, [])

@api_router.get("/loyalty/{slug}/wheel/status")
async def get_wheel_status(slug: str, telefono: str = ""):
    cfg = _WHEEL_CONFIG_STORE.get(slug, DEFAULT_WHEEL_CONFIG_BACKEND)
    history = _WHEEL_HISTORY_STORE.get(slug, [])
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    clean_phone = "".join(ch for ch in telefono if ch.isdigit())
    user_spins = [h for h in history if h.get("telefono") == clean_phone and h.get("fecha_dia") == today]
    free_used = sum(1 for h in user_spins if h.get("modo") == "gratis")
    points_used = sum(1 for h in user_spins if h.get("modo") == "puntos")
    puntos_disp = 0
    if clean_phone:
        try:
            biz_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
            if biz_res.data:
                c_res = supabase.table('clientes_fidelizacion').select('puntos_disponibles, nombre').eq('negocio_id', biz_res.data[0]['id']).eq('telefono', clean_phone).execute()
                if c_res.data:
                    puntos_disp = int(c_res.data[0].get('puntos_disponibles') or 0)
        except Exception:
            pass
    return {
        "telefono": clean_phone,
        "puntos_disponibles": puntos_disp,
        "tiros_gratis_restantes": max(0, int(cfg.get("tiros_gratis_dia", 1)) - free_used),
        "tiros_puntos_restantes": max(0, int(cfg.get("max_tiros_puntos_dia", 2)) - points_used) if cfg.get("permitir_tiro_puntos", True) else 0,
        "costo_tiro_puntos": int(cfg.get("costo_tiro_puntos", 30)),
        "permitir_tiro_puntos": bool(cfg.get("permitir_tiro_puntos", True)),
        "historial_cliente": [h for h in history if h.get("telefono") == clean_phone][:10],
    }

@api_router.post("/loyalty/{slug}/wheel/spin")
async def spin_wheel(slug: str, data: Dict[str, Any]):
    import random as _rand
    cfg = _WHEEL_CONFIG_STORE.get(slug, DEFAULT_WHEEL_CONFIG_BACKEND)
    if not cfg.get("activo", True) and not data.get("preview"):
        raise HTTPException(status_code=400, detail="La ruleta está pausada en este momento.")
    history = _WHEEL_HISTORY_STORE.setdefault(slug, [])
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    clean_phone = "".join(ch for ch in str(data.get("telefono", "")) if ch.isdigit()) or "preview"
    use_points = bool(data.get("usar_puntos", False))
    is_preview = bool(data.get("preview", False))

    user_today = [h for h in history if h.get("telefono") == clean_phone and h.get("fecha_dia") == today]
    free_used = sum(1 for h in user_today if h.get("modo") == "gratis")
    points_used = sum(1 for h in user_today if h.get("modo") == "puntos")
    free_limit = int(cfg.get("tiros_gratis_dia", 1))
    points_limit = int(cfg.get("max_tiros_puntos_dia", 2))
    cost_points = int(cfg.get("costo_tiro_puntos", 30))

    if not is_preview:
        if not use_points and free_used >= free_limit:
            raise HTTPException(status_code=400, detail="Ya usaste tu giro gratis de hoy. Puedes girar usando tus puntos o volver mañana.")
        if use_points:
            if not cfg.get("permitir_tiro_puntos", True):
                raise HTTPException(status_code=400, detail="Los giros con puntos están desactivados.")
            if points_used >= points_limit:
                raise HTTPException(status_code=400, detail=f"Has alcanzado el límite de {points_limit} giros con puntos por hoy.")

    # Weighted selection respecting daily caps
    today_all = [h for h in history if h.get("fecha_dia") == today]
    counts_today: Dict[Any, int] = {}
    for h in today_all:
        sid = h.get("segmento_id")
        counts_today[sid] = counts_today.get(sid, 0) + 1

    segments = cfg.get("segmentos") or DEFAULT_WHEEL_CONFIG_BACKEND["segmentos"]
    eligible = []
    for idx, seg in enumerate(segments):
        used = counts_today.get(seg.get("id"), 0)
        limit = int(seg.get("limite_diario", 999))
        prob = float(seg.get("probabilidad", 0))
        if used < limit and prob > 0:
            eligible.append((idx, seg, prob))

    if not eligible:
        chosen_idx, chosen_seg = len(segments) - 1, segments[-1]
    else:
        total_w = sum(w for _, _, w in eligible)
        r = _rand.uniform(0, total_w)
        chosen_idx, chosen_seg = eligible[-1][0], eligible[-1][1]
        for idx, seg, w in eligible:
            r -= w
            if r <= 0:
                chosen_idx, chosen_seg = idx, seg
                break

    prefix_map = {"producto": "PREMIO", "descuento": f"DTO{chosen_seg.get('valor', 10)}", "multiplicador": "DOBLEPTS", "upgrade": "UPGRADE"}
    coupon = None if chosen_seg.get("tipo") == "puntos" else f"FM-{prefix_map.get(chosen_seg.get('tipo'), 'FOGON')}-{_rand.randint(1000, 9999)}"
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=int(cfg.get("vigencia_horas", 48)))).isoformat()

    record = {
        "id": f"spin-{uuid.uuid4().hex[:8]}",
        "telefono": clean_phone,
        "cliente_nombre": data.get("nombre") or ("Vista Previa" if is_preview else f"Cliente {clean_phone[-4:]}"),
        "segmento_id": chosen_seg.get("id"),
        "segmento_index": chosen_idx,
        "premio_label": chosen_seg.get("label"),
        "premio_emoji": chosen_seg.get("emoji", "🎁"),
        "premio_tipo": chosen_seg.get("tipo"),
        "premio_valor": chosen_seg.get("valor", 0),
        "codigo_cupon": coupon,
        "modo": "puntos" if use_points else "gratis",
        "puntos_usados": cost_points if use_points else 0,
        "compra_minima": 0 if chosen_seg.get("tipo") == "puntos" else int(cfg.get("compra_minima_cupon", 20000)),
        "expira_en": expires_at,
        "fecha_dia": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if not is_preview:
        history.insert(0, record)
    return {
        **record,
        "tiros_gratis_restantes": 1 if is_preview else max(0, free_limit - (free_used + (0 if use_points else 1))),
        "tiros_puntos_restantes": points_limit if is_preview else (max(0, points_limit - (points_used + (1 if use_points else 0))) if cfg.get("permitir_tiro_puntos", True) else 0),
    }


@api_router.get("/loyalty/{slug}/points/{telefono}", response_model=CustomerPointsPublic)
async def get_customer_points(slug: str, telefono: str):
    """Get customer loyalty points and stats"""
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    # Get general point info
    response = supabase.table('clientes_puntos').select('*').match({
        "negocio_id": business_id,
        "telefono": telefono
    }).execute()
    
    # Get order stats
    orders_res = supabase.table('pedidos').select('total').match({
        "negocio_id": business_id,
        "cliente_telefono": telefono
    }).execute()
    
    total_compras = sum(float(o.get('total', 0) or 0) for o in orders_res.data) if orders_res.data else 0.0
    cantidad_pedidos = len(orders_res.data) if orders_res.data else 0
    
    if not response.data:
        return CustomerPointsPublic(
            telefono=telefono,
            nombre=None,
            puntos_actuales=0,
            puntos_disponibles=0,
            puntos_totales=0,
            total_compras=total_compras,
            cantidad_pedidos=cantidad_pedidos
        )
    
    c = response.data[0]
    puntos_actuales = c.get('puntos_actuales', 0)
    puntos_totales = c.get('puntos_totales', 0)
    
    return CustomerPointsPublic(
        telefono=c['telefono'],
        nombre=c.get('nombre'),
        email=c.get('email'),
        fecha_nacimiento=c.get('fecha_nacimiento'),
        puntos_actuales=puntos_actuales,
        puntos_disponibles=puntos_actuales,
        puntos_totales=puntos_totales,
        puntos_canjeados=max(0, puntos_totales - puntos_actuales),
        total_compras=total_compras,
        cantidad_pedidos=cantidad_pedidos,
        visit_context=c.get('visit_context'),
        created_at=c.get('created_at')
    )


@api_router.get("/loyalty/{slug}/customers")
async def get_loyalty_customers(slug: str, q: Optional[str] = None, business: Business = Depends(get_current_business), limit: int = 50):
    """Get all customers with loyalty points (for business owner)"""
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    query = supabase.table('clientes_puntos').select('*').eq("negocio_id", business.id)
    
    if q:
        # Search by name or phone
        query = query.or_(f"nombre.ilike.%{q}%,telefono.ilike.%{q}%")
    
    response = query.order("puntos_actuales", desc=True).limit(limit).execute()
    customers = response.data
    
    return [CustomerPointsPublic(
        telefono=c['telefono'],
        nombre=c.get('nombre'),
        email=c.get('email'),
        fecha_nacimiento=c.get('fecha_nacimiento'),
        puntos_actuales=c.get('puntos_actuales', 0),
        puntos_disponibles=c.get('puntos_actuales', 0),
        puntos_totales=c.get('puntos_totales', 0),
        puntos_canjeados=max(0, (c.get('puntos_totales', 0) or 0) - (c.get('puntos_actuales', 0) or 0)),
        created_at=c.get('created_at'),
        total_compras=0.0,
        cantidad_pedidos=0
    ) for c in customers]


@api_router.delete("/loyalty/{slug}/customers/{telefono}")
async def delete_loyalty_customer(slug: str, telefono: str, business: Business = Depends(get_current_business)):
    """Delete a customer from loyalty program and their transactions"""
    logger.info(f"--- SOLICITUD DE ELIMINACIÓN RECIBIDA: Slug={slug}, Teléfono={telefono} ---")
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        # Trim input
        telefono = telefono.strip()
        
        # 1. First, find the customer to get their internal UUID
        customer_res = supabase.table('clientes_puntos').select('id').match({
            "negocio_id": business.id,
            "telefono": telefono
        }).execute()
        
        if not customer_res.data:
            logger.warning(f"Intento de borrar cliente inexistente: {telefono} en negocio {business.id}")
            raise HTTPException(status_code=404, detail=f"Cliente {telefono} no encontrado en tu base de datos")
        
        cliente_id = customer_res.data[0]['id']
        logger.info(f"Eliminando cliente {telefono} (ID: {cliente_id}) para el negocio {business.name} (ID: {business.id})")

        # 2. Delete all related transactions in transacciones_puntos
        supabase.table('transacciones_puntos').delete().eq('cliente_id', cliente_id).execute()
        
        # 3. Delete the customer record itself from clientes_puntos
        res = supabase.table('clientes_puntos').delete().eq('id', cliente_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="No se pudo confirmar la eliminación final del cliente")

        return {"message": "Cliente y su historial eliminados correctamente"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error CRÍTICO al eliminar cliente {telefono}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fallo en base de datos: {str(e)}")


@api_router.post("/loyalty/{slug}/customers", response_model=CustomerPointsPublic)
async def create_loyalty_customer(slug: str, data: CustomerCreate, business: Business = Depends(get_current_business)):
    """Register a new loyalty customer"""
    if business.slug != slug:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Check if customer exists
    existing = supabase.table('clientes_puntos').select('*').match({
        "negocio_id": business.id,
        "telefono": data.telefono
    }).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="El cliente ya está registrado con este teléfono")

    # Create new customer
    new_customer = {
        "negocio_id": business.id,
        "telefono": data.telefono,
        "nombre": data.nombre,
        "email": data.email,
        "fecha_nacimiento": data.fecha_nacimiento,

        "puntos_actuales": 0,
        "puntos_totales": 0
    }
    
    try:
        res = supabase.table('clientes_puntos').insert(new_customer).execute()
        
        if not res.data:
             raise HTTPException(status_code=500, detail="Error al crear cliente")
             
        c = res.data[0]
        return CustomerPointsPublic(
            telefono=c['telefono'],
            nombre=c.get('nombre'),
            email=c.get('email'),
            fecha_nacimiento=c.get('fecha_nacimiento'),
            puntos_disponibles=0,
            puntos_totales=0,
            puntos_canjeados=0,
            total_compras=0.0,
            cantidad_pedidos=0
        )
    except Exception as e:
        print(f"Error creating customer: {e}")
        # If column does not exist, it will fail here. We might need to handle it or let it fail so we know.
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@api_router.post("/loyalty/{slug}/award")
async def award_points_manual(slug: str, data: AwardPointsRequest, business: Business = Depends(get_current_business)):
    """Manually award points to a customer"""
    try:
        if business.slug != slug:
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # CHECK: Verify loyalty program is active and configured
        config_res = supabase.table('fidelizacion_config').select('activo, pesos_por_punto').eq('negocio_id', business.id).execute()
        if not config_res.data:
            raise HTTPException(status_code=400, detail="El programa de fidelidad no ha sido configurado. Configúralo primero en la sección de Fidelización.")
        
        loyalty_config = config_res.data[0]
        if not loyalty_config.get('activo', False):
            raise HTTPException(status_code=400, detail="El programa de fidelidad está pausado. Actívalo primero para poder acreditar puntos.")
        
        if (loyalty_config.get('pesos_por_punto', 0) or 0) <= 0:
            raise HTTPException(status_code=400, detail="Debes configurar el valor de pesos por punto antes de acreditar puntos.")
        
        # Get customer points record or create it
        response = supabase.table('clientes_puntos').select('*').match({
            "negocio_id": business.id,
            "telefono": data.telefono
        }).execute()
        
        updated_customer = None

        if response.data:
            customer = response.data[0]
            # Update existing
            total_points = customer.get('puntos_totales', 0) + data.puntos
            current_points = customer.get('puntos_actuales', 0) + data.puntos
            
            response = supabase.table('clientes_puntos').update({
                "puntos_totales": total_points,
                "puntos_actuales": current_points
            }).eq("id", customer['id']).execute()
            
            if response.data:
                updated_customer = response.data[0]
            else:
                 raise HTTPException(status_code=500, detail="Error updating customer points")
        else:
            # Create new customer entry
            new_customer = {
                "negocio_id": business.id,
                "telefono": data.telefono,
                "nombre": "Cliente Nuevo", # Should ideally get name from somewhere if possible, or update later
                "puntos_totales": data.puntos,
                "puntos_actuales": data.puntos
            }
            response = supabase.table('clientes_puntos').insert(new_customer).execute()
            if response.data:
                updated_customer = response.data[0]
            else:
                raise HTTPException(status_code=500, detail="Error creating customer points record")
        
        if not updated_customer:
             raise HTTPException(status_code=500, detail="Failed to get updated customer record")

        # Create transaction record
        transaction = {
            "cliente_puntos_id": updated_customer['id'],
            "tipo": "ganado",
            "puntos": data.puntos,
            "descripcion": data.descripcion or f"Acreditación manual de {data.puntos} puntos",
            "monto": data.monto
        }
        supabase.table('transacciones_puntos').insert(transaction).execute()
        
        return {
            "exito": True,
            "puntos_ganados": data.puntos,
            "puntos_actuales": updated_customer['puntos_actuales']
        }
    except Exception as e:
        print(f"Error awarding points: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@api_router.post("/loyalty/{slug}/redeem", response_model=RedeemPointsResponse)
async def redeem_points(slug: str, data: RedeemPointsRequest):
    """Redeem loyalty points for a discount"""
    # Get business
    biz_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not biz_res.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = biz_res.data[0]['id']
    
    # Get loyalty config - MUST be active
    config_res = supabase.table('fidelizacion_config').select('*').eq('negocio_id', business_id).execute()
    if not config_res.data or not config_res.data[0].get('activo', False):
        raise HTTPException(status_code=400, detail="El programa de fidelidad no está activo")
    config = config_res.data[0]
    
    if (config.get('pesos_por_punto', 0) or 0) <= 0:
        raise HTTPException(status_code=400, detail="El programa de fidelidad no está configurado correctamente")
    
    # Get customer points
    cust_res = supabase.table('clientes_puntos').select('*').match({
        "negocio_id": business_id,
        "telefono": data.telefono
    }).execute()
    
    if not cust_res.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en el programa de fidelidad")
    
    customer = cust_res.data[0]
    puntos_actuales = customer.get('puntos_actuales', 0)
    
    if puntos_actuales < data.puntos_a_canjear:
        return RedeemPointsResponse(
            exito=False,
            mensaje=f"No tienes suficientes puntos. Disponibles: {puntos_actuales}",
            descuento_aplicado=0,
            puntos_restantes=puntos_actuales
        )
    
    minimo_canje = config.get('puntos_minimo_canje', 100)
    if data.puntos_a_canjear < minimo_canje:
        return RedeemPointsResponse(
            exito=False,
            mensaje=f"Mínimo {minimo_canje} puntos para canjear",
            descuento_aplicado=0,
            puntos_restantes=puntos_actuales
        )
    
    # Calculate discount
    valor_punto = config.get('valor_punto_descuento', 100)
    descuento = data.puntos_a_canjear * valor_punto
    
    # Update customer points
    new_actuales = puntos_actuales - data.puntos_a_canjear
    
    supabase.table('clientes_puntos').update({
        "puntos_actuales": new_actuales,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq('id', customer['id']).execute()
    
    # Create transaction record
    try:
        transaction = {
            "cliente_puntos_id": customer['id'],
            "tipo": "canjeado",
            "puntos": -data.puntos_a_canjear,
            "descripcion": f"Canje de {data.puntos_a_canjear} puntos por descuento de ${descuento:,.0f}"
        }
        supabase.table('transacciones_puntos').insert(transaction).execute()
    except Exception as te:
        logger.error(f"Error creating redeem transaction: {te}")
    
    return RedeemPointsResponse(
        exito=True,
        mensaje=f"¡Canjeaste {data.puntos_a_canjear} puntos! Descuento: ${descuento:,.0f} COP",
        descuento_aplicado=descuento,
        puntos_restantes=new_actuales
    )


@api_router.get("/loyalty/{slug}/transactions/{telefono}")
async def get_points_transactions(slug: str, telefono: str, limit: int = 20):
    """Get customer points transaction history"""
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    # First get the customer record
    response = supabase.table('clientes_puntos').select('id').match({
        "negocio_id": business_id,
        "telefono": telefono
    }).execute()
    
    if not response.data:
        return []
    
    customer_id = response.data[0]['id']
    
    response = supabase.table('transacciones_puntos').select('*').eq('cliente_puntos_id', customer_id).order('created_at', desc=True).limit(limit).execute()
    return response.data


@api_router.get("/loyalty/{slug}/recent-transactions")
async def get_recent_transactions(slug: str, limit: int = 10, start_date: str = None, end_date: str = None):
    """Get recent points transactions for the business, optionally filtered by date"""
    response = supabase.table('negocios').select('id').eq('slug', slug).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    business_id = response.data[0]['id']
    
    # Query transactions joining with customers to filter by business_id
    query = supabase.table('transacciones_puntos').select(
        '*, clientes_puntos!inner(nombre, telefono, negocio_id)'
    ).eq('clientes_puntos.negocio_id', business_id).order('created_at', desc=True)

    if start_date:
        query = query.gte('created_at', start_date)
    
    if end_date:
        # Assuming end_date logic to include the full day if only date is passed
        query = query.lte('created_at', end_date)
        
    if not start_date and not end_date:
        query = query.limit(limit)

    response = query.execute()
    
    if not response.data:
        return []
        
    transactions = []
    for t in response.data:
        customer = t.get('clientes_puntos', {})
        transactions.append({
            "id": t['id'],
            "nombre": customer.get('nombre') or customer.get('telefono'),
            "puntos": t['puntos'],
            "monto": t.get('monto', 0),
            "fecha": t['created_at'], 
            "estado": "Completado" 
        })
        
    return transactions


# Helper function to award points after order completion
async def award_loyalty_points(negocio_id: str, telefono: str, nombre: str, total: float, pedido_id: str):
    """Award loyalty points to customer after successful order"""
    if not telefono:
        return None
    
    # Get loyalty config
    response = supabase.table('fidelizacion_config').select('*').eq("negocio_id", negocio_id).execute()
    if not response.data:
        logger.info(f"[LOYALTY] No loyalty config found for business {negocio_id}. Skipping points.")
        return None
    
    config = response.data[0]
    is_active = config.get('activo', False)
    
    if not is_active:
        logger.info(f"[LOYALTY] Program INACTIVE for business {negocio_id}. Skipping points for order {pedido_id}.")
        return None
    
    # Calculate points
    pesos_por_punto = float(config.get('pesos_por_punto', 0))
    if pesos_por_punto <= 0:
        logger.warning(f"[LOYALTY] Business {negocio_id} has program active but pesos_por_punto={pesos_por_punto}. Skipping points.")
        return None
        
    puntos_ganados = int(total / pesos_por_punto)
    
    if puntos_ganados < 1:
        return None
    
    # Get or create customer record
    response = supabase.table('clientes_puntos').select('*').match({
        "negocio_id": negocio_id,
        "telefono": telefono
    }).execute()
    
    if response.data:
        customer = response.data[0]
        # Update existing
        response = supabase.table('clientes_puntos').update({
            "nombre": nombre or customer.get('nombre'),
            "puntos_totales": (customer.get('puntos_totales') or 0) + puntos_ganados,
            "puntos_actuales": (customer.get('puntos_actuales') or 0) + puntos_ganados,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).match({"negocio_id": negocio_id, "telefono": telefono}).execute()
        
        if not response.data:
            return None
        updated_customer = response.data[0]
    else:
        # Create new customer
        new_customer = {
            "negocio_id": negocio_id,
            "telefono": telefono,
            "nombre": nombre,
            "puntos_totales": puntos_ganados,
            "puntos_actuales": puntos_ganados
        }
        response = supabase.table('clientes_puntos').insert(new_customer).execute()
        if not response.data:
            return None
        updated_customer = response.data[0]
    
    # Create transaction record
    try:
        transaction = {
            "cliente_puntos_id": updated_customer['id'],
            "tipo": "ganado",
            "puntos": puntos_ganados,
            "pedido_id": pedido_id,
            "descripcion": f"Ganaste {puntos_ganados} puntos por compra de ${total:,.0f}"
        }
        supabase.table('transacciones_puntos').insert(transaction).execute()
    except Exception as te:
        logger.error(f"Error creating points transaction: {te}")
        # Not critical enough to fail the whole order update
    
    current_puntos = updated_customer.get('puntos_actuales', 0)
    return {
        "puntos_ganados": puntos_ganados,
        "puntos_totales": current_puntos,
        "mensaje": f"¡Ganaste {puntos_ganados} puntos! Total: {current_puntos}"
    }


# ============ MARKETING & CAMPAIGNS ============

class CampaignRequest(BaseModel):
    segment_id: str  # 'all', 'oro', 'plata', 'bronce', 'new', 'inactive'
    message: str

@app.post("/api/marketing/send-campaign")
async def send_marketing_campaign(request: CampaignRequest, background_tasks: BackgroundTasks, business: Business = Depends(get_current_business)):
    """
    Sends a bulk WhatsApp campaign to a specific segment of customers.
    Deducts wa_credits from the business account.
    """
    # 1. Fetch Customers
    try:
        res = supabase.table('clientes_puntos').select('*').eq('negocio_id', business.id).execute()
        all_customers = res.data if res.data else []
    except Exception as e:
        logger.error(f"Error fetching customers for campaign: {e}")
        raise HTTPException(status_code=500, detail="Error al recuperar la base de datos de clientes.")
    
    # 2. Filter by Segment
    filtered_customers = []
    now = datetime.now(timezone.utc)
    
    if request.segment_id == 'all':
        filtered_customers = all_customers
    elif request.segment_id == 'oro':
        filtered_customers = [c for c in all_customers if c.get('puntos_totales', 0) > 1000]
    elif request.segment_id == 'plata':
        filtered_customers = [c for c in all_customers if 300 <= c.get('puntos_totales', 0) <= 1000]
    elif request.segment_id == 'bronce':
        filtered_customers = [c for c in all_customers if c.get('puntos_totales', 0) < 300]
    elif request.segment_id == 'new':
        # Joined in last 30 days
        thirty_days_ago = now - timedelta(days=30)
        filtered_customers = [c for c in all_customers if datetime.fromisoformat(c.get('created_at').replace('Z', '+00:00')) > thirty_days_ago]
    elif request.segment_id == 'inactive':
        # Not updated in last 30 days
        thirty_days_ago = now - timedelta(days=30)
        filtered_customers = [c for c in all_customers if datetime.fromisoformat(c.get('updated_at').replace('Z', '+00:00')) < thirty_days_ago]
        
    count = len(filtered_customers)
    if count == 0:
        return {"success": False, "message": "No hay clientes en este segmento para enviar la campaña."}

    # 3. Check Credits (Marketing Campaigns only use wa_credits)
    wa_credits = business.wa_credits or 0
    
    if wa_credits < count:
        raise HTTPException(
            status_code=403, 
            detail=f"Créditos de campaña insuficientes. Tienes {wa_credits} y requieres {count}."
        )
    
    # 4. Deduct Marketing Credits
    new_wa_credits = wa_credits - count
    
    try:
        supabase.table('negocios').update({
            "wa_credits": new_wa_credits
        }).eq('id', business.id).execute()
    except Exception as e:
        logger.error(f"Error updating campaign credits for {business.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar el descuento de créditos.")
    
    # 5. Send (Background)
    background_tasks.add_task(process_campaign_execution, business, filtered_customers, request.message)
    
    return {
        "success": True, 
        "message": f"Campaña iniciada para {count} clientes.",
        "count": count,
        "remaining_credits": new_wa_credits
    }

async def process_campaign_execution(business: Business, customers: List[Dict], message_template: str):
    """
    Simulates or executes the sending of WhatsApp messages in a background task.
    """
    logger.info(f"Iniciando ejecución de campaña para {business.nombre} ({len(customers)} clientes)")
    
    for customer in customers:
        # Replace tags
        msg = message_template.replace("[Nombre]", customer.get('nombre', 'Cliente'))
        msg = msg.replace("[Puntos]", str(customer.get('puntos_actuales', 0)))
        msg = msg.replace("[Saldo]", str(customer.get('puntos_actuales', 0)))
        msg = msg.replace("[Negocio]", business.nombre)
        
        # In a real scenario, call Twilio or WhatsApp API here
        # For now, we simulate and log
        await asyncio.sleep(0.5) # Simulate slight delay between messages
        logger.info(f"Simulación WhatsApp - Para: {customer.get('telefono')} - Mensaje: {msg[:50]}...")

    logger.info(f"Campaña finalizada para {business.nombre}")


@app.get("/api/marketing/audience-counts")
async def get_audience_counts(business: Business = Depends(get_current_business)):
    """
    Returns the count of customers in each marketing segment for the hub.
    """
    try:
        res = supabase.table('clientes_puntos').select('*').eq('negocio_id', business.id).execute()
        customers = res.data if res.data else []
        
        # Birthday today logic (Assuming format YYYY-MM-DD)
        # Using simple string match for MM-DD
        now_local = datetime.now() 
        today_str = now_local.strftime("%m-%d")
        
        birthdays_today = []
        for c in customers:
            bday = c.get('fecha_nacimiento')
            if bday and len(bday) >= 10:
                # Format could be YYYY-MM-DD or DD/MM/YYYY
                if '-' in bday:
                    if bday[5:10] == today_str:
                        birthdays_today.append(c)
                elif '/' in bday:
                    # DD/MM/YYYY -> MM-DD
                    parts = bday.split('/')
                    if len(parts) >= 2:
                        if f"{parts[1]}-{parts[0]}" == today_str:
                            birthdays_today.append(c)

        return {
            "all": len(customers),
            "oro": len([c for c in customers if (c.get('puntos_totales') or 0) > 1000]),
            "plata": len([c for c in customers if 300 <= (c.get('puntos_totales') or 0) <= 1000]),
            "bronce": len([c for c in customers if (c.get('puntos_totales') or 0) < 300]),
            "new": len([c for c in customers if c.get('created_at') and (datetime.now(timezone.utc) - datetime.fromisoformat(c.get('created_at').replace('Z', '+00:00'))).days <= 30]),
            "inactive": len([c for c in customers if (c.get('updated_at') or c.get('created_at')) and (datetime.now(timezone.utc) - datetime.fromisoformat((c.get('updated_at') or c.get('created_at')).replace('Z', '+00:00'))).days > 30]),
            "birthdays": len(birthdays_today)
        }
    except Exception as e:
        logger.error(f"Error getting audience counts: {e}")
        return {"all": 0, "oro": 0, "plata": 0, "bronce": 0, "new": 0, "inactive": 0, "birthdays": 0}

@api_router.post("/marketing/ai-suggestion")
async def generate_marketing_suggestion(req: MarketingAISuggestionRequest, business: Business = Depends(get_current_business)):
    """
    Generates a marketing message suggestion using Gemini AI based on business and segment context.
    """
    if business.plan in ['trial', 'free'] and not os.environ.get("BYPASS_PLAN_CHECK"):
         raise HTTPException(status_code=403, detail="El asistente de marketing con IA requiere un plan Impulso o superior.")

    try:
        # Get extra business context (protected - if it fails, use defaults)
        try:
            res_counts = await get_audience_counts(business)
        except Exception as count_err:
            logger.warning(f"Marketing AI: Error getting audience counts: {count_err}")
            res_counts = {"all": 0, "oro": 0, "plata": 0, "bronce": 0, "new": 0, "inactive": 0, "birthdays": 0}
        
        # Build prompt
        prompt = f"""Actúa como un experto en Marketing Digital y Copywriting para WhatsApp. 
Tu objetivo es redactar un mensaje persuasivo para una campaña de un negocio llamado "{business.nombre}".

INFORMACIÓN DEL NEGOCIO:
- Nombre: {business.nombre}
- Slogan: {business.slogan or 'No definido'}
- Descripción: {business.descripcion or 'Negocio local de calidad'}

SEGMENTO DE AUDIENCIA:
- Nombre del segmento: {req.segment_name}
- Descripción del segmento: {req.segment_desc}
- Tamaño del segmento: {res_counts.get(req.segment_id, 'varios')} clientes

CONTEXTO ADICIONAL:
- Tono deseado: {req.tone}
- Mensaje actual (opcional): {req.current_message or 'Ninguno'}

REGLAS DEL MENSAJE:
1. Sé breve y directo (máximo 400 caracteres).
2. Usa emojis de forma moderada pero efectiva.
3. Incluye un llamado a la acción (CTA) claro.
4. Usa las etiquetas [Nombre] para personalizarlo.
5. NO incluyas enlaces genéricos, el negocio los añadirá después.
6. Enfócate en el beneficio para el cliente según su segmento (ej: premio a leales, invitación a inactivos).

RESPUESTA:
Genera 3 opciones de mensajes, una corta, una creativa y una enfocada en oferta.
Devuelve el resultado ÚNICAMENTE en formato JSON válido (sin markdown, sin backticks) con esta estructura:
{{
  "opciones": [
    {{ "tipo": "Corta", "mensaje": "..." }},
    {{ "tipo": "Creativa", "mensaje": "..." }},
    {{ "tipo": "Oferta", "mensaje": "..." }}
  ],
  "recomendacion_marketing": "Breve consejo de por qué estos mensajes funcionan para este segmento."
}}
"""
        # --- MOTOR PRINCIPAL: DEEPSEEK (con respaldo automático en ai_engine) ---
        try:
            suggestion_data, prov = ai_engine.complete_json(
                system="Eres un experto en Marketing Digital y Copywriting para restaurantes. Responde únicamente en JSON válido.",
                user=prompt,
                provider=ai_engine.PROVIDER_DEEPSEEK,
            )
            logger.info(f"Marketing AI respondió correctamente usando {prov}")
        except Exception as ai_err:
            logger.error(f"Marketing AI error: {ai_err}")
            raise HTTPException(status_code=500, detail="No se pudo conectar con el proveedor de IA.")

        # Increment usage counter
        supabase.table('negocios').update({
            "ai_credits_campaign_used": (business.ai_credits_campaign_used or 0) + 1
        }).eq('id', business.id).execute()

        return suggestion_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating marketing AI suggestion: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al generar sugerencia: {str(e)}")


# ============ WHATSAPP WEBHOOK (Prepared) ============
@api_router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(hub_mode: str = Query(None, alias="hub.mode"),
                                   hub_verify_token: str = Query(None, alias="hub.verify_token"),
                                   hub_challenge: str = Query(None, alias="hub.challenge")):
    """Verify webhook for WhatsApp Cloud API"""
    verify_token = os.environ.get('WHATSAPP_VERIFY_TOKEN', 'menu.ia-webhook-token')
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge)
    
    raise HTTPException(status_code=403, detail="Verificación fallida")


@api_router.post("/whatsapp/webhook")
async def handle_whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages via Twilio"""
    try:
        # Twilio sends form-encoded data
        form_data = await request.form()
        data_dict = dict(form_data)
        print(f"--- WHATSAPP WEBHOOK RECEIVED --- Data: {data_dict}")
        sender_phone = data_dict.get('From', '').replace('whatsapp:', '')
        message_body = data_dict.get('Body', '')
        lat = data_dict.get('Latitude')
        lng = data_dict.get('Longitude')
        
        print(f"DEBUG: Message from {sender_phone}: {message_body} (GPS: {lat}, {lng})")
        
        if not sender_phone:
            return {"status": "ignored", "reason": "missing_phone"}

        # If it's a location message, normalize the body
        if lat and lng:
            gps_info = f"[UBICACIÓN GPS: {lat}, {lng}]"
            message_body = f"{message_body} {gps_info}".strip()

        # 1. Resolver el único negocio de la aplicación (arquitectura single-business)
        business_data = get_main_business()
        if not business_data:
            logger.error("Webhook WhatsApp: no hay negocio configurado en la tabla 'negocios'.")
            return {"status": "error", "reason": "no_business_configured"}

        negocio_id = business_data['id']
        wa_count = business_data.get('wa_messages_count', 0)

        # 2. Procesar con el agente de WhatsApp (OpenAI)
        response_text = await process_whatsapp_message(message_body, sender_phone, negocio_id)

        # 3. Enviar respuesta y actualizar contador
        if response_text:
            twilio_config = None
            if business_data.get('twilio_sid'):
                twilio_config = {
                    "sid": business_data.get('twilio_sid'),
                    "token": business_data.get('twilio_token'),
                    "number": business_data.get('twilio_number')
                }

            send_whatsapp_response(sender_phone, response_text, twilio_config)

            whatsapp_usados = business_data.get('whatsapp_usados', 0)
            supabase.table('negocios').update({
                "wa_messages_count": wa_count + 1,
                "whatsapp_usados": whatsapp_usados + 1
            }).eq('id', negocio_id).execute()

        return {"status": "processed", "response": response_text}

    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        logger.error(traceback.format_exc())
        return {"status": "error", "detail": f"{str(e)} - {traceback.format_exc()}"}


class WhatsAppBridgeMessage(BaseModel):
    from_phone: str
    message: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@api_router.post("/whatsapp/bridge")
async def whatsapp_local_bridge(payload: WhatsAppBridgeMessage):
    """
    Endpoint para el puente local de WhatsApp (Baileys / QR, sin Meta API ni Twilio).
    Procesa el mensaje real con el agente de WhatsApp (OpenAI) y devuelve la respuesta
    para enviarla de vuelta al chat real del usuario.
    """
    try:
        sender_phone = "".join(ch for ch in str(payload.from_phone) if ch.isdigit())
        if not sender_phone:
            raise HTTPException(status_code=400, detail="Número de teléfono inválido")

        message_body = (payload.message or "").strip()
        if payload.latitude is not None and payload.longitude is not None:
            gps_tag = f"[UBICACIÓN GPS: {payload.latitude}, {payload.longitude}]"
            message_body = f"{message_body} {gps_tag}".strip()

        if not message_body:
            return {"reply": ""}

        response_text = await process_whatsapp_message(message_body, sender_phone)
        return {"reply": response_text or ""}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en /whatsapp/bridge: {e}")
        logger.error(traceback.format_exc())
        return {"reply": "Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?"}


# ============ WEBSOCKET FOR REALTIME ============
@app.websocket("/ws/{negocio_id}")
async def websocket_endpoint(websocket: WebSocket, negocio_id: str):
    await manager.connect(websocket, negocio_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, negocio_id)


# ============ CONSULTOR IA & INSIGHTS (DEEPSEEK) ============

def _get_loyalty_insights_context(negocio_id: str, slug: str) -> Dict[str, Any]:
    """Recopila contexto de fidelización (puntos, niveles y ruleta) para Insights y Consultor IA."""
    try:
        cfg_res = supabase.table('fidelizacion_config').select('*').eq('negocio_id', negocio_id).limit(1).execute()
        cfg = cfg_res.data[0] if cfg_res.data else {}
        bronce_min = int(cfg.get('nivel_bronce_min') or 0)
        plata_min = int(cfg.get('nivel_plata_min') or 300)
        oro_min = int(cfg.get('nivel_oro_min') or 1000)

        clients_res = supabase.table('clientes_puntos').select('puntos_actuales, puntos_totales').eq('negocio_id', negocio_id).execute()
        clients = clients_res.data or []
        niveles = {"BRONCE": 0, "PLATA": 0, "ORO": 0}
        total_pts_disp = 0
        for c in clients:
            tot = int(c.get('puntos_totales') or 0)
            total_pts_disp += int(c.get('puntos_actuales') or 0)
            if tot >= oro_min:
                niveles["ORO"] += 1
            elif tot >= plata_min:
                niveles["PLATA"] += 1
            elif tot >= bronce_min:
                niveles["BRONCE"] += 1

        wheel_cfg = _WHEEL_CONFIG_STORE.get(slug, DEFAULT_WHEEL_CONFIG_BACKEND)
        wheel_hist = _WHEEL_HISTORY_STORE.get(slug, [])
        return {
            "clientes_fidelizados": len(clients),
            "puntos_disponibles_totales": total_pts_disp,
            "distribucion_niveles": niveles,
            "umbrales_niveles": {"bronce": bronce_min, "plata": plata_min, "oro": oro_min},
            "ruleta_activa": bool(wheel_cfg.get("activo", True)),
            "giros_ruleta_registrados": len(wheel_hist),
        }
    except Exception as e:
        logger.warning(f"No se pudo recopilar contexto de fidelización: {e}")
        return {}


@api_router.get("/ai/insights/{negocio_id}")
@api_router.get("/gemini/insights/{negocio_id}")
async def get_ai_insights(negocio_id: str, business: Business = Depends(get_current_business)):
    if business.id != negocio_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        # 1. Recopilar datos de las últimas 24 horas y 7 días
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(hours=24)
        week_ago = now - timedelta(days=7)

        pedidos_dia = supabase.table('pedidos').select('*').match({"negocio_id": negocio_id}).gte('created_at', yesterday.isoformat()).execute()
        pedidos_semana = supabase.table('pedidos').select('total, created_at').match({"negocio_id": negocio_id}).gte('created_at', week_ago.isoformat()).execute()
        mesas = supabase.table('mesas').select('*').eq('negocio_id', negocio_id).execute()
        productos_top = supabase.table('menu_items').select('name, base_price, category').eq('negocio_id', negocio_id).limit(15).execute()
        empleados = supabase.table('empleados').select('nombre, rol').eq('negocio_id', negocio_id).execute()
        loyalty_ctx = _get_loyalty_insights_context(negocio_id, business.slug)

        # 2. Construir contexto para el Consultor IA (DeepSeek)
        context = {
            "negocio": business.nombre,
            "fecha_actual": now.strftime("%Y-%m-%d %H:%M"),
            "resumen_24h": {
                "total_ventas": sum(float(p.get('total', 0)) for p in pedidos_dia.data),
                "cantidad_pedidos": len(pedidos_dia.data),
                "pedidos": [{"hora": p['created_at'], "total": p['total'], "items": len(p['items'])} for p in pedidos_dia.data]
            },
            "resumen_semana": {
                "total_ventas": sum(float(p.get('total', 0)) for p in pedidos_semana.data),
                "cantidad_pedidos": len(pedidos_semana.data)
            },
            "estado_actual": {
                "mesas_ocupadas": len([m for m in mesas.data if m['estado'] != 'libre']),
                "mesas_totales": len(mesas.data),
                "empleados_activos": len(empleados.data)
            },
            "fidelizacion_y_ruleta": loyalty_ctx,
            "catalogo_muestra": productos_top.data
        }

        # 3. Llamar a DeepSeek (con respaldo automático en ai_engine)
        prompt = f"""Actúa como el Consultor IA experto en analítica y rentabilidad de restaurantes.
            Analiza estos datos operativos, de ventas, fidelización (puntos, niveles Bronce/Plata/Oro) y ruleta de premios, y genera insights estratégicos en formato JSON.
            
            DATOS:
            {json.dumps(context, default=str)}

            REQUISITOS:
            1. Responde SOLO con un JSON válido. NO uses bloques de código markdown.
            2. El JSON debe tener esta estructura exacta:
            {{
              "resumen_dia": {{ "ventas": number, "pedidos": number, "ticket_promedio": number }},
              "top_platos": [ {{ "nombre": string, "ventas": number, "ingreso": number }} ], 
              "horas_pico": [ "HH:MM-HH:MM" ],
              "mesas_alerta": [ {{ "mesa": number, "espera_promedio_min": number, "motivo": string }} ], 
              "meseros_top": [ {{ "nombre": string, "pedidos_atendidos": number }} ],
              "acciones_sugeridas": [ 
                  "**PROBLEMA:** descripción detallada del problema... **SOLUCIÓN:** descripción detallada de la estrategia a seguir...",
                  "**PROBLEMA:** ... **SOLUCIÓN:** ...",
                  "**PROBLEMA:** ... **SOLUCIÓN:** ..."
              ],
              "tendencias_semana": {{ "dia_mas_fuerte": string, "categoria_en_crecimiento": string }}
            }}
            3. Sé extremadamente detallado y profundo. No des consejos genéricos, USA LOS DATOS PROPORCIONADOS (incluyendo oportunidades en puntos, niveles y ruleta).
            4. Cada acción sugerida DEBE seguir estrictamente el formato **PROBLEMA:** ... **SOLUCIÓN:** ..."""

        result, prov = ai_engine.complete_json(
            system="Eres el Consultor IA de restaurantes. Respondes únicamente con un objeto JSON válido.",
            user=prompt,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        logger.info(f"Consultor IA Insights generado con {prov}")
        return result

    except Exception as e:
        logger.error(f"Error generando insights: {str(e)}")
        return {
            "resumen_dia": {"ventas": 0, "pedidos": 0, "ticket_promedio": 0},
            "top_platos": [],
            "horas_pico": [],
            "mesas_alerta": [],
            "meseros_top": [],
            "acciones_sugeridas": [
                "⚠️ Los servicios de IA están temporalmente fuera de línea.",
                "💡 Verifica que DEEPSEEK_API_KEY esté configurada o intenta más tarde.",
                "📈 Seguimos registrando tus ventas con normalidad."
            ],
            "tendencias_semana": {"dia_mas_fuerte": "-", "categoria_en_crecimiento": "-"}
        }

# --- AI IMAGE GENERATION ---
class ProductImageRequest(BaseModel):
    nombre: str
    descripcion: str

@api_router.post("/ai/generate-product-image")
async def generate_product_image_endpoint(req: ProductImageRequest, business: Business = Depends(get_current_business)):
    # Deduct credit
    deduct_ai_credit(business.id, 'img', business)
    try:
        # Prompt enhancement with DeepSeek (motor principal)
        prompt_refinement = f"""
        Actúa como un experto en fotografía publicitaria de alimentos.
        Genera un prompt detallado para generar una imagen profesional del siguiente producto:
        "{req.nombre}" - {req.descripcion if req.descripcion else 'Un plato delicioso'}
        
        El prompt debe:
        1. Ser en inglés.
        2. Describir la iluminación profesional de estudio.
        3. Describir el fondo desenfocado (bokeh).
        4. Enfocarse en la frescura y textura.
        5. NO incluir ningún texto, logos o marca de agua.
        """
        
        enhanced_prompt, _ = ai_engine.complete_text(
            system="You are a commercial food photography prompt writer. Reply only with the image prompt in English.",
            user=prompt_refinement,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        
        if not enhanced_prompt:
             enhanced_prompt = f"Professional food photography of {req.nombre}, studio lighting, highly detailed."
             
        # Generate image with OpenAI's GPT Image 1 Mini (Much more cost-efficient)
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        img_gen_res = openai_client.images.generate(
            model="gpt-image-1-mini",
            prompt=enhanced_prompt,
            size="1024x1024",
            quality="low",
            n=1,
        )
        
        dalle_url = img_gen_res.data[0].url
        b64_data = img_gen_res.data[0].b64_json
        
        image_bytes = None
        
        if b64_data:
            import base64
            image_bytes = base64.b64decode(b64_data)
        elif dalle_url:
            # Download and save to Supabase
            import httpx
            async with httpx.AsyncClient() as http_client:
                img_res = await http_client.get(dalle_url, timeout=30.0)
                if img_res.status_code != 200:
                    raise HTTPException(status_code=500, detail="Fallo al obtener la imagen de la IA")
                
                image_bytes = img_res.content
        
        if not image_bytes:
             raise HTTPException(status_code=500, detail="No se pudo obtener el contenido de la imagen de la IA")
             
        file_ext = "png"
        file_name = f"{business.id}/ai-{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase Storage
        supabase.storage.from_('menupro').upload(
            path=file_name,
            file=image_bytes,
            file_options={"content-type": f"image/{file_ext}"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('menupro').get_public_url(file_name)
        
        return {"url": public_url}
        
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error generating AI image: {tb}")
        with open("debug_ai_error.txt", "w") as f:
            f.write(tb)
        raise HTTPException(status_code=500, detail=f"Error en la generación de imagen: {str(e)}")

class ProductDescriptionRequest(BaseModel):
    nombre: str

@api_router.post("/ai/generate-product-description")
async def generate_product_description_endpoint(req: ProductDescriptionRequest, business: Business = Depends(get_current_business)):
    # Deduct credit
    deduct_ai_credit(business.id, 'desc', business)
    try:
        prompt = f"""
        Actúa como redactor de menús para un restaurante.
        Voy a darte solo el nombre de un producto y tú debes inventar una descripción corta y sencilla que explique claramente qué es el producto y qué incluye.

        Requisitos de la descripción:
        - En español.
        - 1 sola frase, máximo 1 renglón.
        - Tono simple y descriptivo, sin palabras rebuscadas.
        - Menciona tipo de preparación y los ingredientes o componentes más probables según el nombre.
        - No inventes características exageradas (no digas “el mejor”, “increíble”, etc.).
        - No repitas el nombre del producto más de una vez.

        Ejemplo de estilo de salida:
        Entrada: “Hamburguesa de carne doble Pequeña”
        Salida: “Hamburguesa con dos porciones pequeñas de carne 100% de res, jugosas y bien sazonadas, servidas en pan fresco con queso, vegetales frescos y salsas de la casa, ideal para quien busca gran sabor en un tamaño compacto.”

        Ahora responde SOLO con la descripción, sin explicaciones ni texto adicional.

        Nombre del producto: {req.nombre}
        """

        description, _ = ai_engine.complete_text(
            system="Eres un redactor gastronómico conciso. Responde solo con la descripción en español.",
            user=prompt,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return {"description": description}
    except Exception as e:
        logger.error(f"Error generating AI description: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error en la generación de descripción: {str(e)}")



# --- CONSULTOR IA CHAT & AUDIO ENDPOINTS (DEEPSEEK) ---

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

@api_router.post("/ai/consultant/audio/{negocio_id}")
@api_router.post("/gemini/audio/{negocio_id}")
async def chat_audio_with_consultant(negocio_id: str, audio: UploadFile = File(...), business: Business = Depends(get_current_business)):
    if business.id != negocio_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(hours=24)
        pedidos_res = supabase.table('pedidos').select('total').eq('negocio_id', negocio_id).gte('created_at', yesterday.isoformat()).execute()
        mesas_res = supabase.table('mesas').select('estado').eq('negocio_id', negocio_id).execute()

        ventas_hoy = sum(float(p.get('total', 0)) for p in pedidos_res.data) if pedidos_res.data else 0
        pedidos_hoy = len(pedidos_res.data) if pedidos_res.data else 0
        mesas_ocupadas = len([m for m in mesas_res.data if m.get('estado') == 'ocupada']) if mesas_res.data else 0
        total_mesas = len(mesas_res.data) if mesas_res.data else 0
        loyalty_ctx = _get_loyalty_insights_context(negocio_id, business.slug)

        system_instructions = get_shared_instructions(
            business.nombre,
            ventas_hoy,
            pedidos_hoy,
            f"{mesas_ocupadas} de {total_mesas} ocupadas",
            loyalty_summary=json.dumps(loyalty_ctx, ensure_ascii=False) if loyalty_ctx else None,
        )

        audio_content = await audio.read()
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            user_text = transcript.text.strip()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        if not user_text:
            return {"reply": "No pude escuchar bien tu audio. ¿Podrías repetirlo?"}

        reply, prov = ai_engine.complete_text(
            system=system_instructions,
            user=user_text,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return {"reply": reply, "provider": prov}

    except Exception as e:
        logger.error(f"Error in consultant audio: {e}")
        logger.error(traceback.format_exc())
        return {"reply": "Lo siento, tuve un problema procesando tu audio de consulta."}

@api_router.post("/ai/consultant/chat/{negocio_id}")
@api_router.post("/gemini/chat/{negocio_id}")
async def chat_with_consultant(negocio_id: str, request: ChatRequest, business: Business = Depends(get_current_business)):
    if business.id != negocio_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(hours=24)

        pedidos_res = supabase.table('pedidos').select('total').eq('negocio_id', negocio_id).gte('created_at', yesterday.isoformat()).execute()
        mesas_res = supabase.table('mesas').select('estado').eq('negocio_id', negocio_id).execute()

        pedidos_data = pedidos_res.data or []
        mesas_data = mesas_res.data or []
        ventas_hoy = sum(float(p.get('total', 0)) for p in pedidos_data)
        pedidos_hoy = len(pedidos_data)
        mesas_ocupadas = len([m for m in mesas_data if m.get('estado') == 'ocupada'])
        total_mesas = len(mesas_data)
        loyalty_ctx = _get_loyalty_insights_context(negocio_id, business.slug)

        system_instructions = get_shared_instructions(
            business.nombre,
            ventas_hoy,
            pedidos_hoy,
            f"{mesas_ocupadas} de {total_mesas} ocupadas",
            loyalty_summary=json.dumps(loyalty_ctx, ensure_ascii=False) if loyalty_ctx else None,
        )

        reply, prov = ai_engine.complete_text(
            system=system_instructions,
            user=request.message,
            history=request.history,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return {"reply": reply, "provider": prov}

    except Exception as e:
        logger.error(f"Error en Consultor IA chat: {str(e)}")
        logger.error(traceback.format_exc())
        return {"reply": get_fallback_message()}

class NutritionRequest(BaseModel):
    name: str
    description: Optional[str] = ""

@api_router.post("/ai/nutrition")
@api_router.post("/gemini/nutrition")
async def analyze_nutrition(request: NutritionRequest, business: Business = Depends(get_current_business)):
    deduct_ai_credit(business.id, 'nutri', business)
    prompt = f"""
    Como experto nutricionista, analiza el siguiente plato y estima sus valores nutricionales aproximados para una porción estándar.
    Plato: {request.name}
    Descripción: {request.description}
    
    Responde ÚNICAMENTE en formato JSON con la siguiente estructura (los valores deben ser números o strings cortos):
    {{
        "kcal": int,
        "proteina": "string (ej: 25g)",
        "carbohidratos": "string (ej: 40g)",
        "grasa": "string (ej: 15g)"
    }}
    """

    try:
        data, _ = ai_engine.complete_json(
            system="Eres un nutricionista experto. Responde únicamente con un JSON válido.",
            user=prompt,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return data
    except Exception as e:
        logger.error(f"Error en análisis nutricional IA: {e}")
        return {"kcal": 0, "proteina": "0g", "carbohidratos": "0g", "grasa": "0g"}

# --- LANDING PAGE CHAT AGENT (FOGÓN & MESA - DEEPSEEK) ---

LANDING_FOGON_PROMPT = """
Eres el Asistente Experto y Anfitrión de Fogón & Mesa — Cocina de Almuerzos Artesanales y Parrilla en Colombia.
Tu objetivo es atender a los comensales con calidez, recomendar platos según sus gustos, explicar ingredientes y precios, ayudarlos a armar su almuerzo del día, explicar el programa de puntos, niveles VIP (Bronce, Plata, Oro) y la Ruleta de Premios, y guiarlos para realizar su pedido.

CARTA Y PRECIOS DE FOGÓN & MESA (Pesos Colombianos - COP):

1. ARMA TU ALMUERZO DEL DÍA ($18.500 COP):
   Incluye Sopa del día + Proteína + 2 Acompañamientos + Bebida Natural:
   - Sopas: Crema de Ahuyama Rostizada, Consomé de Pollo con Verduras, Sopa de Lentejas de la Abuela.
   - Proteínas: Carne Asada al Carbón, Pechuga al Romero, Sobrebarriga en Salsa, Filete de Pescado.
   - Acompañamientos (elige 2): Arroz con Cilantro, Tajadas de Madurito, Puré Rústico, Ensalada Fresca, Aguacate, Papa Criolla.
   - Bebidas: Limonada de Panela, Jugo de Mango, Agua con Gas y Limón.

2. EJECUTIVOS DEL DÍA (Incluyen sopa del día, 2 acompañamientos y bebida natural):
   - Churrasco a la Brasa (250g) — $22.000 COP: Corte jugoso al carbón con chimichurri de la casa, arroz con cilantro, tajadas maduras y ensalada fresca. (El más pedido).
   - Pechuga al Romero y Limón — $18.500 COP: Marinada 12 horas en finas hierbas, puré de papa rústico al ajo y vegetales rostizados. (Opción ligera).
   - Sobrebarriga Criolla en Salsa — $19.500 COP: Cocción lenta de 4 horas en salsa de tomate asado y cebolla, papa chorreada, arroz blanco y aguacate.
   - Filete de Tilapia al Ajillo — $21.000 COP: Pesca fresca sellada en mantequilla clarificada, patacones crujientes, arroz con coco y ensalada de mango.
   - Costillitas al Fogón Criollo — $20.500 COP: Costillitas tiernas doradas a fuego vivo con yuca al vapor, arroz parbolizado y suero costeño artesanal.

3. CAZUELAS & OLLA:
   - Cazuela de Frijoles de la Casa — $24.000 COP: Frijoles rojos cremosos con chicharrón carnudo, carne desmechada, maduritos, aguacate, arroz y arepa asada.
   - Ajiaco Santafereño Tradicional — $23.000 COP: Tres variedades de papa, pollo desmechado, mazorca tierna, guascas, alcaparras, crema de leche y aguacate.
   - Sancocho Trifásico en Leña — $25.000 COP: Caldo concentrado con res, cerdo y pollo, yuca, plátano verde, mazorca, arroz blanco y ají casero.
   - Mondongo Criollo Paisa — $22.000 COP: Caldo espeso con cerdo, papa criolla, verduras, arroz, banano y arepa.

4. PARRILLA & BOWLS:
   - Punta de Anca al Carbón (300g) — $32.000 COP: Asada al término de elección con papa criolla salteada, ensalada verde y chimichurri.
   - Costillas BBQ de Guayaba — $28.000 COP: Costillas de cerdo glaseadas en salsa artesanal de guayaba y especias, con papas rústicas y coleslaw.
   - Lomo de Cerdo al Carbón — $26.000 COP: Con papas a la francesa caseras y ensalada agridulce.
   - Bowl Mediodía Saludable — $19.000 COP: Base de arroz integral y quinua, pollo a la plancha (o tofu), aguacate, maíz tierno, tomate cherry y vinagreta cítrica.

5. BEBIDAS & POSTRES:
   - Limonada de Hierbabuena y Panela — $6.500 COP
   - Jugo Natural de Maracuyá o Mango — $7.000 COP (en agua o leche)
   - Limonada de Coco Cremosa — $9.500 COP
   - Flan de Caramelo & Café — $8.500 COP
   - Torta Tibia de Almojábana con Bocadillo — $9.000 COP

PROGRAMA DE FIDELIZACIÓN, NIVELES Y RULETA:
- Puntos: Por cada pedido los clientes registrados acumulan puntos canjeables por descuentos y premios.
- Niveles VIP: Bronce 🥉 (desde 0 Pts), Plata 🥈 (desde 300 Pts) y Oro 🥇 (desde 1.000 Pts).
- Ruleta de Premios: Giro gratis diario + giros extra con puntos para ganar bebidas gratis, postres, descuentos (10% y 15%), doble puntos y upgrades.

INFORMACIÓN DE ATENCIÓN:
- Horarios: Lunes a Viernes de 11:30 AM a 3:30 PM | Sábados, Domingos y Festivos de 12:00 PM a 4:30 PM.
- Ubicación: Calle 84 # 45-22, Zona Gastronómica.
- Domicilios: Entrega en menos de 30 minutos, o para recoger / comer en mesa.
- Métodos de pago: Efectivo, Nequi, Daviplata, Transferencia y Tarjetas.

REGLAS DE RESPUESTA:
1. Sé cálido, hospitalario y apetitoso al describir los platos.
2. Usa precios exactos en COP según la carta anterior.
3. Responde siempre en español de forma concisa y clara.
"""

class LandingChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

@api_router.post("/public/landing-audio")
async def public_landing_audio(audio: UploadFile = File(...)):
    try:
        audio_content = await audio.read()
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            user_text = transcript.text.strip()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        if not user_text:
            return {"reply": "No pude escuchar bien tu audio. ¿Podrías repetirlo?"}

        reply, prov = ai_engine.complete_text(
            system=LANDING_FOGON_PROMPT,
            user=user_text,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return {"reply": reply, "provider": prov}

    except Exception as e:
        logger.error(f"Error in landing audio: {e}")
        logger.error(traceback.format_exc())
        return {"reply": "Lo siento, tuve un problema procesando tu audio."}

@api_router.post("/public/landing-chat")
async def public_landing_chat(request: LandingChatRequest):
    try:
        reply, prov = ai_engine.complete_text(
            system=LANDING_FOGON_PROMPT,
            user=request.message,
            history=request.history,
            provider=ai_engine.PROVIDER_DEEPSEEK,
        )
        return {"reply": reply, "provider": prov}
    except Exception as e:
        logger.error(f"Error en Landing Chat: {str(e)}")
        logger.error(traceback.format_exc())
        return {"reply": "¡Hola! 👋 Soy el asistente de Fogón & Mesa. En este momento estoy experimentando mucha demanda, intenta de nuevo en unos segundos."}


# ============ MERCADOPAGO SUBSCRIPTIONS ============

class SubscriptionRequest(BaseModel):
    plan_id: str # 'impulso', 'pro', 'elite'
    frequency: str = 'monthly' # 'monthly', 'annual'

class WhatsAppPackRequest(BaseModel):
    amount: int # 1000, 5000, 10000

@api_router.post("/payments/create-subscription")
async def create_subscription_link(data: SubscriptionRequest, business: Business = Depends(get_current_business)):
    """Generate a MercadoPago Preapproval (Subscription) Link"""
    if not os.environ.get("MERCADOPAGO_ACCESS_TOKEN"):
         raise HTTPException(status_code=503, detail="El sistema de pagos de MercadoPago no está configurado.")
    try:
        # Define Plan Details
        # NOTE: For production, better to fetch from DB or MP Plans API
        PLAN_DETAILS = {
            'impulso': {
                'reason': 'Plan Básico (Suscripción) - Menu.IA',
                'price_monthly': 39900,
                'price_annual': 399000, 
                'back_url': f"{os.environ.get('FRONTEND_URL')}/dashboard/{business.slug}/configuracion?status=success"
            },
            'pro': {
                'reason': 'Plan Pro (Suscripción) - Menu.IA',
                'price_monthly': 119900,
                'price_annual': 1199000,
                'back_url': f"{os.environ.get('FRONTEND_URL')}/dashboard/{business.slug}/configuracion?status=success"
            },
            'elite': {
                'reason': 'Plan Premium (Suscripción) - Menu.IA',
                'price_monthly': 209900,
                'price_annual': 2099000,
                'back_url': f"{os.environ.get('FRONTEND_URL')}/dashboard/{business.slug}/configuracion?status=success"
            }
        }
        
        selected_plan = PLAN_DETAILS.get(data.plan_id)
        if not selected_plan:
             raise HTTPException(status_code=400, detail="Plan no válido")
             
        amount = selected_plan['price_annual'] if data.frequency == 'annual' else selected_plan['price_monthly']
        
        # Create Preapproval Data
        payer_email = business.email if business.email else "info@menuia.co"
        
        subscription_data = {
            "reason": selected_plan['reason'],
            "external_reference": f"{business.id}:{data.plan_id}", # Identify User logic
            "payer_email": payer_email, 
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": amount,
                "currency_id": "COP"
            },
            "back_url": selected_plan['back_url'],
            "status": "pending"
        }
        
        # Adjust frequency for annual if needed. Usually frequency=12, frequency_type='months' implies billing every 12 months
        if data.frequency == 'annual':
             subscription_data['auto_recurring']['frequency'] = 12
        
        # Call SDK
        preference_response = mp_sdk.preapproval().create(subscription_data)
        preference = preference_response["response"]
        
        # Debug Log
        logger.info(f"MP Preference Created: {preference}")
        
        if "init_point" not in preference:
             raise HTTPException(status_code=500, detail="Error al conectar con MercadoPago")
             
        return {"init_point": preference["init_point"]}

    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/payments/create-payment-link")
async def create_payment_link(data: SubscriptionRequest, business: Business = Depends(get_current_business)):
    """Generate a MercadoPago Preference Link (For PSE, Nequi, etc - Single Payment)"""
    if not os.environ.get("MERCADOPAGO_ACCESS_TOKEN"):
         raise HTTPException(status_code=503, detail="El sistema de pagos de MercadoPago no está configurado.")
    try:
        # Define Plan Details
        PLAN_DETAILS = {
            'impulso': {
                'reason': 'Plan Básico (Mes Prepago) - Menu.IA',
                'price_monthly': 39900,
                'price_annual': 399000
            },
            'pro': {
                'reason': 'Plan Pro (Mes Prepago) - Menu.IA',
                'price_monthly': 119900,
                'price_annual': 1199000
            },
            'elite': {
                'reason': 'Plan Premium (Mes Prepago) - Menu.IA',
                'price_monthly': 209900,
                'price_annual': 2099000
            }
        }
        
        selected_plan = PLAN_DETAILS.get(data.plan_id)
        if not selected_plan:
             raise HTTPException(status_code=400, detail="Plan no válido")
             
        amount = selected_plan['price_annual'] if data.frequency == 'annual' else selected_plan['price_monthly']
        
        # Create Preference Payload
        payer_email = business.email if business.email else "soporte@menuia.co"
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        preference_data = {
            "items": [
                {
                    "title": selected_plan['reason'],
                    "quantity": 1,
                    "unit_price": amount,
                    "currency_id": "COP"
                }
            ],
            "payer": {
                "email": payer_email
            },
            "external_reference": f"{business.id}:{data.plan_id}:{data.frequency}",
            "back_urls": {
                "success": f"{frontend_url}/dashboard/{business.slug}/configuracion?status=success",
                "failure": f"{frontend_url}/dashboard/{business.slug}/configuracion?status=failure",
                "pending": f"{frontend_url}/dashboard/{business.slug}/configuracion?status=pending"
            }
        }

        # MercadoPago Colombia requires HTTPS and non-localhost for auto_return
        if frontend_url.startswith('https://') and 'localhost' not in frontend_url:
            preference_data["auto_return"] = "approved"

        # Solo añadir notification_url si es una URL pública válida (HTTPS)
        backend_url = os.environ.get('BACKEND_URL', '')
        if backend_url.startswith('https://'):
            preference_data["notification_url"] = f"{backend_url}/api/payments/webhook"
        
        # Call SDK to create preference
        preference_response = mp_sdk.preference().create(preference_data)
        
        if preference_response["status"] < 200 or preference_response["status"] >= 300:
             logger.error(f"MercadoPago Error: {preference_response}")
             raise HTTPException(status_code=500, detail=f"Error en MercadoPago: {preference_response.get('response', {}).get('message', 'Sin mensaje')}")

        preference = preference_response["response"]
        
        if "init_point" not in preference:
             logger.error(f"MercadoPago response missing init_point: {preference}")
             raise HTTPException(status_code=500, detail="Error al crear preferencia en MercadoPago (missing init_point)")
             
        return {"init_point": preference["init_point"]}

    except Exception as e:
        logger.error(f"Error creating single payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/payments/create-wa-pack-link")
async def create_wa_pack_link(data: WhatsAppPackRequest, business: Business = Depends(get_current_business)):
    """Generate a MercadoPago Preference Link for WhatsApp Message Packs"""
    if not os.environ.get("MERCADOPAGO_ACCESS_TOKEN"):
         raise HTTPException(status_code=503, detail="El sistema de pagos de MercadoPago no está configurado.")
    try:
        # Updated pricing for packs (Price in COP)
        PACK_PRICING = {
            1000: 150000,
            5000: 725000,
            10000: 1400000
        }
        
        price = PACK_PRICING.get(data.amount)
        if not price:
             raise HTTPException(status_code=400, detail="Cantidad de mensajes no válida")
             
        # Create Preference Payload
        payer_email = business.email if business.email else "soporte@menuia.co"
        
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        preference_data = {
            "items": [
                {
                    "title": f"Pack de {data.amount:,} Mensajes WhatsApp - Menu.IA",
                    "quantity": 1,
                    "unit_price": price,
                    "currency_id": "COP"
                }
            ],
            "payer": {
                "email": payer_email
            },
            "external_reference": f"PACK:{business.id}:{data.amount}",
            "back_urls": {
                "success": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=success",
                "failure": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=failure",
                "pending": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=pending"
            }
        }

        # MercadoPago Colombia requires HTTPS and non-localhost for auto_return
        if frontend_url.startswith('https://') and 'localhost' not in frontend_url:
            preference_data["auto_return"] = "approved"

        # Solo añadir notification_url si es una URL pública válida (HTTPS)
        backend_url = os.environ.get('BACKEND_URL', '')
        if backend_url.startswith('https://'):
            preference_data["notification_url"] = f"{backend_url}/api/payments/webhook"
        
        logger.info(f"Creating MP preference for business {business.id}, amount: {data.amount}")
        logger.info(f"Preference data: {json.dumps(preference_data, indent=2)}")
        preference_response = mp_sdk.preference().create(preference_data)
        
        if preference_response["status"] >= 400:
            error_detail = preference_response.get("response", "No response data")
            logger.error(f"MercadoPago Error ({preference_response['status']}): {error_detail}")
            raise HTTPException(status_code=400, detail=f"Error de MercadoPago: {error_detail}")

        preference = preference_response["response"]
        
        if "init_point" not in preference:
            logger.error(f"MercadoPago response missing init_point: {preference}")
            raise HTTPException(status_code=500, detail="La respuesta de MercadoPago no contiene el link de pago.")

        return {"init_point": preference["init_point"]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating WA pack payment: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/create-support-pack-link")
async def create_support_pack_link(data: WhatsAppPackRequest, business: Business = Depends(get_current_business)):
    """Generate a MercadoPago Preference Link for WhatsApp Support Packs"""
    if not os.environ.get("MERCADOPAGO_ACCESS_TOKEN"):
         raise HTTPException(status_code=503, detail="El sistema de pagos de MercadoPago no está configurado.")
    try:
        SUPPORT_PRICING = {
            1500: 45000,
            4500: 130500,
            9000: 252000
        }
        
        price = SUPPORT_PRICING.get(data.amount)
        if not price:
             raise HTTPException(status_code=400, detail="Cantidad de mensajes de soporte no válida")
             
        payer_email = business.email if business.email else "info@menuia.co"
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        preference_data = {
            "items": [
                {
                    "title": f"Pack Soporte de {data.amount:,} Mensajes WhatsApp - Menu.IA",
                    "quantity": 1,
                    "unit_price": price,
                    "currency_id": "COP"
                }
            ],
            "payer": {
                "email": payer_email
            },
            "external_reference": f"SUPPORT_PACK:{business.id}:{data.amount}",
            "back_urls": {
                "success": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=success",
                "failure": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=failure",
                "pending": f"{frontend_url}/dashboard/{business.slug}/whatsapp?status=pending"
            }
        }

        if frontend_url.startswith('https://') and 'localhost' not in frontend_url:
            preference_data["auto_return"] = "approved"

        backend_url = os.environ.get('BACKEND_URL', '')
        if backend_url.startswith('https://'):
            preference_data["notification_url"] = f"{backend_url}/api/payments/webhook"
        
        preference_response = mp_sdk.preference().create(preference_data)
        
        if preference_response["status"] >= 400:
            error_detail = preference_response.get("response", "No response data")
            logger.error(f"MercadoPago Error ({preference_response['status']}): {error_detail}")
            raise HTTPException(status_code=400, detail=f"Error de MercadoPago: {error_detail}")

        preference = preference_response["response"]
        
        if "init_point" not in preference:
            raise HTTPException(status_code=500, detail="La respuesta de MercadoPago no contiene el link de pago.")

        return {"init_point": preference["init_point"]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Support pack payment: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@api_router.post("/payments/webhook")
async def mercadopago_webhook(request: Request):
    try:
        data = await request.json()
        logger.info(f"Webhook received: {data}")
        
        topic = request.query_params.get("topic") or data.get("type")
        resource_id = request.query_params.get("id") or data.get("data", {}).get("id")

        if topic == "preapproval":
             # Handle Subscriptions
             sub_res = mp_sdk.preapproval().get(resource_id)
             sub_data = sub_res["response"]
             external_ref = sub_data.get("external_reference")
             status = sub_data.get("status")
             
             if external_ref and ":" in external_ref:
                 parts = external_ref.split(":")
                 business_id = parts[0]
                 plan_id = parts[1]
                 
                 new_plan = 'free'
                 if status == 'authorized':
                     new_plan = plan_id
                 
                 supabase.table('negocios').update({
                     'plan': new_plan,
                     'plan_expires_at': None # Subscriptions don't use this expiration usually
                 }).eq('id', business_id).execute()
                 logger.info(f"Subscription Webhook: Updated Business {business_id} to Plan {new_plan}")

        elif topic == "payment":
             # Handle Single Payments (PSE, Nequi)
             payment_res = mp_sdk.payment().get(resource_id)
             payment_data = payment_res["response"]
             
             status = payment_data.get("status")
             external_ref = payment_data.get("external_reference")
             
             if status == "approved" and external_ref:
                 parts = external_ref.split(":")
                 
                 if parts[0] == "PACK":
                     # Handle WhatsApp Pack Purchase
                     business_id = parts[1]
                     amount = int(parts[2])
                     
                     # Increment wa_credits
                     # Get current credits first to be safe (or use SQL increment)
                     supabase.rpc('increment_wa_credits', {
                         'row_id': business_id,
                         'val': amount
                     }).execute()
                     
                     # If RPC doesn't exist, we can do a normal update (less atomic but works for now)
                     res = supabase.table('negocios').select('wa_credits').eq('id', business_id).single().execute()
                     current = res.data.get('wa_credits', 0) if res.data else 0
                     
                     supabase.table('negocios').update({
                         'wa_credits': current + amount
                     }).eq('id', business_id).execute()
                     
                     logger.info(f"Pack Webhook: Added {amount} credits to Business {business_id}")
                
                 elif parts[0] == "SUPPORT_PACK":
                     # Handle WhatsApp Support Pack Purchase
                     business_id = parts[1]
                     amount = int(parts[2])
                     
                     # Increment wa_messages_limit
                     res = supabase.table('negocios').select('wa_messages_limit').eq('id', business_id).single().execute()
                     current = res.data.get('wa_messages_limit', 0) if res.data else 0
                     
                     supabase.table('negocios').update({
                         'wa_messages_limit': current + amount
                     }).eq('id', business_id).execute()
                     
                     logger.info(f"Support Pack Webhook: Added {amount} to wa_messages_limit for Business {business_id}")
                
                
                 elif len(parts) >= 2:
                     # Handle Plan Payment (Old Logic)
                     business_id = parts[0]
                     plan_id = parts[1]
                     frequency = parts[2] if len(parts) > 2 else 'monthly'
                      
                     from datetime import datetime, timedelta
                     now = datetime.now()
                     expiration = now + timedelta(days=365 if frequency == 'annual' else 31)
                      
                     # Set default limits based on plan
                     limits = {
                         'impulso': 1500,
                         'basic': 1500,
                         'pro': 4500,
                         'elite': 9000,
                         'premium': 9000
                     }
                      
                     supabase.table('negocios').update({
                         'plan': plan_id,
                         'plan_expires_at': expiration.isoformat(),
                         'wa_messages_limit': limits.get(plan_id, 1500)
                     }).eq('id', business_id).execute()
                     logger.info(f"Payment Webhook: Updated {business_id} Plan to {plan_id} expiring {expiration}")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook Error: {e}")
        return {"status": "error"}

# ============ CLIENT AUTH & PROFILE ROUTES ============

@api_router.post("/auth/client/request-otp")
async def request_otp(data: OTPRequest):
    phone = data.telefono.replace(' ', '').replace('+', '')
    
    # Generate 6 digit OTP
    import random
    otp = str(random.randint(100000, 999999))
    
    # Expires in 10 mins
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Log OTP for debugging
    try:
        with open("otp_log.txt", "a") as f:
            f.write(f"{datetime.now().isoformat()} - {phone} - {otp}\n")
    except:
        pass
    
    # Save to auth_otps
    try:
        supabase.table('auth_otps').insert({
            "telefono": phone,
            "otp_code": otp,
            "expires_at": expires.isoformat()
        }).execute()
        
        # Determine the link and business name
        link_to_use = "https://menuia.co"
        business_name_to_use = data.negocio_nombre if data.negocio_nombre else "Menu.IA"
        
        if data.negocio_slug:
            link_to_use = f"https://menuia.co/{data.negocio_slug}/menu"
            try:
                biz_res = supabase.table('business').select('id, nombre, wa_messages_count').eq('slug', data.negocio_slug).execute()
                if biz_res.data:
                    biz_data = biz_res.data[0]
                    if not data.negocio_nombre:
                        business_name_to_use = biz_data.get('nombre', "Menu.IA")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error checking slug {data.negocio_slug}: {e}")
        # Send via WhatsApp using the approved Authentication template
        send_whatsapp_template(
            to_number=phone,
            template_key="codigo_verificacion",
            otp_code=otp,
            negocio_nombre=business_name_to_use
        )
        return {"message": "OTP enviado"}
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        # For development, if sending fails (e.g. no twilio), we might want to log OTP to console
        logger.info(f"DEV OTP for {phone}: {otp}")
        if os.environ.get('DEBUG') == 'True':
             return {"message": "OTP enviado (DEV MODE)", "otp_debug": otp}
        raise HTTPException(status_code=500, detail="Error al enviar OTP")

@api_router.post("/auth/client/login-pin", response_model=ClientTokenResponse)
async def login_client_pin(data: PINLogin):
    # Normalize phone: keep only digits
    phone_digits = "".join(filter(str.isdigit, data.telefono))
    # Standard search: last 10 digits (most common for local numbers)
    search_phone = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
    
    # Search for client - try exact match or matching the last 10 digits
    # Supabase doesn't easily support 'ends_with', so we'll fetch by exact or use a broad search
    client_res = supabase.table('clientes').select('*').or_(f"telefono.eq.{phone_digits},telefono.ilike.%{search_phone}").execute()
    
    if not client_res.data:
        # Auto-create client if not exists
        new_client = {
            "telefono": phone_digits,
            "nombre": "Cliente Nuevo",
            "avatar_url": f"https://ui-avatars.com/api/?name=User&background=random"
        }
        create_res = supabase.table('clientes').insert(new_client).execute()
        if not create_res.data:
            raise HTTPException(status_code=500, detail="Error al crear cliente")
        client_data = create_res.data[0]
    else:
        # If multiple found, pick the one that matches better or the first one
        client_data = client_res.data[0]
        
    # Use password_hash for the PIN as the 'pin' column is missing
    hashed_pin = client_data.get('password_hash') or client_data.get('pin')
    
    # IMPORTANT: The default PIN is the last 4 digits of the stored number
    stored_phone = client_data.get('telefono', phone_digits)
    default_pin = "".join(filter(str.isdigit, stored_phone))[-4:]
    
    if not hashed_pin:
        # First time login with default PIN
        if data.pin != default_pin:
             raise HTTPException(status_code=401, detail=f"PIN inicial incorrecto. Usa los últimos 4 dígitos de tu celular ({default_pin})")
    else:
        if not verify_password(data.pin, hashed_pin):
            raise HTTPException(status_code=401, detail="PIN incorrecto")
        
    # Generate Token
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    expire = datetime.now(timezone.utc) + access_token_expires
    to_encode = {"sub": phone, "role": "client", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Remove Sensitive data from response
    sensitive_fields = ['pin', 'security_answer']
    for field in sensitive_fields:
        if field in client_data:
            del client_data[field]
        
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "cliente": client_data
    }

@api_router.post("/auth/client/verify-otp", response_model=ClientTokenResponse)
async def verify_otp(data: OTPVerify):
    phone = data.telefono.replace(' ', '').replace('+', '')
    
    # Check OTP
    res = supabase.table('auth_otps').select('*')\
        .eq('telefono', phone)\
        .eq('otp_code', data.otp)\
        .eq('used', False)\
        .gt('expires_at', datetime.now(timezone.utc).isoformat())\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
        
    # Mark as used (wait, Supabase might return error if RLS prevents update, but here we use service key so it's fine)
    otp_id = res.data[0]['id']
    supabase.table('auth_otps').update({'used': True}).eq('id', otp_id).execute()
    
    # Get or Create Client
    client_res = supabase.table('clientes').select('*').eq('telefono', phone).execute()
    
    if client_res.data:
        client_data = client_res.data[0]
    else:
        # Create new client
        new_client = {
            "telefono": phone,
            "nombre": "Nuevo Cliente", 
            "avatar_url": f"https://ui-avatars.com/api/?name=User&background=random"
        }
        create_res = supabase.table('clientes').insert(new_client).execute()
        if not create_res.data:
             raise HTTPException(status_code=500, detail="Error al crear cliente")
        client_data = create_res.data[0]
        
    # Generate Token
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    expire = datetime.now(timezone.utc) + access_token_expires
    to_encode = {"sub": phone, "role": "client", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Remove PIN from response
    if 'pin' in client_data:
        del client_data['pin']
        
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "cliente": client_data
    }

@api_router.get("/client/me", response_model=Cliente)
async def get_client_profile(client: Cliente = Depends(get_current_client)):
    return client

@api_router.put("/client/me", response_model=Cliente)
async def update_client_profile(data: ClienteUpdate, client: Cliente = Depends(get_current_client)):
    # Remove None values
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # If providing a new PIN, hash it
    if 'pin' in update_data and update_data['pin']:
        update_data['pin'] = hash_password(update_data['pin'])
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    res = supabase.table('clientes').update(update_data).eq('id', client.id).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="Error actualizando perfil")
    
    client_res = res.data[0]
    if 'pin' in client_res:
        del client_res['pin']
        
    return client_res

@api_router.post("/client/update-pin")
async def update_client_pin(data: UpdatePINRequest, client: Cliente = Depends(get_current_client)):
    try:
        logger.info(f"Updating PIN for client ID: {client.id}")
        hashed_pin = hash_password(data.pin)
        update_item = {
            'password_hash': hashed_pin, # Fix: Use existing column
            'recovery_method': data.recovery_method,
            'pin_hint': data.pin_hint,
            'security_question': data.security_question
        }
        
        if data.security_answer:
            update_item['security_answer'] = hash_password(data.security_answer.lower().strip())
            
        logger.info(f"Update data: {update_item}")
        res = supabase.table('clientes').update(update_item).eq('id', client.id).execute()
        
        if not res.data:
            logger.error(f"Supabase update returned no data for client {client.id}")
            raise HTTPException(status_code=500, detail="Error actualizando PIN y recuperación")
            
        return {"message": "PIN y método de recuperación configurados"}
    except Exception as e:
        logger.error(f"Critical error in update_client_pin: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.get("/auth/client/recovery-info/{phone}", response_model=RecoveryInfo)
async def get_client_recovery_info(phone: str):
    phone = phone.replace(' ', '').replace('+', '')
    res = supabase.table('clientes').select('recovery_method', 'pin_hint', 'security_question').eq('telefono', phone).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    c = res.data[0]
    if not c.get('recovery_method'):
        raise HTTPException(status_code=400, detail="No tienes configurado un método de recuperación")
        
    return {
        "method": c['recovery_method'],
        "hint": c.get('pin_hint'),
        "question": c.get('security_question')
    }

@api_router.post("/auth/client/reset-pin")
async def reset_client_pin(data: ResetPINRequest):
    phone = data.telefono.replace(' ', '').replace('+', '')
    # Get client
    res = supabase.table('clientes').select('*').eq('telefono', phone).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    client = res.data[0]
    method = client.get('recovery_method')
    
    if method == 'question':
        if not data.answer:
            raise HTTPException(status_code=400, detail="Falta la respuesta a la pregunta")
        if not client.get('security_answer') or not verify_password(data.answer.lower().strip(), client['security_answer']):
            raise HTTPException(status_code=401, detail="Respuesta incorrecta")
    elif method == 'hint':
        # Hint is just a reminder, if they are here they are supposed to try again with the login.
        # But wait, if they want to RESET it, hint doesn't prove ownership.
        # If method is hint, they can't reset it automatically? 
        # User said: "one of the two and that will be the way to recover their pin"
        # For 'hint', recovery is just seeing the hint and typing the pin again in Login.
        # If they still don't remember, they need to log in with OTP.
        raise HTTPException(status_code=400, detail="El método de pista solo sirve para recordarte el PIN en la pantalla de inicio.")
    else:
        raise HTTPException(status_code=400, detail="Método de recuperación no soportado para reseteo")

    # If verification pass (only for 'question' for now), allow reset
    new_hashed = hash_password(data.new_pin)
    supabase.table('clientes').update({'password_hash': new_hashed}).eq('id', client['id']).execute()
    
    return {"message": "PIN restablecido con éxito. Ahora puedes entrar."}
    
@api_router.post("/client/upload-avatar")
async def upload_client_avatar(
    file: UploadFile = File(...),
    negocio_id: Optional[str] = Query(None), # Optional business context
    client: Cliente = Depends(get_current_client)
):
    try:
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_id = str(uuid.uuid4())
        file_name = f"{client.id}/{unique_id}.{file_ext}"

        # Upload
        content = await file.read()
        
        # Ensure bucket exists (simplified check)
        try:
             supabase.storage.create_bucket('avatars', options={"public": True})
        except:
             pass

        res = supabase.storage.from_('avatars').upload(
            file_name,
            content,
            {"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get Public URL
        public_url = supabase.storage.from_('avatars').get_public_url(file_name)
        
        # Update Main Client Profile
        supabase.table('clientes').update({'avatar_url': public_url}).eq('id', client.id).execute()
        
        # If business context exists, also try to update business-specific customer record if it exists
        # This assumes there is a table linking clients and businesses (e.g. 'clientes_negocio' or similar)
        # Or that 'clientes' table is global but we want to ensure consistency.
        # Based on your prompt "enlaced to business", let's check if we need to update a specific 
        # table 'puntos_clientes' or similar which holds the business-customer relationship.
        
        if negocio_id:
             try:
                 supabase.table('puntos_clientes') \
                     .update({'avatar_url': public_url}) \
                     .eq('telefono', client.telefono) \
                     .eq('negocio_id', negocio_id) \
                     .execute()
             except Exception as e:
                 logger.warning(f"Could not update business-specific avatar: {e}")
        
        return {"url": public_url}

    except Exception as e:
        logger.error(f"Error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

@api_router.get("/client/addresses", response_model=List[Address])
async def get_client_addresses(client: Cliente = Depends(get_current_client)):
    res = supabase.table('cliente_direcciones').select('*').eq('cliente_id', client.id).execute()
    return res.data

@api_router.post("/client/addresses", response_model=Address)
async def create_client_address(data: AddressCreate, client: Cliente = Depends(get_current_client)):
    payload = data.model_dump()
    payload['cliente_id'] = client.id
    
    # If principal, unset others
    if payload.get('es_principal'):
        supabase.table('cliente_direcciones').update({'es_principal': False}).eq('cliente_id', client.id).execute()
        
    res = supabase.table('cliente_direcciones').insert(payload).execute()
    return res.data[0]

@api_router.get("/client/orders")
async def get_client_orders(slug: str = None, client: Cliente = Depends(get_current_client)):
    query = supabase.table('pedidos').select('*').eq('cliente_telefono', client.telefono).order('created_at', desc=True)
    
    if slug:
        # Get business ID
        biz_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
        if biz_res.data:
            query = query.eq('negocio_id', biz_res.data[0]['id'])
            
    res = query.execute()
    orders = res.data
    
    if not orders:
        return []

    # Enrich with business info
    b_ids = list(set([o['negocio_id'] for o in orders if o.get('negocio_id')]))
    
    b_map = {}
    if b_ids:
        try:
            b_res = supabase.table('negocios').select('id, nombre, logo_url, slug').in_('id', b_ids).execute()
            for b in b_res.data:
                b_map[b['id']] = b
        except Exception as e:
            logger.error(f"Error fetching businesses for orders: {e}")
            
    for o in orders:
        if o.get('negocio_id') in b_map:
            b = b_map[o['negocio_id']]
            o['negocio_nombre'] = b['nombre']
            o['negocio_logo'] = b['logo_url']
            o['negocio_slug'] = b['slug']
            
    return orders

# Favorites Endpoints

@api_router.get("/client/favorites")
async def get_client_favorites(client: Cliente = Depends(get_current_client)):
    try:
        # Fetch favorites relation
        favs = supabase.table('clientes_favoritos').select('*').eq('cliente_id', client.id).execute()
        if not favs.data:
            return []
            
        negocio_ids = [f['negocio_id'] for f in favs.data]
        if not negocio_ids:
            return []
            
        # Fetch businesses
        businesses = supabase.table('negocios').select('id, nombre, slug, logo_url, categoria').in_('id', negocio_ids).execute()
        
        result = []
        for b in businesses.data:
            result.append({
                "negocio_id": b['id'],
                "usuario_telefono": client.telefono, # mapping to model
                "negocio_nombre": b['nombre'],
                "negocio_slug": b['slug'],
                "negocio_logo": b['logo_url'],
                "negocio_categoria": b.get('categoria', 'Restaurante')
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching favorites: {e}")
        return []

@api_router.get("/client/favorites/{slug}/check")
async def check_client_favorite(slug: str, client: Cliente = Depends(get_current_client)):
    try:
        biz_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
        if not biz_res.data:
            return {"is_favorite": False}
        
        biz_id = biz_res.data[0]['id']
        
        fav = supabase.table('clientes_favoritos').select('*').match({
            "cliente_id": client.id,
            "negocio_id": biz_id
        }).execute()
        
        return {"is_favorite": bool(fav.data)}
    except Exception as e:
        logger.error(f"Error checking favorite: {e}")
        return {"is_favorite": False}

@api_router.post("/client/favorites/{slug}")
async def toggle_client_favorite(slug: str, client: Cliente = Depends(get_current_client)):
    try:
        biz_res = supabase.table('negocios').select('id').eq('slug', slug).execute()
        if not biz_res.data:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
        biz_id = biz_res.data[0]['id']
        
        # Check if exists
        fav = supabase.table('clientes_favoritos').select('*').match({
            "cliente_id": client.id,
            "negocio_id": biz_id
        }).execute()
        
        if fav.data:
            # Delete
            supabase.table('clientes_favoritos').delete().match({
                "cliente_id": client.id,
                "negocio_id": biz_id
            }).execute()
            return {"is_favorite": False, "message": "Eliminado de favoritos"}
        else:
            # Add
            supabase.table('clientes_favoritos').insert({
                "cliente_id": client.id,
                "negocio_id": biz_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            return {"is_favorite": True, "message": "Agregado a favoritos"}
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar favoritos")



class WebChatRequest(BaseModel):
    phone: str
    message: str

@api_router.post("/chat/web/{slug}")
async def web_chat_agent(slug: str, data: WebChatRequest):
    """
    Endpoint del Chat Web (Agente cerebro principal con DeepSeek).
    Arquitectura de un solo negocio: siempre resuelve al negocio principal.
    """
    try:
        # 1. Resolver el único negocio
        business_data = get_main_business()
        if not business_data:
            biz_res = supabase.table('negocios').select('*').eq('slug', slug).limit(1).execute()
            business_data = biz_res.data[0] if biz_res.data else None
        if not business_data:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")

        business_id = business_data['id']

        # 2. Procesar mensaje con el motor principal (DeepSeek + herramientas de menú, pedidos, registro, puntos, niveles y ruleta)
        phone_id = f"web_{data.phone.strip()}"
        response_text = await process_web_message(data.message, phone_id, business_id)

        return {"response": response_text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in web_chat_agent: {e}")
        logger.error(traceback.format_exc())
        return {"response": "Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?"}

@api_router.post("/chat/audio/{slug}")
async def web_chat_audio_agent(slug: str, audio: UploadFile = File(...), phone: str = Form(...)):
    """
    Endpoint del Chat Web por Audio.
    Transcribe con OpenAI Whisper y procesa con el motor principal (DeepSeek).
    """
    try:
        # 1. Resolver el único negocio
        business_data = get_main_business()
        if not business_data:
            biz_res = supabase.table('negocios').select('*').eq('slug', slug).limit(1).execute()
            business_data = biz_res.data[0] if biz_res.data else None
        if not business_data:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")

        business_id = business_data['id']

        # 2. Transcribir audio con OpenAI Whisper
        audio_content = await audio.read()
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            user_text = transcript.text.strip()
            logger.info(f"Whisper transcription for web chat: {user_text}")
        except Exception as whisper_err:
            logger.error(f"Whisper Error: {whisper_err}")
            return {"response": "No pude procesar el audio correctamente. ¿Podrías intentar de nuevo o escribir tu mensaje?"}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        if not user_text:
            return {"response": "No pude escuchar nada en tu audio. ¿Podrías intentarlo de nuevo?"}

        # 3. Procesar con el motor principal (DeepSeek)
        phone_id = f"web_{phone.strip()}"
        response_text = await process_web_message(user_text, phone_id, business_id)

        return {"response": response_text}

    except Exception as e:
        logger.error(f"Error in web_chat_audio_agent: {e}")
        logger.error(traceback.format_exc())
        return {"response": "Lo siento, tuve un problema procesando tu audio. ¿Podrías intentarlo de nuevo o escribir tu mensaje?"}

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 8000)),
    )
