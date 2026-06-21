import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip, switchMap, from, EMPTY } from 'rxjs';

import { ErrorService } from './error-service';

const DB_NAME = 'practica11y-layout-db';
const DB_VERSION = 1;
const LAYOUT_STORE = 'layout';
const LAYOUT_KEY = 'shell-layout';

export interface PanelCollapsedState {
  description: boolean;
  editor: boolean;
  preview: boolean;
  tree: boolean;
  feedback: boolean;
}

/** Active tab of the accessibility output panel (tree vs. virtual screen reader). */
export type TreeTab = 'tree' | 'screen-reader';

export interface ShellLayout {
  colWidths: [number, number, number];
  rowHeights: [number, number];
  collapsed: PanelCollapsedState;
  /** Selected tab of the accessibility output panel. */
  activeTreeTab: TreeTab;
  /** Virtual screen reader playback rate (0.5–2). */
  screenReaderRate: number;
  /** Whether the virtual screen reader speech output is enabled. */
  screenReaderSpeechEnabled: boolean;
  /** Whether the virtual screen reader highlight overlay is enabled. */
  screenReaderHighlightEnabled: boolean;
}

function getDefaultLayout(): ShellLayout {
  return {
    colWidths: [3, 4, 4],
    rowHeights: [1, 1],
    collapsed: {
      description: false,
      editor: false,
      preview: false,
      tree: false,
      feedback: false,
    },
    activeTreeTab: 'tree',
    screenReaderRate: 1,
    screenReaderSpeechEnabled: true,
    screenReaderHighlightEnabled: true,
  };
}

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly errorService = inject(ErrorService);
  private db: IDBDatabase | null = null;
  private storageAvailable = false;
  private readonly initialized = signal(false);

  /** Reactive layout state — Components read and write this directly. */
  readonly layout = signal<ShellLayout>(getDefaultLayout());

  constructor() {
    this.init();

    // Auto-persist: skip initial emission, debounce writes, only after init
    toObservable(this.layout)
      .pipe(
        skip(1),
        debounceTime(300),
        switchMap((layout) => {
          if (!this.initialized() || !this.storageAvailable) return EMPTY;
          return from(this.persist(layout));
        }),
      )
      .subscribe();
  }

  /** Update column widths */
  setColWidths(colWidths: [number, number, number]): void {
    this.layout.update((l) => ({ ...l, colWidths }));
  }

  /** Update row heights */
  setRowHeights(rowHeights: [number, number]): void {
    this.layout.update((l) => ({ ...l, rowHeights }));
  }

  /** Update collapsed state for a specific panel */
  setPanelCollapsed(
    panel: keyof PanelCollapsedState,
    collapsed: boolean,
  ): void {
    this.layout.update((l) => ({
      ...l,
      collapsed: { ...l.collapsed, [panel]: collapsed },
    }));
  }

  /** Update the active accessibility output tab */
  setActiveTreeTab(activeTreeTab: TreeTab): void {
    this.layout.update((l) => ({ ...l, activeTreeTab }));
  }

  /** Update the virtual screen reader playback rate */
  setScreenReaderRate(screenReaderRate: number): void {
    this.layout.update((l) => ({ ...l, screenReaderRate }));
  }

  /** Update the virtual screen reader speech enabled state */
  setScreenReaderSpeechEnabled(screenReaderSpeechEnabled: boolean): void {
    this.layout.update((l) => ({ ...l, screenReaderSpeechEnabled }));
  }

  /** Update the virtual screen reader highlight enabled state */
  setScreenReaderHighlightEnabled(screenReaderHighlightEnabled: boolean): void {
    this.layout.update((l) => ({ ...l, screenReaderHighlightEnabled }));
  }

  private async init(): Promise<void> {
    if (this.tryIndexedDB()) {
      try {
        this.db = await this.openDatabase();
        this.storageAvailable = true;
        const stored = await this.idbGet<ShellLayout>(LAYOUT_STORE, LAYOUT_KEY);
        if (stored) {
          // Merge with defaults so layouts persisted before new fields were
          // added still receive sensible values for the missing properties.
          const defaults = getDefaultLayout();
          this.layout.set({
            ...defaults,
            ...stored,
            collapsed: { ...defaults.collapsed, ...stored.collapsed },
          });
        }
      } catch {
        // IndexedDB failed — stay with defaults
      }
    }
    this.initialized.set(true);
  }

  private async persist(layout: ShellLayout): Promise<void> {
    if (!this.db) return;
    try {
      await this.idbPut(LAYOUT_STORE, LAYOUT_KEY, layout);
    } catch {
      this.errorService.addError({
        id: `layout-save-error-${Date.now()}`,
        category: 'storage',
        message: 'Failed to save layout configuration.',
        recoverable: true,
        timestamp: new Date(),
      });
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LAYOUT_STORE)) {
          db.createObjectStore(LAYOUT_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private idbPut(
    storeName: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private tryIndexedDB(): boolean {
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }
}
