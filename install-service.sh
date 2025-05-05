#!/bin/bash

# Build the Next.js application for production
echo "Building Next.js application..."
npm run build

# Copy the service file to systemd directory
echo "Installing systemd service..."
sudo cp /root/Laserkongen/Laserkongen/laserkongen.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable laserkongen.service

# Start the service
sudo systemctl start laserkongen.service

echo "Laserkongen service installed and started"
echo "Check status with: sudo systemctl status laserkongen.service"
echo "View logs with: sudo journalctl -u laserkongen.service"