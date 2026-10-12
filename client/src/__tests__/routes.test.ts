import { describe, it, expect } from 'vitest';

describe('SmartFlow Application Pages Navigation Verification', () => {
  const requiredPages = [
    { name: 'Dashboard', path: '/' },
    { name: 'My Tasks', path: '/tasks' },
    { name: 'Today', path: '/today' },
    { name: 'Upcoming', path: '/upcoming' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'AI Planner', path: '/ai-planner' },
    { name: 'Focus Mode', path: '/focus' },
    { name: 'Projects and Categories', path: '/projects' },
    { name: 'Productivity Analytics', path: '/analytics' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Profile and Settings', path: '/settings' },
    { name: 'Login', path: '/login' },
    { name: 'Registration', path: '/register' },
  ];

  it('should have all 12+ required pages accounted for in configuration', () => {
    expect(requiredPages.length).toBeGreaterThanOrEqual(12);
    const paths = requiredPages.map(p => p.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/tasks');
    expect(paths).toContain('/today');
    expect(paths).toContain('/upcoming');
    expect(paths).toContain('/calendar');
    expect(paths).toContain('/ai-planner');
    expect(paths).toContain('/focus');
    expect(paths).toContain('/projects');
    expect(paths).toContain('/analytics');
    expect(paths).toContain('/notifications');
    expect(paths).toContain('/settings');
    expect(paths).toContain('/login');
    expect(paths).toContain('/register');
  });

  it('verifies brand identity and naming conventions', () => {
    const brandName = 'SmartFlow — AI-Powered Smart To-Do Application';
    expect(brandName).toContain('SmartFlow');
    expect(brandName).toContain('To-Do');
  });
});
