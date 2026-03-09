import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ ERROR: GEMINI_API_KEY no encontrada.")
    exit()

genai.configure(api_key=GEMINI_API_KEY)

print("--- 🔍 LISTANDO MODELOS DISPONIBLES ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Modelo: {m.name}")
except Exception as e:
    print(f"❌ Error al listar modelos: {e}")
