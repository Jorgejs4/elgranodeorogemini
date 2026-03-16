from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import logging

logger = logging.getLogger(__name__)

# CONFIGURACIÓN DE BASE DE DATOS
# Obtener la URL y limpiar espacios/comillas que puedan venir de variables de entorno mal configuradas
_raw_url = os.getenv("DATABASE_URL", "sqlite:///./elgranodeoro.db")
SQLALCHEMY_DATABASE_URL = _raw_url.strip().strip('"').strip("'")

# Neon y otros proveedores a veces dan URLs con 'postgres://' (antiguo).
# SQLAlchemy 2.x requiere 'postgresql://' — corregimos automáticamente.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Log parcial de la URL para debug (ocultamos la contraseña)
try:
    _debug_url = SQLALCHEMY_DATABASE_URL[:30] + "..." if len(SQLALCHEMY_DATABASE_URL) > 30 else SQLALCHEMY_DATABASE_URL
    logger.info(f"DATABASE_URL detectada: {_debug_url}")
    print(f"[DB] DATABASE_URL empieza por: {SQLALCHEMY_DATABASE_URL[:20]}...")
except Exception:
    pass

# Configuración especial para SQLite (necesaria para hilos en FastAPI)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Para PostgreSQL (Neon, etc.)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=10,          # Aumentamos el pool base
        max_overflow=20,       # Permitimos hasta 20 conexiones extras bajo demanda
        pool_timeout=30,       # Tiempo de espera antes de error
        pool_pre_ping=True,    # Reconectar si la conexión se corta (evita errores tras inactividad en Neon)
        pool_recycle=1800,     # Reciclar conexiones cada 30 min
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
