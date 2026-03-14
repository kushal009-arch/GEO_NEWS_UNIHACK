import { type ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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
      <Navbar />
      <Sidebar />
      <main className="fixed inset-0 pt-14 overflow-auto">
        {children}
      </main>
      <div className="scanline-overlay fixed inset-0 z-[500]" aria-hidden />
    </div>
  );
}
