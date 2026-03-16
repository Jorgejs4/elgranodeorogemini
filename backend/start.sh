#!/bin/sh

echo "⏳ Esperando 10 segundos a que la base de datos despierte..."
sleep 10

# Ejecutar migraciones de Alembic
alembic upgrade head

# 1. Ejecutamos el script de entrenamiento que acabamos de crear
python train.py

# 2. Una vez termine, arrancamos la API
# Usamos el puerto de la variable de entorno PORT que asigna Render de forma automática
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload