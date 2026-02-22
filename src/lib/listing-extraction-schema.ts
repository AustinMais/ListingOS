import { z } from 'zod';

/**
 * Schema for AI-extracted listing data from PDF/text.
 * Matches Prisma Listing fields that can be parsed from a listing sheet
 * (id, realtorId, createdAt, updatedAt, embedding are set by the app).
 */
export const extractedListingSchema = z.object({
  price: z
    .number()
    .positive()
    .describe('Listing price in dollars (numeric only, no commas)'),
  beds: z
    .number()
    .int()
    .min(0)
    .describe('Number of bedrooms'),
  baths: z
    .number()
    .min(0)
    .describe('Number of bathrooms (can be half baths, e.g. 2.5)'),
  address: z
    .string()
    .min(1)
    .describe('Full street address (number, street, city, state, ZIP)'),
  description: z
    .string()
    .nullable()
    .describe(
      'Property description or remarks from the listing sheet; null if not present'
    ),
});

export type ExtractedListing = z.infer<typeof extractedListingSchema>;
