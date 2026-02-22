import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientName } from './config';

const originalEnv = process.env;

describe('getClientName', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CLIENT_NAME;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default "ListingOS" when CLIENT_NAME is not set', () => {
    expect(getClientName()).toBe('ListingOS');
  });

  it('returns CLIENT_NAME when set', () => {
    process.env.CLIENT_NAME = 'Acme Realty';
    expect(getClientName()).toBe('Acme Realty');
  });
});
