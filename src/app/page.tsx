import { Chat } from '@/components/chat';

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <header className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight">Trillion</h1>
        <p className="text-xs opacity-40">Personal AI chief of staff</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}
