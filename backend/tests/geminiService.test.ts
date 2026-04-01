const generateContentMock = jest.fn();
const GoogleGenAIMock = jest.fn().mockImplementation(() => ({
  models: {
    generateContent: generateContentMock,
  },
}));

jest.mock('@google/genai', () => ({
  GoogleGenAI: GoogleGenAIMock,
}));

describe('Gemini service', () => {
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

  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'test-model';

    generateContentMock.mockReset();
    GoogleGenAIMock.mockClear();
  });

  test('mock API call and parse fenced JSON (normalizes trailing commas, fields, tags)', async () => {
    generateContentMock.mockResolvedValue({
      text: [
        '```json',
        '{',
        '  "category": "feature",',
        '  "sentiment": "pos",',
        '  "priority_score": 8.7,',
        '  "summary": "Users want dark mode.",',
        '  "tags": ["UI", "Accessibility", "UI",],',
        '}',
        '```',
      ].join('\n'),
    });

    const { default: geminiService } = await import('../src/services/geminiService');

    const result = await geminiService.analyzeFeedback('Dark mode request', 'Please add dark mode.');

    expect(result).toEqual({
      category: 'Feature Request',
      sentiment: 'Positive',
      priority_score: 9,
      summary: 'Users want dark mode.',
      tags: ['UI', 'Accessibility'],
    });

    expect(GoogleGenAIMock).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(generateContentMock).toHaveBeenCalled();
  });

  test('retries prompts when first response is not parseable JSON', async () => {
    generateContentMock
      .mockResolvedValueOnce({ text: 'Sorry, here is an explanation instead of JSON.' })
      .mockResolvedValueOnce({
        text: 'Here you go: {"category":"Bug","sentiment":"negative","priority_score":10,"summary":"Login fails.","tags":"Auth, UI"}',
      });

    const { default: geminiService } = await import('../src/services/geminiService');

    const result = await geminiService.analyzeFeedback('Login broken', 'Login fails with 500.');

    expect(result).toEqual({
      category: 'Bug',
      sentiment: 'Negative',
      priority_score: 10,
      summary: 'Login fails.',
      tags: ['Auth', 'UI'],
    });

    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });
});
