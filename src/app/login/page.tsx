'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';
import { useEventHistoryStore } from '@/stores/event-history-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isBlocked, session, loginTracker } = useAuthStore();
  const { getUserByName, setOnline } = useUserStore();
  const { addEvent } = useEventHistoryStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (session.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [session.isAuthenticated, router]);

  // Countdown timer for blocked state
  useEffect(() => {
    if (!loginTracker.blockedUntil) {
      setRemainingTime(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, loginTracker.blockedUntil! - Date.now());
      setRemainingTime(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [loginTracker.blockedUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for realism
    await new Promise((r) => setTimeout(r, 400));

    const result = login(username, password, getUserByName, setOnline, addEvent);

    if (result.success) {
      router.replace('/dashboard');
    } else {
      setError(result.error || 'An unknown error occurred');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    const { getUserByEmail } = useUserStore.getState();
    const user = getUserByEmail(forgotEmail);

    if (!user) {
      setForgotMessage('If this email is registered, the password has been reset.');
    } else {
      // Reset password to default
      useUserStore.getState().updateUser(user.id, { password: 'Password@123' });
      setForgotMessage(
        'Password has been reset to the default value. You can now log in with: Password@123'
      );
    }
  };

  const blocked = isBlocked();
  const attemptsLeft = 5 - loginTracker.attempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ip-bg p-4">
      {/* Background Decorative Curves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'var(--ip-primary)' }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'var(--ip-accent)' }}
        />
      </div>

      <div className="ip-card p-8 sm:p-10 w-full max-w-md relative ip-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-ip-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            P
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ip-text tracking-tight">
              iPark
            </h1>
            <p className="text-xs text-ip-text-muted">
              Smart Parking Management
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-ip-text-secondary mb-1.5"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="ip-input"
              placeholder="Enter your username"
              required
              disabled={blocked || isLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-ip-text-secondary mb-1.5"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ip-input"
              placeholder="Enter your password"
              required
              disabled={blocked || isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm ip-fade-in">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div>
                <p>{error}</p>
                {!blocked && loginTracker.attempts > 0 && (
                  <p className="text-xs mt-1 text-red-500">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Blocked Timer */}
          {blocked && remainingTime > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm ip-fade-in">
              <p className="font-medium">Account temporarily locked</p>
              <p className="text-xs mt-1">
                Try again in {Math.ceil(remainingTime / 1000)} seconds
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={blocked || isLoading}
            className="ip-btn ip-btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setShowForgotDialog(true);
              setForgotMessage('');
              setForgotEmail('');
            }}
            className="text-sm text-ip-primary hover:text-ip-primary-dark transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-6 p-3 rounded-xl bg-ip-bg border border-ip-border">
          <p className="text-xs text-ip-text-muted text-center font-medium mb-1">
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-ip-text-secondary">
            <div>
              <span className="text-ip-text-muted">Admin:</span> admin
            </div>
            <div>
              <span className="text-ip-text-muted">Pass:</span> Admin@123
            </div>
            <div>
              <span className="text-ip-text-muted">User:</span> user1
            </div>
            <div>
              <span className="text-ip-text-muted">Pass:</span> User1@123
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotDialog && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowForgotDialog(false)}
        >
          <div
            className="ip-card p-8 w-full max-w-sm ip-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-ip-text mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-ip-text-secondary mb-4">
              Enter your registered email to reset your password to the default value.
            </p>

            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="ip-input mb-4"
              placeholder="Enter your email"
            />

            {forgotMessage && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-4 ip-fade-in">
                {forgotMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowForgotDialog(false)}
                className="ip-btn flex-1 py-2.5 text-sm border border-ip-border text-ip-text-secondary hover:bg-ip-surface-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                className="ip-btn ip-btn-primary flex-1 py-2.5 text-sm"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
