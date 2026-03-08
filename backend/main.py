from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Any
from pydantic import BaseModel
import models, schemas, crud, security
from database import engine, get_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import pandas as pd
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import ml_core, gemini_assistant

# Crear tablas automáticamente (Especial para SQLite local)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API El Grano de Oro", description="Gestión de tienda, usuarios e IA Automática")

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    duration = datetime.now() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration}")
    return response

# --- CORS ---
origins = [
    "http://localhost:5173",
    "https://elgranodeorocondockerpruebas.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- SCHEDULER ---
def scheduled_retrain_job():
    logger.info("🔄 [AUTO-SCHEDULER] Ejecutando reentrenamiento semanal...")
    try:
        ml_core.train_model() 
        logger.info("✅ [AUTO-SCHEDULER] Modelo actualizado correctamente.")
    except Exception as e:
        logger.error(f"❌ [AUTO-SCHEDULER] Error entrenando: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_retrain_job, 'interval', weeks=1)
scheduler.start()

# --- ESQUEMAS ---
class OrderItemSchema(BaseModel):
    id: int
    name: str
    qty: int
    price: float

class OrderSchema(BaseModel):
    user: str
    total: float
    items: List[OrderItemSchema]
    address: str
    save_card: Optional[bool] = False
    card_info: Optional[schemas.CreditCardCreate] = None

class InteractionSchema(BaseModel):
    product_id: int = None
    action_type: str

class ChatRequest(BaseModel):
    message: str

class StockUpdate(BaseModel):
    stock: int

class BulkStockItem(BaseModel):
    id: int
    stock: int

class BulkStockRequest(BaseModel):
    updates: List[BulkStockItem]

# --- DEPENDENCIAS DE SEGURIDAD ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except Exception:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere ser Administrador")
    return current_user

# --- AUTH Y LOGIN ---
@app.post("/users/", response_model=schemas.UserResponse, tags=["Usuarios"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role="user")
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception:
        raise HTTPException(status_code=400, detail="El email ya existe")
    return db_user

@app.post("/token", tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "email": user.email
    }

# --- PRODUCTOS ---
@app.get("/products/", response_model=List[schemas.ProductResponse], tags=["Productos"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.post("/products/", response_model=schemas.ProductResponse, tags=["Productos"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.delete("/products/{product_id}", tags=["Productos"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.query(models.Interaction).filter(models.Interaction.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado"}

# --- TARJETAS ---
@app.get("/cards", response_model=List[schemas.CreditCardResponse], tags=["Pagos"])
def get_user_cards(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.CreditCard).filter(models.CreditCard.user_id == user.id).all()

@app.post("/cards", response_model=schemas.CreditCardResponse, tags=["Pagos"])
def save_card(card: schemas.CreditCardCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_card = models.CreditCard(
        user_id=user.id,
        card_holder=card.card_holder,
        last_four=card.last_four,
        exp_month=card.exp_month,
        exp_year=card.exp_year,
        brand=card.brand,
        token=card.token
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@app.delete("/cards/{card_id}", tags=["Pagos"])
def delete_card(card_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(models.CreditCard).filter(models.CreditCard.id == card_id, models.CreditCard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    db.delete(card)
    db.commit()
    return {"message": "Tarjeta eliminada"}

# --- CHECKOUT ---
@app.post("/checkout", tags=["Ventas"])
def checkout(order: OrderSchema, db: Session = Depends(get_db)):
    # 1. Verificar Stock
    for item in order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if not db_product or db_product.stock < item.qty:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {item.name}")
        db_product.stock -= item.qty

    # 2. Simular Pago (MOCK)
    if order.card_info:
        # Lógica de prueba: si empieza por 4242 es OK
        if not order.card_info.last_four.endswith("42"):
            # En un sistema real aquí fallaría el cargo
            logger.info(f"Pago simulado fallido para tarjeta: {order.card_info.last_four}")
            # Pero para el proyecto, dejaremos que pase si no es 4242 (puedes cambiar esto para fallos manuales)
            pass
        
        # 3. Guardar Tarjeta si se solicita
        if order.save_card:
            user = db.query(models.User).filter(models.User.email == order.user).first()
            if user:
                # Evitar duplicados simples
                exists = db.query(models.CreditCard).filter(models.CreditCard.user_id == user.id, models.CreditCard.last_four == order.card_info.last_four).first()
                if not exists:
                    db_card = models.CreditCard(
                        user_id=user.id, card_holder=order.card_info.card_holder,
                        last_four=order.card_info.last_four, exp_month=order.card_info.exp_month,
                        exp_year=order.card_info.exp_year, brand=order.card_info.brand,
                        token=order.card_info.token
                    )
                    db.add(db_card)

    # 4. Crear Pedido
    items_str = ", ".join([f"{i.qty}x {i.name}" for i in order.items])
    db_order = models.Order(
        user_email=order.user,
        total=order.total,
        items_summary=items_str,
        address=order.address,
        status="pending",
        date=datetime.utcnow() 
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return {"message": "Venta exitosa", "order_id": db_order.id}

# --- ADMIN ROUTES ---
@app.get("/admin/orders", response_model=List[Any], tags=["Admin"])
def get_admin_orders(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [{
        "id": o.id, "user": o.user_email, "total": o.total, "date": o.date,
        "items": o.items_summary, "address": o.address, "status": o.status
    } for o in orders]

@app.put("/admin/products/stock/bulk", tags=["Admin"])
def update_bulk_stock(data: BulkStockRequest, admin: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    for item in data.updates:
        product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if product: product.stock = item.stock
    db.commit()
    return {"message": "Stock actualizado masivamente"}

@app.get("/admin/ai-insights", tags=["Admin"])
def get_ai_insights(db: Session = Depends(get_db)):
    from ml_core import generate_business_insights
    return generate_business_insights(db)

# --- IA Y CHAT ---
@app.post("/chat", tags=["IA"])
async def chat_with_barista(request: ChatRequest):
    response = gemini_assistant.get_barista_response(request.message)
    return {"reply": response}

@app.get("/recommendations/", response_model=List[schemas.ProductResponse], tags=["IA"])
def get_recommendations_route(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not user_id:
        return db.query(models.Product).filter(models.Product.stock > 0).limit(4).all()
    rec_ids = ml_core.get_recommendations(user_id, db)
    return db.query(models.Product).filter(models.Product.id.in_(rec_ids), models.Product.stock > 0).all()

# --- EMAILS Y ALERTAS ---
MAILTRAP_USER = "5f6569de0cb0aa" 
MAILTRAP_PASS = "874209eb9cb322"

def send_stock_alert_email(low_stock_products):
    msg = MIMEMultipart()
    msg['From'] = 'sistema@elgranodeoro.com'; msg['To'] = 'admin@elgranodeoro.com'
    msg['Subject'] = "🚨 ALERTA: Reposición de Stock Necesaria"
    items = "\n".join([f"• {p.name}: {p.stock} uds" for p in low_stock_products])
    msg.attach(MIMEText(f"Productos bajo mínimos:\n\n{items}", 'plain'))
    try:
        with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
            server.login(MAILTRAP_USER, MAILTRAP_PASS)
            server.send_message(msg)
    except Exception as e: logger.error(f"Error email: {e}")

@app.get("/check-low-stock")
def check_low_stock(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    low_stock_items = db.query(models.Product).filter(models.Product.stock < 5).all()
    if low_stock_items:
        background_tasks.add_task(send_stock_alert_email, low_stock_items)
        return {"message": "Alerta procesada", "count": len(low_stock_items)}
    return {"message": "Stock correcto", "count": 0}
