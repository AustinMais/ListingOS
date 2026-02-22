import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  Output: { object: (opts: unknown) => opts },
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'openai-model'),
}));

const mockPdfParse = vi.fn();
vi.mock('pdf-parse', () => ({
  __esModule: true,
  default: (buf: Buffer) => mockPdfParse(buf),
}));

import { parseListingFromText, parseListingFromPdfBuffer } from './parse-listing-pdf';

const validExtracted = {
  price: 525_000,
  beds: 4,
  baths: 2.5,
  address: '456 Oak Ave, Denver, CO 80202',
  description: 'Keller Williams listing. Great neighborhood.',
};

describe('parseListingFromText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when text is empty', async () => {
    const result = await parseListingFromText('');
    expect(result).toEqual({ ok: false, error: 'PDF text is empty' });
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('returns error when text is only whitespace', async () => {
    const result = await parseListingFromText('   \n\t  ');
    expect(result).toEqual({ ok: false, error: 'PDF text is empty' });
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('returns extracted data when OpenAI returns valid object', async () => {
    mockGenerateText.mockResolvedValue({ output: validExtracted });

    const result = await parseListingFromText('List price $525,000. 4 bed, 2.5 bath. 456 Oak Ave.');

    expect(result).toEqual({ ok: true, data: validExtracted });
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('456 Oak Ave'),
        system: expect.any(String),
      })
    );
  });

  it('returns error when OpenAI output fails schema validation', async () => {
    mockGenerateText.mockResolvedValue({
      output: { ...validExtracted, price: -100 },
    });

    const result = await parseListingFromText('Some listing text.');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Validation failed/);
    }
  });

  it('returns error when OpenAI throws', async () => {
    mockGenerateText.mockRejectedValue(new Error('API rate limit'));

    const result = await parseListingFromText('Listing content here.');

    expect(result).toEqual({ ok: false, error: 'Extraction failed: API rate limit' });
  });
});

describe('parseListingFromPdfBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts text from buffer then returns extracted listing', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Price $525,000. 456 Oak Ave, Denver.' });
    mockGenerateText.mockResolvedValue({ output: validExtracted });

    const result = await parseListingFromPdfBuffer(Buffer.from('fake-pdf-bytes'));

    expect(mockPdfParse).toHaveBeenCalledWith(Buffer.from('fake-pdf-bytes'));
    expect(result).toEqual({ ok: true, data: validExtracted });
  });

  it('returns error when pdf-parse throws', async () => {
    mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));

    const result = await parseListingFromPdfBuffer(Buffer.from('not-a-pdf'));

    expect(result).toEqual({ ok: false, error: 'PDF parse failed: Invalid PDF' });
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('returns error when extracted text is empty', async () => {
    mockPdfParse.mockResolvedValue({ text: '   \n' });

    const result = await parseListingFromPdfBuffer(Buffer.from('empty-pdf'));

    expect(result).toEqual({ ok: false, error: 'PDF text is empty' });
  });
});
