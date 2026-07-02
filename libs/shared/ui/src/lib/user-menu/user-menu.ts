import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { AuthStore, SyncStore } from '@practica11y/util';

@Component({
  selector: 'a11y-user-menu',
  imports: [Menu, MenuItem, MenuTrigger],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenu {
  protected readonly authStore = inject(AuthStore);
  protected readonly syncStore = inject(SyncStore);

  protected readonly syncStateAnnouncement = computed(() => {
    switch (this.syncStore.state()) {
      case 'syncing':
        return 'Synchronizing progress...';
      case 'success':
        return 'Progress synchronized successfully';
      case 'error':
        return `Sync failed: ${this.syncStore.lastError()}`;
      default:
        return '';
    }
  });

  protected signIn(): void {
    this.authStore.startDeviceFlow();
  }

  protected handleItemSelected(value: string): void {
    switch (value) {
      case 'sync':
        this.syncStore.sync();
        break;
      case 'logout':
        this.authStore.logout();
        break;
    }
  }
}
