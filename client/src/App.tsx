import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { TimerProvider } from './context/TimerContext.js';
import { ErrorBoundary } from './components/ui/ErrorBoundary.js';

import { AppLayout } from './components/layout/AppLayout.js';
import { Dashboard } from './pages/Dashboard.js';
import { Tasks } from './pages/Tasks.js';
import { Today } from './pages/Today.js';
import { Upcoming } from './pages/Upcoming.js';
import { Projects } from './pages/Projects.js';
import { Calendar } from './pages/Calendar.js';
import { Focus } from './pages/Focus.js';
import { Habits } from './pages/Habits.js';
import { Analytics } from './pages/Analytics.js';
import { AIPlanner } from './pages/AIPlanner.js';
import { Notifications } from './pages/Notifications.js';
import { Settings } from './pages/Settings.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TimerProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Workspace Routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/today" element={<Today />} />
                    <Route path="/upcoming" element={<Upcoming />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/ai-planner" element={<AIPlanner />} />
                    <Route path="/ai" element={<Navigate to="/ai-planner" replace />} />
                    <Route path="/focus" element={<Focus />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* Wildcard Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
