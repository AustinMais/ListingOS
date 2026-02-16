'use client';

import { useEffect, useState } from 'react';

type DemoGateProps = {
  children: React.ReactNode;
};

export default function DemoGate({ children }: DemoGateProps) {
  const [status, setStatus] = useState<'loading' | 'locked' | 'unlocked'>('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setStatus(data?.ok ? 'unlocked' : 'locked'))
      .catch(() => setStatus('locked'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: password.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) {
          setStatus('unlocked');
        } else {
          setError(data?.error ?? 'Invalid password');
        }
      })
      .catch(() => setError('Something went wrong'));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">ListingOS</h1>
          <p className="text-sm text-gray-600 mb-6">Exclusive demo access</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[#CE011F] focus:outline-none focus:ring-1 focus:ring-[#CE011F]"
                autoFocus
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#CE011F] px-4 py-3 font-semibold text-white hover:bg-[#a00119] transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
