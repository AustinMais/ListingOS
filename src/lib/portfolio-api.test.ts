import { describe, it, expect } from 'vitest';
import { normalizeBaseUrl } from './portfolio-api';

describe('normalizeBaseUrl', () => {
  it('strips trailing /api', () => {
    expect(normalizeBaseUrl('http://localhost:3000/api')).toBe('http://localhost:3000');
  });

  it('strips trailing /api/', () => {
    expect(normalizeBaseUrl('http://localhost:3000/api/')).toBe('http://localhost:3000');
  });

  it('leaves base without /api unchanged', () => {
    expect(normalizeBaseUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('does not strip /api in the middle', () => {
    expect(normalizeBaseUrl('http://example.com/api/v2')).toBe('http://example.com/api/v2');
  });

  it('returns base when result would be empty', () => {
    expect(normalizeBaseUrl('/api')).toBe('/api');
  });
});
