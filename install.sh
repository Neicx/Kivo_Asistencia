#!/usr/bin/env bash
set -euo pipefail

# Paths
BACKEND_DIR="Backend_Kivo/Kivo_Asistencia"
FRONTEND_DIR="Pagina_Web"
MOBILE_DIR="App_Movil"
VENV_DIR=".venv"

# Defaults
DB_NAME_DEFAULT="empresa_1"
DB_USER_DEFAULT="root"
DB_PASS_DEFAULT=""
DB_HOST_DEFAULT="127.0.0.1"
DB_PORT_DEFAULT="3306"

# Detect IP for API_URL (best effort)
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

# Python binary (install if missing on Debian/Ubuntu)
PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Python no encontrado. Instalando python3..."
    if command -v apt-get >/dev/null 2>&1; then
      apt-get update && apt-get install -y python3 python3-venv python3-pip
      PYTHON_BIN="python3"
    else
      echo "Instala Python 3 manualmente e intenta de nuevo."
      exit 1
    fi
  fi
fi

# Crear/usar entorno virtual
echo "==> Preparando venv en $VENV_DIR"
if [ ! -d "$VENV_DIR" ]; then
  $PYTHON_BIN -m venv "$VENV_DIR"
fi
VENV_PY="$VENV_DIR/bin/python"
if [ ! -x "$VENV_PY" ]; then
  echo "No se encontró $VENV_PY. Verifica el venv."
  exit 1
fi

# Preguntar datos DB
read -rp "Nombre de la base de datos [$DB_NAME_DEFAULT]: " DB_NAME
DB_NAME=${DB_NAME:-$DB_NAME_DEFAULT}
read -rp "Usuario DB [$DB_USER_DEFAULT]: " DB_USER
DB_USER=${DB_USER:-$DB_USER_DEFAULT}
read -rp "Password DB (puede quedar vacio): " DB_PASS
read -rp "Host DB [$DB_HOST_DEFAULT]: " DB_HOST
DB_HOST=${DB_HOST:-$DB_HOST_DEFAULT}
read -rp "Puerto DB [$DB_PORT_DEFAULT]: " DB_PORT
DB_PORT=${DB_PORT:-$DB_PORT_DEFAULT}

export DB_NAME DB_USER DB_PASS DB_HOST DB_PORT

echo "==> Instalando dependencias Backend (venv)"
$VENV_PY -m pip install --upgrade pip
$VENV_PY -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Creando base de datos $DB_NAME (MySQL/MariaDB)"
if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql CLI no encontrado. Instala cliente/servidor y crea la base manualmente si es necesario."
else
  MYSQL_CMD=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")
  [ -n "$DB_PASS" ] && MYSQL_CMD+=(-p"$DB_PASS")
  if ! "${MYSQL_CMD[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"; then
    echo "No se pudo crear/verificar la base. Intenta manualmente con tus credenciales."
    echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS"
    echo "Si usas auth_socket (root sin password):"
    echo "  mysql -u $DB_USER -e \"CREATE DATABASE IF NOT EXISTS \\`$DB_NAME\\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
    read -rp "¿Omitir creación de base y continuar? (y/N): " SKIP_DB
    if [[ "$SKIP_DB" != "y" && "$SKIP_DB" != "Y" ]]; then
      exit 1
    fi
  fi
fi

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
