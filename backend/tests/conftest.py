import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app

# Importamos todos los modelos explícitamente para que SQLAlchemy los registre en Base.metadata
import models

# Usamos una base de datos SQLite en memoria con StaticPool para que persista entre conexiones
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Fixture para crear una base de datos limpia para cada test."""
    # Crear las tablas en la base de datos de prueba
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Sobrescribir la dependencia get_db en FastAPI
    def override_get_db():
        try:
            yield db
        finally:
            # En tests no cerramos aquí para evitar problemas con SQLite en memoria
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield db
    
    # Limpiar después del test
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()
