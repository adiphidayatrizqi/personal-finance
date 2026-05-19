import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { parseIDNumber, formatNumberID } from "@/lib/finance/format";

interface Props {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  /** Max fraction digits while formatting (for display only). Default 0 for IDR-style. */
  maxFractionDigits?: number;
  /** Allow decimals (FX, crypto, gold). Default false. */
  decimals?: boolean;
  className?: string;
  id?: string;
}

/**
 * Indonesian-formatted number input.
 * - Stores value internally as a raw number.
 * - Displays with id-ID thousand separators (e.g. "1.000.000").
 * - parseIDNumber("1.000.000") -> 1000000 ; parseIDNumber("13.847,17") -> 13847.17
 */
export function NumberInputID({ value, onChange, placeholder, maxFractionDigits, decimals, className, id }: Props) {
  const max = maxFractionDigits ?? (decimals ? 6 : 0);
  const formatVal = (n: number) => (n === 0 ? "" : formatNumberID(n, max));
  const [text, setText] = useState<string>(() => formatVal(value));
  const focused = useRef(false);

  // Sync from outside when not focused (e.g. when editing a different record).
  useEffect(() => {
    if (focused.current) return;
    const parsed = parseIDNumber(text);
    if (parsed !== value) setText(formatVal(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    // Allow only digits, dots, commas, minus.
    const allowed = decimals ? /[^\d.,\-]/g : /[^\d.\-]/g;
    const cleaned = raw.replace(allowed, "");
    setText(cleaned);
    onChange(parseIDNumber(cleaned));
  };

  const handleBlur = () => {
    focused.current = false;
    setText(formatVal(parseIDNumber(text)));
  };

  return (
    <Input
      id={id}
      inputMode={decimals ? "decimal" : "numeric"}
      className={className}
      placeholder={placeholder}
      value={text}
      onFocus={() => { focused.current = true; }}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
