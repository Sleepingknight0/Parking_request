"use client";

import * as React from "react";
import { cn } from "../lib/cn";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const selectClass =
  "flex h-10 min-w-[4.5rem] rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function splitTime(value: string): { hour: string; minute: string } {
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!m) return { hour: "", minute: "" };
  return { hour: m[1]!.padStart(2, "0"), minute: m[2]!.padStart(2, "0") };
}

export function ThaiTimeInput({
  value,
  onChange,
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const { hour, minute } = splitTime(value);

  function setHour(nextHour: string) {
    if (!nextHour) {
      onChange("");
      return;
    }
    onChange(`${nextHour}:${minute || "00"}`);
  }

  function setMinute(nextMinute: string) {
    if (!hour) return;
    onChange(`${hour}:${nextMinute}`);
  }

  return (
    <div id={id} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <select
        aria-label="ชั่วโมง"
        className={selectClass}
        disabled={disabled}
        value={hour}
        onChange={(e) => setHour(e.target.value)}
      >
        <option value="">ชม.</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground" aria-hidden="true">
        .
      </span>
      <select
        aria-label="นาที"
        className={selectClass}
        disabled={disabled || !hour}
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
      >
        <option value="">นาที</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">น. (24 ชม.)</span>
    </div>
  );
}
