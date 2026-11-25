from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from models import generate_id, get_utc_now

# Client Models
class ClienteBase(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    fecha_nacimiento: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    pin: Optional[str] = None
    recovery_method: Optional[str] = None
    pin_hint: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class Cliente(ClienteBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    pin: Optional[str] = None
    recovery_method: Optional[str] = None
    pin_hint: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: Optional[datetime] = None

# Address Models
class AddressBase(BaseModel):
    nombre: str
    direccion: str
    ciudad: Optional[str] = None
    es_principal: bool = False
    referencia: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    es_principal: Optional[bool] = None
    referencia: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class Address(AddressBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    cliente_id: str
    created_at: datetime = Field(default_factory=get_utc_now)

# Auth Request Models
class OTPRequest(BaseModel):
    telefono: str
    negocio_slug: Optional[str] = None
    negocio_nombre: Optional[str] = None

class OTPVerify(BaseModel):
    telefono: str
    otp: str

class PINLogin(BaseModel):
    telefono: str
    pin: str

class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None # Optional if they logged in via OTP
    new_password: str

class UpdatePINRequest(BaseModel):
    pin: str
    recovery_method: str # 'hint' or 'question'
    pin_hint: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class ResetPINRequest(BaseModel):
    telefono: str
    answer: Optional[str] = None
    new_pin: str

class RecoveryInfo(BaseModel):
    method: str
    hint: Optional[str] = None
    question: Optional[str] = None

class ClientTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    cliente: Cliente
