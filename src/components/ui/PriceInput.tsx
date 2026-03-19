"use client";

import { useState, useEffect } from "react";

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  prefix?: string;
}

function format(n: number): string {
  if (!n && n !== 0) return "";
  return n.toLocaleString("en-NG");
}

function parse(raw: string): number {
  const digits = raw.replace(/[^0-9.]/g, "");
  return parseFloat(digits) || 0;
}

export default function PriceInput({
  value,
  onChange,
  placeholder = "0",
  required,
  disabled,
  className = "",
  prefix,
}: PriceInputProps) {
  const [display, setDisplay] = useState(value ? format(value) : "");

  // Sync display when value changes externally (e.g. initial load)
  useEffect(() => {
    setDisplay(value ? format(value) : "");
  }, []);  // intentionally only on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow digits and a single decimal point
    const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    const numeric = parse(cleaned);

    // Format with commas for the integer part, preserve trailing decimal input
    const hasDecimal = cleaned.endsWith(".");
    const parts = cleaned.split(".");
    const intFormatted = parseInt(parts[0] || "0", 10).toLocaleString("en-NG");
    const formatted = hasDecimal
      ? intFormatted + "."
      : parts[1] !== undefined
      ? intFormatted + "." + parts[1]
      : cleaned === ""
      ? ""
      : intFormatted;

    setDisplay(formatted);
    onChange(numeric);
  };

  const handleBlur = () => {
    // On blur, clean up to final formatted value
    setDisplay(value ? format(value) : "");
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={`relative flex items-center ${prefix ? "flex" : ""}`}>
      {prefix && (
        <span className="absolute left-3 text-gray-500 font-medium text-sm select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${prefix ? "pl-7" : ""} ${className}`}
      />
    </div>
  );
}
