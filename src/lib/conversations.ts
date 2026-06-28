import type { UIMessage } from 'ai';

const KEY = 'trillion_conversations';
const MAX = 50;

export interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export function listConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Pick<Conversation, 'id' | 'title' | 'messages'> & Partial<Conversation>): void {
  const all = listConversations();
  const old = all.find((c) => c.id === conv.id);
  const next: Conversation = {
    pinned: old?.pinned ?? false,
    createdAt: old?.createdAt ?? Date.now(),
    ...conv,
    updatedAt: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify([next, ...all.filter((c) => c.id !== conv.id)].slice(0, MAX)));
}

export function deleteConversation(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(listConversations().filter((c) => c.id !== id)));
}

export function togglePin(id: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(listConversations().map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))),
  );
}

export function titleFrom(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  const text = (first?.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
  if (!text) return 'New conversation';
  return text.length > 44 ? text.slice(0, 44) + '…' : text;
}
