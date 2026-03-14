# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

El Grano de Oro is a premium coffee e-commerce platform with an AI-powered barista assistant (Google Gemini / Gemma 3) and a collaborative-filtering recommendation engine (scikit-learn). The project is written in Spanish — UI text, comments, variable names, and commit messages all use Spanish.

Live deployment: frontend on Vercel (`elgranodeorogemini.vercel.app`), backend on Render.

## Build & Run Commands

### Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
alembic upgrade head           # run migrations
python -m uvicorn main:app --reload
```

The server auto-seeds the database on first startup: creates admin user (`admin@admin.com` / `admin123`), inserts products from `seed.py`, generates simulated interactions, and trains the ML model.

Required env var in `backend/.env`: `GEMINI_API_KEY` (for the Barista chat). See `backend/.env.example` for all options.

### Frontend (React 19 + Vite)

```bash
cd frontend
npm install
npm run dev
```

Required env var in `frontend/.env`: `VITE_API_URL` (defaults to `http://localhost:8000`).

### Docker (full stack)

```bash
docker-compose up --build
```

Uses PostgreSQL when running via Docker (`DATABASE_URL` env var); SQLite otherwise.

### Linting

```bash
cd frontend && npm run lint   # ESLint (flat config)
```

No backend linter is configured.

### Testing

**Backend** — Pytest with async tests (httpx + ASGITransport). Uses an in-memory SQLite database per test via the `db_session` fixture in `backend/tests/conftest.py`.

```bash
cd backend
python -m pytest                   # all tests
python -m pytest tests/test_main.py          # single file
python -m pytest tests/test_main.py::test_health_check  # single test
python -m pytest --cov             # with coverage
```

`pytest.ini` sets `asyncio_mode = auto` and `pythonpath = .`.

**Frontend** — Vitest + Testing Library (jsdom). Setup file at `frontend/src/setupTests.js`.

```bash
cd frontend
npm test            # watch mode
npx vitest run      # single run
npx vitest run src/ProductCard.test.jsx  # single file
```

## Architecture

### Backend (`backend/`)

Single FastAPI application defined in `main.py`. All API routes, inline Pydantic schemas (OrderSchema, ChatRequest, etc.), middleware, CORS config, startup event, and background tasks live in this one file. There is no router decomposition.

Key modules:

- **`models.py`** — SQLAlchemy ORM models: `User`, `Product`, `Interaction`, `Order`, `CreditCard`, `Review`. Uses `extend_existing = True` on all tables. Cascade deletes configured on Product → Interactions/Reviews and User → CreditCards.
- **`schemas.py`** — Pydantic request/response models. `UserResponse` is an alias for `User`.
- **`database.py`** — Engine creation with SQLite/PostgreSQL detection. Provides `get_db` dependency.
- **`security.py`** — JWT auth (python-jose) + PBKDF2 password hashing (passlib). `SECRET_KEY` is hardcoded (not from env).
- **`crud.py`** — Thin CRUD helpers for Products, Users, Interactions. Mostly bypassed by inline queries in `main.py`.
- **`gemini_assistant.py`** — Wraps the Google Generative AI SDK. Uses `gemma-3-4b-it` model with a system prompt defining the "Barista Experto" personality.
- **`ml_core.py`** — Recommendation engine: builds a user-item interaction matrix, trains a NearestNeighbors (cosine similarity) model, serializes to `recommender.pkl`. Also provides `generate_business_insights()` for the admin BI dashboard.
- **`seed.py`** — 20 premium coffee products + test users. Called automatically on empty DB.
- **`train.py`** — Standalone script to train ML model (used by `start.sh` on deploy).
- **`start.sh`** — Production entrypoint: waits for DB, runs `train.py`, starts uvicorn on `$PORT`.
- **`alembic/`** — Database migration config. `alembic.ini` is present; migrations go in `alembic/versions/`.

Auth flow: `POST /token` returns a JWT. Protected endpoints use `get_current_user` / `check_admin` dependencies.

APScheduler runs a weekly job to retrain the ML model in the background.

### Frontend (`frontend/`)

Single-page React app. Almost all UI lives in **`App.jsx`** (~76KB), which contains the header, product catalog, product detail, admin dashboard (orders, inventory, AI insights, sales charts), login/register modals, cart sidebar, wishlist, and routing — all in one file.

Separate components:

- **`ProductCard.jsx`** — Product card with add-to-cart and wishlist toggle.
- **`ChatAssistant.jsx`** — Floating chat widget that calls `POST /chat` (Gemini barista).
- **`Checkout.jsx`** — Checkout page (note: has a hardcoded `API_BASE_URL` pointing to Render, separate from the store's config).

State management: **Zustand** store in `store/useStore.js` — persists `cart`, `wishlist`, and `user` to localStorage under key `el-grano-de-oro-storage`. Exports `API_BASE_URL` (from `VITE_API_URL` env var).

Routing uses React Router v7 with `BrowserRouter` in `main.jsx`.

Styling: Tailwind CSS 3 with a dark "luxury" theme. No component library.

Internationalization: Google Translate widget via `googtrans` cookie (not i18n library).

## Important Patterns & Gotchas

- **Monolithic `App.jsx`**: Nearly all frontend logic is in one file. When adding features, add components to separate files and import them.
- **Duplicate API_BASE_URL**: `Checkout.jsx` hardcodes a Render URL instead of using the store's `API_BASE_URL`. Always import from `store/useStore.js`.
- **Inline schemas in `main.py`**: Several Pydantic models (OrderSchema, StockUpdate, etc.) are defined directly in the main file rather than in `schemas.py`.
- **PBKDF2 over bcrypt**: Chosen intentionally for Windows/Python 3.12+ compatibility. Do not switch to bcrypt.
- **Database**: SQLite locally (`elgranodeoro.db` in `backend/`), PostgreSQL in Docker/production. The `DATABASE_URL` env var controls this.
- **Mailtrap credentials**: Hardcoded in `main.py` (sandbox only). Email sending uses raw `smtplib`.
- **ML model file**: `recommender.pkl` is generated at startup and retrained weekly. It's gitignored.
- **Auto-seed on startup**: The `startup_event` in `main.py` creates admin, seeds products, generates fake interactions, and trains the model if the DB is empty. Don't duplicate this logic.
