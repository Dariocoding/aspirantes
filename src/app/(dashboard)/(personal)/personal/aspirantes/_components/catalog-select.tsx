import { Label } from "@src/components/ui/label";
import { cn } from "@src/lib/utils";

const selectClass =
  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function CatalogSelect({
  id,
  name,
  label,
  value,
  options,
  groups,
  placeholder = "Sin indicar",
  className,
}: {
  id: string;
  name: string;
  label: string;
  value?: string | null;
  options?: readonly { value: string; label: string }[];
  groups?: readonly { label: string; options: readonly { value: string; label: string }[] }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} name={name} defaultValue={value ?? ""} className={selectClass}>
        <option value="">{placeholder}</option>
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function catalogOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}
