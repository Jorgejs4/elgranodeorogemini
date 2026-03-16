import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from unittest.mock import patch, MagicMock
import models

@pytest.mark.asyncio
async def test_chat_assistant_success():
    # Simulamos la respuesta de la API de Gemini para no consumir tokens reales en tests
    with patch("gemini_assistant.get_barista_response", return_value="☕ ¡Hola! Te recomiendo el Geisha.") as mock_gemini:
        chat_data = {"message": "Dime un buen café suave."}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/chat", json=chat_data)
        
        assert response.status_code == 200
        assert response.json()["reply"] == "☕ ¡Hola! Te recomiendo el Geisha."
        mock_gemini.assert_called_once_with("Dime un buen café suave.")

@pytest.mark.asyncio
async def test_admin_simulate_activity(db_session):
    # Creamos cuenta de admin temporal
    import security
    hashed_pwd = security.get_password_hash("adminpass")
    admin = models.User(email="admin2@test.com", hashed_password=hashed_pwd, role="admin")
    db_session.add(admin)
    db_session.commit()
    
    # Login para obtener el token
    login_data = {"username": "admin2@test.com", "password": "adminpass"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/token", data=login_data)
        token = login_res.json()["access_token"]
        
        # Disparamos la simulación
        headers = {"Authorization": f"Bearer {token}"}
        response = await ac.post("/admin/simulate-activity", headers=headers)
        
    assert response.status_code == 200
    assert "Simulación Anual" in response.json()["message"]
    
    # Verificamos que se crearon interacciones de prueba
    interactions_count = db_session.query(models.Interaction).count()
    assert interactions_count >= 200
    
    # Y ventas simuladas
    orders_count = db_session.query(models.Order).count()
    assert orders_count >= 50

@pytest.mark.asyncio
async def test_admin_check_low_stock_and_emails(db_session):
    # Creamos un producto bajo en stock para forzar la alerta por email
    product = models.Product(
        name="Café Casi Agotado",
        price=10.0,
        stock=2, # Menos de 5 dispara la alerta
        category="Accesorios"
    )
    db_session.add(product)
    db_session.commit()
    
    # Simulamos smtplib para no enviar correos de verdad
    with patch("smtplib.SMTP") as mock_smtp:
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/check-low-stock")
            
        assert response.status_code == 200
        assert response.json()["message"] == "Alerta procesada"
        assert response.json()["count"] >= 1
        
        # FastAPI ejecuta las BackgroundTasks luego de retornar la respuesta,
        # en ASGI Test Client normalmente esto corre sincrónicamente.
        # Comprobamos si el Mailtrap / SMTP fue invocado.
        mock_smtp.assert_called()
