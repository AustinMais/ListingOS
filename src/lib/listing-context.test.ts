import { describe, it, expect } from 'vitest';
import { getListingContextForPrompt, DEMO_LISTING } from './listing-context';

describe('listing-context', () => {
  describe('DEMO_LISTING', () => {
    it('has expected property fields', () => {
      expect(DEMO_LISTING.address).toBe('4285 Copper Canyon Dr, Castle Rock, CO 80109');
      expect(DEMO_LISTING.price).toBe('$1,895,000');
      expect(DEMO_LISTING.beds).toBe(5);
      expect(DEMO_LISTING.baths).toBe(5);
      expect(DEMO_LISTING.schoolDistrict).toBe('Douglas County School District (DCSD)');
      expect(DEMO_LISTING.sources.roofAge).toContain('2021');
      expect(DEMO_LISTING.sources.pets).toContain('HOA Docs');
    });
  });

  describe('getListingContextForPrompt', () => {
    it('returns a string containing listing details', () => {
      const context = getListingContextForPrompt();
      expect(context).toContain(DEMO_LISTING.address);
      expect(context).toContain(DEMO_LISTING.price);
      expect(context).toContain('LISTING DETAILS');
      expect(context).toContain('CRITICAL');
      expect(context).toContain('(HOA Docs, Page 12)');
    });

    it('includes school and source citation instructions', () => {
      const context = getListingContextForPrompt();
      expect(context).toContain(DEMO_LISTING.schools.elementary);
      expect(context).toContain(DEMO_LISTING.sources.taxes);
    });
  });
});
