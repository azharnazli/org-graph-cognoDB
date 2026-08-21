import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  accent?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  accent = "hsl(var(--line-command))",
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-2.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
