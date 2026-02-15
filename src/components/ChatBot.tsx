'use client';

import { useChat } from '@ai-sdk/react';
import { type UIMessage, isTextUIPart } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/** Theme name for chat widget colors. Set in globals.css via [data-chat-theme="…"]. Default "kellerwilliams". */
export type ChatTheme = 'listingos' | 'kellerwilliams' | (string & {});

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => isTextUIPart(part))
    .map((part) => part.text)
    .join('');
}

type ChatBotProps = {
  /** Theme for colors (e.g. "kellerwilliams", "listingos"). Define variables in globals.css under [data-chat-theme="…"]. */
  theme?: ChatTheme;
  /** When true, uses minimal styling for embedding: no shadow, transparent background, reduced padding. */
  embedded?: boolean;
  /** When true, renders as a floating widget: small icon at bottom, expands to chat panel above. No padding, clean look. */
  floating?: boolean;
};

export default function ChatBot({
  theme = 'kellerwilliams',
  embedded = false,
  floating = false,
}: ChatBotProps) {
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

  const isFloating = floating;

  // Floating mode: icon + popover — transparent wrapper, no frame; pointer-events-none so only icon/panel capture clicks
  if (isFloating) {
    return (
      <div
        data-chat-theme={theme}
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-0 bg-transparent border-0 pointer-events-none [&>*]:pointer-events-auto"
        style={{ background: 'transparent' }}
      >
        {/* Chat panel — above icon when expanded */}
        {isExpanded && (
          <div
            className="mb-2 flex w-[420px] flex-col overflow-hidden rounded-lg border shadow-lg transition-all"
            style={{
              borderColor: 'var(--chat-border)',
              backgroundColor: 'var(--chat-container-bg)',
              height: 'min(640px, 85vh)',
              maxHeight: 'min(640px, 85vh)',
            }}
          >
            {/* Header — no padding */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex w-full cursor-pointer select-none items-center justify-between border-b px-2 py-1.5 transition-opacity hover:opacity-95"
              style={{
                background: 'linear-gradient(to right, var(--chat-header-start), var(--chat-header-end))',
                color: 'var(--chat-header-text)',
                borderColor: 'var(--chat-border)',
              }}
            >
              <div className="text-left">
                <h2 className="text-sm font-bold">ListingOS</h2>
                <p className="text-xs opacity-90">Schedule a 15-minute listing consultation</p>
              </div>
              <span className="text-lg" aria-hidden>×</span>
            </button>

            {/* Messages — expands to fill space, scrolls for long responses */}
            <div className="flex min-h-[360px] flex-1 flex-col overflow-y-auto px-2">
              <div className="space-y-4">
                {error && (
                  <div
                    className="rounded-none px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--chat-error-bg)', color: 'var(--chat-error-text)' }}
                  >
                    {error.message}
                  </div>
                )}
                {messages.length === 0 && !error && (
                  <div className="py-6 text-center text-sm" style={{ color: 'var(--chat-placeholder)' }}>
                    <p>How can I help?</p>
                    <p className="text-xs">&quot;What&apos;s the local market like?&quot; or &quot;I&apos;d like to schedule a consultation&quot;</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        m.role === 'user' ? 'max-w-[85%]' : 'max-w-full'
                      } ${m.role === 'assistant' ? 'break-words leading-relaxed [&_*]:first:mt-0 [&_*]:last:mb-0' : ''}`}
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="rounded-lg px-3 py-2 text-sm animate-pulse"
                      style={{ backgroundColor: 'var(--chat-loading-bubble)', color: 'var(--chat-loading-text)' }}
                    >
                      ListingOS is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input — minimal padding */}
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 border-t px-2 py-1.5"
              style={{ borderColor: 'var(--chat-border)' }}
            >
              <input
                className="chat-input flex-1 rounded border px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  borderColor: 'var(--chat-input-border)',
                  backgroundColor: 'var(--chat-container-bg)',
                  color: 'var(--chat-assistant-text)',
                }}
                value={input}
                placeholder="Type a message..."
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="chat-send-btn shrink-0 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--chat-button)' }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Floating icon button — no shadow/frame when closed */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition hover:scale-105"
          style={{
            background: 'linear-gradient(to right, var(--chat-header-start), var(--chat-header-end))',
            color: 'var(--chat-header-text)',
          }}
          aria-label={isExpanded ? 'Close chat' : 'Open chat'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
        </button>
      </div>
    );
  }

  // Inline/card mode
  return (
    <div
      data-chat-theme={theme}
      className={`flex w-full flex-col overflow-hidden transition-[height] duration-300 ${
        embedded
          ? 'rounded-lg border'
          : 'mx-auto max-w-md rounded-xl border shadow-xl'
      } ${isExpanded ? 'h-[600px]' : 'h-auto'}`}
      style={{
        borderColor: 'var(--chat-border)',
        backgroundColor: embedded ? 'transparent' : 'var(--chat-container-bg)',
      }}
    >
      {/* Header — click to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full text-left cursor-pointer select-none hover:opacity-95 transition-opacity flex items-center justify-between gap-2 ${embedded ? 'p-3' : 'p-4'}`}
        style={{
          background: 'linear-gradient(to right, var(--chat-header-start), var(--chat-header-end))',
          color: 'var(--chat-header-text)',
        }}
      >
        <div>
          <h2 className="font-bold">ListingOS</h2>
          <p className="text-xs opacity-90">Schedule a 15-minute listing consultation</p>
        </div>
        <span className="text-lg shrink-0" aria-hidden>
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {/* Messages Area — only visible when expanded */}
      <div
        className={`flex-1 overflow-y-auto space-y-4 min-h-0 transition-all duration-300 ${
          embedded ? 'p-3' : 'p-4'
        } ${isExpanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden p-0'}`}
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
            <p>How can I help?</p>
            <p className="text-sm">&quot;What&apos;s the local market like?&quot; or &quot;I&apos;d like to schedule a consultation&quot;</p>
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
              ListingOS is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className={`border-t ${embedded ? 'p-3' : 'p-4'}`}
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
