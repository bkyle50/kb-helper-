import { tool } from 'ai';
import { z } from 'zod';
import { querySheet } from '@/lib/google/sheets';
import { createMemory, updateMemory, deleteMemory, listMemories, getMemory } from '@/lib/ai/memory';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const tools = {
  querySheet: tool({
    description:
      "Read data from Kyle's Google Sheet — pipeline, contacts, referral partners, and other business data. Optionally specify a range like 'Sheet1' or 'Pipeline!A1:Z50'. Defaults to the whole first sheet.",
    inputSchema: z.object({
      range: z.string().optional().describe("Sheet range, e.g. 'Sheet1' or 'Contacts!A:D'. Defaults to Sheet1."),
    }),
    execute: async ({ range }) => querySheet(range),
  }),

  remember: tool({
    description:
      "Save a new fact to Trillion's persistent memory so it's available in future conversations. Use a path like '/kyle/preferences', '/business/pipeline', '/people/john-smith' to organize facts.",
    inputSchema: z.object({
      path: z.string().describe("Memory path, e.g. '/kyle/preferences/communication' or '/people/jane-doe'"),
      content: z.string().describe('The fact or note to remember.'),
    }),
    execute: async ({ path, content }) => {
      const mem = await createMemory(content, path);
      return mem ? `Saved: [${mem.path}] ${mem.content}` : 'Memory store not configured — set ANTHROPIC_MEMORY_STORE_ID.';
    },
  }),

  updateMemory: tool({
    description: "Update an existing memory entry. Use listMemories first to get the ID.",
    inputSchema: z.object({
      memoryId: z.string().describe('ID of the memory to update.'),
      content: z.string().describe('Updated content.'),
    }),
    execute: async ({ memoryId, content }) => {
      const mem = await updateMemory(memoryId, content);
      return mem ? `Updated ${memoryId}: ${mem.content}` : 'Memory store not configured.';
    },
  }),

  forgetMemory: tool({
    description: "Delete a memory entry by ID. Use listMemories first to find the right ID.",
    inputSchema: z.object({
      memoryId: z.string().describe('ID of the memory to delete.'),
    }),
    execute: async ({ memoryId }) => {
      await deleteMemory(memoryId);
      return `Deleted ${memoryId}.`;
    },
  }),

  listMemories: tool({
    description: "List all saved memories with their IDs and paths — useful before updating or deleting one.",
    inputSchema: z.object({}),
    execute: async () => {
      const mems = await listMemories();
      if (mems.length === 0) return 'No memories saved yet.';
      return mems.map((m) => `ID:${m.id} [${m.path}] ${m.content}`).join('\n');
    },
  }),

  createTask: tool({
    description: "Create a task for Kyle with a title, optional due date, and optional notes. Use dueDate in YYYY-MM-DD format.",
    inputSchema: z.object({
      title: z.string().describe('Task title.'),
      dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format.'),
      notes: z.string().optional().describe('Additional context or notes.'),
    }),
    execute: async ({ title, dueDate, notes }) => {
      const id = uid();
      const task = { type: 'task', id, title, dueDate, notes, completed: false, createdAt: new Date().toISOString() };
      const mem = await createMemory(JSON.stringify(task), `/tasks/${id}`);
      return mem ? `Task created: "${title}"${dueDate ? ` (due ${dueDate})` : ''}` : 'Memory store not configured.';
    },
  }),

  completeTask: tool({
    description: "Mark a task as completed. The memoryId comes from the task memory in Kyle's context (path /tasks/...).",
    inputSchema: z.object({
      memoryId: z.string().describe('Memory ID of the task to complete.'),
    }),
    execute: async ({ memoryId }) => {
      const mem = await getMemory(memoryId);
      if (!mem) return `Task memory ${memoryId} not found.`;
      const task = JSON.parse(mem.content);
      task.completed = true;
      task.completedAt = new Date().toISOString();
      await updateMemory(memoryId, JSON.stringify(task));
      return `Task "${task.title}" marked complete.`;
    },
  }),

  setGoal: tool({
    description: "Create a named goal for Kyle with a measurable target and optional deadline.",
    inputSchema: z.object({
      title: z.string().describe('Goal title, e.g. "Close 10 loans in July".'),
      target: z.string().describe('Measurable target description, e.g. "10 loans closed".'),
      deadline: z.string().optional().describe('Deadline in YYYY-MM-DD format.'),
    }),
    execute: async ({ title, target, deadline }) => {
      const id = uid();
      const goal = { type: 'goal', id, title, target, deadline, pct: 0, log: [], createdAt: new Date().toISOString() };
      const mem = await createMemory(JSON.stringify(goal), `/goals/${id}`);
      return mem ? `Goal set: "${title}" → ${target}${deadline ? ` by ${deadline}` : ''}` : 'Memory store not configured.';
    },
  }),

  updateGoalProgress: tool({
    description: "Log new progress on a goal. Provide the memory ID and the new completion percentage (0–100).",
    inputSchema: z.object({
      memoryId: z.string().describe('Memory ID of the goal.'),
      pct: z.number().min(0).max(100).describe('New completion percentage.'),
      note: z.string().optional().describe('Brief note about the progress update.'),
    }),
    execute: async ({ memoryId, pct, note }) => {
      const mem = await getMemory(memoryId);
      if (!mem) return `Goal memory ${memoryId} not found.`;
      const goal = JSON.parse(mem.content);
      const today = new Date().toISOString().slice(0, 10);
      goal.pct = pct;
      goal.log = [...(goal.log ?? []), { date: today, pct, ...(note ? { note } : {}) }];
      await updateMemory(memoryId, JSON.stringify(goal));
      return `Goal "${goal.title}" updated to ${pct}%.${note ? ` Note: ${note}` : ''}`;
    },
  }),

  addHabit: tool({
    description: "Add a recurring habit for Kyle to track — daily or weekly.",
    inputSchema: z.object({
      name: z.string().describe('Habit name, e.g. "Post on social media" or "Follow up with 3 leads".'),
      frequency: z.enum(['daily', 'weekly']).describe('"daily" or "weekly".'),
    }),
    execute: async ({ name, frequency }) => {
      const id = uid();
      const habit = { type: 'habit', id, name, frequency, completions: [], createdAt: new Date().toISOString() };
      const mem = await createMemory(JSON.stringify(habit), `/habits/${id}`);
      return mem ? `Habit added: "${name}" (${frequency})` : 'Memory store not configured.';
    },
  }),

  checkInHabit: tool({
    description: "Log today's completion for a habit. Pass the memory ID of the habit.",
    inputSchema: z.object({
      memoryId: z.string().describe('Memory ID of the habit.'),
    }),
    execute: async ({ memoryId }) => {
      const mem = await getMemory(memoryId);
      if (!mem) return `Habit memory ${memoryId} not found.`;
      const habit = JSON.parse(mem.content);
      const today = new Date().toISOString().slice(0, 10);
      if (habit.completions.includes(today)) return `"${habit.name}" already checked in today.`;
      habit.completions = [...habit.completions, today];
      await updateMemory(memoryId, JSON.stringify(habit));
      const streak = computeStreak(habit.completions, habit.frequency);
      return `Checked in: "${habit.name}". Streak: ${streak} day${streak !== 1 ? 's' : ''}.`;
    },
  }),
};

function computeStreak(completions: string[], frequency: string): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const step = frequency === 'weekly' ? 7 : 1;
  let streak = 0;
  let expected = today;
  for (const date of sorted) {
    if (date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - step);
      expected = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}
