'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
}: NumberInputProps) {
  const current = value === '' ? 0 : Number(value);
  const decimals = step.toString().split('.')[1]?.length ?? 0;

  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  const format = (n: number) => (decimals > 0 ? n.toFixed(decimals) : n.toString());

  const handleStep = (direction: 1 | -1) => {
    if (disabled) return;
    const next = clamp(current + step * direction);
    onChange(format(next));
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="admin-number-input w-full pl-3 pr-9 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50"
      />
      {!disabled && (
        <div className="absolute right-1 top-1 bottom-1 flex flex-col w-7 rounded-md overflow-hidden">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(1)}
            className="flex-1 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-600/50 transition-colors"
            aria-label="Увеличить"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep(-1)}
            className="flex-1 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-600/50 transition-colors"
            aria-label="Уменьшить"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
