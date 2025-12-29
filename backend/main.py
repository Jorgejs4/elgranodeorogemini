from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Any
from pydantic import BaseModel # Necesario para los esquemas del checkout
import models, schemas, crud, security
from database import engine, get_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- NUEVAS IMPORTACIONES PARA AUTOMATIZACIÓN E IA ---
import sqlite3
import pandas as pd
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import ml_core # Tu módulo de IA existente

# Crear tablas del sistema principal (Usuarios, Productos)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API El Grano de Oro", description="Gestión de tienda, usuarios e IA Automática")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- BASE DE DATOS ADICIONAL PARA PEDIDOS Y ESTADO IA (SQLite Directo) ---
# Usamos esto para no obligarte a modificar models.py ahora mismo
DB_FILE = "elgrano.db" # Usará la misma base de datos, pero conexión directa

def init_orders_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Tabla para guardar los pedidos que vienen del Frontend
    c.execute('''CREATE TABLE IF NOT EXISTS orders 
                 (id INTEGER PRIMARY KEY, user TEXT, total REAL, date TEXT, items TEXT)''')
    # Tabla para saber cuándo se entrenó la IA por última vez
    c.execute('''CREATE TABLE IF NOT EXISTS ai_status 
                 (last_trained TEXT, accuracy REAL)''')
    conn.commit()
    conn.close()

init_orders_db()

# --- SCHEDULER: EL RELOJ AUTOMÁTICO ---
def scheduled_retrain_job():
    print("🔄 [AUTO-SCHEDULER] Ejecutando reentrenamiento semanal...")
    try:
        # Aquí llamamos a tu lógica de entrenamiento
        ml_core.train_model() 
        
        # Actualizamos el estado
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM ai_status")
        c.execute("INSERT INTO ai_status VALUES (?, ?)", (datetime.now().isoformat(), 0.95)) # 0.95 simulado
        conn.commit()
        conn.close()
        print("✅ [AUTO-SCHEDULER] Modelo actualizado correctamente.")
    except Exception as e:
        print(f"❌ [AUTO-SCHEDULER] Error entrenando: {e}")

scheduler = BackgroundScheduler()
# Configurado para ejecutarse cada 1 semana. 
# NOTA: Si quieres probarlo rápido, cambia 'weeks=1' por 'seconds=60'
scheduler.add_job(scheduled_retrain_job, 'interval', weeks=1)
scheduler.start()

# --- ESQUEMAS PARA CHECKOUT (Pydantic) ---
# Definidos aquí para no tocar schemas.py
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

# --- GESTIÓN DE USUARIOS ---

@app.get("/users/", response_model=List[schemas.UserResponse], tags=["Usuarios"])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.User).offset(skip).limit(limit).all()

@app.delete("/users/{user_id}", tags=["Usuarios"])
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}

# --- GESTIÓN DE PRODUCTOS ---

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

# --- CHECKOUT Y PEDIDOS (NUEVO) ---
@app.post("/checkout", tags=["Ventas"])
def checkout(order: OrderSchema):
    """Guarda el pedido para que la IA pueda aprender de él"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Convertimos los items a string para guardarlos fácil en SQLite
    items_str = ", ".join([f"{i.qty}x {i.name}" for i in order.items])
    
    c.execute("INSERT INTO orders (user, total, date, items) VALUES (?, ?, ?, ?)",
              (order.user, order.total, datetime.now().isoformat(), items_str))
    
    conn.commit()
    conn.close()
    
    return {"message": "Pedido procesado y guardado para IA"}

@app.get("/ai-status", tags=["IA"])
def get_ai_status():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM ai_status")
    row = c.fetchone()
    conn.close()
    if row:
        return {"last_trained": row[0], "accuracy": row[1]}
    return {"status": "Aún no entrenado"}

# --- INTERACCIONES E IA ---

@app.post("/interactions/", response_model=schemas.InteractionResponse, tags=["Interacciones"])
def create_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
    return crud.create_interaction(db=db, interaction=interaction)

@app.get("/interactions/", response_model=List[schemas.InteractionResponse], tags=["Interacciones"])
def read_interactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Interaction).offset(skip).limit(limit).all()

@app.get("/recommendations/", response_model=List[schemas.ProductResponse], tags=["IA"])
def get_recommendations_route(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    import ml_core
    if not user_id:
        return db.query(models.Product).limit(4).all()
    rec_ids = ml_core.get_recommendations(user_id, db)
    return db.query(models.Product).filter(models.Product.id.in_(rec_ids)).all()

@app.post("/train", tags=["IA"])
def train_model(background_tasks: BackgroundTasks):
    """Entrenamiento manual forzado (además del automático)"""
    background_tasks.add_task(scheduled_retrain_job)
    return {"message": "Entrenamiento iniciado en segundo plano"}  

# --- SISTEMA DE CORREO (MAILTRAP) ---

# ¡¡¡PEGA AQUÍ TUS DATOS DE MAILTRAP!!!
MAILTRAP_USER = "5f6569de0cb0aa" 
MAILTRAP_PASS = "874209eb9cb322"

def send_stock_alert_email(low_stock_products):
    msg = MIMEMultipart()
    msg['From'] = 'sistema@elgranodeoro.com'
    msg['To'] = 'admin@elgranodeoro.com'
    msg['Subject'] = "🚨 ALERTA: Reposición de Stock Necesaria"

    # Construir la lista de productos
    cuerpo_items = ""
    for p in low_stock_products:
        cuerpo_items += f"• {p.name}: Quedan {p.stock} unidades\n"

    cuerpo = f"""
    Hola Administrador,
    
    Los siguientes productos están bajo mínimos (menos de 5 unidades):
    
    {cuerpo_items}
    
    Por favor, accede al panel de control para gestionar los pedidos.
    """
    
    msg.attach(MIMEText(cuerpo, 'plain'))

    try:
        # Usamos el servidor de Mailtrap
        with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
            server.login(MAILTRAP_USER, MAILTRAP_PASS)
            server.send_message(msg)
        print("✅ Correo de alerta enviado a Mailtrap")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")

@app.get("/check-low-stock")
def check_low_stock(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Buscamos productos con stock < 5
    low_stock_items = db.query(models.Product).filter(models.Product.stock < 5).all()
    
    if low_stock_items:
        # Usamos BackgroundTasks para que la web no se congele
        background_tasks.add_task(send_stock_alert_email, low_stock_items)
        return {"message": "Alerta procesada", "count": len(low_stock_items)}
    
    return {"message": "Stock correcto", "count": 0}