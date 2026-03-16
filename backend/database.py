from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# CONFIGURACIÓN DE BASE DE DATOS
# En Render, usamos un Persistent Disk para que los datos sobrevivan los redeploys.
# En local, el archivo se guarda en la carpeta backend/.
if os.getenv("RENDER"):
    _DB_DIR = "/opt/render/project/data"
    os.makedirs(_DB_DIR, exist_ok=True)
    _default_db = f"sqlite:///{_DB_DIR}/elgranodeoro.db"
else:
    _default_db = "sqlite:///./elgranodeoro.db"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

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
