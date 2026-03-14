import pytest
from httpx import AsyncClient, ASGITransport
from main import app
import models, security

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

@pytest.mark.asyncio
async def test_create_user(db_session):
    user_data = {"email": "testuser@example.com", "password": "testpassword"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/users/", json=user_data)
    
    assert response.status_code == 200
    assert response.json()["email"] == user_data["email"]
    
    # Check if user is in DB
    user = db_session.query(models.User).filter(models.User.email == user_data["email"]).first()
    assert user is not None
    assert security.verify_password(user_data["password"], user.hashed_password)

@pytest.mark.asyncio
async def test_login(db_session):
    # Create a user first
    hashed_pwd = security.get_password_hash("testpassword")
    user = models.User(email="test@example.com", hashed_password=hashed_pwd)
    db_session.add(user)
    db_session.commit()
    
    login_data = {"username": "test@example.com", "password": "testpassword"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/token", data=login_data)
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "user"

@pytest.mark.asyncio
async def test_admin_create_product(db_session):
    # Create an admin user
    hashed_pwd = security.get_password_hash("adminpass")
    admin = models.User(email="admin@test.com", hashed_password=hashed_pwd, role="admin")
    db_session.add(admin)
    db_session.commit()
    
    # Login to get token
    login_data = {"username": "admin@test.com", "password": "adminpass"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/token", data=login_data)
        token = login_res.json()["access_token"]
        
        # Create product
        product_data = {
            "name": "Test Coffee",
            "description": "Delicious coffee",
            "price": 10.5,
            "stock": 100,
            "category": "Café en Grano",
            "image_url": "http://example.com/image.jpg"
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = await ac.post("/admin/products", json=product_data, headers=headers)
    
    assert response.status_code == 200
    assert response.json()["name"] == product_data["name"]
    
    # Check DB
    product = db_session.query(models.Product).filter(models.Product.name == product_data["name"]).first()
    assert product is not None
    assert product.price == 10.5
