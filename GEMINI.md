# GEMINI.md - Project Context: El Grano de Oro

## Project Overview
**El Grano de Oro** (The Golden Grain) is a sophisticated full-stack e-commerce platform specializing in premium coffee products. It features an integrated AI engine for personalized recommendations, a "Barista Experto" AI chat assistant (Gemma 3), a robust administration dashboard with real-time analytics, and automated stock management with email notifications.

### Architecture & Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, React Router 7, **Zustand** (State management with persistence).
- **Backend:** FastAPI (Python 3.x), SQLAlchemy ORM, **SQLite (Default)** / PostgreSQL.
- **AI/ML Engine:** Scikit-learn (NearestNeighbors/Cosine Similarity), Pandas, NumPy, **Google Gemini API** (Barista Chat - Gemma 3-4b-it).
- **Logistics:** Nominatim API (OpenStreetMap) for real-time address autocompletion.
- **Infrastructure:** Docker & Docker Compose for orchestration.
- **Services:** Mailtrap (Email alerts), JWT (Security/Auth), APScheduler (Background tasks), **Alembic** (Migrations).
- **Testing:** **Pytest** (Backend), **Vitest** & Testing Library (Frontend).

## Key Features
- **Smart E-Commerce:** Catalog with search, categories, shopping cart, and persistent wishlist.
- **Barista Experto (AI Chat):** Interactive AI assistant powered by Google Gemini (Gemma 3) for personalized coffee advice.
- **AI Recommendations:** Collaborative filtering using Cosine Similarity to suggest products based on user interactions.
- **Business Intelligence (BI):** Admin "AI Insights" dashboard with interactive SVG charts for peak hours, conversion rates, and AI-generated business advice.
- **Inventory Management:** Real-time stock tracking with images in the admin table, bulk update capabilities, and automated email alerts (< 5 units).
- **Internationalization:** Multi-language support (ES, EN, FR, DE, IT, ZH) with a polished language selector.
- **Security:** Role-based access control (Admin vs. User) with **PBKDF2** password hashing for cross-platform stability.
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
    - Default Admin: `admin@admin.com` / `admin123`

### Local Development (Manual)

#### Backend
1.  Navigate to `backend/`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Run migrations: `alembic upgrade head`.
4.  Run the server: `uvicorn main:app --reload`.

#### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run in dev mode: `npm run dev`.

## Key Files
- `backend/main.py`: Entry point and API route definitions.
- `backend/gemini_assistant.py`: Gemini-powered Barista AI assistant.
- `backend/ml_core.py`: Core logic for recommendations and business insights.
- `frontend/src/store/useStore.js`: Centralized Zustand store with persistence.
- `backend/models.py`: SQLAlchemy database models (User, Product, Order, Interaction, CreditCard, Review).
