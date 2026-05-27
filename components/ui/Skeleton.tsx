export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <Skeleton className="w-full aspect-[2/3]" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 mt-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
