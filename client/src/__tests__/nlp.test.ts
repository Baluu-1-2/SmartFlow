import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageTask } from '../lib/nlp.js';

describe('Natural Language Task Parser Tests', () => {
  it('should parse prompt: "Finish mathematics homework tomorrow at 6 PM, high priority"', () => {
    const input = 'Finish mathematics homework tomorrow at 6 PM, high priority';
    const result = parseNaturalLanguageTask(input);

    expect(result.priority).toBe('HIGH');
    expect(result.title.toLowerCase()).toContain('mathematics homework');
    expect(result.dueDate).not.toBeNull();
    if (result.dueDate) {
      expect(result.dueDate.getHours()).toBe(18); // 6 PM
    }
  });

  it('should parse urgent priority and duration: "Deploy microservices for 45 mins urgent"', () => {
    const input = 'Deploy microservices for 45 mins urgent';
    const result = parseNaturalLanguageTask(input);

    expect(result.priority).toBe('URGENT');
    expect(result.estimatedMinutes).toBe(45);
    expect(result.title.toLowerCase()).toContain('deploy microservices');
  });

  it('should parse low priority with "today"', () => {
    const input = 'Water the office plants today, low priority';
    const result = parseNaturalLanguageTask(input);

    expect(result.priority).toBe('LOW');
    expect(result.title.toLowerCase()).toContain('water the office plants');
    expect(result.dueDate).not.toBeNull();
  });
});
