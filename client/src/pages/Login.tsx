import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('alex@smarttodo.ai');
    setPassword('Password123!');
    setError('');
    setIsLoading(true);

    try {
      await login('alex@smarttodo.ai', 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to your Smart To-Do AI workspace
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="alex@smarttodo.ai"
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            className="w-full py-2.5"
            isLoading={isLoading}
          >
            Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* 1-Click Demo Login Card */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full p-3 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-100/60 text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-semibold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> 1-Click Demo Account
              </p>
              <p className="text-[11px] text-violet-700/80 dark:text-violet-400">
                alex@smarttodo.ai (Pre-seeded data)
              </p>
            </div>
            <span className="text-xs font-semibold text-violet-600 group-hover:translate-x-0.5 transition-transform">
              Explore →
            </span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
