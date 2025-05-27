import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Function to generate a JWT token for a user
async function generateToken(email: string, password: string): Promise<string | null> {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found');
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error('Invalid password');
      return null;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    return null;
  }
}

// Main function
async function main() {
  // If email and password are provided as arguments, use them
  const email = process.argv[2] || 'test@example.com';
  const password = process.argv[3] || 'password123';

  console.log(`Attempting to generate token for user: ${email}`);
  
  const token = await generateToken(email, password);
  
  if (token) {
    console.log('\nJWT Token generated successfully:');
    console.log(token);
    console.log('\nUse this token in your API requests:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3333/api/questionsets/1/questions`);
  } else {
    console.log('Failed to generate token. Please check your credentials.');
    
    // If token generation failed, try to create a test user
    console.log('\nAttempting to create a test user...');
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });
      
      console.log(`Test user created with ID: ${newUser.id}`);
      
      // Generate token for the new user
      const newToken = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('\nJWT Token for new user:');
      console.log(newToken);
      console.log('\nUse this token in your API requests:');
      console.log(`curl -H "Authorization: Bearer ${newToken}" http://localhost:3333/api/questionsets/1/questions`);
    } catch (createError) {
      console.error('Error creating test user:', createError);
      console.log('\nAlternatively, you can use this hardcoded token for testing:');
      const hardcodedToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log(hardcodedToken);
      console.log('\nUse this token in your API requests:');
      console.log(`curl -H "Authorization: Bearer ${hardcodedToken}" http://localhost:3333/api/questionsets/1/questions`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
