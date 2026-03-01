'use server';

import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  extractedListingSchema,
  type ExtractedListing,
} from '@/lib/listing-extraction-schema';

const LISTING_EXTRACTION_SYSTEM = `You are an expert at parsing Keller Williams and real estate listing sheets (PDFs, flyers, and MLS-style documents).

Your task is to extract structured property details from the provided text. The text may come from:
- Keller Williams listing presentation sheets or one-sheets
- MLS printouts or export text
- Listing flyers or marketing copy
- PDFs that were converted to plain text

Extraction rules:
- **Price**: Extract the list/sale price as a single number (no commas, no $). If you see "Sold" or "Pending" with a price, use that price. Ignore "assessed value" or "tax value" unless it's the only price.
- **Beds/Baths**: Use whole numbers for bedrooms. For bathrooms, use decimals for half-baths (e.g. 2.5 = 2 full + 1 half). If only "full baths" is given, use that as the number; if "half" is mentioned, add 0.5 per half bath.
- **Address**: Use the full mailing-style address (street number, street name, unit if any, city, state, ZIP). If the document has "Property address" or "Listing address", prefer that. Normalize state to 2-letter abbreviation.
- **Description**: Concatenate the main property description, remarks, or "Agent remarks" into one string. Omit legal disclaimers and contact blocks. Use null if there is no meaningful description.

Be robust to odd formatting, tables, and headers. If a value is missing or unreadable, infer from context when reasonable; otherwise use 0 for numeric fields or empty string for address (description can be null).`;

export type ParseListingPdfResult =
  | { ok: true; data: ExtractedListing }
  | { ok: false; error: string };

/**
 * Extracts listing details from raw PDF text using OpenAI structured outputs.
 * Use this when you already have the PDF content as text (e.g. from pdf-parse).
 *
 * To save to DB: `prisma.listing.create({ data: { ...result.data, realtorId } })`
 * (price/beds/baths/address/description match the Listing model; id/realtorId/timestamps set by Prisma.)
 */
export async function parseListingFromText(
  pdfText: string
): Promise<ParseListingPdfResult> {
  const trimmed = pdfText.trim();
  if (!trimmed) {
    return { ok: false, error: 'PDF text is empty' };
  }

  try {
    const { output } = await generateText({
      model: openai('gpt-4o'),
      system: LISTING_EXTRACTION_SYSTEM,
      prompt: `Extract the listing details from this real estate document text:\n\n${trimmed}`,
      output: Output.object({
        name: 'ExtractedListing',
        description: 'Property details extracted from a Keller Williams style listing sheet',
        schema: extractedListingSchema,
      }),
    });

    const parsed = extractedListingSchema.safeParse(output);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Validation failed: ${parsed.error.message}`,
      };
    }

    return { ok: true, data: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Extraction failed: ${message}` };
  }
}

/**
 * Extracts listing details from a PDF buffer using pdf-parse, then OpenAI.
 * Use this when you have the raw PDF file (e.g. from a form upload or FormData).
 */
export async function parseListingFromPdfBuffer(
  pdfBuffer: Buffer
): Promise<ParseListingPdfResult> {
  let text: string;
  try {
    // pdf-parse returns { text: string, numpages, info, ... }
    const pdfParse = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(pdfBuffer);
    text = result?.text ?? '';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `PDF parse failed: ${message}` };
  }

  return parseListingFromText(text);
}
