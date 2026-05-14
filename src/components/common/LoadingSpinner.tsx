import type { HTMLAttributes } from 'react';

type LoadingSpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'small' | 'medium' | 'large';
  color?: 'lavender' | 'mint' | 'rose' | 'gray';
  className?: string;
};

const LoadingSpinner = ({
  size = 'medium',
  color = 'lavender',
  className = '',
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colorClasses = {
    lavender: 'border-lavender',
    mint: 'border-mint',
    rose: 'border-rose',
    gray: 'border-gray-400',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
  );
};

export default LoadingSpinner;