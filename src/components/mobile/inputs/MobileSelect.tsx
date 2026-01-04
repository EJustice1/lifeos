import React from 'react';

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-zinc-800 border border-zinc-700 rounded-[var(--mobile-border-radius)] p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--mobile-primary)] focus:border-transparent ${
          error ? 'border-[var(--mobile-danger)]' : ''
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-zinc-900">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};