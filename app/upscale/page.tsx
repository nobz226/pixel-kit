import Link from 'next/link';

export default function UpscalePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold">
            PixelKit
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
            ← Back
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-bold">Upscale</h1>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
          2x/4x AI super-resolution using TensorFlow.js. Preserves detail better than simple
          interpolation. Coming in Phase 3.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Back to Tools
        </Link>
      </section>
    </main>
  );
}
