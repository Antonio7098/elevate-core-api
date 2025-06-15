import request from 'supertest';
import app from '../../app';  // Assume app is exported from the main server file
import { prisma } from '../../prisma';  // Import Prisma for test setup

import { GenerateNoteRequest, GenerateQuestionRequest } from '../../types/aiGeneration.types';  // Correct path if needed, assuming src/types directory

describe('AI Routes Integration Tests', () => {
  beforeAll(async () => {
    // Set up test data or mock if needed
    await prisma.$connect();  // Ensure Prisma is initialized
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate a note successfully with valid request', async () => {
    const response = await request(app)
      .post('/api/ai/generate-note')
      .set('Authorization', 'Bearer valid-token')  // Mock auth token if needed
      .send({ sourceId: 'test-source', userId: 1, noteStyle: 'detailed', sourceFidelity: 'high' } as GenerateNoteRequest);
    expect(response.status).toBe(200);  // Adjust expected status based on endpoint implementation
    expect(response.body).toHaveProperty('note');  // Check for expected response fields
  });

  it('should return 400 for missing fields in generate-note', async () => {
    const response = await request(app)
      .post('/api/ai/generate-note')
      .set('Authorization', 'Bearer valid-token')
      .send({ sourceId: 'test-source' });  // Missing other fields
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Missing required fields');
  });

  it('should generate questions successfully with valid request', async () => {
    const response = await request(app)
      .post('/api/ai/generate-questions')
      .set('Authorization', 'Bearer valid-token')
      .send({ sourceId: 'test-source', userId: 1, questionScope: 'detailed', questionTone: 'informal' } as GenerateQuestionRequest);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('questions');
  });

  it('should return 400 for missing fields in generate-questions', async () => {
    const response = await request(app)
      .post('/api/ai/generate-questions')
      .set('Authorization', 'Bearer valid-token')
      .send({ sourceId: 'test-source' });  // Missing other fields
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Missing required fields or invalid input');
  });

  // Add more tests for other endpoints as needed
});
