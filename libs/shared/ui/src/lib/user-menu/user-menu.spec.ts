import { render, fireEvent } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { UserMenu } from './user-menu';
import { AuthStore, SyncStore } from '@practica11y/util';

describe('UserMenu', () => {
  async function setup() {
    const { fixture } = await render(UserMenu);
    const authStore = TestBed.inject(AuthStore);
    const syncStore = TestBed.inject(SyncStore);
    return { fixture, authStore, syncStore };
  }

  function authenticateUser(authStore: AuthStore) {
    authStore.state.set('authenticated');
    authStore.user.set({
      login: 'octocat',
      avatarUrl: 'https://example.com/avatar.png',
    });
  }

  describe('unauthenticated state', () => {
    it('should render sign-in button when unauthenticated', async () => {
      const { fixture } = await setup();

      const signInButton =
        fixture.nativeElement.querySelector('.sign-in-button');
      expect(signInButton).not.toBeNull();
      expect(signInButton.textContent).toContain('Sign in');
    });

    it('should not render avatar button when unauthenticated', async () => {
      const { fixture } = await setup();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      expect(avatarButton).toBeNull();
    });
  });

  describe('authenticated state', () => {
    it('should render avatar and username when authenticated', async () => {
      const { fixture, authStore } = await setup();

      authenticateUser(authStore);
      fixture.detectChanges();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      expect(avatarButton).not.toBeNull();

      const avatar = fixture.nativeElement.querySelector('.avatar');
      expect(avatar).not.toBeNull();
      expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.png');

      const username = fixture.nativeElement.querySelector('.username');
      expect(username).not.toBeNull();
      expect(username.textContent).toContain('octocat');
    });

    it('should not render sign-in button when authenticated', async () => {
      const { fixture, authStore } = await setup();

      authenticateUser(authStore);
      fixture.detectChanges();

      const signInButton =
        fixture.nativeElement.querySelector('.sign-in-button');
      expect(signInButton).toBeNull();
    });
  });

  describe('menu trigger ARIA attributes', () => {
    it('should have aria-haspopup on avatar button', async () => {
      const { fixture, authStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      expect(avatarButton.getAttribute('aria-haspopup')).toBeTruthy();
    });

    it('should have aria-expanded attribute on avatar button', async () => {
      const { fixture, authStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      // Initially closed
      expect(avatarButton.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('menu items', () => {
    it('should have menu items with role="menuitem"', async () => {
      const { fixture, authStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      // Open menu
      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      fireEvent.click(avatarButton);
      fixture.detectChanges();

      const menuItems =
        fixture.nativeElement.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(2); // Sync now + Sign out
    });
  });

  describe('sync indicator', () => {
    it('should show "Idle" when sync state is idle', async () => {
      const { fixture, authStore, syncStore } = await setup();
      authenticateUser(authStore);
      syncStore.state.set('idle');
      fixture.detectChanges();

      // Open menu
      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      fireEvent.click(avatarButton);
      fixture.detectChanges();

      const syncStatus = fixture.nativeElement.querySelector('.sync-status');
      expect(syncStatus.textContent).toContain('Idle');
    });

    it('should show "Syncing" when sync state is syncing', async () => {
      const { fixture, authStore, syncStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      fireEvent.click(avatarButton);
      fixture.detectChanges();

      syncStore.state.set('syncing');
      fixture.detectChanges();

      const syncStatus = fixture.nativeElement.querySelector('.sync-status');
      expect(syncStatus.textContent).toContain('Syncing');
    });
  });

  describe('actions', () => {
    it('should call syncStore.sync() when sync menu item is activated', async () => {
      const { fixture, authStore, syncStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      const syncSpy = vi.spyOn(syncStore, 'sync').mockResolvedValue();

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      fireEvent.click(avatarButton);
      fixture.detectChanges();

      const menuItems =
        fixture.nativeElement.querySelectorAll('[role="menuitem"]');
      fireEvent.click(menuItems[0]); // "Sync now"

      expect(syncSpy).toHaveBeenCalled();
    });

    it('should call authStore.logout() when sign out menu item is activated', async () => {
      const { fixture, authStore } = await setup();
      authenticateUser(authStore);
      fixture.detectChanges();

      const logoutSpy = vi.spyOn(authStore, 'logout');

      const avatarButton =
        fixture.nativeElement.querySelector('.avatar-button');
      fireEvent.click(avatarButton);
      fixture.detectChanges();

      const menuItems =
        fixture.nativeElement.querySelectorAll('[role="menuitem"]');
      fireEvent.click(menuItems[1]); // "Sign out"

      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});
