'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
} from '@/lib/canvas-utils';
import { compressTool, estimateCompressedSize } from '@/lib/tools/compress';
import { CompressOptions, OutputFormatValue } from '@/lib/tools/types';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function CompressPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState<number | ''>('');
  const [format, setFormat] = useState<OutputFormatValue>('jpeg');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ blob: Blob; filename: string; originalName: string }>
  >([]);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [originalSize, setOriginalSize] = useState(0);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    setError(null);
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length !== newFiles.length) {
      setError('Some files exceed the 100MB limit and were skipped');
    }
    setFiles(validFiles);
    setResults([]);
    setCurrentIndex(0);

    const newBitmaps = new Map<number, ImageBitmap>();
    const newPreviews = new Map<number, string>();

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const bitmap = await loadImageWithExif(validFiles[i]);
        newBitmaps.set(i, bitmap);
        const previewUrl = URL.createObjectURL(validFiles[i]);
        newPreviews.set(i, previewUrl);

        if (i === 0) {
          setOriginalDimensions({ width: bitmap.width, height: bitmap.height });
          setOriginalSize(validFiles[i].size);
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

  const estimatedSize = originalDimensions
    ? estimateCompressedSize(originalDimensions.width, originalDimensions.height, format, quality)
    : 0;

  const handleProcess = useCallback(async () => {
    if (files.length === 0 || bitmaps.size === 0) return;

    setProcessing(true);
    setError(null);
    const newResults: Array<{ blob: Blob; filename: string; originalName: string }> = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const bitmap = bitmaps.get(i);
        if (!bitmap) continue;

        const options: CompressOptions = {
          quality,
          targetSize: targetSize === '' ? undefined : targetSize * 1024,
          format,
        };
        const blob = await compressTool.run(bitmap, options);
        const filename = getOutputFilename(
          files[i].name,
          format === 'jpeg' ? 'jpg' : format,
          `compressed-q${quality}`
        );

        newResults.push({ blob, filename, originalName: files[i].name });
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [files, bitmaps, quality, targetSize, format]);

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
    setOriginalDimensions(null);
    setOriginalSize(0);
    setError(null);
    setCurrentIndex(0);
    setTargetSize('');
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((bitmap) => bitmap.close());
    };
  }, []);

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
                id="compress-dropzone"
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
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          index === currentIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'bg-gray-50 dark:bg-gray-700'
                        } cursor-pointer`}
                        onClick={() => setCurrentIndex(index)}
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
                Compression Settings
              </h2>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'jpeg', label: 'JPEG', ext: 'jpg' },
                      { value: 'webp', label: 'WebP', ext: 'webp' },
                      { value: 'avif', label: 'AVIF', ext: 'avif' },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => setFormat(fmt.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        format === fmt.value
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  JPEG doesn&apos;t support transparency. WebP and AVIF preserve alpha channel.
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.valueAsNumber)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
                  disabled={processing}
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Low (smaller file)</span>
                  <span>High (larger file)</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target File Size (optional, KB)
                </label>
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.valueAsNumber || '')}
                  min="1"
                  placeholder="e.g., 500"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={processing}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use quality slider only. The tool will find the best quality to
                  match target size.
                </p>
              </div>

              {originalDimensions && (
                <div className="mb-6 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400">
                    Original:{' '}
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {originalDimensions.width} × {originalDimensions.height}
                    </span>{' '}
                    • {formatFileSize(originalSize)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Estimated {format.toUpperCase()}:{' '}
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {formatFileSize(estimatedSize)}
                    </span>
                    {originalSize > 0 && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        (
                        {estimatedSize < originalSize
                          ? `${((1 - estimatedSize / originalSize) * 100).toFixed(0)}% smaller`
                          : `${((estimatedSize / originalSize - 1) * 100).toFixed(0)}% larger`}
                        )
                      </span>
                    )}
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleProcess}
                  disabled={processing || files.length === 0}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? 'Compressing...' : 'Compress Images'}
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
                        alt={`Compressed ${result.originalName}`}
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
