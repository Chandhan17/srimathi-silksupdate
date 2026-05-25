export default function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-brand-gold/20 bg-white/60 p-4"
        >
          <div className="h-52 rounded-xl bg-brand-maroon/10" />
          <div className="mt-4 h-4 w-2/3 rounded bg-brand-maroon/10" />
          <div className="mt-2 h-4 w-1/2 rounded bg-brand-maroon/10" />
        </div>
      ))}
    </div>
  )
}
