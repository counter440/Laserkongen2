#!/bin/bash
set -e

echo "=== Complete Laserkongen System Restart ==="

# 1. Stop systemd service if it exists
if systemctl list-units --full -all | grep -Fq "laserkongen.service"; then
  echo "Stopping laserkongen service..."
  sudo systemctl stop laserkongen
  sleep 2
else
  echo "Laserkongen service not found, continuing with manual process cleanup."
fi

# 2. Forcefully kill any remaining processes
echo "Killing any processes on ports 5001 and 3002..."
sudo fuser -k 5001/tcp || true
sudo fuser -k 3002/tcp || true

echo "Killing any Node.js processes matching our app..."
sudo pkill -f "node backend/server.js" || true
sudo pkill -f "next" || true
sleep 2

# 3. Build Next.js application
cd /root/Laserkongen/Laserkongen
echo "Building Next.js application..."
npm run build

# 4. Update systemd service file
echo "Updating systemd service file..."
cat > /tmp/laserkongen.service << EOF
[Unit]
Description=Laserkongen Application
After=network.target mysql.service
StartLimitIntervalSec=0

[Service]
Type=forking
User=root
WorkingDirectory=/root/Laserkongen/Laserkongen
ExecStart=/bin/bash -c 'node backend/server.js > /root/Laserkongen/Laserkongen/backend.log 2>&1 & PORT=3002 npm run start > /root/Laserkongen/Laserkongen/frontend.log 2>&1 &'
Restart=always
RestartSec=10
KillMode=mixed
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/laserkongen.service /etc/systemd/system/laserkongen.service
sudo systemctl daemon-reload

# 5. Start the service
echo "Starting laserkongen service..."
sudo systemctl restart laserkongen
sleep 5

# 6. Check service status
echo "Service status:"
sudo systemctl status laserkongen --no-pager

echo "=== Restart process completed ==="
echo "Check logs:"
echo "  - Backend: /root/Laserkongen/Laserkongen/backend.log"
echo "  - Frontend: /root/Laserkongen/Laserkongen/frontend.log"
echo "  - Service: sudo journalctl -u laserkongen -f"
echo "The application should be available at http://localhost:3002"