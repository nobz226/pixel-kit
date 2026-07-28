'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
} from '@/lib/canvas-utils';
import { cropTool, calculateCropBounds, ASPECT_RATIOS } from '@/lib/tools/crop';
import { CropOptions } from '@/lib/tools/types';
import { PageBackground } from '@/components/background/BackgroundEffects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel, PanelHeader } from '@/components/ui/Panel';

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
  const cropAtDragStart = useRef<CropArea | null>(null);

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
      cropAtDragStart.current = { ...cropArea };
      setDragType(type);
      setDragStart({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    },
    [cropArea, getHandleType]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStart || !dragType || !cropAtDragStart.current || !originalDimensions) return;

      const base = cropAtDragStart.current;
      const dx = (e.clientX - dragStart.x) / previewScale;
      const dy = (e.clientY - dragStart.y) / previewScale;

      let newCrop: CropArea;

      if (dragType === 'move') {
        newCrop = {
          x: Math.max(0, Math.min(originalDimensions.width - base.width, base.x + dx)),
          y: Math.max(0, Math.min(originalDimensions.height - base.height, base.y + dy)),
          width: base.width,
          height: base.height,
        };
      } else if (dragType.startsWith('resize')) {
        const ratio = selectedRatio;
        const isWest = dragType.includes('w');
        const isNorth = dragType.includes('n');

        if (isWest) {
          const newX = Math.max(0, Math.min(base.x + base.width - 10, base.x + dx));
          const newWidth = base.width - (newX - base.x);
          if (ratio) {
            const newHeight = newWidth / ratio;
            if (isNorth) {
              newCrop = {
                x: newX,
                y: Math.max(0, Math.min(base.y + base.height - newHeight, base.y - (newHeight - base.height) / 2)),
                width: newWidth,
                height: newHeight,
              };
            } else {
              newCrop = {
                x: newX,
                y: Math.max(0, Math.min(originalDimensions.height - newHeight, base.y + (base.height - newHeight) / 2)),
                width: newWidth,
                height: newHeight,
              };
            }
          } else {
            newCrop = { x: newX, y: base.y, width: newWidth, height: base.height };
          }
        } else {
          const newWidth = Math.max(10, Math.min(originalDimensions.width - base.x, base.width + dx));
          if (ratio) {
            const newHeight = newWidth / ratio;
            if (isNorth) {
              newCrop = {
                x: base.x,
                y: Math.max(0, Math.min(base.y + base.height - newHeight, base.y - (newHeight - base.height) / 2)),
                width: newWidth,
                height: newHeight,
              };
            } else {
              newCrop = {
                x: base.x,
                y: Math.max(0, Math.min(originalDimensions.height - newHeight, base.y + (base.height - newHeight) / 2)),
                width: newWidth,
                height: newHeight,
              };
            }
          } else {
            newCrop = { x: base.x, y: base.y, width: newWidth, height: base.height };
          }
        }
      } else {
        return;
      }

      setCropArea(newCrop);
    },
    [isDragging, dragStart, dragType, previewScale, selectedRatio, originalDimensions]
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
    <PageBackground variant="tool">
      <motion.main
        className="min-h-screen px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              PixelKit
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              ← All Tools
            </Link>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Panel variant="elevated" padding="md" className="sticky top-24">
                <PanelHeader title="Upload" />
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
                    <h3 className="text-sm font-medium text-zinc-300">
                      Selected Files ({files.length})
                    </h3>
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {files.map((file, index) => (
                        <li
                          key={index}
                          className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm ${
                            index === currentIndex
                              ? 'bg-primary/10 text-zinc-200'
                              : 'bg-white/[0.03] text-zinc-300'
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
                    <Button
                      onClick={handleClear}
                      variant="ghost"
                      size="sm"
                      fullWidth
                      disabled={processing}
                      className="text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </Panel>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <Panel variant="elevated" padding="lg">
                <PanelHeader
                  title="Crop Area"
                  action={
                    files.length > 1 && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>
                          Image {currentIndex + 1} of {files.length}
                        </span>
                        {currentIndex > 0 && (
                          <Button
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                            variant="ghost"
                            size="sm"
                          >
                            ← Prev
                          </Button>
                        )}
                        {currentIndex < files.length - 1 && (
                          <Button
                            onClick={() => setCurrentIndex(currentIndex + 1)}
                            variant="ghost"
                            size="sm"
                          >
                            Next →
                          </Button>
                        )}
                      </div>
                    )
                  }
                />

                <div className="mb-4 flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => handleRatioChange(ratio.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        selectedRatio === ratio.value
                          ? 'border-primary/40 bg-primary/20 text-primary'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>

                <div
                  ref={containerRef}
                  className="relative overflow-hidden rounded-lg bg-black/50"
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
                        className="pointer-events-none absolute border-2 border-primary bg-primary/10"
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
                            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-primary"
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
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">X</label>
                      <Input
                        type="number"
                        value={cropArea.x}
                        onChange={(e) => handleNumericChange('x', e.target.valueAsNumber)}
                        min={0}
                        max={originalDimensions.width - (cropArea.width || 1)}
                        variant="glass"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Y</label>
                      <Input
                        type="number"
                        value={cropArea.y}
                        onChange={(e) => handleNumericChange('y', e.target.valueAsNumber)}
                        min={0}
                        max={originalDimensions.height - (cropArea.height || 1)}
                        variant="glass"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Width</label>
                      <Input
                        type="number"
                        value={cropArea.width}
                        onChange={(e) => handleNumericChange('width', e.target.valueAsNumber)}
                        min={1}
                        max={originalDimensions.width}
                        variant="glass"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Height</label>
                      <Input
                        type="number"
                        value={cropArea.height}
                        onChange={(e) => handleNumericChange('height', e.target.valueAsNumber)}
                        min={1}
                        max={originalDimensions.height}
                        variant="glass"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleProcess}
                    disabled={processing || files.length === 0 || !cropArea}
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    {processing ? 'Processing...' : 'Crop Images'}
                  </Button>
                  {results.length > 1 && (
                    <Button
                      onClick={handleDownloadAll}
                      variant="glass"
                      size="md"
                    >
                      Download All
                    </Button>
                  )}
                </div>
              </Panel>

              {results.length > 0 && (
                <Panel variant="elevated" padding="lg">
                  <PanelHeader title={`Results (${results.length})`} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border border-white/10"
                      >
                        <img
                          src={URL.createObjectURL(result.blob)}
                          alt={`Cropped ${result.originalName}`}
                          className="h-48 w-full bg-zinc-900/50 object-contain"
                        />
                        <div className="space-y-2 p-3">
                          <p className="truncate text-sm font-medium text-white">
                            {result.filename}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatFileSize(result.blob.size)}
                          </p>
                          <Button
                            onClick={() => handleDownload(result.blob, result.filename)}
                            variant="primary"
                            size="sm"
                            fullWidth
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
