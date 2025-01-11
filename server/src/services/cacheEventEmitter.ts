import { EventEmitter } from 'events';

export interface CacheEvents {
  set: (key: string, value: any) => void;
  delete: (key: string) => void;
  expire: (key: string) => void;
  error: (error: Error) => void;
  evict: (key: string) => void;
  clear: () => void;
}

export class CacheEventEmitter {
  private emitter = new EventEmitter();

  on<K extends keyof CacheEvents>(event: K, listener: CacheEvents[K]): void {
    this.emitter.on(event, listener);
  }

  off<K extends keyof CacheEvents>(event: K, listener: CacheEvents[K]): void {
    this.emitter.off(event, listener);
  }

  emit<K extends keyof CacheEvents>(event: K, ...args: Parameters<CacheEvents[K]>): void {
    this.emitter.emit(event, ...args);
  }
} 