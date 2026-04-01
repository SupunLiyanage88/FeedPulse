jest.mock('../src/services/geminiService', () => ({
  __esModule: true,
  default: {
    analyzeFeedback: jest.fn(),
    generateWeeklySummary: jest.fn(),
  },
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Feedback from '../src/models/Feedback';
import geminiService from '../src/services/geminiService';
import { eventually } from './helpers/eventually';

const mockedGemini = geminiService as unknown as {
  analyzeFeedback: jest.Mock;
  generateWeeklySummary: jest.Mock;
};

describe('Feedback API', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('POST /api/feedback — valid submission saves to DB and triggers AI', async () => {
    mockedGemini.analyzeFeedback.mockResolvedValue({
      category: 'Bug',
      sentiment: 'Negative',
      priority_score: 8,
      summary: 'Login fails on slow networks.',
      tags: ['Authentication', 'Performance'],
    });

    const payload = {
      title: 'Login intermittently fails',
      description: 'When using a slow connection, login sometimes fails with no error.',
      category: 'Bug',
      submitterName: 'Test User',
      submitterEmail: 'test@example.com',
    };

    const response = await request(app).post('/api/feedback').send(payload);

    expect(response.status).toBe(201);
    expect(response.body?.success).toBe(true);

    const id = response.body?.data?._id as string | undefined;
    expect(typeof id).toBe('string');

    const saved = await Feedback.findById(id);
    expect(saved).toBeTruthy();
    expect(saved?.title).toBe(payload.title);

    expect(mockedGemini.analyzeFeedback).toHaveBeenCalledWith(payload.title, payload.description);

    await eventually(async () => {
      const analyzed = await Feedback.findById(id);
      expect(analyzed?.ai_processed).toBe(true);
      expect(analyzed?.ai_category).toBe('Bug');
      expect(analyzed?.ai_sentiment).toBe('Negative');
      expect(analyzed?.ai_priority).toBe(8);
      expect(analyzed?.ai_summary).toBe('Login fails on slow networks.');
      expect(analyzed?.ai_tags).toEqual(['Authentication', 'Performance']);
    });
  });

  test('POST /api/feedback — rejects empty title (validation test)', async () => {
    const payload = {
      title: '',
      description: 'This description is long enough to pass validation.',
      category: 'Other',
    };

    const response = await request(app).post('/api/feedback').send(payload);

    expect(response.status).toBe(400);
    expect(response.body?.success).toBe(false);
  });

  test('PATCH /api/feedback/:id — status update works correctly', async () => {
    const feedback = await Feedback.create({
      title: 'Status update test',
      description: 'This description is long enough to satisfy schema validation.',
      category: 'Improvement',
    });

    const token = jwt.sign(
      { email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .patch(`/api/feedback/${feedback._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Resolved' });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
    expect(response.body?.data?.status).toBe('Resolved');

    const updated = await Feedback.findById(feedback._id);
    expect(updated?.status).toBe('Resolved');
  });

  test('Auth middleware — protected routes reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/feedback');

    expect(response.status).toBe(401);
    expect(response.body?.success).toBe(false);
    expect(response.body?.message).toBe('Authentication required');
  });
});
