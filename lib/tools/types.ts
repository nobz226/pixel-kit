export interface ImageTool {
  name: string;
  accepts: string[];
  run(input: ImageBitmap, opts: Record<string, unknown>): Promise<Blob>;
}

export interface ToolOptions {
  [key: string]: unknown;
}

export interface ResizeOptions extends ToolOptions {
  width?: number;
  height?: number;
  percentage?: number;
  lockAspectRatio?: boolean;
  fit?: 'cover' | 'contain' | 'fill';
}

export interface CropOptions extends ToolOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConvertOptions extends ToolOptions {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  backgroundColor?: string;
}

export interface CompressOptions extends ToolOptions {
  quality: number;
  targetSize?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export const SUPPORTED_INPUT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/tiff',
] as const;

export const OUTPUT_FORMATS = [
  { value: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg', supportsAlpha: false },
  { value: 'png', label: 'PNG', mimeType: 'image/png', extension: 'png', supportsAlpha: true },
  { value: 'webp', label: 'WebP', mimeType: 'image/webp', extension: 'webp', supportsAlpha: true },
  { value: 'avif', label: 'AVIF', mimeType: 'image/avif', extension: 'avif', supportsAlpha: true },
] as const;

export type OutputFormatValue = (typeof OUTPUT_FORMATS)[number]['value'];
