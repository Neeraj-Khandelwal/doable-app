import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  className?: string;
};

const Input = ({
  label,
  error,
  className = '',
  ...props
}: InputProps) => {
  const inputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClasses = 'mt-1 text-sm text-rose';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className={errorClasses}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;