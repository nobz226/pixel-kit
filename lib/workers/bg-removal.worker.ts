import { removeBackground } from '@imgly/background-removal';

type BgRemovalMessage =
  | { type: 'init' }
  | { type: 'remove'; bitmap: ImageBitmap }
  | { type: 'terminate' };

type BgRemovalResponse =
  | { type: 'ready' }
  | { type: 'progress'; progress: number }
  | { type: 'result'; blob: Blob }
  | { type: 'error'; message: string };

// Signal ready immediately - model loads on first use
self.postMessage({ type: 'ready' } as BgRemovalResponse);

self.onmessage = async (event: MessageEvent<BgRemovalMessage>) => {
  const { type } = event.data;

  if (type === 'terminate') {
    self.close();
    return;
  }

  if (type === 'remove') {
    const { bitmap } = event.data;
    try {
      const result = await removeBackground(bitmap, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress: (name: string, loaded: number, total: number) => {
          const progress = total > 0 ? loaded / total : 0;
          self.postMessage({ type: 'progress', progress } as BgRemovalResponse);
        },
      });

      self.postMessage({ type: 'result', blob: result } as BgRemovalResponse);
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Background removal failed',
      } as BgRemovalResponse);
    }
  }
};

// Handle any unhandled errors in the worker
self.onerror = (error) => {
  self.postMessage({
    type: 'error',
    message: error instanceof Error ? error.message : 'Worker error',
  } as BgRemovalResponse);
};