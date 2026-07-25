import { ImageTool } from './types';

export interface UpscaleOptions {
  scale: 2 | 4;
}

export const upscaleTool: ImageTool = {
  name: 'upscale',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, opts: Record<string, unknown>): Promise<Blob> {
    const { scale = 2 } = opts as unknown as UpscaleOptions;

    const Upscaler = (await import('upscaler')).default;
    const model =
      scale === 2
        ? (await import('@upscalerjs/esrgan-slim/2x')).default
        : (await import('@upscalerjs/esrgan-slim/4x')).default;

    const upscaler = new Upscaler({ model });

    const result = await upscaler.upscale(input, { output: 'base64' });

    const response = await fetch(result);
    return response.blob();
  },
};

export function getMaxInputDimensions(scale: 2 | 4): { width: number; height: number } {
  const maxOutput = 8000;
  const factor = scale === 4 ? 4 : 2;
  return {
    width: Math.floor(maxOutput / factor),
    height: Math.floor(maxOutput / factor),
  };
}

export function estimateOutputSize(
  inputWidth: number,
  inputHeight: number,
  scale: 2 | 4
): { width: number; height: number } {
  return {
    width: inputWidth * scale,
    height: inputHeight * scale,
  };
}

export function rgbToImageBitmap(
  data: Uint8Array,
  width: number,
  height: number
): Promise<ImageBitmap> {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
  const imageData = new ImageData(rgba, width, height);
  return createImageBitmap(imageData);
}
