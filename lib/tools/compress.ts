import { ImageTool, CompressOptions, OutputFormatValue } from './types';

const OUTPUT_FORMATS: Record<OutputFormatValue, { mimeType: string; extension: string }> = {
  jpeg: { mimeType: 'image/jpeg', extension: 'jpg' },
  png: { mimeType: 'image/png', extension: 'png' },
  webp: { mimeType: 'image/webp', extension: 'webp' },
  avif: { mimeType: 'image/avif', extension: 'avif' },
};

export const compressTool: ImageTool = {
  name: 'compress',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, opts: CompressOptions): Promise<Blob> {
    const { quality, targetSize, format = 'jpeg' } = opts;
    const { mimeType } = OUTPUT_FORMATS[format];

    const canvas = new OffscreenCanvas(input.width, input.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // For JPEG, composite on white background since it doesn't support alpha
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, input.width, input.height);
    }

    ctx.drawImage(input, 0, 0);

    if (targetSize) {
      // Binary search for quality to hit target size
      let low = 1;
      let high = 100;
      let bestBlob: Blob | null = null;

      for (let i = 0; i < 10; i++) {
        const mid = Math.round((low + high) / 2);
        const blob = await canvas.convertToBlob({ type: mimeType, quality: mid / 100 });

        if (blob.size <= targetSize) {
          bestBlob = blob;
          low = mid + 1;
        } else {
          high = mid - 1;
        }

        if (low > high) break;
      }

      return bestBlob || canvas.convertToBlob({ type: mimeType, quality: quality / 100 });
    }

    return canvas.convertToBlob({ type: mimeType, quality: quality / 100 });
  },
};

export function estimateCompressedSize(
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
