export async function loadImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (error) {
    throw new Error(
      `Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface CanvasToBlobOptions {
  mimeType: string;
  quality?: number;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options: CanvasToBlobOptions
): Promise<Blob> {
  const { mimeType, quality = 0.92 } = options;

  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: mimeType, quality });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      },
      mimeType,
      quality
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExifOrientation {
  value: number;
  width: number;
  height: number;
  transform: {
    rotate: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
}

const EXIF_ORIENTATION_TAG = 0x0112;

function readExifOrientation(
  dataView: DataView,
  littleEndian: boolean,
  ifdOffset: number
): number | null {
  const numEntries = dataView.getUint16(ifdOffset, littleEndian);
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    if (tag === EXIF_ORIENTATION_TAG) {
      return dataView.getUint16(entryOffset + 8, littleEndian);
    }
  }
  return null;
}

export async function getExifOrientation(file: File): Promise<ExifOrientation | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve(null);
          return;
        }

        const dataView = new DataView(arrayBuffer);

        if (dataView.getUint16(0, false) !== 0xffd8) {
          resolve(null);
          return;
        }

        let offset = 2;
        while (offset < arrayBuffer.byteLength) {
          if (offset + 2 > arrayBuffer.byteLength) break;
          const marker = dataView.getUint16(offset, false);
          offset += 2;

          if (marker === 0xffe1) {
            if (offset + 8 > arrayBuffer.byteLength) break;
            offset += 2; // Skip length field

            if (offset + 4 > arrayBuffer.byteLength) break;
            const exifHeader = String.fromCharCode(
              dataView.getUint8(offset),
              dataView.getUint8(offset + 1),
              dataView.getUint8(offset + 2),
              dataView.getUint8(offset + 3)
            );
            if (exifHeader !== 'Exif') continue;

            offset += 6;
            const endianMarker = dataView.getUint16(offset, false);
            const littleEndian = endianMarker === 0x4949;
            offset += 2;

            if (dataView.getUint16(offset, littleEndian) !== 0x002a) continue;
            offset += 2;

            const ifdOffset = dataView.getUint32(offset, littleEndian);
            offset += ifdOffset;

            const orientation = readExifOrientation(dataView, littleEndian, offset);
            if (orientation !== null) {
              const transforms: Record<number, ExifOrientation['transform']> = {
                1: { rotate: 0, flipHorizontal: false, flipVertical: false },
                2: { rotate: 0, flipHorizontal: true, flipVertical: false },
                3: { rotate: 180, flipHorizontal: false, flipVertical: false },
                4: { rotate: 180, flipHorizontal: true, flipVertical: false },
                5: { rotate: 90, flipHorizontal: true, flipVertical: false },
                6: { rotate: 90, flipHorizontal: false, flipVertical: false },
                7: { rotate: 270, flipHorizontal: true, flipVertical: false },
                8: { rotate: 270, flipHorizontal: false, flipVertical: false },
              };

              const transform = transforms[orientation];
              if (transform) {
                resolve({
                  value: orientation,
                  width: 0,
                  height: 0,
                  transform,
                });
              }
            }
            break;
          } else if ((marker & 0xff00) === 0xff00) {
            if (offset + 2 > arrayBuffer.byteLength) break;
            const length = dataView.getUint16(offset, false);
            offset += length;
          } else {
            break;
          }
        }
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
}

export async function applyExifOrientation(
  bitmap: ImageBitmap,
  orientation: ExifOrientation
): Promise<ImageBitmap> {
  const { transform } = orientation;
  if (transform.rotate === 0 && !transform.flipHorizontal && !transform.flipVertical) {
    return bitmap;
  }

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const { width, height } = bitmap;
  let drawWidth = width;
  let drawHeight = height;

  if (transform.rotate === 90 || transform.rotate === 270) {
    canvas.width = height;
    canvas.height = width;
    drawWidth = height;
    drawHeight = width;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((transform.rotate * Math.PI) / 180);

  if (transform.flipHorizontal) ctx.scale(-1, 1);
  if (transform.flipVertical) ctx.scale(1, -1);

  ctx.drawImage(bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return canvas.transferToImageBitmap();
}

export async function loadImageWithExif(file: File): Promise<ImageBitmap> {
  const bitmap = await loadImage(file);
  const orientation = await getExifOrientation(file);
  if (orientation) {
    return applyExifOrientation(bitmap, orientation);
  }
  return bitmap;
}

export function getOutputFilename(
  originalName: string,
  newExtension: string,
  suffix?: string
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const suffixStr = suffix ? `-${suffix}` : '';
  return `${baseName}${suffixStr}.${newExtension}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function estimateJpegSize(width: number, height: number, quality: number): number {
  const pixels = width * height;
  const bytesPerPixel = (quality / 100) * 0.5 + 0.1;
  return Math.round(pixels * bytesPerPixel);
}

export function estimatePngSize(width: number, height: number): number {
  const pixels = width * height;
  return Math.round(pixels * 0.5);
}

export function estimateWebpSize(width: number, height: number, quality: number): number {
  const pixels = width * height;
  const bytesPerPixel = (quality / 100) * 0.3 + 0.05;
  return Math.round(pixels * bytesPerPixel);
}

export function estimateAvifSize(width: number, height: number, quality: number): number {
  const pixels = width * height;
  const bytesPerPixel = (quality / 100) * 0.2 + 0.03;
  return Math.round(pixels * bytesPerPixel);
}

export function drawCheckerboard(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  squareSize = 10,
  lightColor = '#ffffff',
  darkColor = '#d1d5db'
): void {
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = darkColor;
  for (let x = 0; x < width; x += squareSize * 2) {
    for (let y = 0; y < height; y += squareSize * 2) {
      ctx.fillRect(x, y, squareSize, squareSize);
      ctx.fillRect(x + squareSize, y + squareSize, squareSize, squareSize);
    }
  }
}

export function estimateFileSize(
  width: number,
  height: number,
  mimeType: string,
  quality: number
): number {
  switch (mimeType) {
    case 'image/jpeg':
      return estimateJpegSize(width, height, quality);
    case 'image/png':
      return estimatePngSize(width, height);
    case 'image/webp':
      return estimateWebpSize(width, height, quality);
    case 'image/avif':
      return estimateAvifSize(width, height, quality);
    default:
      return estimatePngSize(width, height);
  }
}
