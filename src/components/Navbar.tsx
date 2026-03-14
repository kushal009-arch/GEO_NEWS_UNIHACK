import { BarChart3, Menu, Search } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard', href: '#' },
  { label: 'Map', href: '#' },
  { label: 'Analytics', href: '#' },
];

interface NavbarProps {
  onAnalyticsClick?: () => void;
  onMenuClick?: () => void;
}

export default function Navbar({ onAnalyticsClick, onMenuClick }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-14 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4 px-4">
        {/* Logo + mobile menu */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg border border-white/15 p-2 text-white/70 hover:text-white hover:border-cyan-300/50 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="rounded-[20px] border border-[rgba(0,242,255,0.1)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-4 py-2 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
            <span className="text-lg font-semibold tracking-[0.2em] text-cyan-100 uppercase font-mono">
              GEONEWS
            </span>
          </div>
        </div>

        {/* Nav links (hidden on small screens) */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-white/75 hover:text-cyan-200 hover:bg-white/5 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md mx-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search events, regions..."
            className="w-full rounded-full border border-white/15 bg-black/50 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/30"
            aria-label="Search"
          />
        </div>

        {/* Analytics button */}
        <button
          type="button"
          onClick={onAnalyticsClick}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,242,255,0.35)] bg-[rgba(0,0,0,0.3)] backdrop-blur-[20px] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-100 hover:border-cyan-300 transition-colors"
        >
          <BarChart3 size={14} />
          <span>// ANALYTICS</span>
        </button>
      </div>
    </header>
  );
}
