import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '../trpc';
import { createContext } from '../context';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: { create: vi.fn() },
  })),
}));

vi.mock('@/lib/listing-search', () => ({
  searchListings: vi.fn(),
  DEFAULT_SEARCH_LIMIT: 20,
}));

import { appRouter } from './index';
import { searchListings } from '@/lib/listing-search';

describe('listing.search', () => {
  const createCaller = createCallerFactory(appRouter);

  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    vi.mocked(searchListings).mockResolvedValue([]);
    caller = createCaller(
      await createContext({
        req: new Request('http://localhost'),
        resHeaders: new Headers(),
      })
    );
  });

  it('returns results from searchListings for valid input', async () => {
    const mockListings = [
      {
        id: 'id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        realtorId: 'r1',
        price: '350000',
        beds: 2,
        baths: 1,
        address: '100 Test St',
        description: 'Nice place',
      },
    ];
    vi.mocked(searchListings).mockResolvedValue(mockListings);

    const result = await caller.listing.search({
      query: 'affordable starter home',
    });

    expect(searchListings).toHaveBeenCalledWith(
      'affordable starter home',
      20,
      expect.any(Object)
    );
    expect(result).toEqual(mockListings);
  });

  it('passes custom limit to searchListings', async () => {
    await caller.listing.search({ query: 'condo', limit: 5 });

    expect(searchListings).toHaveBeenCalledWith(
      'condo',
      5,
      expect.any(Object)
    );
  });

  it('rejects empty query', async () => {
    await expect(
      caller.listing.search({ query: '' })
    ).rejects.toThrow();
  });

  it('rejects limit below 1', async () => {
    await expect(
      caller.listing.search({ query: 'house', limit: 0 })
    ).rejects.toThrow();
  });

  it('rejects limit above 50', async () => {
    await expect(
      caller.listing.search({ query: 'house', limit: 51 })
    ).rejects.toThrow();
  });
});
