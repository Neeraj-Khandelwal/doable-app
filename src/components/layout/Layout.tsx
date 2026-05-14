import { type ReactNode, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ── Nav icon components ────────────────────────────────────────────────────

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TasksIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]">
    <path d="M4 6h16M4 12h10M4 18h7" />
  </svg>
);

const HabitsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FamilyIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]">
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const RewardsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────

type NavItem = {
  path: string;
  label: string;
  Icon: ComponentType<{ active: boolean }>;
  matchPaths: string[];
};

// ── Layout ────────────────────────────────────────────────────────────────

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/home',
      label: 'Home',
      Icon: HomeIcon,
      matchPaths: ['/home'],
    },
    {
      path: '/tasks',
      label: 'Tasks',
      Icon: TasksIcon,
      matchPaths: ['/tasks'],
    },
    {
      path: '/habits',
      label: 'Habits',
      Icon: HabitsIcon,
      matchPaths: ['/habits'],
    },
    {
      path: '/family',
      label: 'Family',
      Icon: FamilyIcon,
      matchPaths: ['/family', '/family-setup'],
    },
    {
      path: '/rewards',
      label: 'Rewards',
      Icon: RewardsIcon,
      matchPaths: ['/rewards'],
    },
  ];

  return (
    <div className="min-h-svh bg-bg font-sans text-ink">
      {/* Each page owns its own title — no global header */}
      <main className="pb-28 px-4 pt-5">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto bg-[rgba(255,251,242,0.94)] backdrop-blur-xl border-t border-line flex justify-around items-center px-1 pt-2 pb-5">
          {navItems.map((item) => {
            const isActive = item.matchPaths.some(
              (p) => location.pathname === p || location.pathname.startsWith(p + '/')
            );
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center gap-[3px] flex-1"
              >
                {/* Icon pill — fills with plum-soft when active */}
                <div className={`flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-plum-soft' : ''
                }`}>
                  <span className={isActive ? 'text-plum' : 'text-ink-3'}>
                    <item.Icon active={isActive} />
                  </span>
                </div>
                {/* Label */}
                <span className={`text-[11px] font-semibold tracking-tight ${
                  isActive ? 'text-plum' : 'text-ink-4'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
