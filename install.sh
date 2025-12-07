#!/usr/bin/env bash
set -euo pipefail

# Paths
BACKEND_DIR="Backend_Kivo/Kivo_Asistencia"
FRONTEND_DIR="Pagina_Web"
MOBILE_DIR="App_Movil"

# DB config (ajusta según tu entorno)
DB_NAME="empresa_1"
DB_USER="root"
DB_PASS=""
DB_HOST="127.0.0.1"
DB_PORT="3306"

# Detectar IP local (mejor esfuerzo). Si falla, usa loopback.
API_HOST="127.0.0.1"
if command -v python >/dev/null 2>&1; then
  API_HOST=$(python - <<'PY'
import socket
ip = "127.0.0.1"
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
except Exception:
    pass
print(ip)
PY
)
fi
API_URL="http://${API_HOST}:8000/api"

echo "==> Instalando dependencias Backend (Python/Django)"
python -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Creando base de datos MySQL si no existe ($DB_NAME)"
if command -v mysql >/dev/null 2>&1; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
  echo "mysql CLI no encontrado. Crea la base $DB_NAME manualmente o instala MySQL client/server."
fi

echo "==> Aplicando migraciones Backend"
python "$BACKEND_DIR/manage.py" migrate

echo "==> Instalando dependencias Frontend (npm)"
if [ -f "$FRONTEND_DIR/package.json" ]; then
  (cd "$FRONTEND_DIR" && npm install)
  echo "VITE_API_URL=\"$API_URL\"" > "$FRONTEND_DIR/.env.local"
  echo "Escribiendo $FRONTEND_DIR/.env.local con VITE_API_URL=$API_URL"
else
  echo "package.json no encontrado en $FRONTEND_DIR, omitiendo npm install"
fi

echo "==> Instalando dependencias App Movil (React Native / Expo)"
if [ -d "$MOBILE_DIR" ] && [ -f "$MOBILE_DIR/package.json" ]; then
  (cd "$MOBILE_DIR" && npm install)
  echo "API_URL=\"$API_URL\"" > "$MOBILE_DIR/.env"
  echo "Escribiendo $MOBILE_DIR/.env con API_URL=$API_URL"
else
  echo "App_Movil/package.json no encontrado, omitiendo npm install movil"
fi

echo "==> Listo. Para correr:"
echo "Backend : cd $BACKEND_DIR && python manage.py runserver 0.0.0.0:8000"
echo "Frontend: cd $FRONTEND_DIR && npm run dev -- --host"
echo "Movil   : cd $MOBILE_DIR && npm run start  # o npm run android"
echo ""
echo "Notas:"
echo "- DB MySQL: NAME=$DB_NAME, USER=$DB_USER, PASS='$DB_PASS', HOST=$DB_HOST, PORT=$DB_PORT (ajusta en install.sh y settings.py si cambia)."
echo "- Se generaron .env con API_URL=$API_URL en Pagina_Web/.env.local y App_Movil/.env; si cambias de red, actualiza."
