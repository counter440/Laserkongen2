#!/bin/bash

echo "Restarting Laserkongen application using systemd service..."

# Stop the service
sudo systemctl stop laserkongen
echo "Service stopped. Waiting for all processes to terminate..."
sleep 5

# Kill any remaining processes on the server port to ensure ports are free
echo "Checking for processes on ports 5001 and 3002..."
port_5001_pid=$(lsof -ti:5001)
port_3002_pid=$(lsof -ti:3002)

if [ -n "$port_5001_pid" ]; then
  echo "Process found on port 5001. Killing process..."
  kill -9 $port_5001_pid
fi

if [ -n "$port_3002_pid" ]; then
  echo "Process found on port 3002. Killing process..."
  kill -9 $port_3002_pid
fi

# Ensure the next build exists
echo "Checking if Next.js build exists..."
if [ ! -d ".next" ]; then
  echo "Building Next.js application..."
  npm run build
fi

# Start the service
echo "Starting the service..."
sudo systemctl start laserkongen

# Check the status
echo "Checking service status..."
sleep 5
sudo systemctl status laserkongen

echo "Restart completed. The application should be available at http://localhost:3002"
echo "Check logs with: sudo journalctl -u laserkongen -f"
