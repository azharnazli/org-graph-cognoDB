export interface StationDotProps {
  color: string;
  className?: string;
}

/** A station roundel — the transit-map mark for an entity. */
export function StationDot({ color, className }: StationDotProps) {
  const classes = ["inline-block h-2 w-2 shrink-0 rounded-full", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <span aria-hidden className={classes} style={{ backgroundColor: color }} />;
}
