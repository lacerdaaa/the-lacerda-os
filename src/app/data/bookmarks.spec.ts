import { findBookmark, normalizeUrl } from './bookmarks';

describe('bookmarks', () => {
  it('normalizes urls', () => {
    expect(normalizeUrl('nodejs.org/en/')).toBe('https://nodejs.org/en');
    expect(normalizeUrl('HTTPS://WWW.NPMJS.COM/#x')).toBe('https://www.npmjs.com');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });

  it('finds bookmarks regardless of formatting', () => {
    expect(findBookmark('nodejs.org/en')?.id).toBe('nodejs');
    expect(findBookmark('https://www.npmjs.com/')?.id).toBe('npm');
    expect(findBookmark('https://google.com')).toBeUndefined();
  });
});
