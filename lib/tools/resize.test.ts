import { describe, it, expect } from 'vitest';
import { getFormatFromMimeType, calculateResizeDimensions } from './resize';

describe('getFormatFromMimeType', () => {
  it('maps each input mime type to its natural output format', () => {
    expect(getFormatFromMimeType('image/jpeg')).toBe('jpeg');
    expect(getFormatFromMimeType('image/png')).toBe('png');
    expect(getFormatFromMimeType('image/webp')).toBe('webp');
    expect(getFormatFromMimeType('image/avif')).toBe('avif');
  });

  it('falls back to png for formats without a direct representation', () => {
    expect(getFormatFromMimeType('image/gif')).toBe('png');
    expect(getFormatFromMimeType('image/bmp')).toBe('png');
    expect(getFormatFromMimeType('image/tiff')).toBe('png');
  });

  it('falls back to png for unknown mime types', () => {
    expect(getFormatFromMimeType('image/svg+xml')).toBe('png');
    expect(getFormatFromMimeType('')).toBe('png');
  });
});

describe('calculateResizeDimensions', () => {
  it('keeps original dimensions when no options are provided', () => {
    expect(calculateResizeDimensions(200, 100, {})).toEqual({ width: 200, height: 100 });
  });

  it('scales by percentage', () => {
    expect(calculateResizeDimensions(200, 100, { percentage: 50 })).toEqual({
      width: 100,
      height: 50,
    });
  });

  it('preserves aspect ratio when only one dimension is given', () => {
    expect(calculateResizeDimensions(200, 100, { width: 100 })).toEqual({
      width: 100,
      height: 50,
    });
  });
});
