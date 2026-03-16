#!/bin/sh

echo "⏳ Preparando entorno..."

# Crear directorio para disco persistente (Render Persistent Disk)
mkdir -p /opt/render/project/data

# Ejecutar migraciones de Alembic
alembic upgrade head

# 1. Ejecutamos el script de entrenamiento
python train.py

# 2. Una vez termine, arrancamos la API
# Usamos el puerto de la variable de entorno PORT que asigna Render de forma automática
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload