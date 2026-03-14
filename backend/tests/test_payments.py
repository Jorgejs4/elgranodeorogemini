import pytest
from httpx import AsyncClient, ASGITransport
from main import app
import models

@pytest.mark.asyncio
async def test_checkout_success(db_session):
    # 1. Crear producto con stock
    product = models.Product(
        name="Café de Prueba",
        description="Rico rico",
        price=20.0,
        stock=10,
        category="Café en Grano",
        image_url="http://test.com/img.jpg"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    # 2. Datos del pedido
    order_data = {
        "user": "cliente@test.com",
        "total": 40.0,
        "items": [{"id": product.id, "name": product.name, "qty": 2, "price": 20.0}],
        "address": "Calle Falsa 123",
        "save_card": False
    }
    
    # 3. Ejecutar checkout
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/checkout", json=order_data)
    
    # 4. Verificaciones
    assert response.status_code == 200
    assert response.json()["message"] == "Venta exitosa"
    
    # Verificar que el pedido existe en DB
    order = db_session.query(models.Order).filter(models.Order.user_email == "cliente@test.com").first()
    assert order is not None
    assert order.total == 40.0
    assert "2x Café de Prueba" in order.items_summary
    
    # Verificar stock reducido
    db_session.refresh(product)
    assert product.stock == 8

@pytest.mark.asyncio
async def test_checkout_insufficient_stock(db_session):
    # 1. Crear producto con stock bajo
    product = models.Product(
        name="Café Limitado",
        price=30.0,
        stock=1,
        category="Café en Grano"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    # 2. Intentar comprar más de lo que hay
    order_data = {
        "user": "pobre@test.com",
        "total": 60.0,
        "items": [{"id": product.id, "name": product.name, "qty": 2, "price": 30.0}],
        "address": "Calle Vacia 0"
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/checkout", json=order_data)
    
    assert response.status_code == 400
    assert "Stock insuficiente" in response.json()["detail"]
    
    # Verificar que NO se redujo el stock
    db_session.refresh(product)
    assert product.stock == 1
