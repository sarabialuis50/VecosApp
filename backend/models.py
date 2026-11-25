from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


def generate_id():
    return str(uuid.uuid4())


def get_utc_now():
    return datetime.now(timezone.utc)


class OrderStatus(str, Enum):
    PENDIENTE = "pendiente"
    ACEPTADO = "aceptado"
    PREPARANDO = "preparando"
    LISTO = "listo"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class TableStatus(str, Enum):
    LIBRE = "libre"
    OCUPADA = "ocupada"
    PENDIENTE = "pendiente"


class EmployeeRole(str, Enum):
    DUENO = "dueno"
    MESERO = "mesero"
    COCINA = "cocina"
    REPARTIDOR = "repartidor"


# Business Models
class BusinessBase(BaseModel):
    nombre: str
    slug: str
    descripcion: Optional[str] = None
    slogan: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    horarios: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    banner_tag: Optional[str] = "Los mejores sabores"
    banner_title: Optional[str] = "Nuestro Menú"
    banner_description: Optional[str] = None
    # Promo Modal Config
    promo_habilitado: Optional[bool] = False
    promo_imagen_url: Optional[str] = None
    promo_precio: Optional[float] = None
    # Delivery Config
    precio_km: Optional[float] = 0.0
    costo_minimo_domicilio: Optional[float] = 0.0
    lat: Optional[float] = None
    lng: Optional[float] = None
    # Operation Config
    metodos_pago: Optional[Dict[str, Any]] = {
        "efectivo": True,
        "nequi": True,
        "daviplata": False,
        "transferencia": True,
        "tarjeta": False,
        "link": False
    }
    datos_pago: Optional[Dict[str, Any]] = {
        "nequi": {"numero": "", "qr_url": ""},
        "daviplata": {"numero": "", "qr_url": ""},
        "transferencia": {"banco": "", "numero_cuenta": ""},
        "tarjeta": {"link_pago": "", "qr_url": ""},
        "link": {"llave": "", "qr_url": ""}
    }
    metodos_entrega: Optional[Dict[str, Any]] = {
        "domicilio": True,
        "recoger": True,
        "mesa": True
    }
    # AI Config
    ai_habilitado: Optional[bool] = True
    ai_personalidad: Optional[str] = "Amigable y cercano (Recomendado)"
    ai_saludo: Optional[str] = None
    ai_conocimiento: Optional[str] = None
    google_maps_review_url: Optional[str] = None
    # Custom Twilio Config (For Pro businesses)
    twilio_sid: Optional[str] = None
    twilio_token: Optional[str] = None
    twilio_number: Optional[str] = None
    ai_use_modal: Optional[bool] = True
    abierto: Optional[bool] = True
    # Kitchen Config
    cocinas_duales_activo: Optional[bool] = False
    # Social Media
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    # Multi-branch hierarchy
    parent_id: Optional[str] = None  # None = Super Admin / dueño. Set = Admin de Sede

    # WhatsApp & Campaign Credits (Centralized)
    whatsapp_incluidos: int = 0
    whatsapp_usados: int = 0
    wa_campaign_limit: int = 0
    wa_campaign_count: int = 0
    wa_messages_limit: int = 0
    wa_messages_count: int = 0
    wa_credits: int = 0

    @field_validator('metodos_entrega', mode='before')
    @classmethod
    def normalize_metodos_entrega(cls, v: Any) -> Any:
        if isinstance(v, list):
            lower = [str(m).lower() for m in v]
            return {
                "domicilio": any('domicilio' in m for m in lower),
                "recoger": any('recoger' in m or 'llevar' in m for m in lower),
                "mesa": any('mesa' in m for m in lower)
            }
        if isinstance(v, dict):
            return {
                "domicilio": v.get("domicilio", False),
                "recoger": v.get("recoger", False),
                "mesa": v.get("mesa", False)
            }
        if v is None:
            return {"domicilio": True, "recoger": True, "mesa": True}
        return v

    @field_validator('metodos_pago', mode='before')
    @classmethod
    def normalize_metodos_pago(cls, v: Any) -> Any:
        if isinstance(v, list):
            lower = [str(m).lower() for m in v]
            return {
                "efectivo": any('efectivo' in m for m in lower),
                "nequi": any('nequi' in m for m in lower),
                "daviplata": any('daviplata' in m for m in lower),
                "transferencia": any('transferencia' in m for m in lower),
                "tarjeta": any('tarjeta' in m or 'datáfono' in m or 'datafono' in m for m in lower),
                "link": any('link' in m or 'epayco' in m or 'wompi' in m for m in lower)
            }
        if isinstance(v, dict):
            return {
                "efectivo": v.get("efectivo", False),
                "nequi": v.get("nequi", False),
                "daviplata": v.get("daviplata", False),
                "transferencia": v.get("transferencia", False),
                "tarjeta": v.get("tarjeta", False),
                "link": v.get("link", False)
            }
        if v is None:
            return {"efectivo": True, "nequi": True, "transferencia": True, "daviplata": False, "tarjeta": False, "link": False}
        return v

class BusinessCreate(BusinessBase):
    email: str
    password: str

class BusinessLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class Business(BusinessBase):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    id: str = Field(default_factory=generate_id)
    email: str
    created_at: datetime = Field(default_factory=get_utc_now)
    plan: Optional[str] = "free"
    is_active: bool = True
    # IA Credits Usage
    ai_credits_desc_used: int = 0
    ai_credits_img_used: int = 0
    ai_credits_nutri_used: int = 0
    ai_credits_wa_used: int = 0
    ai_credits_campaign_used: int = 0
    ai_credits_hub_used: int = 0
    ai_credits_last_reset: Optional[datetime] = None
    plan_expires_at: Optional[datetime] = None

class BusinessPublic(BusinessBase):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    id: str
    plan: Optional[str] = "free"
    # IA Credits Usage
    ai_credits_desc_used: int = 0
    ai_credits_img_used: int = 0
    ai_credits_nutri_used: int = 0
    ai_credits_wa_used: int = 0
    ai_credits_campaign_used: int = 0
    ai_credits_hub_used: int = 0
    ai_credits_last_reset: Optional[datetime] = None
    plan_expires_at: Optional[datetime] = None


# Product Models
class ProductBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    precio_original: Optional[float] = None
    oferta_porcentaje: Optional[int] = None
    categoria: str
    imagen: Optional[str] = None
    etiqueta: Optional[str] = None
    disponible: bool = True
    destacado: bool = False
    orden: int = 0
    modificadores: Optional[List[Dict[str, Any]]] = None
    tamanos: Optional[List[Dict[str, Any]]] = None
    opciones: Optional[List[Dict[str, Any]]] = None
    
    # Nutrición (IA)
    nutri_kcal: Optional[int] = None
    nutri_proteina: Optional[str] = None
    nutri_carbohidratos: Optional[str] = None
    nutri_grasa: Optional[str] = None
    
    # Extras
    prep_time_minutes: Optional[int] = None
    is_vegan: bool = False
    is_vegetarian: bool = False
    is_gluten_free: bool = False
    is_spicy: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    precio_original: Optional[float] = None
    oferta_porcentaje: Optional[int] = None
    categoria: Optional[str] = None
    imagen: Optional[str] = None
    etiqueta: Optional[str] = None
    disponible: Optional[bool] = None
    destacado: Optional[bool] = None
    orden: Optional[int] = None
    modificadores: Optional[List[Dict[str, Any]]] = None
    tamanos: Optional[List[Dict[str, Any]]] = None
    opciones: Optional[List[Dict[str, Any]]] = None
    
    # Nutrición (IA)
    nutri_kcal: Optional[int] = None
    nutri_proteina: Optional[str] = None
    nutri_carbohidratos: Optional[str] = None
    nutri_grasa: Optional[str] = None


class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    created_at: datetime = Field(default_factory=get_utc_now)


# Table Models
class TableBase(BaseModel):
    numero: int
    capacidad: int = 4
    ubicacion: Optional[str] = None
    empleado_id: Optional[str] = None


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    numero: Optional[int] = None
    capacidad: Optional[int] = None
    ubicacion: Optional[str] = None
    empleado_id: Optional[str] = None
    estado: Optional[TableStatus] = None


class Table(TableBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    estado: TableStatus = TableStatus.LIBRE
    qr_code: Optional[str] = None
    empleado_id: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)


# Employee Models
class EmployeeBase(BaseModel):
    nombre: str
    pin: str
    rol: EmployeeRole = EmployeeRole.MESERO
    telefono: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeLogin(BaseModel):
    pin: str


class Employee(EmployeeBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    activo: bool = True
    created_at: datetime = Field(default_factory=get_utc_now)


# Order Item Models
class OrderItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    producto_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    cantidad: int
    precio_unitario: float = Field(..., alias="precio")  # Handle both names
    notas: Optional[str] = None
    modificadores: Optional[List[Any]] = None

    def __init__(self, **data):
        # Fallback for precio_unitario if given directly
        if "precio_unitario" in data and "precio" not in data:
            data["precio"] = data["precio_unitario"]
        super().__init__(**data)


# Order Models
class OrderBase(BaseModel):
    mesa_id: Optional[str] = None
    mesa_numero: Optional[int] = None
    items: List[OrderItem]
    notas: Optional[str] = None
    cliente_nombre: Optional[str] = None
    cliente_telefono: Optional[str] = None
    tipo: str = "mesa"  # mesa, takeaway, delivery
    metodo_pago: Optional[str] = "Efectivo"
    metodo_entrega: Optional[str] = None
    direccion: Optional[str] = None
    distancia: Optional[float] = None
    costo_envio: Optional[float] = 0.0
    cliente_lat: Optional[float] = None
    cliente_lng: Optional[float] = None


class OrderCreate(OrderBase):
    via_ai: Optional[bool] = False


class OrderUpdate(BaseModel):
    estado: Optional[OrderStatus] = None
    notas: Optional[str] = None
    repartidor_id: Optional[str] = None
    repartidor_lat: Optional[float] = None
    repartidor_lng: Optional[float] = None



class ClientFavorite(BaseModel):
    id: Optional[str] = None
    usuario_telefono: str # Use phone or client_id? client_id is cleaner. but existing endpoints heavily use phone. 
    negocio_id: str
    created_at: Optional[datetime] = None
    
    # Optional fields for frontend display
    negocio_nombre: Optional[str] = None
    negocio_slug: Optional[str] = None
    negocio_logo: Optional[str] = None
    negocio_categoria: Optional[str] = None


class Order(OrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    mesero_id: Optional[str] = None
    repartidor_id: Optional[str] = None
    repartidor_lat: Optional[float] = None
    repartidor_lng: Optional[float] = None
    business_lat: Optional[float] = None
    business_lng: Optional[float] = None
    estado: OrderStatus = OrderStatus.PENDIENTE
    total: float = 0.0
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
    
    # Extra fields for list view
    negocio_nombre: Optional[str] = None
    negocio_logo: Optional[str] = None
    mesero_nombre: Optional[str] = None
    numero_secuencial: Optional[int] = None
    # Multi-branch: enriched by the unified kitchen endpoint
    sede_nombre: Optional[str] = None
    sede_slug: Optional[str] = None


# Analytics Models
class DailyStats(BaseModel):
    fecha: str
    total_pedidos: int
    total_ventas: float
    pedidos_completados: int
    pedidos_cancelados: int


class BusinessAnalytics(BaseModel):
    ventas_hoy: float
    pedidos_hoy: int
    pedidos_activos: int
    mesas_ocupadas: int
    mesas_totales: int
    productos_agotados: int
    clientes_nuevos_hoy: int = 0
    puntos_otorgados_hoy: int = 0
    mensajes_enviados_hoy: int = 0
    domicilios_hoy: int = 0
    # Campos Históricos (Totales)
    ventas_total: float = 0
    pedidos_total: int = 0
    domicilios_total: int = 0
    clientes_total: int = 0
    puntos_total: int = 0
    mensajes_total: int = 0
    ticket_promedio_total: float = 0
    ultimos_7_dias: List[DailyStats]


class MonthlyAnalytics(BaseModel):
    ventas_mes: float
    pedidos_mes: int
    domicilios_mes: int
    ticket_promedio_mes: float
    clientes_nuevos_mes: int
    puntos_otorgados_mes: int
    mensajes_enviados_mes: int
    mesas_ocupadas: int
    mesas_totales: int


# WhatsApp Config
class WhatsAppConfig(BaseModel):
    negocio_id: str
    access_token: Optional[str] = None
    phone_number_id: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    mensaje_bienvenida: str = "¡Hola! Bienvenido a {negocio}. Escribe 'menu' para ver nuestro menú."
    is_configured: bool = False


# Auth Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    business: BusinessPublic


class EmployeeTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee: Employee



# Loyalty Program Models
class LoyaltyConfigBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    activo: bool = False
    pesos_por_punto: int = 0  # Cuantos pesos equivalen a 1 punto (0 = no configurado)
    puntos_minimo_canje: int = 0  # Minimo de puntos para canjear
    valor_punto_descuento: int = 0  # Cuantos pesos vale 1 punto al canjear
    nivel_bronce_min: int = 0  # Puntos mínimos para nivel Bronce
    nivel_plata_min: int = 300  # Puntos mínimos para nivel Plata
    nivel_oro_min: int = 1000  # Puntos mínimos para nivel Oro


class LoyaltyConfigCreate(LoyaltyConfigBase):
    pass


class LoyaltyConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    activo: Optional[bool] = None
    pesos_por_punto: Optional[int] = None
    puntos_minimo_canje: Optional[int] = None
    valor_punto_descuento: Optional[int] = None
    nivel_bronce_min: Optional[int] = None
    nivel_plata_min: Optional[int] = None
    nivel_oro_min: Optional[int] = None


class LoyaltyConfig(LoyaltyConfigBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    created_at: datetime = Field(default_factory=get_utc_now)


# Customer Loyalty Points
class CustomerPoints(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    telefono: str  # Identificador del cliente
    nombre: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    puntos_totales: int = 0
    puntos_actuales: int = 0
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class CustomerCreate(BaseModel):
    nombre: str
    telefono: str
    email: Optional[str] = None
    fecha_nacimiento: Optional[str] = None


class CustomerPointsPublic(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    email: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    puntos_actuales: int
    puntos_disponibles: int
    puntos_totales: int
    puntos_canjeados: int = 0
    total_compras: float = 0.0
    cantidad_pedidos: int = 0
    visit_context: Optional[str] = None
    created_at: Optional[datetime] = None


# Points Transaction History
class PointsTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    negocio_id: str
    telefono: str
    tipo: str  # "ganado", "canjeado"
    puntos: int
    pedido_id: Optional[str] = None
    descripcion: str
    created_at: datetime = Field(default_factory=get_utc_now)


class RedeemPointsRequest(BaseModel):
    telefono: str
    puntos_a_canjear: int


class AwardPointsRequest(BaseModel):
    telefono: str
    puntos: int
    descripcion: Optional[str] = None
    monto: Optional[float] = None


class RedeemPointsResponse(BaseModel):
    exito: bool
    mensaje: str
    descuento_aplicado: float
    puntos_restantes: int
# Premium Menu Models
class MenuItemBase(BaseModel):
    negocio_id: str
    name: str
    description: Optional[str] = None
    base_price: Optional[float] = 0.0
    currency: str = "COP"
    category: Optional[str] = None
    image_url: Optional[str] = None
    etiqueta: Optional[str] = None
    is_recommended: bool = False
    precio_original: Optional[float] = None
    oferta_porcentaje: Optional[int] = None
    is_spicy: bool = False
    is_vegan: bool = False
    is_vegetarian: bool = False
    is_gluten_free: bool = False
    allergens: List[str] = []
    prep_time_minutes: Optional[int] = None
    available: bool = True
    available_from: Optional[str] = None  # Using str for time compatibility
    available_to: Optional[str] = None
    notes: Optional[str] = None
    
    # Nutrición (IA)
    nutri_kcal: Optional[int] = None
    nutri_proteina: Optional[str] = None
    nutri_carbohidratos: Optional[str] = None
    nutri_grasa: Optional[str] = None
    
    # Modificadores (JSON/JSONB compatibility)
    modificadores: Optional[List[Dict[str, Any]]] = None
    tamanos: Optional[List[Dict[str, Any]]] = None
    opciones: Optional[List[Dict[str, Any]]] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class MenuItemOptionBase(BaseModel):
    menu_item_id: str
    type: str           # "size", "extra", "cooking", "side"
    name: str
    price_delta: float = 0.0
    is_default: bool = False
    max_per_order: Optional[int] = None

class MenuItemOptionCreate(MenuItemOptionBase) :
    pass

class MenuItemOption(MenuItemOptionBase):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)

class MenuItemTagBase(BaseModel):
    menu_item_id: str
    tag: str

class MenuItemTagCreate(MenuItemTagBase):
    pass

class MenuItemTag(MenuItemTagBase):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)

class MarketingAISuggestionRequest(BaseModel):
    current_message: Optional[str] = ""
    segment_id: str
    segment_name: str
    segment_desc: str
    tone: Optional[str] = "amigable y profesional"

# --- NEW ARCHITECTURE MODELS (Multi-Sede, Catalog, Inventory, Loyalty) ---

class BrandBase(BaseModel):
    nombre: str
    slug: str
    logo_url: Optional[str] = None
    configuracion_global: Optional[Dict[str, Any]] = {}

class BrandCreate(BrandBase):
    pass

class Brand(BrandBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class GlobalCategoryBase(BaseModel):
    brand_id: str
    nombre: str
    orden: int = 0

class GlobalCategoryCreate(GlobalCategoryBase):
    pass

class GlobalCategory(GlobalCategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class GlobalProductBase(BaseModel):
    brand_id: str
    category_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    imagen: Optional[str] = None

class GlobalProductCreate(GlobalProductBase):
    pass

class GlobalProduct(GlobalProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class SedeProductBase(BaseModel):
    sede_id: str
    global_product_id: str
    activo: bool = True
    disponible: bool = True
    precio_local: Optional[float] = None
    config_adicional: Optional[Dict[str, Any]] = {}

class SedeProductCreate(SedeProductBase):
    pass

class SedeProduct(SedeProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class GlobalIngredientBase(BaseModel):
    brand_id: str
    nombre: str
    unidad_medida: str

class GlobalIngredientCreate(GlobalIngredientBase):
    pass

class GlobalIngredient(GlobalIngredientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class GlobalRecipeBase(BaseModel):
    global_product_id: str
    nombre: Optional[str] = None

class GlobalRecipeCreate(GlobalRecipeBase):
    pass

class GlobalRecipe(GlobalRecipeBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class RecipeIngredientBase(BaseModel):
    recipe_id: str
    global_ingredient_id: str
    cantidad: float

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredient(RecipeIngredientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class SedeInventoryBase(BaseModel):
    sede_id: str
    global_ingredient_id: str
    stock_actual: float = 0.0
    stock_minimo: float = 0.0
    costo_unitario: float = 0.0

class SedeInventoryCreate(SedeInventoryBase):
    pass

class SedeInventory(SedeInventoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class InventoryTransactionBase(BaseModel):
    sede_id: str
    global_ingredient_id: str
    tipo: str # 'entrada', 'venta', 'merma', 'ajuste', 'reverso_cancelacion'
    cantidad: float
    reference_id: Optional[str] = None
    notas: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransaction(InventoryTransactionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)

class LoyaltyAccountBase(BaseModel):
    brand_id: str
    telefono: str
    nombre: Optional[str] = None
    email: Optional[str] = None
    puntos_totales: int = 0
    puntos_actuales: int = 0

class LoyaltyAccountCreate(LoyaltyAccountBase):
    pass

class LoyaltyAccount(LoyaltyAccountBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class LoyaltyTransactionBase(BaseModel):
    account_id: str
    sede_id: Optional[str] = None
    tipo: str
    puntos: int
    reference_id: Optional[str] = None
    descripcion: Optional[str] = None

class LoyaltyTransactionCreate(LoyaltyTransactionBase):
    pass

class LoyaltyTransaction(LoyaltyTransactionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=get_utc_now)


# ============================================================
# CATALOG RESPONSE MODELS (Multi-Sede Enriched Menu)
# ============================================================

class SedeMenuItemResponse(BaseModel):
    """
    DTO de salida del endpoint GET /menu-items/{slug}.
    Combina global_products (catálogo maestro) con los overrides de sede_products.
    El campo 'id' corresponde al global_product_id para mantener compatibilidad
    con el motor de inventario (process_inventory_for_order).
    """
    model_config = ConfigDict(extra="ignore")
    # Identity
    id: str                              # = global_products.id  (crucial para motor de inventario)
    sede_product_id: Optional[str] = None  # = sede_products.id  (para gestión desde el admin)
    # Catalog master data
    nombre: str
    descripcion: Optional[str] = None
    imagen: Optional[str] = None
    category_id: Optional[str] = None
    category_nombre: Optional[str] = None
    # Pricing (override local tiene prioridad)
    precio_base: float
    precio_local: Optional[float] = None   # Si no es None, este es el precio vigente para la sede
    precio_vigente: float                  # precio_local ?? precio_base (calculado en el backend)
    # Availability flags (controlled per-sede)
    activo: bool = True
    disponible: bool = True
    # Extended local config (from sede_products.config_adicional)
    modificadores: Optional[List[Dict[str, Any]]] = None
    tamanos: Optional[List[Dict[str, Any]]] = None
    opciones: Optional[List[Dict[str, Any]]] = None
    etiqueta: Optional[str] = None
    is_recommended: bool = False
    is_spicy: bool = False
    is_vegan: bool = False
    is_vegetarian: bool = False
    is_gluten_free: bool = False
    allergens: List[str] = []
    prep_time_minutes: Optional[int] = None
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class GlobalProductCreate(BaseModel):
    """Request body para crear un producto en el catálogo maestro."""
    brand_id: str
    category_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    imagen: Optional[str] = None


class GlobalProductUpdate(BaseModel):
    """Request body para actualizar campos del catálogo maestro."""
    model_config = ConfigDict(extra="ignore")
    category_id: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_base: Optional[float] = None
    imagen: Optional[str] = None


class SedeProductUpsert(BaseModel):
    """
    Request body para activar/configurar un producto global en una sede.
    Si el registro no existe para (sede_id, global_product_id), se crea.
    Si existe, se actualiza (upsert).
    """
    global_product_id: str
    activo: Optional[bool] = True
    disponible: Optional[bool] = True
    precio_local: Optional[float] = None
    # Config adicional extendida (modificadores, etiquetas, alérgenos, etc.)
    config_adicional: Optional[Dict[str, Any]] = {}


class GlobalCategoryCreate(BaseModel):
    """Request body para crear una categoría en el catálogo maestro."""
    brand_id: str
    nombre: str
    orden: int = 0


class GlobalCategoryUpdate(BaseModel):
    """Request body para actualizar una categoría."""
    nombre: Optional[str] = None
    orden: Optional[int] = None

