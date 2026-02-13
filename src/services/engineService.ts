import type { EngineMove, EngineMessage } from '../types';

export class EngineService {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingCallbacks: Map<string, (move: EngineMove) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/engine.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.addEventListener('message', (event: MessageEvent<EngineMessage>) => {
        this.handleWorkerMessage(event.data);
      });

      this.worker.addEventListener('error', (error) => {
        console.error('Engine worker error:', error);
        this.isReady = false;
      });

      // Send init message
      this.worker.postMessage({ type: 'init' });
    } catch (error) {
      console.error('Failed to initialize engine worker:', error);
    }
  }

  private handleWorkerMessage(message: EngineMessage): void {
    switch (message.type) {
      case 'ready':
        this.isReady = true;
        console.log('Engine worker ready');
        break;

      case 'move':
        if (message.data) {
          const callbacks = Array.from(this.pendingCallbacks.values());
          this.pendingCallbacks.clear();
          callbacks.forEach(callback => callback(message.data as EngineMove));
        }
        break;

      case 'error':
        console.error('Engine error:', message.data);
        this.pendingCallbacks.clear();
        break;
    }
  }

  async calculateMove(fen: string, depth: number = 3): Promise<EngineMove> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isReady) {
        reject(new Error('Engine not ready'));
        return;
      }

      const callbackId = Math.random().toString(36);
      
      const timeoutId = setTimeout(() => {
        this.pendingCallbacks.delete(callbackId);
        reject(new Error('Engine calculation timeout'));
      }, 30000); // 30 second timeout

      this.pendingCallbacks.set(callbackId, (move: EngineMove) => {
        clearTimeout(timeoutId);
        resolve(move);
      });

      this.worker.postMessage({
        type: 'calculate',
        data: { fen, depth },
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.pendingCallbacks.clear();
    }
  }

  restart(): void {
    this.terminate();
    this.initWorker();
  }
}

// Singleton instance
let engineInstance: EngineService | null = null;

export const getEngine = (): EngineService => {
  if (!engineInstance) {
    engineInstance = new EngineService();
  }
  return engineInstance;
};

export const terminateEngine = (): void => {
  if (engineInstance) {
    engineInstance.terminate();
    engineInstance = null;
  }
};
