import { TestBed } from '@angular/core/testing';
import { ErrorService, AppError } from './error-service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty errors list', () => {
    expect(service.errors()).toEqual([]);
  });

  it('should add an error', () => {
    const error: AppError = {
      id: 'test-1',
      category: 'network',
      message: 'Connection failed',
      recoverable: true,
      timestamp: new Date('2024-01-01'),
    };

    service.addError(error);

    expect(service.errors()).toEqual([error]);
  });

  it('should add multiple errors', () => {
    const error1: AppError = {
      id: 'err-1',
      category: 'storage',
      message: 'Storage full',
      recoverable: false,
      timestamp: new Date('2024-01-01'),
    };
    const error2: AppError = {
      id: 'err-2',
      category: 'challenge',
      message: 'Invalid frontmatter',
      recoverable: true,
      timestamp: new Date('2024-01-02'),
    };

    service.addError(error1);
    service.addError(error2);

    expect(service.errors()).toEqual([error1, error2]);
  });

  it('should clear an error by id', () => {
    const error1: AppError = {
      id: 'err-1',
      category: 'analysis',
      message: 'axe timeout',
      recoverable: true,
      timestamp: new Date('2024-01-01'),
    };
    const error2: AppError = {
      id: 'err-2',
      category: 'sandbox',
      message: 'Render failed',
      recoverable: false,
      timestamp: new Date('2024-01-02'),
    };

    service.addError(error1);
    service.addError(error2);
    service.clearError('err-1');

    expect(service.errors()).toEqual([error2]);
  });

  it('should not modify errors when clearing a non-existent id', () => {
    const error: AppError = {
      id: 'err-1',
      category: 'network',
      message: 'Timeout',
      recoverable: true,
      timestamp: new Date('2024-01-01'),
    };

    service.addError(error);
    service.clearError('non-existent');

    expect(service.errors()).toEqual([error]);
  });
});
