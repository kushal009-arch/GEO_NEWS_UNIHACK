import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  /** Optional: apply glitch-shake to the main container (e.g. on marker click). */
  glitch?: boolean;
}

export default function Layout({ children, glitch = false }: LayoutProps) {
  return (
    <div
      className={`relative h-full w-full bg-black font-sans text-white overflow-hidden ${
        glitch ? 'glitch-shake' : ''
      }`}
    >
      {children}
      <div className="scanline-overlay fixed inset-0 z-[500]" aria-hidden />
    </div>
  );
}
