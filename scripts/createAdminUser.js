/**
 * This script creates an admin user directly in the in-memory database.
 * Run this script with: node scripts/createAdminUser.js
 */

const bcrypt = require('bcryptjs');
const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');

dotenv.config();

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check if admin user already exists
    const existingUser = await db.collection('users').findOne({ email: 'admin@laserkongen.no' });
    
    if (existingUser) {
      console.log('Admin user already exists');
      await client.close();
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@laserkongen.no',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('Admin user created with ID:', result.insertedId);
    console.log('Email: admin@laserkongen.no');
    console.log('Password: admin123');
    
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();