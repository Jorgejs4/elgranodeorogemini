from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 1. INTELIGENCIA:
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@localhost/elgranodeoro"
)

# 2. CREAR EL MOTOR (AQUÍ ESTÁ LA SOLUCIÓN)
if "neon.tech" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"sslmode": "require"},
        pool_pre_ping=True,  # <-- Comprueba si la conexión sigue viva antes de usarla
        pool_recycle=300     # <-- Recicla las conexiones cada 5 minutos (300 seg) para que no caduquen
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True   # Buena práctica tenerlo también en local
    )

# 3. CREAR LA SESIÓN
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. CREAR LA BASE
Base = declarative_base()

# 5. DEPENDENCIA
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()