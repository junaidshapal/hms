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
}: {
  name: string;
  id?: string;
  defaultValue?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {TIMES.map(({ value, label }) => (
          <SelectItem key={value} value={value} className="text-sm">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
