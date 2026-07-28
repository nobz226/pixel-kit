'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageBackground } from '@/components/background/BackgroundEffects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel, PanelHeader } from '@/components/ui/Panel';
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
    <PageBackground variant="tool">
      <motion.main
        className="px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-white transition-colors hover:text-primary"
            >
              PixelKit
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              ← All Tools
            </Link>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Panel variant="elevated" padding="md">
                  <PanelHeader title="Upload" />
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
                      <p className="text-sm font-medium text-zinc-300">
                        Selected Files ({files.length})
                      </p>
                      <ul className="max-h-40 space-y-1 overflow-y-auto">
                        {files.map((file, index) => (
                          <li
                            key={index}
                            className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm text-zinc-300 transition-colors hover:bg-white/10 ${
                              index === currentIndex
                                ? 'bg-primary/20 text-primary'
                                : 'bg-white/[0.03]'
                            }`}
                            onClick={() => setCurrentIndex(index)}
                          >
                            <span className="mr-2 truncate">{file.name}</span>
                            <span className="text-zinc-500">
                              {formatFileSize(file.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <motion.button
                        onClick={handleClear}
                        className="w-full text-sm text-red-400 transition-colors hover:text-red-300"
                        disabled={processing}
                        whileTap={{ scale: 0.98 }}
                      >
                        Clear All
                      </motion.button>
                    </div>
                  )}
                </Panel>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <Panel variant="elevated" padding="md">
                <PanelHeader title="Compression Settings" />

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
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
                      <motion.button
                        key={fmt.value}
                        onClick={() => setFormat(fmt.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          format === fmt.value
                            ? 'border-primary/40 bg-primary/20 text-primary'
                            : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        {fmt.label}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    JPEG doesn&apos;t support transparency. WebP and AVIF preserve alpha
                    channel.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(e.target.valueAsNumber)}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-primary"
                    disabled={processing}
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Low (smaller file)</span>
                    <span>High (larger file)</span>
                  </div>
                </div>

                <div className="mb-6">
                  <Input
                    label="Target File Size (optional, KB)"
                    type="number"
                    value={targetSize}
                    onChange={(e) => setTargetSize(e.target.valueAsNumber || '')}
                    min="1"
                    placeholder="e.g., 500"
                    variant="glass"
                    disabled={processing}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Leave empty to use quality slider only. The tool will find the best
                    quality to match target size.
                  </p>
                </div>

                {originalDimensions && (
                  <div className="mb-6 space-y-2 border-t border-white/5 pt-4 text-sm">
                    <p className="text-zinc-400">
                      Original:{' '}
                      <span className="font-mono font-medium text-white">
                        {originalDimensions.width} × {originalDimensions.height}
                      </span>{' '}
                      • {formatFileSize(originalSize)}
                    </p>
                    <p className="text-zinc-400">
                      Estimated {format.toUpperCase()}:{' '}
                      <span className="font-mono font-medium text-white">
                        {formatFileSize(estimatedSize)}
                      </span>
                      {originalSize > 0 && (
                        <span className="ml-2 text-zinc-500">
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
                    className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleProcess}
                    disabled={processing || files.length === 0}
                    variant="primary"
                    className="flex-1"
                  >
                    {processing ? 'Compressing...' : 'Compress Images'}
                  </Button>
                  {results.length > 1 && (
                    <Button onClick={handleDownloadAll} variant="glass">
                      Download All
                    </Button>
                  )}
                </div>
              </Panel>

              {results.length > 0 && (
                <Panel variant="elevated" padding="md">
                  <PanelHeader title={`Results (${results.length})`} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border border-white/10"
                      >
                        <img
                          src={URL.createObjectURL(result.blob)}
                          alt={`Compressed ${result.originalName}`}
                          className="h-48 w-full bg-white/5 object-contain"
                        />
                        <div className="space-y-2 p-3">
                          <p className="truncate text-sm font-medium text-zinc-300">
                            {result.filename}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatFileSize(result.blob.size)}
                          </p>
                          <Button
                            onClick={() => handleDownload(result.blob, result.filename)}
                            variant="primary"
                            fullWidth
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </div>
      </motion.main>
    </PageBackground>
  );
}
