import { ImageTool, ConvertOptions, OutputFormatValue } from './types';
import { canvasToBlob } from '../canvas-utils';

export const OUTPUT_FORMATS: Record<
  OutputFormatValue,
  { mimeType: string; extension: string; supportsAlpha: boolean }
> = {
  jpeg: { mimeType: 'image/jpeg', extension: 'jpg', supportsAlpha: false },
  png: { mimeType: 'image/png', extension: 'png', supportsAlpha: true },
  webp: { mimeType: 'image/webp', extension: 'webp', supportsAlpha: true },
  avif: { mimeType: 'image/avif', extension: 'avif', supportsAlpha: true },
};

export const convertTool: ImageTool = {
  name: 'convert',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, opts: ConvertOptions): Promise<Blob> {
    const { format, quality = 0.92, backgroundColor = '#ffffff' } = opts;
    const { mimeType, supportsAlpha } = OUTPUT_FORMATS[format];

    const canvas = new OffscreenCanvas(input.width, input.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    if (!supportsAlpha) {
      // Output format doesn't support alpha (JPEG) - composite on background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, input.width, input.height);
      ctx.drawImage(input, 0, 0);
    } else {
      // Output format supports alpha - draw directly
      ctx.drawImage(input, 0, 0);
    }

    return canvasToBlob(canvas, { mimeType, quality });
  },
};

export function checkAvifSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/avif').startsWith('data:image/avif');
}

export function checkWebpSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

export function estimateConvertedSize(
  width: number,
  height: number,
  format: OutputFormatValue,
  quality: number
): number {
  const pixels = width * height;
  switch (format) {
    case 'jpeg':
      return Math.round(pixels * ((quality / 100) * 0.5 + 0.1));
    case 'png':
      return Math.round(pixels * 0.5);
    case 'webp':
      return Math.round(pixels * ((quality / 100) * 0.3 + 0.05));
    case 'avif':
      return Math.round(pixels * ((quality / 100) * 0.2 + 0.03));
    default:
      return Math.round(pixels * 0.5);
  }
}

export function getFormatInfo(format: OutputFormatValue) {
  return OUTPUT_FORMATS[format];
}
