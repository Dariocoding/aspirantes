"use client";

import { cn } from "@src/lib/utils";

type Props = {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

/** Casilla de selección del censo. El estado mixto marca «algunos de esta página». */
export function SelectionMark({ checked, indeterminate = false, disabled = false, label, onCheckedChange }: Props) {
  const mixed = indeterminate && !checked;
  const active = checked || mixed;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(mixed ? true : !checked)}
      className={cn(
        "inline-flex size-[1.15rem] shrink-0 items-center justify-center rounded-[5px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition",
        "focus-visible:ring-2 focus-visible:ring-slate-900/25 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-slate-900/20"
          : "border-slate-300 bg-white text-slate-900 hover:border-slate-500",
      )}
    >
      {mixed ? (
        <span className="h-0.5 w-2 rounded-full bg-white" />
      ) : (
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className={cn("size-3 transition-opacity", checked ? "opacity-100" : "opacity-0")}
        >
          <path
            d="M3.2 8.4 6.4 11.5 12.8 4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
