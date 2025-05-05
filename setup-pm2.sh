#!/bin/bash

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Build the Next.js application for production
echo "Building Next.js application..."
npm run build

# Start the application using PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save the PM2 process list to be restored on reboot
echo "Saving PM2 process list..."
pm2 save

# Setup PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo "PM2 setup complete!"
echo "Your application will now run continuously and restart automatically after system reboots."
echo ""
echo "Useful PM2 commands:"
echo "  - View logs: pm2 logs"
echo "  - Monitor: pm2 monit"
echo "  - Status: pm2 status"
echo "  - Restart: pm2 restart all"
echo "  - Stop: pm2 stop all"