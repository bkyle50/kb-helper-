'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { Chat } from './chat';
import {
  listConversations,
  saveConversation,
  deleteConversation,
  togglePin,
  titleFrom,
  type Conversation,
} from '@/lib/conversations';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} className="w-3.5 h-3.5">
      <path d="M9.828 3.009A.75.75 0 0 1 10.572 3h.001a.75.75 0 0 1 .744.744v.001c0 .24-.054.467-.151.672L12.25 7.5l1.766-.529a.75.75 0 0 1 .918.464l.001.003a.75.75 0 0 1-.464.918L12.75 9l-.794 2.649a.75.75 0 0 1-1.415-.002L10.75 9l-1.72.516a.75.75 0 0 1-.918-.464l-.001-.003a.75.75 0 0 1 .464-.918L10.25 7.5l1.081-3.108a1.752 1.752 0 0 1-.152-.673v-.001A.75.75 0 0 1 9.828 3.009ZM6.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H4.084a2.25 2.25 0 0 1-2.244-2.077L1.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  );
}

interface TaskItem { memoryId: string; title: string; dueDate?: string; completed: boolean; }
interface HabitItem { memoryId: string; name: string; frequency: string; completions: string[]; }
interface GoalItem { memoryId: string; title: string; pct: number; deadline?: string; }
interface PlannerData { pendingTasks: TaskItem[]; habits: HabitItem[]; goals: GoalItem[]; today: string; }

function streak(completions: string[], frequency: string): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const step = frequency === 'weekly' ? 7 : 1;
  let count = 0;
  let expected = today;
  for (const date of sorted) {
    if (date === expected) {
      count++;
      const d = new Date(expected);
      d.setDate(d.getDate() - step);
      expected = d.toISOString().slice(0, 10);
    } else break;
  }
  return count;
}

function PlannerPanel() {
  const [data, setData] = useState<PlannerData | null>(null);
  const [open, setOpen] = useState(true);

  const load = useCallback(() => {
    fetch('/api/planner').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = (action: string, memoryId: string, extra?: Record<string, unknown>) => {
    fetch('/api/planner', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, memoryId, ...extra }),
    }).then(load);
  };

  if (!data) return null;
  const { pendingTasks, habits, goals, today } = data;
  const pendingHabits = habits.filter((h) => !h.completions.includes(today));
  const totalPending = pendingTasks.length + pendingHabits.length;
  if (totalPending === 0 && goals.length === 0) return null;

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity"
      >
        <span>Today</span>
        <span className="flex items-center gap-1.5">
          {totalPending > 0 && (
            <span className="bg-blue-600 text-white rounded-full px-1.5 py-px text-[9px] font-bold leading-none">
              {totalPending}
            </span>
          )}
          <span>{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="pb-2 space-y-0.5">
          {pendingTasks.map((t) => (
            <div key={t.memoryId} className="flex items-start gap-1.5 px-3 py-1 group">
              <button
                onClick={() => act('complete_task', t.memoryId)}
                className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors"
                title="Complete"
              >
                <CheckIcon />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug truncate">{t.title}</p>
                {t.dueDate && (
                  <p className={`text-[9px] ${t.dueDate < today ? 'text-red-500' : 'opacity-40'}`}>
                    {t.dueDate < today ? 'Overdue · ' : ''}{t.dueDate}
                  </p>
                )}
              </div>
            </div>
          ))}

          {pendingHabits.map((h) => {
            const s = streak(h.completions, h.frequency);
            return (
              <div key={h.memoryId} className="flex items-center gap-1.5 px-3 py-1">
                <button
                  onClick={() => act('checkin_habit', h.memoryId)}
                  className="shrink-0 w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors"
                  title="Check in"
                >
                  <CheckIcon />
                </button>
                <span className="flex-1 text-xs truncate">{h.name}</span>
                {s > 0 && <span className="text-[9px] opacity-40 shrink-0">{s}🔥</span>}
              </div>
            );
          })}

          {goals.map((g) => (
            <div key={g.memoryId} className="px-3 py-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs truncate flex-1">{g.title}</span>
                <span className="text-[9px] opacity-40 shrink-0 ml-1">{g.pct}%</span>
              </div>
              <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(g.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConvItem({
  conv,
  active,
  onLoad,
  onPin,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onLoad: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onLoad(conv.id)}
      className={`group flex items-center gap-1 px-2 py-1.5 mx-1 rounded-lg cursor-pointer ${
        active
          ? 'bg-neutral-200 dark:bg-neutral-700'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="flex-1 truncate text-xs leading-snug">{conv.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onPin(conv.id); }}
        title={conv.pinned ? 'Unpin' : 'Pin'}
        className={`shrink-0 p-0.5 rounded transition-opacity ${
          conv.pinned ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
        }`}
      >
        <PinIcon filled={conv.pinned} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
        title="Delete"
        className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-500 transition-opacity"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>(() => genId());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setConversations(listConversations());
  }, []);

  const handleSave = useCallback(
    (messages: UIMessage[]) => {
      saveConversation({
        id: activeId,
        title: titleFrom(messages),
        messages,
      });
      setConversations(listConversations());
    },
    [activeId],
  );

  const newConversation = () => {
    setActiveId(genId());
    setSidebarOpen(false);
  };

  const loadConversation = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  const handlePin = (id: string) => {
    togglePin(id);
    setConversations(listConversations());
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    const updated = listConversations();
    setConversations(updated);
    if (activeId === id) setActiveId(genId());
  };

  const active = conversations.find((c) => c.id === activeId);
  const pinned = conversations.filter((c) => c.pinned);
  const recent = conversations.filter((c) => !c.pinned);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-60 flex flex-col
          bg-neutral-50 dark:bg-neutral-950
          border-r border-neutral-200 dark:border-neutral-800
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-semibold tracking-tight opacity-70">Conversations</span>
          <button
            onClick={newConversation}
            className="text-[11px] px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors leading-none"
          >
            New
          </button>
        </div>

        <PlannerPanel />

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
          {pinned.length > 0 && (
            <section>
              <p className="px-3 pt-1 pb-0.5 text-[9px] font-semibold uppercase tracking-widest opacity-40">
                Pinned
              </p>
              {pinned.map((c) => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  active={c.id === activeId}
                  onLoad={loadConversation}
                  onPin={handlePin}
                  onDelete={handleDelete}
                />
              ))}
              {recent.length > 0 && (
                <div className="my-1.5 mx-3 border-t border-neutral-200 dark:border-neutral-800" />
              )}
            </section>
          )}

          {recent.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <p className="px-3 pt-1 pb-0.5 text-[9px] font-semibold uppercase tracking-widest opacity-40">
                  Recent
                </p>
              )}
              {recent.map((c) => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  active={c.id === activeId}
                  onLoad={loadConversation}
                  onPin={handlePin}
                  onDelete={handleDelete}
                />
              ))}
            </section>
          )}

          {conversations.length === 0 && (
            <p className="px-3 py-8 text-center text-[11px] opacity-30">No conversations yet</p>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 -ml-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <MenuIcon />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Trillion</h1>
            <p className="text-xs opacity-40">Personal AI chief of staff</p>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <Chat
            key={activeId}
            conversationId={activeId}
            initialMessages={active?.messages ?? []}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
