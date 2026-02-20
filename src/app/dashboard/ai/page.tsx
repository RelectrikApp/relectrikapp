"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
}

export default function DashboardAIPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setError("");
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.response ?? "No response." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">AI Assistant</h1>
        <p className="text-slate-400">
          Ask about revenue, projects, technicians, or type &quot;help&quot; for suggestions.
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col max-h-[calc(100vh-14rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm">
              Example: &quot;How is the business doing?&quot; or &quot;Give me a summary of metrics&quot;
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={
                  msg.role === "user"
                    ? "bg-relectrik-orange/20 text-white rounded-lg px-4 py-2 max-w-[85%]"
                    : "bg-slate-700 text-slate-200 rounded-lg px-4 py-2 max-w-[85%]"
                }
              >
                {msg.role === "assistant" ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.text),
                    }}
                  />
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-400 rounded-lg px-4 py-2">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && (
          <div className="px-4 pb-2">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about metrics, projects, technicians..."
              className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-lg bg-relectrik-orange text-black font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-relectrik-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
