#!/bin/bash

# Update package repositories
sudo apt-get update

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get install -y nginx
else
    echo "Nginx is already installed."
fi

# Stop Nginx service
sudo systemctl stop nginx

# Copy our Nginx configuration
sudo cp /root/Laserkongen/Laserkongen/nginx.conf /etc/nginx/sites-available/laserkongen

# Create a symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/laserkongen /etc/nginx/sites-enabled/

# Remove the default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t

# If the test is successful, restart Nginx
if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Restarting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo "Nginx is now running and configured to forward requests to the Laserkongen application."
else
    echo "Nginx configuration test failed. Please check the configuration and try again."
    exit 1
fi

# Update the start script to not use port 80 directly
sed -i 's/sudo npm run dev -- -p 80/npm run dev -- -p 3002/' /root/Laserkongen/Laserkongen/start.sh

echo "Port 80 setup complete. The Laserkongen application is now accessible on port 80 via Nginx."