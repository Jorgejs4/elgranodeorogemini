import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_read_products():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_health_check():
    # Un test simple para verificar que la app carga
    assert app.title == "API El Grano de Oro"
