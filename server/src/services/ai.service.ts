import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';

let genAI: GoogleGenerativeAI | null = null;
if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim()) {
  try {
    genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY.trim());
  } catch (err) {
    console.warn('[AI Service] Failed to initialize Google Generative AI client:', err);
  }
}

export interface DayPlanItem {
  timeSlot: string;
  taskId?: string;
  taskTitle: string;
  durationMinutes: number;
  priority: string;
  reason: string;
}

export interface SubtaskBreakdownItem {
  title: string;
  estimatedMinutes?: number;
}

export interface PrioritySuggestionItem {
  taskId: string;
  taskTitle: string;
  currentPriority: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
}

export class AIService {
  static isConfigured(): boolean {
    return Boolean(genAI && ENV.GEMINI_API_KEY);
  }

  static async chat(prompt: string, context: { userTasks: any[]; userHabits: any[]; userProjects: any[] }): Promise<string> {
    if (this.isConfigured()) {
      try {
        const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemPrompt = `You are Smart To-Do AI, an elite productivity coach and executive assistant.
Context:
The user has ${context.userTasks.length} tasks (${context.userTasks.filter(t => t.status === 'COMPLETED').length} completed, ${context.userTasks.filter(t => t.status !== 'COMPLETED').length} pending).
Pending high/urgent tasks: ${context.userTasks.filter(t => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.priority === 'URGENT')).map(t => t.title).join(', ') || 'None'}.
Active projects: ${context.userProjects.map(p => p.name).join(', ') || 'None'}.
Active habits: ${context.userHabits.map(h => h.title).join(', ') || 'None'}.

Instructions:
Be encouraging, structured, actionable, and concise. Format with bullet points and clear steps.`;

        const result = await model.generateContent([systemPrompt, prompt]);
        return result.response.text();
      } catch (err: any) {
        console.warn('[AI Service] Gemini chat call failed, falling back to heuristic assistant:', err?.message);
      }
    }

    // Heuristic Assistant Fallback
    const pending = context.userTasks.filter(t => t.status !== 'COMPLETED');
    const urgent = pending.filter(t => t.priority === 'URGENT');
    const high = pending.filter(t => t.priority === 'HIGH');

    if (prompt.toLowerCase().includes('plan my day')) {
      return `### 📅 Smart Heuristic Daily Plan\n\nBased on your ${pending.length} pending tasks:\n\n1. **Morning Block (Deep Work)**: Focus on high-impact priorities:\n${urgent.concat(high).slice(0, 2).map(t => `   - 🎯 **${t.title}** (Priority: ${t.priority})`).join('\n') || '   - Plan today’s top goal.'}\n\n2. **Midday Block**: Steady execution & routine tasks:\n${pending.filter(t => t.priority === 'MEDIUM').slice(0, 2).map(t => `   - 📝 ${t.title}`).join('\n') || '   - Process inbox and small tasks.'}\n\n3. **Afternoon Wrap-Up**: Low-friction administrative tasks and habit check-in.\n\n*Tip: Configure \`GEMINI_API_KEY\` in .env for fully dynamic, generative recommendations.*`;
    }

    if (prompt.toLowerCase().includes('priorit')) {
      return `### ⚡ Priority Analysis\n\nReviewing your pending items:\n- **Urgent Items**: ${urgent.length} requiring immediate attention.\n- **High Priority**: ${high.length} core impact drivers.\n\nRecommendation: Tackle items with nearest due dates first using 25-minute Pomodoro intervals.`;
    }

    return `### 💡 Smart Productivity Assistant\n\nYou currently have **${pending.length} pending tasks** across **${context.userProjects.length} projects**.\n\nTo maximize focus:\n- Target your top 1-3 tasks first thing in the morning.\n- Group similar tasks into a dedicated 50-minute time block.\n- Use the Focus Mode timer to sustain momentum without burnout.\n\n*(Connect your GEMINI_API_KEY in the server .env to enable multi-turn AI reasoning!)*`;
  }

  static async generateDailyPlan(pendingTasks: any[]): Promise<{ summary: string; schedule: DayPlanItem[] }> {
    if (this.isConfigured()) {
      try {
        const model = genAI!.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `Given these pending user tasks:
${JSON.stringify(pendingTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, estMinutes: t.estimatedMinutes })), null, 2)}

Create a realistic daily schedule starting from 09:00 AM.
Return a valid JSON object matching this schema:
{
  "summary": "Brief encouraging overview of the day",
  "schedule": [
    {
      "timeSlot": "09:00 - 10:00",
      "taskId": "task-id-if-applicable",
      "taskTitle": "Task or block title",
      "durationMinutes": 60,
      "priority": "HIGH",
      "reason": "Why this task is scheduled at this time"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.schedule)) {
          return parsed;
        }
      } catch (err) {
        console.warn('[AI Service] Gemini daily plan failed, falling back to heuristic schedule:', err);
      }
    }

    // Smart heuristic schedule generation
    const sorted = [...pendingTasks].sort((a, b) => {
      const pMap: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
    });

    const schedule: DayPlanItem[] = [];
    let startHour = 9;
    let startMin = 0;

    for (const task of sorted.slice(0, 5)) {
      const dur = task.estimatedMinutes || 45;
      const endTotalMin = startHour * 60 + startMin + dur;
      const endHour = Math.floor(endTotalMin / 60);
      const endMin = endTotalMin % 60;

      const formatTime = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      schedule.push({
        timeSlot: `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`,
        taskId: task.id,
        taskTitle: task.title,
        durationMinutes: dur,
        priority: task.priority,
        reason: task.priority === 'URGENT' ? 'Urgent priority requiring immediate attention' : 'High cognitive energy window',
      });

      // Advance time with 15 min buffer
      const nextTotalMin = endTotalMin + 15;
      startHour = Math.floor(nextTotalMin / 60);
      startMin = nextTotalMin % 60;
    }

    return {
      summary: `Automated plan prioritizing ${Math.min(sorted.length, 5)} critical tasks with built-in rest buffers.`,
      schedule,
    };
  }

  static async breakdownTask(taskTitle: string, description?: string): Promise<{ subtasks: SubtaskBreakdownItem[] }> {
    if (this.isConfigured()) {
      try {
        const model = genAI!.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `Break down this task into 3-6 logical, actionable subtasks:
Task: "${taskTitle}"
Details: "${description || ''}"

Return valid JSON:
{
  "subtasks": [
    { "title": "Subtask action step", "estimatedMinutes": 25 }
  ]
}`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());
        if (parsed && Array.isArray(parsed.subtasks)) {
          return parsed;
        }
      } catch (err) {
        console.warn('[AI Service] Gemini breakdown failed, falling back to heuristics:', err);
      }
    }

    // Heuristic decomposition
    return {
      subtasks: [
        { title: `Define requirements and scope for "${taskTitle}"`, estimatedMinutes: 20 },
        { title: `Draft initial implementation / core work`, estimatedMinutes: 45 },
        { title: `Review, test, and polish results`, estimatedMinutes: 25 },
        { title: `Finalize and document outcomes`, estimatedMinutes: 15 },
      ],
    };
  }

  static async suggestPriorities(tasks: any[]): Promise<{ suggestions: PrioritySuggestionItem[] }> {
    const suggestions: PrioritySuggestionItem[] = [];
    const now = new Date();

    for (const t of tasks.filter(task => task.status !== 'COMPLETED')) {
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24 && t.priority !== 'URGENT') {
          suggestions.push({
            taskId: t.id,
            taskTitle: t.title,
            currentPriority: t.priority,
            suggestedPriority: 'URGENT',
            reason: 'Task is due in less than 24 hours',
          });
        } else if (diffHours < 72 && t.priority === 'LOW') {
          suggestions.push({
            taskId: t.id,
            taskTitle: t.title,
            currentPriority: t.priority,
            suggestedPriority: 'HIGH',
            reason: 'Due within 3 days; elevate from Low to prevent deadline crunch',
          });
        }
      }
    }

    return { suggestions };
  }

  static async suggestRescheduling(tasks: any[]): Promise<{ summary: string; suggestions: any[] }> {
    const suggestions: any[] = [];
    const now = new Date();
    const overdueOrNear = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now);

    overdueOrNear.forEach((t, idx) => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + (idx % 3 + 1));
      newDate.setHours(17, 0, 0, 0);
      suggestions.push({
        taskId: t.id,
        taskTitle: t.title,
        currentDueDate: t.dueDate,
        proposedDueDate: newDate.toISOString(),
        reason: 'Overdue deadline redistributed to avoid cognitive bottleneck',
      });
    });

    return {
      summary:
        suggestions.length > 0
          ? `Identified ${suggestions.length} overloaded/overdue tasks and prepared optimized target dates.`
          : 'All scheduled deadlines are balanced. No rescheduling required.',
      suggestions,
    };
  }
}
