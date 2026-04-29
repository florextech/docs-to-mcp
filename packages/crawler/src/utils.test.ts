import { describe, it, expect } from 'vitest';
import { normalizeUrl, isSameOrigin, shouldFollow } from './utils.js';

describe('normalizeUrl', () => {
  it('strips hash fragments', () => {
    expect(normalizeUrl('https://docs.example.com/page#section')).toBe(
      'https://docs.example.com/page',
    );
  });

  it('strips query parameters', () => {
    expect(normalizeUrl('https://docs.example.com/page?ref=nav')).toBe(
      'https://docs.example.com/page',
    );
  });

  it('strips trailing slashes', () => {
    expect(normalizeUrl('https://docs.example.com/page/')).toBe(
      'https://docs.example.com/page',
    );
  });

  it('handles root URL', () => {
    expect(normalizeUrl('https://docs.example.com/')).toBe(
      'https://docs.example.com',
    );
  });

  it('preserves path', () => {
    expect(normalizeUrl('https://docs.example.com/a/b/c')).toBe(
      'https://docs.example.com/a/b/c',
    );
  });
});

describe('isSameOrigin', () => {
  it('returns true for same origin', () => {
    expect(
      isSameOrigin('https://docs.example.com/a', 'https://docs.example.com/b'),
    ).toBe(true);
  });

  it('returns false for different origin', () => {
    expect(
      isSameOrigin('https://docs.example.com', 'https://other.com'),
    ).toBe(false);
  });

  it('returns false for different protocol', () => {
    expect(
      isSameOrigin('https://docs.example.com', 'http://docs.example.com'),
    ).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isSameOrigin('not-a-url', 'also-not')).toBe(false);
  });
});

describe('shouldFollow', () => {
  const base = 'https://docs.example.com/intro';

  it('follows same-origin links', () => {
    expect(shouldFollow(base, 'https://docs.example.com/guide')).toBe(true);
  });

  it('follows relative links', () => {
    expect(shouldFollow(base, '/guide')).toBe(true);
  });

  it('rejects cross-origin links', () => {
    expect(shouldFollow(base, 'https://other.com/page')).toBe(false);
  });

  it('rejects hash-only links', () => {
    expect(shouldFollow(base, '#section')).toBe(false);
  });

  it('rejects mailto links', () => {
    expect(shouldFollow(base, 'mailto:a@b.com')).toBe(false);
  });

  it('rejects tel links', () => {
    expect(shouldFollow(base, 'tel:+1234')).toBe(false);
  });

  it('rejects javascript links', () => {
    expect(shouldFollow(base, 'javascript:void(0)')).toBe(false);
  });

  it('rejects asset links', () => {
    expect(shouldFollow(base, '/logo.png')).toBe(false);
    expect(shouldFollow(base, '/file.pdf')).toBe(false);
    expect(shouldFollow(base, '/style.css')).toBe(false);
  });

  it('rejects empty href', () => {
    expect(shouldFollow(base, '')).toBe(false);
  });
});
