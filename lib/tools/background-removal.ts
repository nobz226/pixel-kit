import { ImageTool } from './types';

export const backgroundRemovalTool: ImageTool = {
  name: 'background-removal',
  accepts: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],
  async run(input: ImageBitmap, _opts: Record<string, unknown> = {}): Promise<Blob> {
    const { removeBackground } = await import('@imgly/background-removal');
    const blob = await removeBackground(input);
    return blob;
  },
};
