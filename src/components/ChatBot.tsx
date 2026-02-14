'use client';

import { useChat } from '@ai-sdk/react';
import { type UIMessage, isTextUIPart } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/** Theme name for chat widget colors. Set in globals.css via [data-chat-theme="…"]. Default "austinmais". */
export type ChatTheme = 'austinmais' | (string & {});

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => isTextUIPart(part))
    .map((part) => part.text)
    .join('');
}

type ChatBotProps = {
  /** Theme for colors (e.g. "austinmais"). Define variables in globals.css under [data-chat-theme="…"]. */
  theme?: ChatTheme;
};

export default function ChatBot({ theme = 'austinmais' }: ChatBotProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, sendMessage, status, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ text });
    setIsExpanded(true);
  };

  return (
    <div
      data-chat-theme={theme}
      className={`mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-xl border shadow-xl transition-[height] duration-300 ${
        isExpanded ? 'h-[600px]' : 'h-auto'
      }`}
      style={{
        borderColor: 'var(--chat-border)',
        backgroundColor: 'var(--chat-container-bg)',
      }}
    >
      {/* Header — click to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 text-left cursor-pointer select-none hover:opacity-95 transition-opacity flex items-center justify-between gap-2"
        style={{
          background: 'linear-gradient(to right, var(--chat-header-start), var(--chat-header-end))',
          color: 'var(--chat-header-text)',
        }}
      >
        <div>
          <h2 className="font-bold">Austin&apos;s Automated Assistant</h2>
          <p className="text-xs opacity-90">Ask me about my stack or rates!</p>
        </div>
        <span className="text-lg shrink-0" aria-hidden>
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {/* Messages Area — only visible when expanded */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden p-0'
        }`}
      >
        {error && (
          <div
            className="rounded-lg px-4 py-2 text-sm"
            style={{ backgroundColor: 'var(--chat-error-bg)', color: 'var(--chat-error-text)' }}
          >
            {error.message}
          </div>
        )}
        {messages.length === 0 && !error && (
          <div className="mt-8 text-center" style={{ color: 'var(--chat-placeholder)' }}>
            <p>Go ahead, grill me.</p>
            <p className="text-sm">&quot;What is Austin&apos;s favorite tech stack?&quot;</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                m.role === 'assistant' ? 'break-words leading-relaxed [&_*]:first:mt-0 [&_*]:last:mb-0' : ''
              }`}
              style={
                m.role === 'user'
                  ? { backgroundColor: 'var(--chat-user-bubble)', color: 'var(--chat-user-text)' }
                  : { backgroundColor: 'var(--chat-assistant-bubble)', color: 'var(--chat-assistant-text)' }
              }
            >
              {m.role === 'assistant' ? (
                <div className="chat-assistant-content text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 my-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5">{children}</ol>,
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                    h1: ({ children }) => <h1 className="text-base font-semibold mt-2 mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
                  }}
                >
                  {getMessageText(m)}
                </ReactMarkdown>
                </div>
              ) : (
                getMessageText(m)
              )}
            </div>
          </div>
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-lg px-4 py-2 text-sm animate-pulse"
              style={{ backgroundColor: 'var(--chat-loading-bubble)', color: 'var(--chat-loading-text)' }}
            >
              Austin&apos;s Assistant is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4"
        style={{ borderColor: 'var(--chat-border)' }}
      >
        <div className="flex gap-2">
          <input
            className="chat-input flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
            style={{
              borderColor: 'var(--chat-input-border)',
              backgroundColor: 'var(--chat-container-bg)',
              color: 'var(--chat-assistant-text)',
            }}
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="chat-send-btn rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{
              backgroundColor: 'var(--chat-button)',
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
