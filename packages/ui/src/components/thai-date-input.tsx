"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { formatThaiDate, type Era } from "@nacc/utils";
import { cn } from "../lib/cn";

export function ThaiDateInput({
  value,
  onChange,
  className,
  disabled,
  id,
  era = "be",
  placeholder = "วัน/เดือน/ปี (พ.ศ.)",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  era?: Era;
  placeholder?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const display = value ? formatThaiDate(value, era) : "";

  function openPicker() {
    const el = inputRef.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
      return;
    }
    el.click();
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={openPicker}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          disabled ? "cursor-not-allowed opacity-50" : "hover:bg-accent/40",
        )}
      >
        <span className={cn("tabular-nums", !display && "text-muted-foreground")}>
          {display || placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <input
        ref={inputRef}
        type="date"
        className="sr-only"
        tabIndex={-1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-hidden
      />
    </div>
  );
}
