'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  canvasToBlob,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
  estimateFileSize,
} from '@/lib/canvas-utils';
import { calculateResizeDimensions } from '@/lib/tools/resize';
import { ResizeOptions } from '@/lib/tools/types';

const MAX_DIMENSION = 10000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type ResizeMode = 'dimensions' | 'percentage';

export default function ResizePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [mode, setMode] = useState<ResizeMode>('dimensions');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [percentage, setPercentage] = useState<number | ''>(100);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ blob: Blob; filename: string; originalName: string }>
  >([]);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    setError(null);
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length !== newFiles.length) {
      setError('Some files exceed the 100MB limit and were skipped');
    }
    setFiles(validFiles);
    setResults([]);

    const newBitmaps = new Map<number, ImageBitmap>();
    const newPreviews = new Map<number, string>();

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const bitmap = await loadImageWithExif(validFiles[i]);
        newBitmaps.set(i, bitmap);

        const previewUrl = URL.createObjectURL(validFiles[i]);
        newPreviews.set(i, previewUrl);

        if (i === 0) {
          setWidth(bitmap.width);
          setHeight(bitmap.height);
          setPercentage(100);
          setOriginalDimensions({ width: bitmap.width, height: bitmap.height });
        }
      } catch (err) {
        setError(
          `Failed to load ${validFiles[i].name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    setBitmaps(newBitmaps);
    setPreviews(newPreviews);
  }, []);

  const updatePreviews = useCallback(async () => {
    if (bitmaps.size === 0) return;

    const newPreviews = new Map<number, string>();

    for (const [index, bitmap] of bitmaps) {
      let options: ResizeOptions;
      if (mode === 'percentage') {
        options = { percentage: percentage as number };
      } else {
        options = {
          width: width as number,
          height: height as number,
          lockAspectRatio,
        };
      }

      const { width: targetWidth, height: targetHeight } = calculateResizeDimensions(
        bitmap.width,
        bitmap.height,
        options
      );

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.92 });
      newPreviews.set(index, URL.createObjectURL(blob));
    }

    setPreviews(newPreviews);
  }, [bitmaps, mode, width, height, percentage, lockAspectRatio]);

  const triggerPreviewUpdate = useCallback(() => {
    updatePreviews();
  }, [updatePreviews]);

  const handleDimensionChange = useCallback(
    (dimension: 'width' | 'height', value: number | '') => {
      if (value === '' || !lockAspectRatio || !originalDimensions) {
        if (dimension === 'width') setWidth(value);
        else setHeight(value);
        triggerPreviewUpdate();
        return;
      }

      const ratio = originalDimensions.width / originalDimensions.height;

      if (dimension === 'width' && typeof value === 'number') {
        setWidth(value);
        setHeight(Math.round(value / ratio));
      } else if (dimension === 'height' && typeof value === 'number') {
        setHeight(value);
        setWidth(Math.round(value * ratio));
      }
      triggerPreviewUpdate();
    },
    [lockAspectRatio, originalDimensions, triggerPreviewUpdate]
  );

  const handlePercentageChange = useCallback(
    (value: number | '') => {
      if (value === '') {
        setPercentage(value);
        triggerPreviewUpdate();
        return;
      }
      const clamped = Math.max(1, Math.min(1000, value));
      setPercentage(clamped);

      if (!originalDimensions) return;

      const newWidth = Math.round(originalDimensions.width * (clamped / 100));
      const newHeight = Math.round(originalDimensions.height * (clamped / 100));
      setWidth(newWidth);
      setHeight(newHeight);
      triggerPreviewUpdate();
    },
    [originalDimensions, triggerPreviewUpdate]
  );

  const handleModeChange = useCallback(
    (newMode: ResizeMode) => {
      setMode(newMode);
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleLockAspectRatioChange = useCallback(
    (checked: boolean) => {
      setLockAspectRatio(checked);
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleProcess = useCallback(async () => {
    if (files.length === 0 || bitmaps.size === 0) return;

    setProcessing(true);
    setError(null);
    const newResults: Array<{ blob: Blob; filename: string; originalName: string }> = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const bitmap = bitmaps.get(i);
        if (!bitmap) continue;

        let options: ResizeOptions;
        if (mode === 'percentage') {
          options = { percentage: percentage as number };
        } else {
          options = {
            width: width as number,
            height: height as number,
            lockAspectRatio,
          };
        }

        const { width: targetWidth, height: targetHeight } = calculateResizeDimensions(
          bitmap.width,
          bitmap.height,
          options
        );

        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
          throw new Error(
            `Resulting dimensions (${targetWidth}x${targetHeight}) exceed maximum allowed (${MAX_DIMENSION}px)`
          );
        }

        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas');

        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToBlob(canvas, { mimeType: 'image/png', quality: 0.92 });
        const filename = getOutputFilename(
          files[i].name,
          'png',
          `resized-${targetWidth}x${targetHeight}`
        );

        newResults.push({ blob, filename, originalName: files[i].name });
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [files, bitmaps, mode, width, height, percentage, lockAspectRatio]);

  const handleDownload = useCallback((blob: Blob, filename: string) => {
    downloadBlob(blob, filename);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((r) => downloadBlob(r.blob, r.filename));
  }, [results]);

  const handleClear = useCallback(() => {
    setFiles([]);
    setBitmaps(new Map());
    setPreviews(new Map());
    setResults([]);
    setWidth('');
    setHeight('');
    setPercentage(100);
    setError(null);
    setOriginalDimensions(null);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((bitmap) => bitmap.close());
    };
  }, []);

  const firstBitmap = bitmaps.get(0);
  const originalSize = firstBitmap ? formatFileSize(files[0]?.size || 0) : null;
  const estimatedSize =
    firstBitmap && width && height
      ? formatFileSize(estimateFileSize(width as number, height as number, 'image/png', 92))
      : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            PixelKit
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            ← All Tools
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Upload</h2>
              <Dropzone
                onFiles={handleFiles}
                multiple
                maxFiles={10}
                maxFileSize={MAX_FILE_SIZE}
                id="resize-dropzone"
                disabled={processing}
              />

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Selected Files ({files.length})
                  </h3>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm dark:bg-gray-700"
                      >
                        <span className="mr-2 truncate">{file.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleClear}
                    className="w-full text-sm text-red-600 hover:text-red-700 dark:hover:text-red-400"
                    disabled={processing}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Resize Settings
              </h2>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="resize-mode"
                      value="dimensions"
                      checked={mode === 'dimensions'}
                      onChange={() => handleModeChange('dimensions')}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Exact Dimensions</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="resize-mode"
                      value="percentage"
                      checked={mode === 'percentage'}
                      onChange={() => handleModeChange('percentage')}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Percentage</span>
                  </label>
                </div>
              </div>

              {mode === 'dimensions' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) =>
                        handleDimensionChange('width', e.currentTarget.valueAsNumber || '')
                      }
                      min={1}
                      max={MAX_DIMENSION}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={processing}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) =>
                        handleDimensionChange('height', e.currentTarget.valueAsNumber || '')
                      }
                      min={1}
                      max={MAX_DIMENSION}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={processing}
                    />
                  </div>
                </div>
              )}

              {mode === 'percentage' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scale: {percentage}%
                  </label>
                  <input
                    type="range"
                    value={percentage as number}
                    onChange={(e) => handlePercentageChange(e.target.valueAsNumber)}
                    min={1}
                    max={1000}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
                    disabled={processing}
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>1%</span>
                    <span>100%</span>
                    <span>1000%</span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="lock-aspect"
                  checked={lockAspectRatio}
                  onChange={(e) => handleLockAspectRatioChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="lock-aspect"
                  className="cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  Lock aspect ratio
                </label>
              </div>

              {firstBitmap && (
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400">
                    Original:{' '}
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {originalDimensions?.width} × {originalDimensions?.height}
                    </span>{' '}
                    • {originalSize}
                  </p>
                  {(width || percentage) && height && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Resized:{' '}
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {width} × {height}
                      </span>{' '}
                      • Est. {estimatedSize}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleProcess}
                  disabled={processing || files.length === 0 || (!width && !percentage)}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Resize Images'}
                </button>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Download All
                  </button>
                )}
              </div>
            </div>

            {results.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Results ({results.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={URL.createObjectURL(result.blob)}
                        alt={`Resized ${result.originalName}`}
                        className="h-48 w-full bg-gray-100 object-contain dark:bg-gray-700"
                      />
                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {result.filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(result.blob.size)}
                        </p>
                        <button
                          onClick={() => handleDownload(result.blob, result.filename)}
                          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
