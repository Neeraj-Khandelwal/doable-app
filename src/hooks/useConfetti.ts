import confetti from 'canvas-confetti';

const KID_COLORS: Record<string, string[]> = {
  lavender: ['#b39ddb', '#d1c4e9', '#ffffff'],
  peach: ['#ffab91', '#ffccbc', '#ffffff'],
  mint: ['#80cbc4', '#b2dfdb', '#ffffff'],
  sky: ['#81d4fa', '#b3e5fc', '#ffffff'],
  amber: ['#ffd54f', '#ffe082', '#ffffff'],
  rose: ['#f48fb1', '#f8bbd0', '#ffffff'],
};

const DEFAULT_COLORS = ['#b39ddb', '#ffd54f', '#80cbc4', '#f48fb1', '#ffab91'];

export function useConfetti() {
  const fire = (kidColors?: string[]) => {
    void confetti({
      particleCount: 130,
      spread: 80,
      origin: { y: 0.6 },
      colors: kidColors ?? DEFAULT_COLORS,
    });
  };

  const fireForKids = (colors: string[]) => {
    const palette = colors.flatMap((c) => KID_COLORS[c] ?? DEFAULT_COLORS);
    fire(palette.length > 0 ? palette : DEFAULT_COLORS);
  };

  return { fire, fireForKids };
}
