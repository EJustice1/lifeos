import React from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleButtonProps {
  options: ToggleOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  options,
  selectedValue,
  onChange,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-${options.length} gap-2 bg-zinc-900 rounded-xl p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            triggerHapticFeedback();
            onChange(option.value);
          }}
          className={`rounded-[var(--mobile-border-radius)] py-3 font-semibold transition-colors text-center ${
            selectedValue === option.value
              ? option.value === 'income'
                ? 'bg-[var(--mobile-primary)] text-white'
                : option.value === 'expense'
                ? 'bg-[var(--mobile-danger)] text-white'
                : 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};