'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
} from '@/lib/canvas-utils';
import { cropTool, calculateCropBounds, ASPECT_RATIOS } from '@/lib/tools/crop';
import { CropOptions } from '@/lib/tools/types';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CropPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ blob: Blob; filename: string; originalName: string }>
  >([]);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragType, setDragType] = useState<
    'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | null
  >(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(
    async (newFiles: File[]) => {
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
            const bounds = calculateCropBounds(bitmap.width, bitmap.height, {
              aspectRatio: selectedRatio || undefined,
            });
            setCropArea(bounds);
          }
        } catch (err) {
          setError(
            `Failed to load ${validFiles[i].name}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      setBitmaps(newBitmaps);
      setPreviews(newPreviews);
    },
    [selectedRatio]
  );

  const updatePreviewScale = useCallback(() => {
    const bitmap = bitmaps.get(currentIndex);
    const container = containerRef.current;
    if (!bitmap || !container) return;

    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 32;
    const maxHeight = window.innerHeight * 0.6;

    const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);

    setPreviewScale(scale);
  }, [bitmaps, currentIndex]);

  useEffect(() => {
    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [updatePreviewScale]);

  const getHandleType = useCallback(
    (
      clientX: number,
      clientY: number
    ): 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | null => {
      if (!cropArea || !imageRef.current) return null;

      const rect = imageRef.current.getBoundingClientRect();
      const handleSize = 16 / previewScale;
      const x = (clientX - rect.left) / previewScale;
      const y = (clientY - rect.top) / previewScale;

      const handles = {
        'resize-nw': { x: cropArea.x, y: cropArea.y },
        'resize-ne': { x: cropArea.x + cropArea.width, y: cropArea.y },
        'resize-sw': { x: cropArea.x, y: cropArea.y + cropArea.height },
        'resize-se': { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
      };

      for (const [type, pos] of Object.entries(handles)) {
        if (
          x >= pos.x - handleSize &&
          x <= pos.x + handleSize &&
          y >= pos.y - handleSize &&
          y <= pos.y + handleSize
        ) {
          return type as 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';
        }
      }

      if (
        x >= cropArea.x &&
        x <= cropArea.x + cropArea.width &&
        y >= cropArea.y &&
        y <= cropArea.y + cropArea.height
      ) {
        return 'move';
      }

      return null;
    },
    [cropArea, previewScale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const type = getHandleType(e.clientX, e.clientY);
      if (!type || !cropArea) return;

      e.preventDefault();
      setDragType(type);
      setDragStart({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    },
    [cropArea, getHandleType]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStart || !dragType || !cropArea || !originalDimensions) return;

      const dx = (e.clientX - dragStart.x) / previewScale;
      const dy = (e.clientY - dragStart.y) / previewScale;

      const newCrop = { ...cropArea };

      if (dragType === 'move') {
        newCrop.x = Math.max(
          0,
          Math.min(originalDimensions.width - cropArea.width, cropArea.x + dx)
        );
        newCrop.y = Math.max(
          0,
          Math.min(originalDimensions.height - cropArea.height, cropArea.y + dy)
        );
      } else if (dragType.startsWith('resize')) {
        const ratio = selectedRatio;
        const isWest = dragType.includes('w');
        const isNorth = dragType.includes('n');

        if (isWest) {
          const newX = Math.max(0, Math.min(cropArea.x + cropArea.width - 10, cropArea.x + dx));
          const newWidth = cropArea.width - (newX - cropArea.x);
          if (ratio) {
            const newHeight = newWidth / ratio;
            newCrop.x = newX;
            newCrop.width = newWidth;
            if (isNorth) {
              newCrop.y = Math.max(
                0,
                Math.min(
                  cropArea.y + cropArea.height - newHeight,
                  cropArea.y - (newHeight - cropArea.height) / 2
                )
              );
            } else {
              newCrop.y = Math.max(
                0,
                Math.min(
                  originalDimensions.height - newHeight,
                  cropArea.y + (cropArea.height - newHeight) / 2
                )
              );
            }
            newCrop.height = newHeight;
          } else {
            newCrop.x = newX;
            newCrop.width = newWidth;
          }
        } else {
          const newWidth = Math.max(
            10,
            Math.min(originalDimensions.width - cropArea.x, cropArea.width + dx)
          );
          if (ratio) {
            const newHeight = newWidth / ratio;
            newCrop.width = newWidth;
            if (isNorth) {
              newCrop.y = Math.max(
                0,
                Math.min(
                  cropArea.y + cropArea.height - newHeight,
                  cropArea.y - (newHeight - cropArea.height) / 2
                )
              );
            } else {
              newCrop.y = Math.max(
                0,
                Math.min(
                  originalDimensions.height - newHeight,
                  cropArea.y + (cropArea.height - newHeight) / 2
                )
              );
            }
            newCrop.height = newHeight;
          } else {
            newCrop.width = newWidth;
          }
        }
      }

      setCropArea(newCrop);
    },
    [isDragging, dragStart, dragType, cropArea, previewScale, selectedRatio, originalDimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleNumericChange = useCallback(
    (field: keyof CropArea, value: number) => {
      if (!cropArea || !originalDimensions) return;
      const newCrop = { ...cropArea, [field]: value };
      if (field === 'width' || field === 'height') {
        if (selectedRatio) {
          const otherField = field === 'width' ? 'height' : 'width';
          const ratio = selectedRatio;
          newCrop[otherField] = field === 'width' ? value / ratio : value * ratio;
        }
      }
      newCrop.x = Math.max(0, Math.min(originalDimensions.width - newCrop.width, newCrop.x));
      newCrop.y = Math.max(0, Math.min(originalDimensions.height - newCrop.height, newCrop.y));
      setCropArea(newCrop);
    },
    [cropArea, originalDimensions, selectedRatio]
  );

  const handleRatioChange = useCallback(
    (ratio: number | null) => {
      setSelectedRatio(ratio);
      if (originalDimensions) {
        const bounds = calculateCropBounds(originalDimensions.width, originalDimensions.height, {
          aspectRatio: ratio || undefined,
        });
        setCropArea(bounds);
      }
    },
    [originalDimensions]
  );

  const handleProcess = useCallback(async () => {
    if (files.length === 0 || bitmaps.size === 0 || !cropArea) return;

    setProcessing(true);
    setError(null);
    const newResults: Array<{ blob: Blob; filename: string; originalName: string }> = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const bitmap = bitmaps.get(i);
        if (!bitmap) continue;

        const options: CropOptions = {
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        };
        const blob = await cropTool.run(bitmap, options);
        const filename = getOutputFilename(
          files[i].name,
          'png',
          `cropped-${cropArea.width}x${cropArea.height}`
        );

        newResults.push({ blob, filename, originalName: files[i].name });
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [files, bitmaps, cropArea]);

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
    setCropArea(null);
    setOriginalDimensions(null);
    setError(null);
    setCurrentIndex(0);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((bitmap) => bitmap.close());
    };
  }, []);

  const currentBitmap = bitmaps.get(currentIndex);
  const currentPreview = previews.get(currentIndex);
  const currentFile = files[currentIndex];

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
                id="crop-dropzone"
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Area</h2>
                {files.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Image {currentIndex + 1} of {files.length}
                    </span>
                    {currentIndex > 0 && (
                      <button
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ← Prev
                      </button>
                    )}
                    {currentIndex < files.length - 1 && (
                      <button
                        onClick={() => setCurrentIndex(currentIndex + 1)}
                        className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => handleRatioChange(ratio.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedRatio === ratio.value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              <div
                ref={containerRef}
                className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                onMouseDown={handleMouseDown}
              >
                {currentPreview && currentBitmap && (
                  <>
                    <img
                      ref={imageRef}
                      src={currentPreview}
                      alt={currentFile?.name || 'Crop preview'}
                      className="block"
                      style={{
                        width: currentBitmap.width * previewScale,
                        height: currentBitmap.height * previewScale,
                      }}
                    />

                    <div
                      className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10"
                      style={{
                        left: cropArea?.x ? cropArea.x * previewScale : 0,
                        top: cropArea?.y ? cropArea.y * previewScale : 0,
                        width: cropArea?.width ? cropArea.width * previewScale : 0,
                        height: cropArea?.height ? cropArea.height * previewScale : 0,
                      }}
                    >
                      {['nw', 'ne', 'sw', 'se'].map((corner) => (
                        <div
                          key={corner}
                          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-blue-500"
                          style={{
                            left: corner.includes('e') ? '100%' : '0',
                            top: corner.includes('s') ? '100%' : '0',
                          }}
                        />
                      ))}
                    </div>

                    {(cropArea?.x !== 0 || cropArea?.y !== 0) && (
                      <div
                        className="pointer-events-none absolute inset-0 bg-black/30"
                        style={{
                          clipPath: cropArea
                            ? `polygon(
                                0 0,
                                100% 0,
                                100% 100%,
                                0 100%,
                                0 0,
                                ${cropArea.x * previewScale}px ${cropArea.y * previewScale}px,
                                ${(cropArea.x + cropArea.width) * previewScale}px ${cropArea.y * previewScale}px,
                                ${(cropArea.x + cropArea.width) * previewScale}px ${(cropArea.y + cropArea.height) * previewScale}px,
                                ${cropArea.x * previewScale}px ${(cropArea.y + cropArea.height) * previewScale}px,
                                ${cropArea.x * previewScale}px ${cropArea.y * previewScale}px
                              )`
                            : 'none',
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {cropArea && originalDimensions && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="mb-1 block text-gray-500 dark:text-gray-400">X</label>
                    <input
                      type="number"
                      value={cropArea.x}
                      onChange={(e) => handleNumericChange('x', e.target.valueAsNumber)}
                      min={0}
                      max={originalDimensions.width - (cropArea.width || 1)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-500 dark:text-gray-400">Y</label>
                    <input
                      type="number"
                      value={cropArea.y}
                      onChange={(e) => handleNumericChange('y', e.target.valueAsNumber)}
                      min={0}
                      max={originalDimensions.height - (cropArea.height || 1)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-500 dark:text-gray-400">Width</label>
                    <input
                      type="number"
                      value={cropArea.width}
                      onChange={(e) => handleNumericChange('width', e.target.valueAsNumber)}
                      min={1}
                      max={originalDimensions.width}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-500 dark:text-gray-400">Height</label>
                    <input
                      type="number"
                      value={cropArea.height}
                      onChange={(e) => handleNumericChange('height', e.target.valueAsNumber)}
                      min={1}
                      max={originalDimensions.height}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
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
                  disabled={processing || files.length === 0 || !cropArea}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Crop Images'}
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
                        alt={`Cropped ${result.originalName}`}
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
