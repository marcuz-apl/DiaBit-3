'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import Link from 'next/link';
import { Shield, Key, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#0b0f19] grid-lines">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Workspace</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-[#111827]">
        {/* Header branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-6 w-6"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            Sign In to DiaBit
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Enterprise Directional Drilling Planning Suite
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Shield className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-500 bg-rose-50 dark:bg-rose-950/15 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-bold py-2.5 text-sm transition-colors shadow-md shrink-0 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Secure Access'}
          </button>
        </form>

        {/* Demo credentials guide */}
        <div className="mt-6 rounded-lg bg-slate-50 p-3.5 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-600 dark:text-slate-300">Default Access Accounts:</p>
          <div className="flex justify-between">
            <span>Administrator:</span>
            <code className="font-bold text-slate-700 dark:text-slate-200">admin / admin123</code>
          </div>
          <div className="flex justify-between">
            <span>Drilling Engineer:</span>
            <code className="font-bold text-slate-700 dark:text-slate-200">engineer / engineer123</code>
          </div>
        </div>

      </div>
    </div>
  );
}
