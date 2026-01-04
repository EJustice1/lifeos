import React from 'react';

interface MobileSliderProps {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  className?: string;
}

export const MobileSlider: React.FC<MobileSliderProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  showValue = true,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[var(--mobile-primary)]"
        />
        {showValue && (
          <span className="w-12 text-center text-sm font-medium text-white">
            {value}
          </span>
        )}
      </div>
    </div>
  );
};