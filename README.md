# Laserkongen - 3D Printing & Laser Engraving E-commerce Platform

A modern e-commerce platform for 3D printing and laser engraving services with custom design upload capabilities, real-time cost calculation, and a fully functional admin dashboard.

## Features

- **Dual-service Platform**: Offering both 3D printing and laser engraving services
- **Custom Design Upload**: Upload your own 3D models or image files
- **Real-time Cost Calculation**: Instant pricing based on material usage, size, and complexity
- **Model Visualization**: 3D preview for uploaded models
- **Product Shop**: Ready-made products for direct purchase
- **User Accounts**: Save designs, order history, and track deliveries
- **Admin Dashboard**: Comprehensive admin panel for order and user management
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: 
  - React/Next.js
  - Tailwind CSS
  - Three.js (for 3D model rendering)
  - React-Three-Fiber (React renderer for Three.js)

- **Backend**:
  - Node.js
  - Express.js
  - MySQL (primary database)
  - Mongoose/MongoDB (secondary database)
  - Multer (file uploads)
  - JWT Authentication
  
- **Payment**:
  - Vipps integration
  - Stripe integration (planned)
  
## Getting Started

### Prerequisites

- Node.js 16.x or higher
- MySQL database
- MongoDB (optional)
- NPM or Yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/counter440/Laserkongen2.git
   cd Laserkongen2
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables by creating a `.env` file:
   ```
   NODE_ENV=development
   PORT=5000
   MYSQL_HOST=localhost
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=laserkongen
   JWT_SECRET=your_jwt_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start both the backend server and frontend application:
   ```
   ./start.sh
   ```
   
   Or start them separately:
   ```
   # Terminal 1: Start the backend server
   npm run server
   
   # Terminal 2: Start the frontend application
   npm run dev
   ```

5. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Initial Setup

To access the admin dashboard, you'll need to create an admin account:

1. Go to http://localhost:3000/setup
2. Create an admin account using the secret key: `laserkongen_admin_setup_key`
3. Once created, you can log in with your admin credentials at http://localhost:3000/login

## Deployment

For production deployment, we recommend:

1. Building the Next.js application:
   ```
   npm run build
   ```

2. Using the provided systemd service file to run the application as a service:
   ```
   sudo ./install-service.sh
   ```

## License

This project is proprietary software.
