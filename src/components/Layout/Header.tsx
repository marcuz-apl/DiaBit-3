'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { VERSION } from '@/lib/version';
import { HelpCircle, Info, Sun, Moon, LogOut, ShieldAlert, User } from 'lucide-react';

export default function Header() {
  const { user, theme, toggleTheme, logout } = useApp();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b0f19]/85">
      <div className="flex h-14 items-center justify-between px-6">
        
        {/* Left Section: Help & About */}
        <div className="flex items-center space-x-3">
          <Link
            href="/help"
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
              pathname === '/help'
                ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <HelpCircle className="h-4.5 w-4.5" />
            <span>Help</span>
          </Link>
          <Link
            href="/about"
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
              pathname === '/about'
                ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Info className="h-4.5 w-4.5" />
            <span>About</span>
          </Link>
        </div>

        {/* Center Section: Branding & Logo */}
        <div className="flex items-center space-x-2.5">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md">
              {/* Dynamic Drill Bit Logo SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-white"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold tracking-tight dark:from-white dark:to-slate-200">
              DiaBit
            </span>
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            v{VERSION}
          </span>
        </div>

        {/* Right Section: Auth, Admin & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              {user.role === 'Admin' && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    pathname === '/admin'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/15'
                  }`}
                >
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              
              <div className="flex items-center space-x-2 rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">{user.username}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">({user.role})</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                title="Logout"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              Sign In
            </Link>
          )}

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>

      </div>
    </header>
  );
}
