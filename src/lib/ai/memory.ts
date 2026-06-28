const API_KEY = process.env.ANTHROPIC_API_KEY;
const STORE_ID = process.env.ANTHROPIC_MEMORY_STORE_ID;

const BASE = 'https://api.anthropic.com/v1';
const HEADERS = {
  'x-api-key': API_KEY ?? '',
  'anthropic-version': '2023-06-01',
  'anthropic-beta': 'managed-agents-2026-04-01',
  'content-type': 'application/json',
};

export interface MemoryItem {
  id: string;
  path: string;
  content: string;
}

export async function listMemories(): Promise<MemoryItem[]> {
  if (!STORE_ID || !API_KEY) return [];
  try {
    const res = await fetch(
      `${BASE}/beta/memory-stores/${STORE_ID}/memories?view=full`,
      { headers: HEADERS },
    );
    if (!res.ok) return [];
    const json = await res.json() as { data?: MemoryItem[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function createMemory(content: string, path: string): Promise<MemoryItem | null> {
  if (!STORE_ID || !API_KEY) return null;
  const res = await fetch(`${BASE}/beta/memory-stores/${STORE_ID}/memories`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ content, path }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Memory create failed ${res.status}: ${err}`);
  }
  return res.json() as Promise<MemoryItem>;
}

export async function updateMemory(memoryId: string, content: string): Promise<MemoryItem | null> {
  if (!STORE_ID || !API_KEY) return null;
  const res = await fetch(`${BASE}/beta/memory-stores/${STORE_ID}/memories/${memoryId}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Memory update failed ${res.status}: ${err}`);
  }
  return res.json() as Promise<MemoryItem>;
}

export async function deleteMemory(memoryId: string): Promise<void> {
  if (!STORE_ID || !API_KEY) return;
  const res = await fetch(`${BASE}/beta/memory-stores/${STORE_ID}/memories/${memoryId}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Memory delete failed ${res.status}: ${err}`);
  }
}

export async function getMemory(memoryId: string): Promise<MemoryItem | null> {
  if (!STORE_ID || !API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/beta/memory-stores/${STORE_ID}/memories/${memoryId}`, {
      headers: HEADERS,
    });
    if (res.ok) return res.json() as Promise<MemoryItem>;
    const all = await listMemories();
    return all.find((m) => m.id === memoryId) ?? null;
  } catch {
    return null;
  }
}

export async function buildMemoryContext(): Promise<string> {
  const memories = await listMemories();
  if (memories.length === 0) return '';
  const lines = memories.map((m) => `[${m.path}] ${m.content}`).join('\n');
  return `\n\n--- Trillion's memory ---\n${lines}\n--- end memory ---`;
}
