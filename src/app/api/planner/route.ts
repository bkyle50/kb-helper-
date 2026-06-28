import { listMemories, getMemory, updateMemory } from '@/lib/ai/memory';

export const runtime = 'nodejs';

export async function GET() {
  const memories = await listMemories();
  const today = new Date().toISOString().slice(0, 10);

  const parse = (prefix: string) =>
    memories
      .filter((m) => m.path.startsWith(prefix))
      .map((m) => {
        try {
          return { memoryId: m.id, ...JSON.parse(m.content) };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

  const tasks = parse('/tasks/');
  const goals = parse('/goals/');
  const habits = parse('/habits/');

  const pendingTasks = tasks.filter((t: { completed: boolean; dueDate?: string }) =>
    !t.completed && (!t.dueDate || t.dueDate <= today),
  );

  return Response.json({ tasks, goals, habits, pendingTasks, today });
}

export async function PATCH(req: Request) {
  let body: { action: string; memoryId: string; pct?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { action, memoryId } = body;
  const mem = await getMemory(memoryId);
  if (!mem) return new Response('Not found', { status: 404 });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(mem.content);
  } catch {
    return new Response('Invalid memory content', { status: 422 });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (action === 'complete_task') {
    data = { ...data, completed: true, completedAt: new Date().toISOString() };
  } else if (action === 'checkin_habit') {
    const completions = (data.completions as string[]) ?? [];
    if (!completions.includes(today)) {
      data = { ...data, completions: [...completions, today] };
    }
  } else if (action === 'update_goal_progress') {
    const { pct, note } = body;
    const log = (data.log as Array<{ date: string; pct: number; note?: string }>) ?? [];
    data = { ...data, pct, log: [...log, { date: today, pct, ...(note ? { note } : {}) }] };
  } else {
    return new Response('Unknown action', { status: 400 });
  }

  await updateMemory(memoryId, JSON.stringify(data));
  return Response.json({ success: true, data });
}
