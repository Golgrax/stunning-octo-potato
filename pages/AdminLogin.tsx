import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader } from 'lucide-react';
import { GlassCard, Button, Input } from '../components/GlassComponents';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
  onCancel: () => void;
}

const API_BASE_URL = '/api';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user has admin or employee role
      if (data.user.role !== 'admin' && data.user.role !== 'employee') {
        throw new Error('Access denied. Admin or employee role required.');
      }

      console.log('✅ Admin login successful:', data.user.name);
      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick login for demo
  const quickLogin = (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      setEmail('admin@lumina.cafe');
      setPassword('admin123');
    } else {
      setEmail('employee@lumina.cafe');
      setPassword('employee123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Lumina Admin</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Sign in to access the dashboard</p>
        </div>

        {/* Login Form */}
        <GlassCard className="p-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-2xl border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Login Failed</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <Input
                  type="email"
                  placeholder="admin@lumina.cafe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-white dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-white dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-3">Demo Credentials (Click to fill)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                Admin Account
              </button>
              <button
                type="button"
                onClick={() => quickLogin('employee')}
                className="px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                Employee Account
              </button>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full mt-4 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
          >
            ← Back to Home
          </button>
        </GlassCard>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Secure admin access • Protected by authentication
          </p>
        </div>
      </div>
    </div>
  );
};

