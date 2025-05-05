module.exports = {
  apps: [
    {
      name: 'laserkongen-backend',
      script: 'backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      output: 'backend.log',
      error: 'backend-error.log',
    },
    {
      name: 'laserkongen-frontend',
      script: 'npm',
      args: 'run start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      output: 'frontend.log',
      error: 'frontend-error.log',
    },
  ],
};