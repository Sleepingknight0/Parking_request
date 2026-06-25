"use client";

import * as React from "react";
import { cn } from "@nacc/ui";

/**
 * Recharts ResponsiveContainer measures its parent on mount. If the parent is
 * `display:none` (Tailwind `hidden`) or has zero width, the chart renders blank
 * and never recovers. ResizeObserver + deferred render fixes that.
 */
export function ChartFrame({
  height,
  className,
  children,
}: {
  height: number;
  className?: string;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      window.requestAnimationFrame(() => {
        const { width } = el.getBoundingClientRect();
        if (width > 0) {
          const next = { width: Math.floor(width), height };
          setSize((prev) =>
            prev && prev.width === next.width && prev.height === next.height ? prev : next,
          );
        }
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div
      ref={ref}
      className={cn("w-full min-w-0", className)}
      style={{ height }}
      aria-hidden={!size}
    >
      {size ? children(size) : null}
    </div>
  );
}
