import request from 'supertest';
import app from '../app';  // Assume app is exported from the main server file
import prisma from '../lib/prisma';  // Import Prisma for test setup

import { GenerateNoteRequest, GenerateQuestionRequest, NoteStyle, SourceFidelity, QuestionScope, QuestionTone } from '../types/aiGeneration.types';  // Correct path if needed, assuming src/types directory

describe('AI Routes Integration Tests', () => {
  beforeAll(async () => {
    // Set up test data or mock if needed
    await prisma.$connect();  // Ensure Prisma is initialized
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate a note successfully with valid request', async () => {
    const noteRequest: GenerateNoteRequest = {
      sourceId: 'test-source-id',
      noteStyle: NoteStyle.THOROUGH,
      sourceFidelity: SourceFidelity.STRICT,
    };
    const response = await request(app)
      .post('/api/ai/generate-note')
      .set('Authorization', 'Bearer valid-token')  
      .send(noteRequest);
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
    const questionRequest: GenerateQuestionRequest = {
      sourceId: 'test-source-id',
      questionScope: QuestionScope.THOROUGH,
      questionTone: QuestionTone.FORMAL,
    };
    const response = await request(app)
      .post('/api/ai/generate-questions')
      .set('Authorization', 'Bearer valid-token')
      .send(questionRequest);
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
