import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <div className="text-[6rem] font-[family-name:var(--font-display)] font-bold text-[var(--color-border-strong)] leading-none">
        404
      </div>
      <h1 className="text-[var(--text-h1)] font-[family-name:var(--font-display)] font-semibold text-[var(--color-text-ink)]">
        Page not found
      </h1>
      <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/episodes"
        className="mt-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent-blue)] text-[var(--color-text-on-accent)] font-[family-name:var(--font-display)] font-medium text-[var(--text-body-sm)] hover:bg-[var(--color-accent-blue-hover)] transition-colors"
      >
        Back to Episodes
      </Link>
    </div>
  )
}
