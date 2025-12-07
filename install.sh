#!/usr/bin/env bash
set -euo pipefail

# Paths
BACKEND_DIR="Backend_Kivo/Kivo_Asistencia"
FRONTEND_DIR="Pagina_Web"
MOBILE_DIR="App_Movil"
VENV_DIR=".venv"

# DB config (ajusta según tu entorno)
DB_NAME="empresa_1"
DB_USER="root"
DB_PASS=""
DB_HOST="127.0.0.1"
DB_PORT="3306"

# Detectar IP local (mejor esfuerzo). Si falla, usa loopback.
API_HOST="127.0.0.1"
if command -v python3 >/dev/null 2>&1; then
  API_HOST=$(python3 - <<'PY'
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

# Resolver comando de Python; si falta, intenta instalar en Debian/Ubuntu
PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Python no encontrado. Intentando instalar python3 y python3-venv..."
    if command -v apt-get >/dev/null 2>&1; then
      apt-get update && apt-get install -y python3 python3-venv python3-pip
      PYTHON_BIN="python3"
    else
      echo "No se pudo instalar python automáticamente. Instálalo manualmente e intenta de nuevo."
      exit 1
    fi
  fi
fi

# Crear/usar entorno virtual para evitar instalaciones globales
echo "==> Preparando entorno virtual en $VENV_DIR"
if [ ! -d "$VENV_DIR" ]; then
  $PYTHON_BIN -m venv "$VENV_DIR"
fi
VENV_PY="$VENV_DIR/bin/python"
if [ ! -x "$VENV_PY" ]; then
  echo "No se encontró $VENV_PY. Verifica la creación del entorno virtual."
  exit 1
fi

echo "==> Instalando dependencias Backend (Python/Django)"
$VENV_PY -m pip install --upgrade pip
$VENV_PY -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Creando base de datos MySQL si no existe ($DB_NAME)"
if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql CLI no encontrado. Intentando instalar mariadb-server (Debian/Ubuntu)..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y mariadb-server mariadb-client
  else
    echo "No se pudo instalar mariadb/mysql automáticamente. Instala el cliente/servidor y crea la base $DB_NAME manualmente."
    exit 1
  fi
fi

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
  echo "No se pudo crear/verificar la base $DB_NAME. Verifica credenciales en install.sh y en settings.py"
  exit 1
}

echo "==> Aplicando migraciones Backend"
$VENV_PY "$BACKEND_DIR/manage.py" migrate

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
echo "Backend : cd $BACKEND_DIR && source $VENV_DIR/bin/activate && python manage.py runserver 0.0.0.0:8000"
echo "Frontend: cd $FRONTEND_DIR && npm run dev -- --host"
echo "Movil   : cd $MOBILE_DIR && npm run start  # o npm run android"
echo ""
echo "Notas:"
echo "- DB MySQL: NAME=$DB_NAME, USER=$DB_USER, PASS='$DB_PASS', HOST=$DB_HOST, PORT=$DB_PORT (ajusta en install.sh y settings.py si cambia)."
echo "- Se generaron .env con API_URL=$API_URL en Pagina_Web/.env.local y App_Movil/.env; si cambias de red, actualiza."
