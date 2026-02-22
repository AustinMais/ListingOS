import { z } from 'zod';
import OpenAI from 'openai';
import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/db';
import {
  searchListings,
  DEFAULT_SEARCH_LIMIT,
} from '@/lib/listing-search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const listingSearchInputSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(50).optional().default(DEFAULT_SEARCH_LIMIT),
});

export const listingRouter = router({
  search: publicProcedure
    .input(listingSearchInputSchema)
    .query(async ({ input }) => {
      return searchListings(input.query, input.limit, { openai, prisma });
    }),
});
