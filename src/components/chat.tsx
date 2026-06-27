'use client';

import { useChat } from '@ai-sdk/react';
import { isTextUIPart } from 'ai';
import { useEffect, useRef, useState } from 'react';

export function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4">
      {/* message list */}
      <div className="flex-1 overflow-y-auto py-8 space-y-6">
        {messages.length === 0 && (
          <p className="text-center text-sm opacity-40 mt-24 select-none">
            Trillion is ready.
          </p>
        )}
        {messages.map((msg) => {
          const text = msg.parts
            .filter(isTextUIPart)
            .map((p) => p.text)
            .join('');
          if (!text) return null;
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 rounded-bl-sm'
                }`}
              >
                {text}
              </div>
            </div>
          );
        })}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms] opacity-50" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms] opacity-50" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms] opacity-50" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 pb-6 pt-2 bg-gradient-to-t from-background via-background to-transparent"
      >
        <div className="flex items-end gap-2 border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-900 px-4 py-3 shadow-sm">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something…"
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:opacity-40 max-h-40 overflow-y-auto disabled:opacity-50"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-blue-700 transition-colors"
            aria-label="Send"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.654 5.25H12.5a.75.75 0 0 1 0 1.5H3.933l-1.654 5.25a.75.75 0 0 0 .826.95 28.9 28.9 0 0 0 15.293-7.155.75.75 0 0 0 0-1.115A28.9 28.9 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] opacity-30 mt-2">
          Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
