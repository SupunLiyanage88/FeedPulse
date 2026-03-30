import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@feedpulse.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Server auth configuration error (missing JWT secret)',
      });
    }

    const expiresIn =
      (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '7d';
    
    // Hardcoded admin check (for simplicity)
    if (email === adminEmail && password === adminPassword) {
      // Create token
      const token = jwt.sign(
        { email, role: 'admin' },
        jwtSecret,
        { expiresIn }
      );
      
      return res.json({
        success: true,
        data: { token, user: { email, role: 'admin' } },
        message: 'Login successful',
      });
    }
    
    // Optional: Check database for user
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'admin' },
      jwtSecret,
      { expiresIn }
    );
    
    res.json({
      success: true,
      data: { token, user: { email: user.email, role: 'admin' } },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};