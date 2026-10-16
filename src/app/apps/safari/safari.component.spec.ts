import { TestBed } from '@angular/core/testing';
import { SafariComponent } from './safari.component';

describe('SafariComponent', () => {
  const create = () => TestBed.createComponent(SafariComponent).componentInstance;

  it('opens bookmarks from the address bar and supports back/forward', () => {
    const safari = create();
    safari.address.set('nodejs.org/en');
    safari.submitAddress();
    expect(safari.page()).toEqual(expect.objectContaining({ kind: 'bookmark' }));
    expect(safari.address()).toBe('https://nodejs.org/en');

    safari.back();
    expect(safari.page().kind).toBe('favorites');
    safari.forward();
    expect(safari.address()).toBe('https://nodejs.org/en');
  });

  it('offers a new tab for addresses outside the bookmarks', () => {
    const safari = create();
    safari.address.set('https://google.com');
    safari.submitAddress();
    expect(safari.page()).toEqual({ kind: 'external', url: 'https://google.com' });
  });

  it('rejects invalid addresses', () => {
    const safari = create();
    safari.address.set('not a url');
    safari.submitAddress();
    expect(safari.error()).toBeTruthy();
    expect(safari.page().kind).toBe('favorites');
  });
});
