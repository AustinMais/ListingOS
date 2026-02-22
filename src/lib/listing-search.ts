import type OpenAI from 'openai';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_SEARCH_LIMIT = 20;

export type SearchListingRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  realtorId: string;
  price: Prisma.Decimal;
  beds: number;
  baths: number;
  address: string;
  description: string | null;
};

export type SearchListingResult = Omit<SearchListingRow, 'price'> & {
  price: string;
};

export type ListingSearchDeps = {
  openai: OpenAI;
  prisma: PrismaClient;
};

/**
 * Generates an embedding for the query and returns listings ordered by cosine similarity.
 * Used by the tRPC listing.search procedure.
 */
export async function searchListings(
  query: string,
  limit: number,
  deps: ListingSearchDeps
): Promise<SearchListingResult[]> {
  const {
    data: [{ embedding }],
  } = await deps.openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const vectorStr = `[${embedding.join(',')}]`;

  const rows = await deps.prisma.$queryRaw<SearchListingRow[]>(Prisma.sql`
    SELECT id, "createdAt", "updatedAt", "realtorId", price, beds, baths, address, description
    FROM "Listing"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
    ...row,
    price: row.price.toString(),
  }));
}
