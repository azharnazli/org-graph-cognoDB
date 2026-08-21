import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({ value, onChange, placeholder = "Search...", debounceMs = 300 }: SearchBarProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [draft, debounceMs, onChange, value]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
