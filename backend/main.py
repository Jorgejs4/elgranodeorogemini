from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Any
from pydantic import BaseModel
import models, schemas, crud, security
from database import engine, get_db, SessionLocal
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import pandas as pd
import logging
import random
import os
import json
import httpx
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
import ml_core, gemini_assistant
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

# --- CONFIGURACIÓN DE LOGGING (Sin Emojis para Windows) ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")]
)
logger = logging.getLogger("api_grano_oro")

# Crear tablas automáticamente (Especial para SQLite local)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API El Grano de Oro", description="Gestion de tienda, usuarios e IA Automatica")

@app.api_route("/health", methods=["GET", "HEAD"], tags=["Sistema"])
def health_check():
    return {"status": "online", "timestamp": datetime.now(timezone.utc)}

# --- EVENTO DE ARRANQUE (Auto-Seed y Admin) ---
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando servidor y verificando base de datos...")
    db = next(get_db())
    try:
        # 1. Crear Admin Maestro si no existe
        admin_email = "admin@admin.com"
        exists = db.query(models.User).filter(models.User.email == admin_email).first()
        if not exists:
            # Usamos un hash manual o aseguramos que el password sea corto
            hashed_pwd = security.get_password_hash("admin123")
            admin_user = models.User(email=admin_email, hashed_password=hashed_pwd, role="admin")
            db.add(admin_user)
            logger.info(f"Usuario admin creado: {admin_email} / admin123")
        
        # 2. Auto-llenar productos si esta vacio
        prod_count = db.query(models.Product).count()
        if prod_count == 0:
            logger.info("Base de datos vacia. Iniciando auto-seed...")
            from seed import seed_data
            seed_data(db)
            logger.info("Productos inyectados correctamente.")

        # 3. Generar Interacciones para la IA si no hay ninguna (Simulacion de Mercado)
        int_count = db.query(models.Interaction).count()
        if int_count == 0:
            logger.info("Generando interacciones simuladas para la IA...")
            products = db.query(models.Product).all()
            if products:
                actions = ["view", "add_to_cart", "purchase"]
                for _ in range(200):
                    p = random.choice(products)
                    action = random.choices(actions, weights=[70, 20, 10])[0]
                    h = random.randint(8, 22)
                    ts = datetime.now(timezone.utc).replace(hour=h)
                    db.add(models.Interaction(user_id=1, product_id=p.id, action_type=action, timestamp=ts))
                db.commit()
                ml_core.train_model(db)
                logger.info("Interacciones y modelo IA listos.")
        
        db.commit()
    except Exception as e:
        logger.error(f"Error en el arranque: {str(e)}")
    finally:
        db.close()

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    duration = datetime.now() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration}")
    return response

# --- CORS ---
frontend_url = os.getenv("FRONTEND_URL", "").strip()
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://elgranodeorocondockerpruebas.onrender.com",
    "https://elgranodeorogemini.vercel.app",
    "https://elgranodeorogemini.onrender.com"
]

if frontend_url:
    origins.append(frontend_url)
    # Si la URL tiene barra final, añadir también la versión sin barra
    if frontend_url.endswith("/"):
        origins.append(frontend_url[:-1])
    else:
        origins.append(frontend_url + "/")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- SCHEDULER ---
def scheduled_retrain_job():
    logger.info("[AUTO-SCHEDULER] Ejecutando reentrenamiento semanal...")
    try:
        db = SessionLocal()
        ml_core.train_model(db)
        db.close()
        logger.info("[AUTO-SCHEDULER] Modelo actualizado correctamente.")
    except Exception as e:
        logger.error(f"[AUTO-SCHEDULER] Error entrenando: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_retrain_job, 'interval', weeks=1)
scheduler.start()

# --- ESQUEMAS ---
class OrderItemSchema(BaseModel):
    id: int; name: str; qty: int; price: float

class OrderSchema(BaseModel):
    user: str; total: float; items: List[OrderItemSchema]; address: str
    save_card: Optional[bool] = False; card_info: Optional[schemas.CreditCardCreate] = None

class InteractionSchema(BaseModel):
    product_id: int = None; action_type: str

class ChatRequest(BaseModel):
    message: str

class StockUpdate(BaseModel):
    stock: int

class BulkStockItem(BaseModel):
    id: int; stock: int

class BulkStockRequest(BaseModel):
    updates: List[BulkStockItem]

# --- SEGURIDAD ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None: raise HTTPException(status_code=401, detail="Token invalido")
    except Exception: raise HTTPException(status_code=401, detail="No autorizado")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None: raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Acceso denegado: Admin requerido")
    return current_user

# --- ENDPOINTS ---
@app.post("/users/", response_model=schemas.UserResponse, tags=["Usuarios"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role="user")
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception: raise HTTPException(status_code=400, detail="El email ya existe")
    return db_user

@app.post("/token", tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id, "email": user.email}


@app.get("/products/", response_model=List[schemas.ProductResponse], tags=["Productos"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.post("/cards", response_model=schemas.CreditCardResponse, tags=["Pagos"])
def save_card(card: schemas.CreditCardCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_card = models.CreditCard(user_id=user.id, card_holder=card.card_holder, last_four=card.last_four, exp_month=card.exp_month, exp_year=card.exp_year, brand=card.brand, token=card.token)
    db.add(db_card); db.commit(); db.refresh(db_card); return db_card

@app.get("/cards", response_model=List[schemas.CreditCardResponse], tags=["Pagos"])
def get_user_cards(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.CreditCard).filter(models.CreditCard.user_id == user.id).all()

@app.post("/admin/products", response_model=schemas.ProductResponse, tags=["Admin"])
def create_product(product: schemas.ProductCreate, admin: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/admin/products/{product_id}", tags=["Admin"])
def delete_product(product_id: int, admin: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado"}

@app.post("/track", tags=["IA"])
def track_interaction(interaction: InteractionSchema, db: Session = Depends(get_db)):
    # Usamos user_id=1 (o una lógica de sesión/IP) para usuarios no logueados
    db_interaction = models.Interaction(user_id=1, product_id=interaction.product_id, action_type=interaction.action_type, timestamp=datetime.now(timezone.utc))
    db.add(db_interaction)
    db.commit()
    return {"status": "ok"}

@app.post("/checkout", tags=["Ventas"])
def checkout(order: OrderSchema, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 0. Validar campos obligatorios
    addr = (order.address or "").strip()
    if not addr or addr.replace(",", "").replace(" ", "") == "":
        raise HTTPException(status_code=400, detail="La dirección de envío es obligatoria")
    if not order.card_info:
        raise HTTPException(status_code=400, detail="Debes seleccionar un método de pago")

    # 1. Verificar stock y restar
    low_stock_triggered = False
    # Obtener usuario UNA sola vez
    db_user = db.query(models.User).filter(models.User.email == order.user).first()
    user_id = db_user.id if db_user else 1

    for item in order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if not db_product or db_product.stock < item.qty:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente: {item.name}")
        db_product.stock -= item.qty
        if db_product.stock < 5:
            low_stock_triggered = True
        # Alimentar IA
        db.add(models.Interaction(user_id=user_id, product_id=item.id, action_type="purchase", timestamp=datetime.now(timezone.utc)))

    # 2. Guardar tarjeta si se solicita
    if order.card_info and order.save_card and db_user:
        exists = db.query(models.CreditCard).filter(
            models.CreditCard.user_id == db_user.id,
            models.CreditCard.last_four == order.card_info.last_four
        ).first()
        if not exists:
            db.add(models.CreditCard(
                user_id=db_user.id,
                card_holder=order.card_info.card_holder,
                last_four=order.card_info.last_four,
                exp_month=order.card_info.exp_month,
                exp_year=order.card_info.exp_year,
                brand=order.card_info.brand,
                token=order.card_info.token
            ))

    # 3. Crear el pedido
    items_str = ", ".join([f"{i.qty}x {i.name}" for i in order.items])
    db_order = models.Order(
        user_email=order.user,
        total=order.total,
        items_summary=items_str,
        address=order.address,
        status="pending",
        date=datetime.now(timezone.utc)
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 4. Tareas de fondo: email, stock alert y reentrenamiento IA (no bloquea la respuesta)
    background_tasks.add_task(send_order_confirmation_email, order.user, db_order.id, items_str, order.total, order.address)
    if low_stock_triggered:
        low_items = db.query(models.Product).filter(models.Product.stock < 5).all()
        background_tasks.add_task(send_stock_alert_email, low_items)
    background_tasks.add_task(_retrain_model_bg)

    return {"message": "Venta exitosa", "order_id": db_order.id}

def _retrain_model_bg():
    """Reentrenar modelo IA en segundo plano sin bloquear la respuesta al cliente."""
    try:
        db = SessionLocal()
        ml_core.train_model(db)
        db.close()
    except Exception as e:
        logger.error(f"Error IA background: {e}")

# --- SISTEMA DE EMAILS ---
SMTP_HOST = os.getenv("SMTP_HOST", "sandbox.smtp.mailtrap.io")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

def send_order_confirmation_email(user_email: str, order_id: int, items: str, total: float, address: str = ""):
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return
    msg = MIMEMultipart("alternative")
    msg['From'] = 'tienda@elgranodeoro.com'
    msg['To'] = user_email
    msg['Subject'] = f"Confirmacion de Pedido #{order_id} - El Grano de Oro"
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; border: 1px solid #d4af37; padding: 40px;">
        <h1 style="color: #d4af37; text-align: center; font-size: 28px;">El Grano de Oro</h1>
        <p style="text-align: center; color: #888; font-size: 12px; letter-spacing: 3px;">TOSTADORES DESDE 1920</p>
        <hr style="border: 1px solid #333; margin: 20px 0;">
        <h2 style="color: #fff;">Pedido #{order_id} Confirmado</h2>
        <p style="color: #ccc;">Hola, gracias por tu compra en El Grano de Oro.</p>
        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="color: #d4af37; font-weight: bold; font-size: 12px; letter-spacing: 2px;">PRODUCTOS</p>
          <p style="color: #eee;">{items}</p>
          <hr style="border: 1px solid #333;">
          <p style="color: #d4af37; font-weight: bold; font-size: 12px; letter-spacing: 2px;">DIRECCION DE ENVIO</p>
          <p style="color: #eee;">{address or 'No especificada'}</p>
          <hr style="border: 1px solid #333;">
          <p style="color: #d4af37; font-weight: bold; font-size: 12px; letter-spacing: 2px;">TOTAL</p>
          <p style="color: #fff; font-size: 24px; font-weight: bold;">{total:.2f} EUR</p>
        </div>
        <p style="color: #888;">Estamos preparando tu cafe con el maximo cuidado. Recibiras otro correo cuando el pedido sea enviado.</p>
        <p style="color: #888; margin-top: 30px; text-align: center; font-size: 11px;">El Equipo de El Grano de Oro</p>
      </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html_body, 'html'))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        logger.info(f"Email de confirmacion enviado a {user_email}")
    except Exception as e: logger.error(f"Error email cliente: {e}")

def send_stock_alert_email(low_stock_products):
    if not SMTP_USER or not SMTP_PASS:
        return
    msg = MIMEMultipart()
    msg['From'] = 'sistema@elgranodeoro.com'
    msg['To'] = os.getenv("ADMIN_EMAIL", "admin@elgranodeoro.com")
    msg['Subject'] = "ALERTA CRITICA: Stock Bajo"
    
    items_list = "\n".join([f"- {p.name} (ID: {p.id}): SOLO QUEDAN {p.stock} UDS" for p in low_stock_products])
    body = f"Los siguientes productos estan por debajo del minimo (5 uds):\n\n{items_list}\n\nPor favor, repon el inventario lo antes posible."
    
    msg.attach(MIMEText(body, 'plain'))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    except Exception as e: logger.error(f"Error email admin: {e}")

# --- RESTAURACIÓN DE ENDPOINTS FALTANTES ---

@app.get("/admin/orders", response_model=List[Any], tags=["Admin"])
def get_admin_orders(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [{"id": o.id, "user": o.user_email, "total": o.total, "date": o.date, "items": o.items_summary, "address": o.address, "status": o.status} for o in orders]

@app.put("/admin/products/stock/bulk", tags=["Admin"])
def update_bulk_stock(data: BulkStockRequest, admin: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    for item in data.updates:
        product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if product: product.stock = item.stock
    db.commit(); return {"message": "Stock actualizado"}

@app.post("/admin/simulate-activity", tags=["Admin"])
def simulate_activity(background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    """Inicia una simulación de mercado en segundo plano para evitar timeouts."""
    # Verificar que existan productos
    if db.query(models.Product).count() == 0:
        raise HTTPException(status_code=400, detail="No hay productos en la base de datos para simular actividad.")
    
    background_tasks.add_task(_run_simulation_bg)
    return {"message": "Simulación iniciada en segundo plano. Los datos aparecerán en unos instantes."}

def _run_simulation_bg():
    """Ejecuta la generación masiva de pedidos e interacciones sin bloquear el servidor."""
    import random
    from datetime import timedelta, datetime, timezone
    db = SessionLocal()
    try:
        # 1. Obtener productos existentes
        all_products = db.query(models.Product).all()
        if not all_products:
            return

        users = ["cliente1@test.com", "vip_coffee@aroma.es", "espresso_fan@grano.net", "invitado_demo@test.com", "coffee_lover@madrid.es"]
        statuses = ["pending", "shipped", "delivered"]
        
        # 2. Generar Ventas (50 Pedidos históricos)
        for _ in range(50):
            p = random.choice(all_products)
            days_ago = random.randint(0, 365)
            fake_date = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0,23), minutes=random.randint(0,59))
            
            qty = random.randint(1, 3)
            total = round(p.price * qty, 2)
            
            new_order = models.Order(
                user_email=random.choice(users),
                total=total,
                items_summary=f"{qty}x {p.name}",
                address="Av. de la Inteligencia Artificial 101, Madrid",
                status=random.choice(statuses),
                date=fake_date
            )
            db.add(new_order)

        # 3. Generar Interacciones masivas para la IA (200 eventos anuales)
        for _ in range(200):
            p = random.choice(all_products)
            days_ago = random.randint(0, 365)
            h = random.randint(0, 23)
            ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
            ts = ts.replace(hour=h)
            
            inter = models.Interaction(
                user_id=random.randint(1, 10),
                product_id=p.id,
                action_type=random.choice(["view", "add_to_cart", "purchase"]),
                timestamp=ts
            )
            db.add(inter)

        db.commit()
        
        # 4. RE-ENTRENAR IA
        try:
            import ml_core
            ml_core.train_model(db)
        except Exception as e:
            logger.error(f"Error IA tras simulacion bg: {e}")
            
    except Exception as e:
        logger.error(f"Error en simulacion background: {e}")
    finally:
        db.close()

@app.get("/admin/ai-insights", tags=["Admin"])
def get_ai_insights(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    from ml_core import generate_business_insights
    return generate_business_insights(db)

@app.post("/chat", tags=["IA"])
async def chat_with_barista(request: ChatRequest):
    response = gemini_assistant.get_barista_response(request.message)
    return {"reply": response}

@app.get("/recommendations/", response_model=List[schemas.ProductResponse], tags=["IA"])
def get_recommendations_route(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    from sqlalchemy import func
    if not user_id: 
        return db.query(models.Product).filter(models.Product.stock > 0).order_by(func.random()).limit(4).all()
    rec_ids = ml_core.get_recommendations(user_id, db)
    return db.query(models.Product).filter(models.Product.id.in_(rec_ids), models.Product.stock > 0).all()

@app.put("/admin/orders/{order_id}/shipped", tags=["Admin"])
def mark_order_as_shipped(order_id: int, admin: models.User = Depends(check_admin), db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order: raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = "shipped"
    db.commit()
    return {"message": "Pedido marcado como enviado"}

@app.get("/check-low-stock")
def check_low_stock(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    low_stock_items = db.query(models.Product).filter(models.Product.stock < 5).all()
    if low_stock_items:
        background_tasks.add_task(send_stock_alert_email, low_stock_items)
        return {"message": "Alerta procesada", "count": len(low_stock_items)}
    return {"message": "Stock correcto", "count": 0}

# --- ENDPOINTS DE RESEÑAS ---
@app.get("/products/{product_id}/reviews", response_model=List[schemas.ReviewResponse], tags=["Social"])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.product_id == product_id).order_by(models.Review.date.desc()).all()

@app.post("/reviews", response_model=schemas.ReviewResponse, tags=["Social"])
def post_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    db_review = models.Review(**review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

# --- ENDPOINTS DE CARRITO PERSISTENTE ---
@app.get("/cart", response_model=List[schemas.CartItemResponse], tags=["Carrito"])
def get_cart(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene el carrito guardado del usuario."""
    return db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()

@app.post("/cart/sync", tags=["Carrito"])
def sync_cart(data: schemas.SyncCartRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sobrescribe el carrito del usuario en la BD con el estado actual del frontend."""
    # 1. Eliminar el carrito anterior
    db.query(models.CartItem).filter(models.CartItem.user_id == user.id).delete()
    
    # 2. Guardar los nuevos items
    new_items = []
    for item in data.items:
        new_items.append(models.CartItem(user_id=user.id, product_id=item.product_id, quantity=item.quantity))
    
    if new_items:
        db.add_all(new_items)
        
    db.commit()
    return {"message": "Carrito sincronizado exitosamente"}

# =============================================
# --- PAGOS CON STRIPE ---
# =============================================
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

class StripeCheckoutRequest(BaseModel):
    items: List[OrderItemSchema]
    user_email: str
    address: str

@app.post("/create-checkout-session", tags=["Pagos"])
def create_stripe_checkout(data: StripeCheckoutRequest, db: Session = Depends(get_db)):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe no esta configurado. Añade STRIPE_SECRET_KEY en .env")
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        
        line_items = []
        for item in data.items:
            line_items.append({
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": item.name},
                    "unit_amount": int(item.price * 100),
                },
                "quantity": item.qty,
            })
        
        # Guardar datos del pedido en metadata para el webhook
        items_str = ", ".join([f"{i.qty}x {i.name}" for i in data.items])
        total = sum(i.price * i.qty for i in data.items)
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{FRONTEND_URL}/?payment=success",
            cancel_url=f"{FRONTEND_URL}/?payment=cancel",
            customer_email=data.user_email,
            metadata={
                "user_email": data.user_email,
                "address": data.address,
                "items_summary": items_str,
                "total": str(total),
            }
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stripe-webhook", tags=["Pagos"])
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        
        # Crear pedido
        db_order = models.Order(
            user_email=metadata.get("user_email", "stripe_customer"),
            total=float(metadata.get("total", 0)),
            items_summary=metadata.get("items_summary", ""),
            address=metadata.get("address", ""),
            status="pending",
            payment_method="stripe",
            payment_id=session.get("payment_intent", session.get("id")),
            date=datetime.now(timezone.utc)
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        background_tasks.add_task(
            send_order_confirmation_email,
            metadata.get("user_email", ""),
            db_order.id,
            metadata.get("items_summary", ""),
            float(metadata.get("total", 0)),
            metadata.get("address", "")
        )
        logger.info(f"Stripe payment completed: Order #{db_order.id}")
    
    return {"status": "ok"}

# =============================================
# --- PAGOS CON PAYPAL ---
# =============================================
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")

class PayPalOrderRequest(BaseModel):
    items: List[OrderItemSchema]
    user_email: str
    address: str
    total: float

async def get_paypal_access_token():
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        return None
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        return response.json().get("access_token")

@app.post("/create-paypal-order", tags=["Pagos"])
async def create_paypal_order(data: PayPalOrderRequest):
    if not PAYPAL_CLIENT_ID:
        raise HTTPException(status_code=500, detail="PayPal no esta configurado. Añade PAYPAL_CLIENT_ID en .env")
    token = await get_paypal_access_token()
    if not token:
        raise HTTPException(status_code=500, detail="No se pudo autenticar con PayPal")
    
    order_data = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": "EUR",
                "value": f"{data.total:.2f}"
            },
            "description": f"Pedido El Grano de Oro - {len(data.items)} productos"
        }]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            json=order_data,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        result = response.json()
    
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Error creando orden PayPal")
    
    return {"order_id": result["id"], "status": result["status"]}

@app.post("/capture-paypal-order", tags=["Pagos"])
async def capture_paypal_order(
    paypal_order_id: str,
    data: PayPalOrderRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    token = await get_paypal_access_token()
    if not token:
        raise HTTPException(status_code=500, detail="Error autenticando con PayPal")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        result = response.json()
    
    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail="El pago PayPal no se completo")
    
    # Restar stock
    for item in data.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if db_product:
            db_product.stock = max(0, db_product.stock - item.qty)
    
    items_str = ", ".join([f"{i.qty}x {i.name}" for i in data.items])
    db_order = models.Order(
        user_email=data.user_email,
        total=data.total,
        items_summary=items_str,
        address=data.address,
        status="pending",
        payment_method="paypal",
        payment_id=paypal_order_id,
        date=datetime.now(timezone.utc)
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    background_tasks.add_task(send_order_confirmation_email, data.user_email, db_order.id, items_str, data.total, data.address)
    
    return {"message": "Pago PayPal completado", "order_id": db_order.id}

# =============================================
# --- AUTENTICACIÓN CON GOOGLE ---
# =============================================
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

class GoogleAuthRequest(BaseModel):
    credential: str

@app.post("/auth/google", tags=["Auth"])
async def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Auth no esta configurado. Añade GOOGLE_CLIENT_ID en .env")
    
    try:
        # Validar el token con Google
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Token de Google invalido")
            
            google_data = response.json()
        
        email = google_data.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="No se pudo obtener el email de Google")
        
        # Verificar que el token es para nuestra app
        if google_data.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=401, detail="Token no valido para esta aplicacion")
        
        # Buscar o crear usuario
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            # Crear nuevo usuario con Google
            hashed_pwd = security.get_password_hash(os.urandom(32).hex())
            user = models.User(
                email=email,
                hashed_password=hashed_pwd,
                role="user",
                auth_provider="google"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Nuevo usuario Google creado: {email}")
        
        # Generar JWT
        access_token = security.create_access_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Error en autenticacion con Google")
