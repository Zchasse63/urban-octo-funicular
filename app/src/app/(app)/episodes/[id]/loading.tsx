export default function EpisodeDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-24 rounded bg-bg-subtle" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-72 rounded-lg bg-bg-subtle" />
            <div className="mt-2 h-4 w-48 rounded bg-bg-subtle" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-lg bg-bg-subtle" />
            <div className="h-10 w-28 rounded-lg bg-bg-subtle" />
          </div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="mb-6 flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-xl border border-border-soft bg-bg-elevated p-4"
          >
            <div className="mx-auto h-20 w-20 rounded-full bg-bg-subtle" />
            <div className="mt-3 h-4 w-16 mx-auto rounded bg-bg-subtle" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-md bg-bg-subtle" />
        ))}
      </div>

      {/* Two-column content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="h-64 rounded-xl bg-bg-subtle" />
          <div className="h-48 rounded-xl bg-bg-subtle" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-bg-subtle" />
          <div className="h-56 rounded-xl bg-bg-subtle" />
        </div>
      </div>
    </div>
  );
}
