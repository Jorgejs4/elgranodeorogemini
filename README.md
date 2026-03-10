# ☕ El Grano de Oro - Premium Coffee E-Commerce

**El Grano de Oro** es una plataforma de comercio electrónico de lujo especializada en café artesanal. Combina una experiencia de usuario refinada con un potente motor de Inteligencia Artificial para la gestión empresarial y recomendaciones personalizadas.

---

## 🌐 Despliegue en Vivo
🚀 **Visita la plataforma aquí:** [https://elgranodeorogemini.vercel.app/](https://elgranodeorogemini.vercel.app/)

---

## 🚀 Tecnologías Principales

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (Estado persistente), React Router 7.
- **Backend:** FastAPI (Python), SQLAlchemy ORM, SQLite (Desarrollo), PBKDF2 (Seguridad).
- **IA y ML:** 
  - **Google Gemini (Gemma 3):** Barista experto para asesoramiento en tiempo real.
  - **Scikit-learn:** Motor de recomendaciones basado en filtrado colaborativo (Similitud de Coseno).
  - **AI Insights:** Dashboards interactivos con análisis de BI para gestión de ventas.
- **Servicios:** Mailtrap (Alertas de stock y pedidos), Nominatim API (Autocompletado de direcciones).

---

## ✨ Características Destacadas

### 👤 Experiencia del Cliente
- **Barista Virtual (IA):** Un chatbot integrado con Google Gemini (Gemma 3) que te ayuda a elegir el café perfecto según tus gustos y molienda.
- **Recomendaciones Inteligentes:** El sistema aprende de tus interacciones para sugerirte productos exclusivos.
- **Smart Checkout:** Pago fluido con autocompletado de direcciones real y gestión de tarjetas guardadas.
- **Internacionalización:** Soporte completo para 6 idiomas (ES, EN, FR, DE, IT, ZH).

### 🛠️ Panel de Administración (BI Dashboard)
- **Visualización de Datos:** Gráficos SVG interactivos para análisis de ventas diarias, semanales y mensuales.
- **AI Business Insights:** Análisis automático de horas pico, tasas de conversión y consejos estratégicos generados por IA.
- **Control de Inventario:** Gestión de stock en tiempo real con alertas automáticas por email (< 5 unidades).
- **Gestión de Pedidos:** Sistema robusto para el seguimiento de órdenes pendientes y completadas.

---

## 🛠️ Instalación Local

### 1. Requisitos Previos
- Python 3.10+
- Node.js 18+
- Docker (Opcional para despliegue rápido)

### 2. Configuración del Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
*Nota: Configura tu `GEMINI_API_KEY` en un archivo `.env` dentro de `backend/`.*

### 3. Configuración del Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso Local
- **Tienda:** [http://localhost:5173](http://localhost:5173)
- **Admin:** `admin@admin.com` / `admin123`
- **Documentación API:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📧 Sistema de Notificaciones
El sistema utiliza **Mailtrap** para flujos transaccionales:
1. **Notificación al Cliente:** Confirmación de compra instantánea.
2. **Alerta Crítica al Admin:** Notificación de "Stock Bajo" para reposición inmediata.

---

Desarrollado con ❤️ para los apasionados del café premium.
