import requests
import time
from datetime import datetime
import os

# URL del backend (puedes configurarla por variable de entorno o dejar la de defecto)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/health")

def ping_backend():
    print(f"[{datetime.now()}] Iniciando bot de mantenimiento...")
    print(f"Apuntando a: {BACKEND_URL}")
    
    while True:
        try:
            response = requests.get(BACKEND_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"[{datetime.now()}] OK - Status: {data.get('status')} - TS: {data.get('timestamp')}")
            else:
                print(f"[{datetime.now()}] Advertencia - Status Code: {response.status_code}")
        except Exception as e:
            print(f"[{datetime.now()}] Error de conexión: {e}")
        
        # Esperar 10 minutos (600 segundos) para evitar que el servicio entre en reposo
        time.sleep(600)

if __name__ == "__main__":
    ping_backend()
