import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  glitch?: boolean;
}

export default function Layout({ children, glitch = false }: LayoutProps) {
  return (
    <div
      className={`relative w-full bg-black font-sans text-white overflow-hidden ${
        glitch ? 'glitch-shake' : ''
      }`}
      style={{ height: '100vh', minHeight: '100vh' }}
    >
      <main className="absolute inset-0 z-[1] overflow-hidden" style={{ height: '100%' }}>
        {children}
      </main>
      <div className="scanline-overlay fixed inset-0 z-[500]" aria-hidden />
    </div>
  );
}
