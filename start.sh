#!/bin/bash

# Check if anything is running on ports 3000 and 3002
echo "Checking for processes on ports 3000 and 3002..."
port_3000_pid=$(lsof -ti:3000)
port_3002_pid=$(lsof -ti:3002)

# Kill processes if found
if [ -n "$port_3000_pid" ]; then
  echo "Process found on port 3000. Killing process..."
  kill -9 $port_3000_pid
fi

if [ -n "$port_3002_pid" ]; then
  echo "Process found on port 3002. Killing process..."
  kill -9 $port_3002_pid
fi

# Start the backend server in the background
echo "Starting the backend server..."
node backend/server.js > backend.log 2>&1 &
backend_pid=$!

# Wait for the backend to start
echo "Waiting for the backend to start..."
sleep 5

# Start the frontend server on port 3002
echo "Starting the frontend server on port 3002..."
PORT=3002 npm run dev

# When the script receives a SIGINT, kill the backend server
trap "kill $backend_pid" SIGINT