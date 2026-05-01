#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  sudo bash setup-duckdns-livekit.sh <duckdns-domain> <livekit-api-key> <livekit-api-secret> [duckdns-token]

Example:
  sudo bash setup-duckdns-livekit.sh ogadoctorrtc.duckdns.org LK_XXXX SECRET_XXXX your_duckdns_token
USAGE
  exit 0
fi

if [[ $# -lt 3 || $# -gt 4 ]]; then
  echo "Missing required arguments. Run with --help."
  exit 1
fi

DOMAIN="$1"
LIVEKIT_API_KEY="$2"
LIVEKIT_API_SECRET="$3"
DUCKDNS_TOKEN="${4:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root (sudo)."
  exit 1
fi

if ! [[ "$DOMAIN" =~ \.duckdns\.org$ ]]; then
  echo "Warning: domain does not end with .duckdns.org (${DOMAIN})"
fi

echo "[1/9] Installing dependencies..."
apt-get update -y
apt-get install -y curl ca-certificates gnupg ufw caddy

echo "[2/9] Installing LiveKit server binary..."
if ! command -v livekit-server >/dev/null 2>&1; then
  curl -sSL https://get.livekit.io | bash
fi

if ! command -v livekit-server >/dev/null 2>&1; then
  echo "livekit-server not found after install. Install manually and re-run."
  exit 1
fi

install -m 0755 "$(command -v livekit-server)" /usr/local/bin/livekit-server

echo "[3/9] Writing LiveKit config..."
mkdir -p /etc/livekit
cat >/etc/livekit/livekit.yaml <<EOF
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true
keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}
EOF

echo "[4/9] Registering systemd service..."
cat >/etc/systemd/system/livekit.service <<'EOF'
[Unit]
Description=LiveKit Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit/livekit.yaml
Restart=always
RestartSec=2
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

echo "[5/9] Configuring Caddy TLS reverse proxy..."
cat >/etc/caddy/Caddyfile <<EOF
${DOMAIN} {
  reverse_proxy 127.0.0.1:7880
}
EOF

echo "[6/9] Opening firewall ports..."
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 7881/tcp || true
ufw allow 50000:50100/udp || true
ufw --force enable || true

echo "[7/9] Starting services..."
systemctl daemon-reload
systemctl enable --now livekit
systemctl enable --now caddy
systemctl restart caddy

echo "[8/9] Optional DuckDNS auto-refresh setup..."
if [[ -n "$DUCKDNS_TOKEN" ]]; then
  mkdir -p /opt/duckdns
  cat >/opt/duckdns/update.sh <<EOF
#!/usr/bin/env bash
curl -fsS "https://www.duckdns.org/update?domains=${DOMAIN%%.duckdns.org}&token=${DUCKDNS_TOKEN}&ip="
EOF
  chmod +x /opt/duckdns/update.sh
  (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/duckdns/update.sh >/dev/null 2>&1") | crontab -
fi

echo "[9/9] Health checks..."
sleep 2
systemctl --no-pager --full status livekit | sed -n '1,20p' || true
systemctl --no-pager --full status caddy | sed -n '1,20p' || true
curl -I "https://${DOMAIN}" || true

echo ""
echo "Setup complete."
echo "Now set backend env vars:"
echo "  LIVEKIT_PUBLIC_URL=wss://${DOMAIN}"
echo "  LIVEKIT_API_KEY=${LIVEKIT_API_KEY}"
echo "  LIVEKIT_API_SECRET=<same value used on this VM>"
echo ""
echo "If call media still fails, open the same ports in your cloud provider firewall/security group."
