import { describe, it, expect } from 'vitest';
import { extractedListingSchema } from './listing-extraction-schema';

const valid = {
  price: 450_000,
  beds: 3,
  baths: 2.5,
  address: '123 Main St, Austin, TX 78701',
  description: 'Spacious family home with updated kitchen.',
};

describe('extractedListingSchema', () => {
  it('accepts valid listing data', () => {
    expect(extractedListingSchema.safeParse(valid).success).toBe(true);
    const parsed = extractedListingSchema.safeParse(valid);
    if (parsed.success) {
      expect(parsed.data).toEqual(valid);
    }
  });

  it('accepts null description', () => {
    const withNullDesc = { ...valid, description: null };
    expect(extractedListingSchema.safeParse(withNullDesc).success).toBe(true);
  });

  it('accepts integer baths', () => {
    const intBaths = { ...valid, baths: 2 };
    expect(extractedListingSchema.safeParse(intBaths).success).toBe(true);
  });

  it('rejects zero price', () => {
    const zeroPrice = { ...valid, price: 0 };
    expect(extractedListingSchema.safeParse(zeroPrice).success).toBe(false);
  });

  it('rejects negative price', () => {
    const negPrice = { ...valid, price: -100 };
    expect(extractedListingSchema.safeParse(negPrice).success).toBe(false);
  });

  it('rejects negative beds', () => {
    const negBeds = { ...valid, beds: -1 };
    expect(extractedListingSchema.safeParse(negBeds).success).toBe(false);
  });

  it('rejects non-integer beds', () => {
    const fracBeds = { ...valid, beds: 2.5 };
    expect(extractedListingSchema.safeParse(fracBeds).success).toBe(false);
  });

  it('rejects negative baths', () => {
    const negBaths = { ...valid, baths: -0.5 };
    expect(extractedListingSchema.safeParse(negBaths).success).toBe(false);
  });

  it('rejects empty address', () => {
    const noAddress = { ...valid, address: '' };
    expect(extractedListingSchema.safeParse(noAddress).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { price, ...missingPrice } = valid;
    expect(extractedListingSchema.safeParse(missingPrice).success).toBe(false);
  });

  it('rejects wrong types', () => {
    expect(extractedListingSchema.safeParse({ ...valid, price: '450000' }).success).toBe(false);
    expect(extractedListingSchema.safeParse({ ...valid, beds: '3' }).success).toBe(false);
    expect(extractedListingSchema.safeParse({ ...valid, address: 123 }).success).toBe(false);
  });
});
