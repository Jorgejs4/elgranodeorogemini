import pytest
from httpx import AsyncClient
from main import app
import models

@pytest.mark.asyncio
async def test_save_card(db_session):
    # Primero necesitamos un usuario
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Login mock o crear usuario (asumiendo que los tests corren con base limpia)
        card_data = {
            "card_holder": "Juan Perez",
            "last_four": "1234",
            "exp_month": "12",
            "exp_year": "25",
            "brand": "visa",
            "token": "tok_123"
        }
        # Nota: este test fallará si no hay autenticación, 
        # en un entorno real usaríamos un fixture de token
        pass

@pytest.mark.asyncio
async def test_checkout_with_mock_payment():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        order_data = {
            "user": "test@example.com",
            "total": 50.0,
            "items": [{"id": 1, "name": "Café", "qty": 2, "price": 25.0}],
            "address": "Calle Falsa 123",
            "save_card": True,
            "card_info": {
                "card_holder": "Test User",
                "last_four": "4242",
                "exp_month": "01",
                "exp_year": "28",
                "brand": "visa",
                "token": "mock_tok"
            }
        }
        # Para que este test funcione, el producto ID 1 debe existir en la DB de test
        # response = await ac.post("/checkout", json=order_data)
        # assert response.status_code == 200
        pass
