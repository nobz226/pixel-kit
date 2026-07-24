import { ImageTool, CropOptions } from './types';
import { canvasToBlob } from '../canvas-utils';

export const cropTool: ImageTool = {
  name: 'crop',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, opts: CropOptions): Promise<Blob> {
    const { x, y, width, height } = opts;

    if (width <= 0 || height <= 0) {
      throw new Error('Crop width and height must be greater than 0');
    }

    if (x < 0 || y < 0 || x + width > input.width || y + height > input.height) {
      throw new Error('Crop region exceeds image bounds');
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(input, x, y, width, height, 0, 0, width, height);

    return canvasToBlob(canvas, { mimeType: 'image/png', quality: 0.92 });
  },
};

export function calculateCropBounds(
  imageWidth: number,
  imageHeight: number,
  options: { aspectRatio?: number; x?: number; y?: number; width?: number; height?: number }
): { x: number; y: number; width: number; height: number } {
  const { aspectRatio, x = 0, y = 0, width, height } = options;

  if (width && height) {
    return {
      x: Math.max(0, Math.min(x, imageWidth - width)),
      y: Math.max(0, Math.min(y, imageHeight - height)),
      width,
      height,
    };
  }

  if (aspectRatio) {
    const imageAspect = imageWidth / imageHeight;
    let cropWidth: number;
    let cropHeight: number;

    if (imageAspect > aspectRatio) {
      cropHeight = imageHeight;
      cropWidth = Math.round(imageHeight * aspectRatio);
    } else {
      cropWidth = imageWidth;
      cropHeight = Math.round(imageWidth / aspectRatio);
    }

    const cropX = Math.round((imageWidth - cropWidth) / 2);
    const cropY = Math.round((imageHeight - cropHeight) / 2);

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  }

  return { x: 0, y: 0, width: imageWidth, height: imageHeight };
}

export const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1 (Square)', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '21:9', value: 21 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 },
] as const;
