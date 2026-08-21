import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line-command bg-line-command/10"
      >
        <span className="font-mono text-xl font-semibold text-line-command">?</span>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          End of the line — no station at this stop
        </h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          The route you followed doesn't serve a page here. Head back to the network map and
          choose another station.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Back to the network map</Link>
      </Button>
    </div>
  );
}
