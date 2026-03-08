import random
from sqlalchemy.orm import Session
import models, security

# --- DATOS: PRODUCTOS ---
products_data = [
    {"name": "Etiopia Yirgacheffe", "description": "Notas florales y citricas.", "price": 18.50, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1611854779393-1b2ae9e07d73?w=500", "stock": 2},
    {"name": "Colombia Huila", "description": "Cuerpo medio, notas a caramelo.", "price": 16.00, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500", "stock": 4},
    {"name": "Brasil Santos", "description": "Baja acidez, muy dulce.", "price": 14.50, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500", "stock": 45},
    {"name": "Kenya AA", "description": "Intenso, con notas de frutos rojos.", "price": 22.00, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", "stock": 1},
    {"name": "Guatemala Antigua", "description": "Especiado y ahumado.", "price": 19.00, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1510707577719-5d6835698445?w=500", "stock": 12},
    {"name": "Sumatra Mandheling", "description": "Terroso y cuerpo pesado.", "price": 20.50, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1521302080334-4be99c3044a9?w=500", "stock": 8},
    {"name": "Costa Rica Tarrazu", "description": "Limpio y muy equilibrado.", "price": 17.50, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500", "stock": 3},
    {"name": "Espresso Italiano Blend", "description": "Mezcla robusta para espresso.", "price": 13.00, "category": "Cafe en Grano", "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500", "stock": 100},
    {"name": "Descafeinado Suizo", "description": "Proceso al agua, sin quimicos.", "price": 15.00, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1621262968392-4f3df757279e?w=500", "stock": 20},
    {"name": "Moka Java", "description": "La mezcla mas antigua del mundo.", "price": 16.50, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500", "stock": 4},
    {"name": "French Roast", "description": "Tueste oscuro, sabor ahumado.", "price": 14.00, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1504630083234-141a7a968a57?w=500", "stock": 15},
    {"name": "Breakfast Blend", "description": "Suave y ligero.", "price": 12.50, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500", "stock": 30},
    {"name": "Avellana Vainilla", "description": "Aromatizado naturalmente.", "price": 13.50, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", "stock": 2},
    {"name": "Pack Degustacion Molido", "description": "3 variedades de 250g cada una.", "price": 28.00, "category": "Cafe Molido", "image_url": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500", "stock": 10},
    {"name": "Chemex 6 Tazas", "description": "Diseno clasico de filtro.", "price": 48.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1544787210-2213d6429f36?w=500", "stock": 5},
    {"name": "Molinillo Hario Skerton", "description": "Muelas de ceramica.", "price": 35.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517080315802-196f1b1b22e1?w=500", "stock": 2},
    {"name": "Aeropress Original", "description": "Versatil y portatil.", "price": 32.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1524350300060-337ce2a057ba?w=500", "stock": 14},
    {"name": "Bascula de Precision", "description": "Con cronometro integrado.", "price": 22.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500", "stock": 0},
    {"name": "Tetera Cuello de Cisne", "description": "Control total del vertido.", "price": 40.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1565452347101-79b9ae7d121c?w=500", "stock": 6},
    {"name": "Juego Tazas Espresso", "description": "Ceramica doble pared.", "price": 25.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500", "stock": 20}
]

def seed_data(db: Session):
    """Inyecta datos iniciales directamente en la base de datos."""
    # 1. Productos
    for p in products_data:
        db_p = models.Product(**p)
        db.add(db_p)
    
    # 2. Usuarios de prueba
    users = [
        {"email": "bot1@test.com", "password": "123"},
        {"email": "bot2@test.com", "password": "123"},
    ]
    for u in users:
        hashed = security.get_password_hash(u["password"])
        db_u = models.User(email=u["email"], hashed_password=hashed, role="user")
        db.add(db_u)
    
    db.commit()

if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    try:
        seed_data(db)
        print("✅ Base de datos poblada exitosamente.")
    finally:
        db.close()
