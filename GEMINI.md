# GEMINI.md - Project Context: El Grano de Oro

## Project Overview
**El Grano de Oro** (The Golden Grain) is a sophisticated full-stack e-commerce platform specializing in premium coffee products. It features an integrated AI engine for personalized recommendations, a "Barista Experto" AI chat assistant, a robust administration dashboard with real-time analytics, and automated stock management with email notifications.

### Architecture & Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, React Router 7, **Zustand** (State management).
- **Backend:** FastAPI (Python 3.x), SQLAlchemy ORM, **SQLite (Default)** / PostgreSQL.
- **AI/ML Engine:** Scikit-learn (NearestNeighbors), Pandas, NumPy, **Google Gemini API** (Barista Chat).
- **Infrastructure:** Docker & Docker Compose for orchestration.
- **Services:** Mailtrap (Email alerts), JWT (Security/Auth), APScheduler (Background tasks), **Alembic** (Migrations).
- **Testing:** **Pytest** (Backend), **Vitest** & Testing Library (Frontend).

## Key Features
- **Smart E-Commerce:** Catalog with search, categories, shopping cart, and persistent wishlist (persisted via Zustand/LocalStorage).
- **Barista Experto (AI Chat):** Interactive AI assistant powered by Google Gemini for personalized coffee advice and recommendations.
- **AI Recommendations:** Collaborative filtering using Cosine Similarity to suggest products based on user interactions.
- **Business Intelligence:** Admin "AI Insights" dashboard analyzing sales peak hours, conversion rates, and automated business advice.
- **Inventory Management:** Real-time stock tracking with **bulk update capabilities** and automated email alerts when stock falls below a threshold (< 5 units).
- **Internationalization:** Multi-language support (ES, EN, FR, DE, IT, ZH) using a custom Google Translate integration.
- **Security:** Role-based access control (Admin vs. User) powered by JWT tokens.
- **Automated Startup:** On launch, the system automatically creates a master admin and seeds the database if empty.

## Getting Started

### Prerequisites
- Docker and Docker Compose installed.
- Python 3.10+ (for local backend development).
- Node.js 18+ (for local frontend development).
- **GEMINI_API_KEY:** Required for the Barista Chat feature (add to `.env`).

### Building and Running (Docker)
1.  **Start the entire stack:**
    ```bash
    docker-compose up --build
    ```
2.  **Access points:**
    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend API: [http://localhost:8000](http://localhost:8000)
    - API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
    - Default Admin: `admin@admin.com` / `admin123`
    - Local Database: `backend/elgranodeoro.db` (SQLite)

### Local Development (Manual)

#### Backend
1.  Navigate to `backend/`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Run migrations: `alembic upgrade head`.
4.  Run the server: `uvicorn main:app --reload`.
5.  **Tests:** Run `pytest`.

#### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run in dev mode: `npm run dev`.
4.  **Tests:** Run `npm test`.

## Development Conventions

### Backend (Python/FastAPI)
- **Structure:** Follows a modular pattern:
  - `main.py`: Main entry point with `startup_event` (auto-seed/admin creation) and API routes.
  - `models.py`: SQLAlchemy database models.
  - `schemas.py`: Pydantic models for request/response validation.
  - `crud.py`: Database abstraction layer.
  - `security.py`: JWT, hashing, and authentication logic.
  - `ml_core.py`: Machine Learning logic and training functions.
  - `gemini_assistant.py`: Logic for the Barista AI chat integration.
- **Migrations:** Managed via **Alembic**. Use `alembic revision --autogenerate -m "description"` to create new migrations.
- **AI Training:** The recommendation model (`recommender.pkl`) is retrained automatically every week via `APScheduler` or manually via the `/train` endpoint (or `train.py`).

### Frontend (React/Vite)
- **State Management:** Uses **Zustand** in `src/store/useStore.js` to manage users, cart, wishlist, and API data.
- **Styling:** Uses Tailwind CSS with a dark-mode "Premium" aesthetic.
- **Routing:** Centralized in `App.jsx` using `react-router-dom`.
- **Testing:** Uses **Vitest** for component testing.

## Key Files
- `docker-compose.yml`: Orchestration for DB, Backend, and Frontend.
- `backend/main.py`: Entry point and API route definitions.
- `backend/alembic.ini`: Configuration for database migrations.
- `backend/gemini_assistant.py`: Gemini-powered Barista AI assistant.
- `backend/ml_core.py`: Core logic for recommendations and business insights.
- `frontend/src/store/useStore.js`: Centralized Zustand store.
- `backend/seed.py`: Utility to populate the initial product database.
- `backend/pytest.ini`: Configuration for backend tests.
