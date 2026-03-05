"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { parseSseChunk } from "@/lib/sse";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function sanitizeHref(href: string | undefined): string {
  if (!href) return "#";
  if (href.startsWith("/")) return href;
  try {
    const parsed = new URL(href, "https://organvm.local");
    if (parsed.hostname === "organvm.local") {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return href;
    }
  } catch {
    return "#";
  }
  return "#";
}

const STARTERS = [
  "What is ORGANVM?",
  "Which products are deployed?",
  "What's the tech stack for Styx?",
  "How many repos are in each organ?",
  "What happened in the last sprint?",
  "Show me the flagship repos",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Error: ${err.error || "Something went wrong"}`,
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setIsStreaming(false);
        return;
      }

      let accumulated = "";
      let buffered = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parsedChunk = parseSseChunk(buffered, chunk);
        buffered = parsedChunk.remainder;
        streamDone = parsedChunk.done;

        for (const data of parsedChunk.payloads) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              accumulated += `\n\n*${parsed.error}*`;
            } else if (parsed.text) {
              accumulated += parsed.text;
            }

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: accumulated,
              };
              return updated;
            });
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Failed to connect. Please try again.",
        };
        return updated;
      });
    }

    setIsStreaming(false);
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-2">Ask anything about ORGANVM</h2>
            <p className="text-[var(--color-text-muted)] mb-6 max-w-md">
              Get instant answers about repos, deployments, architecture,
              sprints, and more across all 8 organs and 100+ repositories.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)]"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => {
                        const safeHref = sanitizeHref(href);
                        const isExternal = !safeHref.startsWith("/");
                        return (
                          <a
                            href={safeHref}
                            className="text-[var(--color-accent)] hover:underline"
                            rel="noopener noreferrer nofollow"
                            target={isExternal ? "_blank" : undefined}
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {msg.content || (isStreaming && i === messages.length - 1 ? "Thinking..." : "")}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 border-t border-[var(--color-border)] pt-4"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about ORGANVM..."
          disabled={isStreaming}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
