import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_read_products(db_session):
    # Usamos ASGITransport para que sea compatible con las últimas versiones de httpx
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_health_check():
    # Un test simple para verificar que la app carga
    assert app.title == "API El Grano de Oro"
