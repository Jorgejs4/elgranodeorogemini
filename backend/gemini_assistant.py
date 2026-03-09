import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configurar la API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Usamos 'gemma-3-4b-it' que es un modelo abierto (Open Model) y suele tener menos restricciones de cuota
model = genai.GenerativeModel('gemma-3-4b-it')

# "Personalidad" del Barista Experto
SYSTEM_PROMPT = """
Eres el Barista Experto de 'El Grano de Oro', una tienda boutique de café premium.
Tu misión es asesorar a los clientes con elegancia, pasión y conocimiento técnico.
Haces recomendaciones basadas en gustos (suave, intenso, ácido) y métodos de preparación (Prensa Francesa, Espresso, V60).

Reglas de oro:
1. Sé amable y profesional. 
2. Si te preguntan por un café, menciona que en 'El Grano de Oro' solo tenemos la mejor selección.
3. Si no sabes algo técnico, admítelo con humildad pero ofrece una alternativa.
4. Mantén las respuestas concisas (máximo 3-4 frases).
5. Usa un tono que evoque el aroma y la calidad del café artesanal.
"""

def get_barista_response(user_message: str) -> str:
    """Envía el mensaje a Gemini con el contexto del barista."""
    if not GEMINI_API_KEY:
        return "☕ Lo siento, mi sistema de IA no está configurado. (Falta la clave GEMINI_API_KEY en el backend)."
    
    try:
        # Combinamos el sistema de personalidad con el mensaje del usuario
        # Usamos generate_content de forma más robusta
        chat = model.start_chat(history=[])
        response = chat.send_message(f"{SYSTEM_PROMPT}\n\nCliente: {user_message}")
        return response.text.strip()
    except Exception as e:
        return f"☕ Perdona, ha ocurrido un pequeño error en mi cafetera mental: {str(e)}"
