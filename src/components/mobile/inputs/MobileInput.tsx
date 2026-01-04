import React from 'react';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  inputClassName?: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  prefix,
  suffix,
  inputClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
            {prefix}
          </div>
        )}
        <input
          id={props.id || props.name}
          className={`w-full bg-zinc-800 border border-zinc-700 rounded-[var(--mobile-border-radius)] py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--mobile-primary)] focus:border-transparent ${inputClassName} ${
            prefix ? 'pl-10' : ''
          } ${
            suffix ? 'pr-10' : ''
          } ${
            error ? 'border-[var(--mobile-danger)]' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p id={`${props.id || props.name}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};