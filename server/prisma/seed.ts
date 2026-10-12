import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  const email = 'alex@smarttodo.ai';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists. Cleaning up previous test data...`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await hashPassword('Password123!');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 5);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Alex Mercer',
      passwordHash,
      timezone: 'America/New_York',
      theme: 'system',
      defaultPriority: 'HIGH',
      settings: {
        create: {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          soundEnabled: true,
          browserNotifications: true,
        },
      },
      tags: {
        create: [
          { name: 'engineering', color: '#3b82f6' },
          { name: 'release', color: '#ef4444' },
          { name: 'wellness', color: '#10b981' },
          { name: 'design', color: '#8b5cf6' },
        ],
      },
      projects: {
        create: [
          {
            name: 'Q4 Product Launch',
            description: 'Core deliverables for the upcoming feature rollout',
            color: '#7c3aed',
            category: 'Work',
          },
          {
            name: 'Personal Habits & Fitness',
            description: 'Daily routines and wellness milestones',
            color: '#10b981',
            category: 'Personal',
          },
        ],
      },
    },
    include: {
      projects: true,
      tags: true,
    },
  });

  const launchProject = user.projects.find(p => p.name === 'Q4 Product Launch')!;
  const personalProject = user.projects.find(p => p.name === 'Personal Habits & Fitness')!;

  // Create Tasks
  await prisma.task.create({
    data: {
      userId: user.id,
      projectId: launchProject.id,
      title: 'Finalize API documentation and developer portal',
      description: 'Review endpoint specifications and ensure all sample payloads are verified.',
      priority: 'URGENT',
      status: 'TODO',
      dueDate: today,
      estimatedMinutes: 60,
      actualMinutes: 25,
      order: 0,
      subtasks: {
        create: [
          { title: 'Update OpenAPI schema definitions', isCompleted: true, order: 0 },
          { title: 'Write authentication walkthrough', isCompleted: true, order: 1 },
          { title: 'Publish client SDK reference', isCompleted: false, order: 2 },
        ],
      },
      taskTags: {
        create: [{ tagId: user.tags[0].id }, { tagId: user.tags[1].id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      projectId: launchProject.id,
      title: 'Run end-to-end security penetration audit',
      description: 'Audit JWT cookie flags, CORS policies, and rate limiter settings.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: tomorrow,
      estimatedMinutes: 90,
      actualMinutes: 45,
      order: 1,
      subtasks: {
        create: [
          { title: 'Verify rate limiting thresholds', isCompleted: true, order: 0 },
          { title: 'Validate JWT expiration and invalidation', isCompleted: false, order: 1 },
        ],
      },
      taskTags: {
        create: [{ tagId: user.tags[0].id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      projectId: personalProject.id,
      title: 'Sign up for half-marathon race',
      description: 'Complete registration and download 12-week training schedule.',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: yesterday,
      estimatedMinutes: 20,
      actualMinutes: 20,
      order: 2,
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Review quarterly financial budget draft',
      description: 'Check expenses against initial forecast before executive briefing.',
      priority: 'HIGH',
      status: 'TODO',
      dueDate: nextWeek,
      estimatedMinutes: 45,
      order: 3,
    },
  });

  // Create Habits
  const habit1 = await prisma.habit.create({
    data: {
      userId: user.id,
      title: 'Morning Focused Deep Work',
      description: '90 minutes of undisturbed creative work before email',
      frequency: 'daily',
      targetDays: '[0,1,2,3,4,5,6]',
      color: '#7c3aed',
      completions: {
        create: [
          { date: twoDaysAgoStr },
          { date: yesterdayStr },
          { date: todayStr },
        ],
      },
    },
  });

  const habit2 = await prisma.habit.create({
    data: {
      userId: user.id,
      title: 'Daily 30-Minute Exercise',
      description: 'Cardio, strength training, or brisk walk',
      frequency: 'weekdays',
      targetDays: '[1,2,3,4,5]',
      color: '#10b981',
      completions: {
        create: [
          { date: twoDaysAgoStr },
          { date: yesterdayStr },
        ],
      },
    },
  });

  // Create Focus Sessions
  await prisma.focusSession.create({
    data: {
      userId: user.id,
      durationMinutes: 25,
      sessionType: 'pomodoro',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 2100000),
    },
  });

  await prisma.focusSession.create({
    data: {
      userId: user.id,
      durationMinutes: 25,
      sessionType: 'pomodoro',
      startedAt: new Date(Date.now() - 1800000),
      completedAt: new Date(Date.now() - 300000),
    },
  });

  console.log(`
✅ Database seeding complete!
--------------------------------------------------
👤 Demo User:     ${email}
🔑 Password:      Password123!
📁 Projects:      2
📝 Tasks:         4
🔥 Habits:        2 (with active 3-day and 2-day streaks)
⏱️ Focus Time:    50 minutes logged
--------------------------------------------------
  `);
}

seed()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
