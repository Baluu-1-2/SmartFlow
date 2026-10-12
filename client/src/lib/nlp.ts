export interface ParsedTaskInput {
  title: string;
  dueDate: Date | null;
  dueDateFormatted: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedMinutes?: number | null;
}

export function parseNaturalLanguageTask(input: string): ParsedTaskInput {
  let cleaned = input.trim();
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  let targetDate: Date | null = null;
  let estimatedMinutes: number | null = null;

  // 1. Detect Priority
  const urgentRegex = /\b(urgent|asap|critical|emergency)\b/i;
  const highRegex = /\b(high priority|important|high)\b/i;
  const lowRegex = /\b(low priority|low)\b/i;

  if (urgentRegex.test(cleaned)) {
    priority = 'URGENT';
    cleaned = cleaned.replace(urgentRegex, '').trim();
  } else if (highRegex.test(cleaned)) {
    priority = 'HIGH';
    cleaned = cleaned.replace(highRegex, '').trim();
  } else if (lowRegex.test(cleaned)) {
    priority = 'LOW';
    cleaned = cleaned.replace(lowRegex, '').trim();
  }

  // 2. Detect Duration (e.g., "for 45 mins", "30m", "1 hour")
  const durationMatch = cleaned.match(/\b(?:for\s+)?(\d+)\s*(mins?|minutes?|hours?|hrs?|h|m)\b/i);
  if (durationMatch) {
    const val = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      estimatedMinutes = val * 60;
    } else {
      estimatedMinutes = val;
    }
    cleaned = cleaned.replace(durationMatch[0], '').trim();
  }

  // 3. Detect Time (e.g. "at 6 PM", "at 6:30pm", "at 14:00")
  let targetHour = 12;
  let targetMinute = 0;
  let hasSpecificTime = false;

  const timeMatch = cleaned.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  // Match specifically when it has am/pm or is prefixed with "at "
  if (timeMatch && (timeMatch[3] || cleaned.toLowerCase().includes('at ' + timeMatch[1]))) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      targetHour = hour;
      targetMinute = minute;
      hasSpecificTime = true;
      cleaned = cleaned.replace(timeMatch[0], '').trim();
    }
  }

  // 4. Detect Date (e.g. "today", "tomorrow", "tonight", "next friday")
  const now = new Date();
  const todayMatch = /\b(today|tonight)\b/i;
  const tomorrowMatch = /\b(tomorrow)\b/i;
  const weekdayMatch = /\b(?:on\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

  if (todayMatch.test(cleaned)) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute);
    cleaned = cleaned.replace(todayMatch, '').trim();
  } else if (tomorrowMatch.test(cleaned)) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, targetHour, targetMinute);
    cleaned = cleaned.replace(tomorrowMatch, '').trim();
  } else {
    const dayResult = cleaned.match(weekdayMatch);
    if (dayResult) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDayIndex = dayNames.indexOf(dayResult[1].toLowerCase());
      if (targetDayIndex !== -1) {
        const currentDayIndex = now.getDay();
        let daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // Next week's day
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, targetHour, targetMinute);
        cleaned = cleaned.replace(dayResult[0], '').trim();
      }
    }
  }

  // Clean remaining prepositions like trailing "at", "on", extra commas
  cleaned = cleaned
    .replace(/\s+(at|on|for|by|due)\s*$/i, '')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If no title left, fallback to original
  if (!cleaned) {
    cleaned = input.trim();
  }

  let dueDateFormatted: string | null = null;
  if (targetDate) {
    const yr = targetDate.getFullYear();
    const mo = String(targetDate.getMonth() + 1).padStart(2, '0');
    const da = String(targetDate.getDate()).padStart(2, '0');
    const hr = String(targetDate.getHours()).padStart(2, '0');
    const mi = String(targetDate.getMinutes()).padStart(2, '0');
    dueDateFormatted = `${yr}-${mo}-${da}T${hr}:${mi}`;
  }

  return {
    title: cleaned,
    dueDate: targetDate,
    dueDateFormatted,
    priority,
    estimatedMinutes,
  };
}
