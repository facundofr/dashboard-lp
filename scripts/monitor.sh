#!/usr/bin/env bash
# Self-monitoring: checks the health endpoint and sends alert if down
# Usage: add to crontab: */5 * * * * /path/to/monitor.sh

set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost:3001/api/health}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
THRESHOLD_MEM="${THRESHOLD_MEM:-90}"   # alert if memory > 90%
THRESHOLD_LOAD="${THRESHOLD_LOAD:-5}"  # alert if load avg > 5

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$response" != "200" ]; then
  echo "[ALERTA] Health check devolvió HTTP $response"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"event\":\"server_down\",\"httpStatus\":\"$response\",\"timestamp\":\"$(date -Iseconds)\"}" \
      --max-time 10 > /dev/null 2>&1 || true
  fi
  exit 1
fi

body=$(curl -s --max-time 10 "$HEALTH_URL" 2>/dev/null)
mem_pct=$(echo "$body" | grep -o '"usagePct":[0-9]*' | cut -d: -f2)

if [ -n "$mem_pct" ] && [ "$mem_pct" -gt "$THRESHOLD_MEM" ]; then
  echo "[ADVERTENCIA] Memoria al ${mem_pct}% (límite: ${THRESHOLD_MEM}%)"
fi

echo "[OK] Servidor saludable - $(date)"
