import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-[var(--radius-md)]" />
    </div>
  )
}
