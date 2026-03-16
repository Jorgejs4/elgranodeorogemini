from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# ==========================
# ESQUEMAS DE PRODUCTOS
# ==========================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    stock: int = 10
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass 

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================
# ESQUEMAS DE USUARIOS
# ==========================
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)

# Alias para compatibilidad con main.py
UserResponse = User

# ==========================
# ESQUEMAS DE TARJETAS
# ==========================
class CreditCardBase(BaseModel):
    card_holder: str
    last_four: str
    exp_month: str
    exp_year: str
    brand: str

class CreditCardCreate(CreditCardBase):
    token: str # En producción esto vendría de Stripe/PayPal

class CreditCardResponse(CreditCardBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================
# ESQUEMAS DE INTERACCIONES
# ==========================
class InteractionBase(BaseModel):
    user_id: int
    product_id: int
    action: str 

class InteractionCreate(InteractionBase):
    pass

class Interaction(InteractionBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# --- ESQUEMAS DE RESEÑAS ---
class ReviewCreate(BaseModel):
    product_id: int
    user_name: str
    rating: int
    comment: str

class ReviewResponse(ReviewCreate):
    id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)


InteractionResponse = Interaction

# --- ESQUEMAS DEL CARRITO ---
class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItemResponse(CartItemBase):
    id: int
    product: ProductResponse
    model_config = ConfigDict(from_attributes=True)

class SyncCartRequest(BaseModel):
    items: List[CartItemCreate]
