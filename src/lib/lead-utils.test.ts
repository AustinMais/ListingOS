import { describe, it, expect } from 'vitest';
import { hasPhoneNumber, isQualifiedLead } from './lead-utils';

describe('hasPhoneNumber', () => {
  it('returns true for xxx-xxx-xxxx', () => {
    expect(hasPhoneNumber('Call me at 303-555-1234')).toBe(true);
    expect(hasPhoneNumber('303-555-1234')).toBe(true);
  });

  it('returns true for xxx.xxx.xxxx', () => {
    expect(hasPhoneNumber('303.555.1234')).toBe(true);
  });

  it('returns true for (xxx) xxx-xxxx', () => {
    expect(hasPhoneNumber('(303) 555-1234')).toBe(true);
    expect(hasPhoneNumber('(303)555-1234')).toBe(true);
  });

  it('returns true for spaces only', () => {
    expect(hasPhoneNumber('303 555 1234')).toBe(true);
  });

  it('returns false when no phone number', () => {
    expect(hasPhoneNumber('Just text me')).toBe(false);
    expect(hasPhoneNumber('')).toBe(false);
    expect(hasPhoneNumber('303-55-123')).toBe(false);
  });
});

describe('isQualifiedLead', () => {
  it('returns true when user expressed interest then gave phone', () => {
    const messages = [
      { role: 'user', content: 'I want to see the house' },
      { role: 'assistant', content: 'Great, what is the best phone number?' },
      { role: 'user', content: '303-555-1234' },
    ];
    expect(isQualifiedLead(messages)).toBe(true);
  });

  it('returns true for "schedule a showing" then phone', () => {
    const messages = [
      { role: 'user', content: 'Can I schedule a showing?' },
      { role: 'user', content: 'My number is (720) 555-9999' },
    ];
    expect(isQualifiedLead(messages)).toBe(true);
  });

  it('returns false when interest but no phone', () => {
    const messages = [
      { role: 'user', content: 'I want to view the property' },
      { role: 'assistant', content: 'Sure!' },
    ];
    expect(isQualifiedLead(messages)).toBe(false);
  });

  it('returns false when phone but no viewing interest', () => {
    const messages = [
      { role: 'user', content: 'What is the price?' },
      { role: 'user', content: 'Call me at 303-555-1234' },
    ];
    expect(isQualifiedLead(messages)).toBe(false);
  });

  it('returns false for empty messages', () => {
    expect(isQualifiedLead([])).toBe(false);
  });

  it('handles message with phone after interest', () => {
    const messages = [
      { role: 'user', content: 'I want to tour the house' },
      { role: 'user', content: '555-123-4567' },
    ];
    expect(isQualifiedLead(messages)).toBe(true);
  });
});
