from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# CONFIGURACIÓN LOCAL: Usamos SQLite por defecto para evitar instalar PostgreSQL
# El archivo se guardará como 'elgranodeoro.db' en la carpeta backend/
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./elgranodeoro.db"
)

# Neon y otros proveedores a veces dan URLs con 'postgres://' (antiguo).
# SQLAlchemy 2.x require 'postgresql://' — corregimos automáticamente.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuración especial para SQLite (necesaria para hilos en FastAPI)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
