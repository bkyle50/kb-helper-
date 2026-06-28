import { tool } from 'ai';
import { z } from 'zod';
import { querySheet } from '@/lib/google/sheets';
import { createMemory, updateMemory, deleteMemory, listMemories } from '@/lib/ai/memory';

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
};
