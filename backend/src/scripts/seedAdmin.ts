import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@feedpulse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        password: adminPassword,
      });
      await admin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedAdmin();