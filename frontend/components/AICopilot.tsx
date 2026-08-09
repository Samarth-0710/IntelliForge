"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Send, Trash2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hello 👋 I am IntelliForge AI Copilot. Ask me anything about your current security posture, active incidents, or threat landscape.",
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: trimmed,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.data?.answer || "No response received from AI.",
        },
      ]);
    } catch (err: any) {
      console.error("AI Copilot error:", err);
      const isQuota = err.response?.status === 429;
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: isQuota
            ? "AI quota temporarily reached. Please try again later."
            : "Unable to contact AI Security Assistant. Please check connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#0b1225] border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              IntelliForge AI Copilot
            </h2>
            <p className="text-xs text-slate-400">
              Context-Aware Autonomous Threat Advisor
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: "ai",
                text: "Chat cleared. Ready for your security queries.",
              },
            ])
          }
          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <Trash2 size={14} />
          Clear Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-[380px] overflow-y-auto space-y-4 bg-[#050816] rounded-xl p-5 border border-slate-800/80">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 whitespace-pre-wrap text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                  : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs mb-1 font-semibold opacity-75">
                {message.role === "user" ? (
                  <>
                    <User size={12} />
                    <span>Security Analyst</span>
                  </>
                ) : (
                  <>
                    <Bot size={12} />
                    <span>IntelliForge AI</span>
                  </>
                )}
              </div>
              <p>{message.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2 text-sm text-slate-300">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
              <span>Analyzing security context...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask about active incidents, threat trends, or remediation advice..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              askAI();
            }
          }}
          disabled={loading}
          className="flex-1 rounded-xl bg-[#111827] border border-slate-700 px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 transition"
        />

        <button
          onClick={askAI}
          disabled={loading || !question.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-6 rounded-xl font-semibold text-sm text-white transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
}