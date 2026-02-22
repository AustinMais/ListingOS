import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  searchListings,
  EMBEDDING_DIMENSIONS,
  DEFAULT_SEARCH_LIMIT,
} from './listing-search';

const mockEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0.1);

const mockRow = {
  id: 'listing-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
  realtorId: 'realtor-1',
  price: new Prisma.Decimal('450000.00'),
  beds: 3,
  baths: 2,
  address: '123 Main St',
  description: 'Spacious family home',
};

describe('searchListings', () => {
  const mockEmbeddingsCreate = vi.fn();
  const mockQueryRaw = vi.fn();

  const deps = {
    openai: {
      embeddings: {
        create: mockEmbeddingsCreate,
      },
    },
    prisma: {
      $queryRaw: mockQueryRaw,
    },
  } as unknown as Parameters<typeof searchListings>[2];

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [...mockEmbedding] }],
    });
    mockQueryRaw.mockResolvedValue([mockRow]);
  });

  it('calls OpenAI embeddings with query and dimensions', async () => {
    await searchListings('family home with yard', 10, deps);

    expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1);
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'family home with yard',
      dimensions: EMBEDDING_DIMENSIONS,
    });
  });

  it('calls prisma.$queryRaw once per search', async () => {
    await searchListings('test query', 5, deps);

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns listings with price as string', async () => {
    const result = await searchListings('house', 10, deps);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'listing-1',
      realtorId: 'realtor-1',
      beds: 3,
      baths: 2,
      address: '123 Main St',
      description: 'Spacious family home',
    });
    expect(result[0]!.price).toBe('450000');
  });

  it('returns multiple rows when prisma returns multiple', async () => {
    const secondRow = {
      ...mockRow,
      id: 'listing-2',
      address: '456 Oak Ave',
      price: new Prisma.Decimal('520000'),
    };
    mockQueryRaw.mockResolvedValue([mockRow, secondRow]);

    const result = await searchListings('home', 20, deps);

    expect(result).toHaveLength(2);
    expect(result[0]!.price).toBe('450000');
    expect(result[1]!.price).toBe('520000');
    expect(result[1]!.address).toBe('456 Oak Ave');
  });

  it('returns empty array when no listings match', async () => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await searchListings('obscure query', 10, deps);

    expect(result).toEqual([]);
  });
});

describe('listing-search constants', () => {
  it('uses 1536 embedding dimensions', () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it('exports default search limit', () => {
    expect(DEFAULT_SEARCH_LIMIT).toBe(20);
  });
});
