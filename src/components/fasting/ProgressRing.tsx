import type { ReactNode } from 'react';

interface Props {
  percent: number;       // 0–100
  size?: number;         // diameter in px, default 200
  strokeWidth?: number;  // default 18
  children?: ReactNode;
}

function ringColor(p: number): string {
  if (p >= 100) return '#E8A800'; // amber — goal reached
  if (p >= 70)  return '#2EB87A'; // mint  — approaching goal
  return '#2FA8E0';               // sky   — early progress
}

export default function ProgressRing({ percent, size = 200, strokeWidth = 18, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = ringColor(percent);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>

      {/* Centered content */}
      <div className="absolute flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
