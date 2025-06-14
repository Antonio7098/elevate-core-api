import dotenv from 'dotenv';

dotenv.config();

export const config = {
  aiService: {
    url: process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
    apiVersion: process.env.AI_SERVICE_API_VERSION || 'v1'
  }
}; 