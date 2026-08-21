import { useHealth } from "./hooks/useHealth";

export default function App() {
  const { data, isLoading, isError, error } = useHealth();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">org-graph</h1>
      <p className="text-muted-foreground">CognoDB + Express + React (TS strict)</p>

      <section className="w-full max-w-md rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Backend health</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Error: {String(error)}</p>
        ) : data ? (
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">status</dt>
              <dd className="font-mono">{data.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">database</dt>
              <dd className="font-mono">{data.database}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">node count</dt>
              <dd className="font-mono">{data.nodeCount}</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </main>
  );
}
