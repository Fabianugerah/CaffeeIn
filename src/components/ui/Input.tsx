import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 bg-transparent text-black dark:text-white focus:ring-neutral-500 focus:border-transparent${
          error ? 'border-red-500' : 'border-neutral-800'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}