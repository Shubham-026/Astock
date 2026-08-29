"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LineChart, Menu, X } from "lucide-react";

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="url(#astock-logo-grad)" />
      <path
        d="M9 26L16 18L21 23L31 11"
        stroke="#030712"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="11" r="2.6" fill="#030712" />
      <defs>
        <linearGradient id="astock-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEAD4" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong shadow-[0_4px_30px_rgba(0,0,0,0.35)]" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 focus-ring rounded-lg">
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.jpg"
              alt="Astock logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-[10px] object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <LogoMark />
          )}
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Astock
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#discover" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Discover
          </Link>
          <Link href="/#how-it-works" className="text-sm text-ink-muted transition-colors hover:text-ink">
            How it works
          </Link>
          <a
            href="#"
            className="btn-primary"
          >
            <LineChart size={16} />
            Launch Screener
          </a>
        </nav>

        <button
          className="focus-ring glass-pill flex h-10 w-10 items-center justify-center md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="glass-strong border-t border-white/10 px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link href="/#discover" className="text-sm text-ink-muted" onClick={() => setMobileOpen(false)}>
              Discover
            </Link>
            <Link href="/#how-it-works" className="text-sm text-ink-muted" onClick={() => setMobileOpen(false)}>
              How it works
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
