/**
 * Demo listing context — luxury property for KW ISA MVP.
 * Douglas County, CO — representative Castle Rock / DCSD listing.
 * Each factual answer includes a source citation for the "magic moment" trust sell.
 */
export const DEMO_LISTING = {
  address: '4285 Copper Canyon Dr, Castle Rock, CO 80109',
  price: '$1,895,000',
  beds: 5,
  baths: 5,
  sqft: 5234,
  lotAcres: 0.35,
  description: 'Luxury single-family with mountain views and designer finishes.',
  schoolDistrict: 'Douglas County School District (DCSD)',
  schools: {
    elementary: 'Clear Sky Elementary',
    middle: 'Castle Rock Middle School',
    high: 'Castle View High School',
  },
  hoa: '$85/month',
  features: ['Mountain views', 'Open floor plan', 'Finished basement', 'Main-floor primary', 'Outdoor living space'],
  /** Factual details with source citations — ALWAYS include the citation when answering. */
  sources: {
    roofAge: 'Replaced 2021 (Inspection Report, Page 3)',
    pets: 'Yes, up to 2 pets, 25 lb weight limit per pet (HOA Docs, Page 12)',
    taxes: '$8,420/year (County Records, 2024)',
  },
} as const;

/** Pre-canned demo prompts — questions that reliably showcase the bot. */
export const DEMO_PROMPTS = [
  'How old is the roof?',
  'Are pets allowed?',
  "Draft a text message to the owner asking to schedule a showing.",
] as const;

export function getListingContextForPrompt(): string {
  const { address, price, beds, baths, sqft, lotAcres, schoolDistrict, schools, hoa, features, sources } = DEMO_LISTING;
  return `
LISTING DETAILS (use this exact info when asked). CRITICAL: When answering factual questions, ALWAYS cite the source in parentheses exactly as shown — e.g. "(HOA Docs, Page 12)". This builds trust.
- Address: ${address}
- Price: ${price}
- Bedrooms: ${beds} | Bathrooms: ${baths}
- Square footage: ${sqft} | Lot: ${lotAcres} acres
- HOA: ${hoa}
- School District: ${schoolDistrict}
  - Elementary: ${schools.elementary}
  - Middle: ${schools.middle}
  - High School: ${schools.high}
- Features: ${features.join(', ')}
- Roof: ${sources.roofAge}
- Pets: ${sources.pets}
- Taxes: ${sources.taxes}
`.trim();
}
