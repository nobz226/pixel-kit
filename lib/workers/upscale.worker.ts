import * as tf from '@tensorflow/tfjs';
import Upscaler from 'upscaler';
import x2 from '@upscalerjs/esrgan-slim/2x';
import x4 from '@upscalerjs/esrgan-slim/4x';

type UpscaleMessage =
  | { type: 'init' }
  | { type: 'upscale'; imageData: Uint8Array; shape: [number, number, number]; scale: 2 | 4 }
  | { type: 'terminate' };

type UpscaleResponse =
  | { type: 'ready' }
  | { type: 'progress'; progress: number }
  | { type: 'result'; data: Uint8Array; shape: [number, number, number] }
  | { type: 'error'; message: string };

let upscaler2x: Record<string, unknown> | null = null;
let upscaler4x: Record<string, unknown> | null = null;

self.postMessage({ type: 'ready' } as UpscaleResponse);

self.onmessage = async (event: MessageEvent<UpscaleMessage>) => {
  const { type } = event.data;

  if (type === 'terminate') {
    if (upscaler2x) await (upscaler2x as { dispose: () => Promise<void> }).dispose();
    if (upscaler4x) await (upscaler4x as { dispose: () => Promise<void> }).dispose();
    self.close();
    return;
  }

  if (type === 'upscale') {
    const { imageData, shape, scale } = event.data;

    try {
      let upscaler: { upscale: (img: tf.Tensor, opts: Record<string, unknown>) => Promise<tf.Tensor3D> };
      if (scale === 2) {
        if (!upscaler2x) upscaler2x = new Upscaler({ model: x2 });
        upscaler = upscaler2x as typeof upscaler;
      } else {
        if (!upscaler4x) upscaler4x = new Upscaler({ model: x4 });
        upscaler = upscaler4x as typeof upscaler;
      }

      const tensor = tf.tensor(imageData, shape);

      const result = await upscaler.upscale(tensor, {
        output: 'tensor' as const,
        patchSize: 64,
        padding: 8,
        progress: (progress: number) => {
          self.postMessage({ type: 'progress', progress } as UpscaleResponse);
        },
      });

      const resultData = await result.data();
      const resultShape = result.shape;

      tensor.dispose();
      result.dispose();

      const response: UpscaleResponse = {
        type: 'result',
        data: new Uint8Array(resultData),
        shape: resultShape as [number, number, number],
      };

      self.postMessage(response, { transfer: [response.data.buffer] });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upscaling failed',
      } as UpscaleResponse);
    }
  }
};
