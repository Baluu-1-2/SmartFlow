import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../lib/api.js';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

interface TimerContextType {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  setMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  selectTaskForFocus: (taskId: string | null, title?: string | null) => void;
  configureDurations: (focus: number, shortBreak: number, longBreak: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Synthesize pleasant completion chime using browser Web Audio API
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play warm melodic two-tone chime (E5 -> B5)
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(659.25, 0, 0.4); // E5
    playTone(987.77, 0.25, 0.6); // B5
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [focusDuration, setFocusDuration] = useState<number>(25 * 60);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15 * 60);

  const [mode, setModeState] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  const sessionStartTimeRef = useRef<Date | null>(null);

  const getDurationForMode = (m: TimerMode) => {
    switch (m) {
      case 'pomodoro':
        return focusDuration;
      case 'short_break':
        return shortBreakDuration;
      case 'long_break':
        return longBreakDuration;
    }
  };

  const totalDuration = getDurationForMode(mode);

  const setMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setModeState(newMode);
    setTimeLeft(getDurationForMode(newMode));
    sessionStartTimeRef.current = null;
  };

  const startTimer = () => {
    if (!isRunning) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date();
      }
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
    sessionStartTimeRef.current = null;
  };

  const selectTaskForFocus = (taskId: string | null, title?: string | null) => {
    setActiveTaskId(taskId);
    setActiveTaskTitle(title || null);
  };

  const configureDurations = (focus: number, shortBreak: number, longBreak: number) => {
    setFocusDuration(focus * 60);
    setShortBreakDuration(shortBreak * 60);
    setLongBreakDuration(longBreak * 60);
    if (!isRunning) {
      if (mode === 'pomodoro') setTimeLeft(focus * 60);
      else if (mode === 'short_break') setTimeLeft(shortBreak * 60);
      else if (mode === 'long_break') setTimeLeft(longBreak * 60);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed session!
      setIsRunning(false);
      playChime();

      const durationMinutes = Math.round(totalDuration / 60);
      const startedAt = sessionStartTimeRef.current || new Date(Date.now() - totalDuration * 1000);

      // Record to backend
      api.post('/focus', {
        durationMinutes,
        sessionType: mode,
        taskId: activeTaskId,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      }).catch(err => console.error('Failed to record completed focus session:', err));

      sessionStartTimeRef.current = null;
      // Switch to next mode or notify
      if (mode === 'pomodoro') {
        setModeState('short_break');
        setTimeLeft(shortBreakDuration);
      } else {
        setModeState('pomodoro');
        setTimeLeft(focusDuration);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, totalDuration, activeTaskId, shortBreakDuration, focusDuration]);

  return (
    <TimerContext.Provider
      value={{
        mode,
        timeLeft,
        totalDuration,
        isRunning,
        activeTaskId,
        activeTaskTitle,
        setMode,
        startTimer,
        pauseTimer,
        resetTimer,
        selectTaskForFocus,
        configureDurations,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
