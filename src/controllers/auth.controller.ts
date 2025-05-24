import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Check for JWT_SECRET
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ message: 'Internal server error: JWT configuration missing' });
      return;
    }

    // Define expiresIn option
    const expiresInSeconds = 24 * 60 * 60; // 24 hours in seconds
    const signOptions: jwt.SignOptions = {
      expiresIn: expiresInSeconds,
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      secret, // Now known to be a string
      signOptions
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
    return;
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
    return;
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check for JWT_SECRET
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ message: 'Internal server error: JWT configuration missing' });
      return;
    }

    // Define expiresIn option
    const expiresInSeconds = 24 * 60 * 60; // 24 hours in seconds
    const signOptions: jwt.SignOptions = {
      expiresIn: expiresInSeconds,
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      secret, // Now known to be a string
      signOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
    return;
  }
};
