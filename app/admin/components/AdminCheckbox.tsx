'use client';

import { Check } from 'lucide-react';

interface AdminCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function AdminCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: AdminCheckboxProps) {
  return (
    <label
      className={`group inline-flex items-center gap-2.5 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {/* Скрытый нативный input — для accessibility и формы */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      {/* Кастомный чекбокс */}
      <span
        className={`relative w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-150 flex-shrink-0
          ${checked
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 shadow-sm shadow-amber-500/20'
            : 'bg-slate-700/50 border-slate-600 group-hover:border-slate-500'
          }
          peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-800`}
      >
        <Check
          className={`w-3.5 h-3.5 text-white transition-all duration-150
            ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          strokeWidth={3}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-slate-300'} group-hover:text-white`}>
              {label}
            </span>
          )}
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
}
