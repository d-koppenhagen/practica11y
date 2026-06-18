import { Injectable, signal } from '@angular/core';

export interface AppError {
  id: string;
  category: 'challenge' | 'sandbox' | 'analysis' | 'storage' | 'network';
  message: string;
  recoverable: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly errors = signal<AppError[]>([]);

  addError(error: AppError): void {
    this.errors.update((errors) => [...errors, error]);
  }

  clearError(id: string): void {
    this.errors.update((errors) => errors.filter((e) => e.id !== id));
  }
}
