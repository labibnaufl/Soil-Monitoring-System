export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-lg bg-muted mt-2" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border bg-card p-5">
          <div className="h-6 w-56 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-40 rounded-lg bg-muted mb-6" />
          <div className="h-80 rounded-lg bg-muted/60" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-4 w-32 rounded-lg bg-muted mb-3" />
              <div className="h-8 w-24 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
