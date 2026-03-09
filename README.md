# ☕ El Grano de Oro - Premium Coffee E-Commerce

**El Grano de Oro** es una plataforma de comercio electrónico de lujo especializada en café artesanal. Combina una experiencia de usuario refinada con un potente motor de Inteligencia Artificial para la gestión empresarial y recomendaciones personalizadas.

---

## 🚀 Tecnologías Principales

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (Estado), React Router 7.
- **Backend:** FastAPI (Python), SQLAlchemy ORM, SQLite (Desarrollo).
- **IA y ML:** 
  - **Gemini Pro:** Chatbot barista experto para asesoramiento.
  - **Scikit-learn:** Motor de recomendaciones basado en filtrado colaborativo.
  - **Custom Analytics:** Algoritmos de BI para análisis de horas pico y conversión.
- **Servicios:** Mailtrap (Simulación de correos), OpenStreetMap (Autocompletado de direcciones).

---

## ✨ Características Destacadas

### 👤 Experiencia del Cliente
- **Recomendaciones Inteligentes:** El sistema aprende de tus compras y carritos para sugerirte productos que te encantarán.
- **Barista Virtual:** Un chatbot integrado con Gemini Pro que te ayuda a elegir el café perfecto según tu método de preparación.
- **Smart Checkout:** Formulario de pago ultra-rápido con autocompletado de direcciones real y gestión de tarjetas guardadas.
- **Multilenguaje:** Traducción instantánea a 6 idiomas (ES, EN, FR, DE, IT, ZH).

### 🛠️ Panel de Administración (BI Dashboard)
- **Visualización Financiera:** Gráficos de ingresos con estética *Glassmorphism* y desglose por días, semanas, meses y años.
- **Insights de IA:** La IA analiza automáticamente los datos para indicarte la hora punta de ventas y consejos de marketing.
- **Gestión de Inventario:** Control total del stock con alertas automáticas por correo electrónico cuando las unidades bajan de 5.
- **Flujo de Pedidos:** Separación clara entre pedidos pendientes y completados con actualizaciones en tiempo real.

---

## 🛠️ Instalación y Uso

### 1. Requisitos Previos
- Python 3.10+
- Node.js 18+

### 2. Configuración del Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # En Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
*Nota: Crea un archivo `.env` en `backend/` con tu `GEMINI_API_KEY`.*

### 3. Configuración del Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso
- **Tienda:** [http://localhost:5173](http://localhost:5173)
- **Admin:** `admin@admin.com` / `admin123`
- **Documentación API:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📧 Sistema de Notificaciones
El sistema está configurado para enviar correos transaccionales a través de **Mailtrap**:
1. **Al Cliente:** Confirmación detallada tras cada compra.
2. **Al Admin:** Alerta crítica de "Stock Bajo" cuando un producto está a punto de agotarse.

---

Desarrollado con ❤️ para los amantes del buen café.
