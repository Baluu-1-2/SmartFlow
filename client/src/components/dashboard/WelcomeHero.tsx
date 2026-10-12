import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, X, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WelcomeHeroProps {
  userName?: string;
  onQuickAdd: () => void;
}

export function WelcomeHero({ userName, onQuickAdd }: WelcomeHeroProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('smartflow_welcome_dismissed') === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('smartflow_welcome_dismissed', 'true');
  };

  const handleResetWelcome = () => {
    setIsDismissed(false);
    localStorage.removeItem('smartflow_welcome_dismissed');
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setVideoError(true));
    }
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span>Welcome to <strong>SmartFlow</strong>. Plan smarter, focus deeper, and achieve your daily goals.</span>
        </div>
        <button
          onClick={handleResetWelcome}
          className="text-violet-600 dark:text-violet-400 hover:underline text-xs font-medium"
        >
          Show Intro Banner
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 dark:border-violet-900/60 shadow-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white min-h-[220px]">
      {/* Background Video with Graceful Poster Fallback */}
      {!videoError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/video/poster.svg"
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none transition-opacity duration-700"
        >
          <source src="/assets/video/smart_todo_intro.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src="/assets/video/poster.svg"
          alt="SmartFlow Productivity Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
      )}

      {/* Decorative ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-indigo-950/60 pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-violet-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>AI-Powered Smart Productivity Suite</span>
          </div>

          <div className="flex items-center gap-2">
            {!videoError && (
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title={isPlaying ? 'Pause background video' : 'Play background video'}
                aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Dismiss welcome experience"
              aria-label="Dismiss welcome experience"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Text & CTA Buttons */}
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Elevate your daily workflow with SmartFlow
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Harness natural language planning, intelligent task breakdown, focused Pomodoro sessions, and real-time productivity analytics designed to keep you ahead.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={onQuickAdd}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quick Add Task (Ctrl+K)
            </button>

            <Link
              to="/ai-planner"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold border border-white/15 backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <span>Explore AI Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/focus"
              className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors"
            >
              Start Focus Session
            </Link>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autonomous Subtask Generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>Time-Blocked Scheduling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Bank-Grade Data Privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
