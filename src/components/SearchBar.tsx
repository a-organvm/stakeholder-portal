"use client";

import { useState } from "react";

export function SearchBar({
  placeholder = "Search...",
  onSearch,
}: {
  placeholder?: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onSearch(e.target.value);
      }}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}
