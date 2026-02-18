import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base font-sans">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 text-7xl font-bold text-text-tertiary/20">
          404
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-blue/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
