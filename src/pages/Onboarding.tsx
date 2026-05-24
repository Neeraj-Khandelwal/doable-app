import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ONBOARDING_KEY = 'doable_onboarding_done';

const SLIDES = [
  {
    emoji: '🏠',
    title: 'Welcome to Doable',
    description: 'Your family\'s all-in-one app for tasks, habits, rewards, and more.',
    tips: [],
    accent: '#7C6FF0',
    bg: '#f3f0fd',
  },
  {
    emoji: '✅',
    title: 'Tasks that get done',
    description: 'Create tasks, set due dates, and assign them to family members.',
    tips: [
      'Tap + to add a task',
      'Assign to yourself or a partner',
      'Set priority, due date & reminders',
    ],
    accent: '#2EB87A',
    bg: '#edfaf4',
  },
  {
    emoji: '🔥',
    title: 'Habits & Kid Rewards',
    description: 'Build daily habits. Kids earn points and redeem them for rewards you set.',
    tips: [
      'Create habits on the Habits tab',
      'Add kid profiles in Family tab',
      'Set up rewards they can earn',
    ],
    accent: '#E8A800',
    bg: '#fef9e7',
  },
  {
    emoji: '🛒',
    title: 'Grocery, Fasting & Voice',
    description: 'Shared grocery list, fasting timer, and hands-free voice task creation.',
    tips: [
      'Grocery list syncs with your partner',
      'Track fasting sessions & streaks',
      'Just speak to create a task instantly',
    ],
    accent: '#2FA8E0',
    bg: '#e8f6fd',
  },
  {
    emoji: '👨‍👩‍👧',
    title: 'Sync with your family',
    description: 'Invite your partner from the Family tab — everything syncs in real time.',
    tips: [
      'Family tab → share your invite code',
      'Add kids for reward tracking',
      'Works across all Android devices',
    ],
    accent: '#7C6FF0',
    bg: '#f3f0fd',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    navigate('/home');
  };

  const next = () => {
    if (isLast) finish();
    else setCurrent((c) => c + 1);
  };

  const skip = () => finish();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: slide.bg, transition: 'background 0.4s ease' }}>

      {/* Skip button */}
      <div className="flex justify-end px-6 pt-6">
        {!isLast && (
          <button onClick={skip} className="text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
            Skip
          </button>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          className="text-7xl mb-8 transition-all duration-300"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.10))' }}
        >
          {slide.emoji}
        </div>

        <h1 className="text-2xl font-extrabold text-ink mb-3 leading-tight">
          {slide.title}
        </h1>

        <p className="text-base text-ink-3 leading-relaxed max-w-xs mb-8">
          {slide.description}
        </p>

        {slide.tips.length > 0 && (
          <div className="w-full max-w-xs space-y-3">
            {slide.tips.map((tip) => (
              <div key={tip} className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 text-left">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: slide.accent }}
                >
                  ✓
                </span>
                <span className="text-sm font-medium text-ink">{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-10 flex flex-col items-center gap-6">

        {/* Dot indicators */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? slide.accent : '#d1cfe8',
              }}
            />
          ))}
        </div>

        {/* Next / Get Started */}
        <button
          onClick={next}
          className="w-full max-w-xs py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-95 hover:opacity-90"
          style={{ background: slide.accent }}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
