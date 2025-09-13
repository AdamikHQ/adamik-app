// Global event emitter for triggering refetch across the app
class RefetchEventEmitter extends EventTarget {
  triggerRefetch() {
    this.dispatchEvent(new CustomEvent('refetch-account-state'));
  }
  
  onRefetch(callback: () => void) {
    const handler = () => callback();
    this.addEventListener('refetch-account-state', handler);
    return () => this.removeEventListener('refetch-account-state', handler);
  }
}

export const refetchEventEmitter = new RefetchEventEmitter();