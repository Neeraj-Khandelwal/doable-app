import { formatElapsedHMS } from '../../utils/fastingModels';

interface Props {
  elapsedSeconds: number;
  size?: 'sm' | 'lg';
}

export default function LiveTimer({ elapsedSeconds, size = 'lg' }: Props) {
  return (
    <span
      className={
        size === 'lg'
          ? 'font-mono font-extrabold text-gray-900 tracking-widest text-4xl'
          : 'font-mono font-bold text-gray-900 tracking-wide text-2xl'
      }
    >
      {formatElapsedHMS(elapsedSeconds)}
    </span>
  );
}
