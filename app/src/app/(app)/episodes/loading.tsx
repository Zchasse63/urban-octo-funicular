export default function EpisodesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 rounded-lg bg-bg-subtle" />
        <div className="mt-2 h-4 w-64 rounded bg-bg-subtle" />
      </div>

      {/* Search & filter skeleton */}
      <div className="mb-6 flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-bg-subtle" />
        <div className="h-10 w-40 rounded-lg bg-bg-subtle" />
      </div>

      {/* Tab skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-bg-subtle" />
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border-soft bg-bg-elevated p-4"
          >
            <div className="h-10 w-10 rounded-full bg-bg-subtle" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-bg-subtle" />
              <div className="h-3 w-1/2 rounded bg-bg-subtle" />
            </div>
            <div className="h-6 w-20 rounded-full bg-bg-subtle" />
          </div>
        ))}
      </div>
    </div>
  );
}
