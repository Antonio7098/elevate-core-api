/**
 * Debug Environment Variables
 * 
 * This script directly accesses environment variables to debug loading issues.
 */

import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Checking if .env file exists at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  // Read the .env file content
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n.env file content:');
  console.log(envContent);
}

// Print all environment variables
console.log('\nEnvironment variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`AI_SERVICE_BASE_URL: ${process.env.AI_SERVICE_BASE_URL}`);
console.log(`AI_SERVICE_API_KEY: ${process.env.AI_SERVICE_API_KEY ? '***' + process.env.AI_SERVICE_API_KEY.substring(process.env.AI_SERVICE_API_KEY.length - 4) : 'undefined'}`);
console.log(`AI_SERVICE_API_VERSION: ${process.env.AI_SERVICE_API_VERSION}`);

// Print all environment variables
console.log('\nAll environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('AI_SERVICE')) {
    console.log(`${key}: ${key.includes('KEY') ? '***' + process.env[key]?.substring(process.env[key]!.length - 4) : process.env[key]}`);
  }
});
