import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!idToken || !clientId) {
      res.status(400).json({ message: 'Missing idToken or GOOGLE_CLIENT_ID' });
      return;
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(401).json({ message: 'Invalid Google token' });
      return;
    }

    const email = payload.email;
    const name = payload.name || undefined;
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, password: crypto.randomBytes(32).toString('hex'), googleId, isVerified: true },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'JWT secret missing' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: 60 * 60 * 24 });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    return;
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
    return;
  }
};

export const requestEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.verificationToken.create({ data: { token, userId: user.id, expiresAt } });

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@elevate.local',
      to: user.email,
      subject: 'Verify your email',
      text: `Click to verify your email: ${verifyUrl}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    res.json({ message: 'Verification email sent' });
    return;
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
    return;
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }
    await prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } });
    await prisma.verificationToken.delete({ where: { id: record.id } });
    res.json({ message: 'Email verified successfully' });
    return;
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed' });
    return;
  }
};
