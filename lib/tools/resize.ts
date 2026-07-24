import { ImageTool, ResizeOptions } from './types';
import { canvasToBlob } from '../canvas-utils';

export const resizeTool: ImageTool = {
  name: 'resize',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, opts: ResizeOptions): Promise<Blob> {
    const { width, height, percentage, lockAspectRatio = true, fit = 'fill' } = opts;

    let targetWidth: number;
    let targetHeight: number;

    if (percentage !== undefined && percentage > 0) {
      targetWidth = Math.round(input.width * (percentage / 100));
      targetHeight = Math.round(input.height * (percentage / 100));
    } else if (width !== undefined && height !== undefined) {
      targetWidth = width;
      targetHeight = height;
    } else if (width !== undefined) {
      targetWidth = width;
      targetHeight = lockAspectRatio
        ? Math.round(input.height * (width / input.width))
        : input.height;
    } else if (height !== undefined) {
      targetHeight = height;
      targetWidth = lockAspectRatio
        ? Math.round(input.width * (height / input.height))
        : input.width;
    } else {
      throw new Error('Either width, height, or percentage must be provided');
    }

    targetWidth = Math.max(1, targetWidth);
    targetHeight = Math.max(1, targetHeight);

    let drawWidth = targetWidth;
    let drawHeight = targetHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (fit === 'cover' || fit === 'contain') {
      const scaleX = targetWidth / input.width;
      const scaleY = targetHeight / input.height;
      const scale = fit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

      drawWidth = Math.round(input.width * scale);
      drawHeight = Math.round(input.height * scale);
      offsetX = Math.round((targetWidth - drawWidth) / 2);
      offsetY = Math.round((targetHeight - drawHeight) / 2);
    }

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    if (fit === 'cover' || fit === 'contain') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(input, offsetX, offsetY, drawWidth, drawHeight);

    return canvasToBlob(canvas, { mimeType: 'image/png', quality: 0.92 });
  },
};

export function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  options: { width?: number; height?: number; percentage?: number; lockAspectRatio?: boolean }
): { width: number; height: number } {
  const { width, height, percentage, lockAspectRatio = true } = options;

  if (percentage !== undefined && percentage > 0) {
    return {
      width: Math.round(originalWidth * (percentage / 100)),
      height: Math.round(originalHeight * (percentage / 100)),
    };
  }

  if (width !== undefined && height !== undefined) {
    return { width, height };
  }

  if (width !== undefined) {
    return {
      width,
      height: lockAspectRatio
        ? Math.round(originalHeight * (width / originalWidth))
        : originalHeight,
    };
  }

  if (height !== undefined) {
    return {
      width: lockAspectRatio
        ? Math.round(originalWidth * (height / originalHeight))
        : originalWidth,
      height,
    };
  }

  return { width: originalWidth, height: originalHeight };
}

export async function getResizePreviewUrl(
  input: ImageBitmap,
  options: ResizeOptions
): Promise<string> {
  const canvas = new OffscreenCanvas(options.width || input.width, options.height || input.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const { width, height } = calculateResizeDimensions(input.width, input.height, options);

  ctx.drawImage(input, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.92 });
  return URL.createObjectURL(blob);
}
