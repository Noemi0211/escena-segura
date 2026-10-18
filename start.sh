#!/usr/bin/env sh
# ==========================================================================
# ESCENA SEGURA — servidor local de desarrollo (macOS / Linux)
# Sustrato de start.bat. Los módulos ES requieren servidor; file:// no vale.
# ==========================================================================
set -e
PUERTO="${1:-8080}"
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js no está instalado. Descárgalo de https://nodejs.org" >&2
  echo "        Alternativa: abre index.html con la extensión Live Server de VS Code." >&2
  exit 1
fi

echo ""
echo " ESCENA SEGURA — servidor de desarrollo"
echo " -------------------------------------"
echo " Abre en el navegador: http://localhost:${PUERTO}"
echo " Detener: Ctrl + C"
echo ""

exec node scripts/servir.mjs "${PUERTO}"
