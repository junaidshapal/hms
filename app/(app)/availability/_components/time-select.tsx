"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMES = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 6; h <= 23; h++) {
    const value = `${String(h).padStart(2, "0")}:00`;
    const hour12 = ((h + 11) % 12) + 1;
    const period = h < 12 ? "AM" : "PM";
    const label = `${hour12}:00 ${period}`;
    out.push({ value, label });
  }
  return out;
})();

export function TimeSelect({
  name,
  id,
  defaultValue,
  value,
  onValueChange,
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Select
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {TIMES.map(({ value: v, label }) => (
          <SelectItem key={v} value={v} className="text-sm">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
