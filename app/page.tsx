import Link from 'next/link';

const tools = [
  {
    name: 'Resize',
    href: '/resize',
    description: 'Exact pixel dimensions, percentage scaling, aspect ratio lock, live preview',
    phase: 'Phase 1',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
    ),
  },
  {
    name: 'Crop',
    href: '/crop',
    description:
      'Freeform drag-to-crop, fixed-ratio presets (1:1, 4:3, 16:9, 3:2), numeric fine-tuning',
    phase: 'Phase 1',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  {
    name: 'Convert',
    href: '/convert',
    description: 'JPEG, PNG, WebP, AVIF output. Transparency handling with background color picker',
    phase: 'Phase 1',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    name: 'Compress',
    href: '/compress',
    description: 'Quality slider (0-100), live file-size estimate, before/after visual comparison',
    phase: 'Phase 1',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0021 6.96V19.04a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Remove Background',
    href: '/remove-background',
    description:
      'One-click subject segmentation, transparent PNG output, checkerboard preview, background replacement',
    phase: 'Phase 2',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    ),
  },
  {
    name: 'Upscale',
    href: '/upscale',
    description:
      '2x/4x AI super-resolution, model selection for photos/art/screenshots, large image handling',
    phase: 'Phase 3',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
            PixelKit
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 sm:text-2xl dark:text-gray-300">
            Free, private, client-side image editing. Resize, crop, convert, compress, remove
            backgrounds, and upscale — all in your browser. No uploads, no accounts, no watermarks.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/resize"
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
            >
              Try Resize Tool
            </Link>
            <Link
              href="#tools"
              className="rounded-lg bg-gray-100 px-8 py-3 text-lg font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              View All Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'No Account', desc: 'Start editing immediately — no sign-up required' },
              {
                title: 'No Uploads',
                desc: 'Images never leave your device — true privacy by architecture',
              },
              {
                title: 'No Watermarks',
                desc: 'Your images, your output — clean exports every time',
              },
              {
                title: 'No Limits',
                desc: 'No file size games, no batch limits, no artificial restrictions',
              },
            ].map((principle, i) => (
              <div key={i} className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {principle.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Tools
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400">
                    {tool.icon}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {tool.phase}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Built With</h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            {[
              'Next.js 16',
              'React 19',
              'TypeScript',
              'Tailwind CSS',
              'Canvas API',
              'Web Workers',
              'ONNX Runtime',
              'TensorFlow.js',
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-800"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-12 sm:px-6 lg:px-8 dark:border-gray-800">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Open source — built with AI assistance. No tracking, no analytics, no nonsense.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link
              href="https://github.com"
              className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              GitHub
            </Link>
            <Link
              href="#license"
              className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              License
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
