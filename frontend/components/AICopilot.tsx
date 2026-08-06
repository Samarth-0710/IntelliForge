"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function AICopilot() {

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hello 👋 I'm IntelliForge AI Copilot. Ask me anything about your security incidents.",
    },
  ]);

  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  async function askAI() {

    if (!question.trim()) return;

    const userMessage = {
      role: "user" as const,
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {

      const res = await api.post("/ai/chat", {
        message: question,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.data.answer,
        },
      ]);

    } catch {

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Unable to contact AI.",
        },
      ]);

    }

    setQuestion("");

    setLoading(false);

  }

  return (

    <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold">
          🤖 IntelliForge AI Copilot
        </h2>

        <button
          onClick={() =>
            setMessages([
              {
                role: "ai",
                text: "Conversation cleared.",
              },
            ])
          }
          className="text-sm text-red-400 hover:text-red-300"
        >
          Clear Chat
        </button>

      </div>

            <div className="h-[420px] overflow-y-auto space-y-4 bg-[#050816] rounded-xl p-5">

        {messages.map((message, index) => (

          <div
            key={index}
            className={`flex ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-blue-600"
                  : "bg-slate-800 border border-slate-700"
              }`}
            >

              <p className="text-sm mb-2 font-semibold">

                {message.role === "user"
                  ? "You"
                  : "IntelliForge AI"}

              </p>

              <p className="leading-7">
                {message.text}
              </p>

            </div>

          </div>

        ))}

        {loading && (

          <div className="flex justify-start">

            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4">

              🤖 Thinking...

            </div>

          </div>

        )}

      </div>

            <div className="mt-6 flex gap-4">

        <input
          type="text"
          placeholder="Ask IntelliForge AI..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              askAI();
            }
          }}
          className="flex-1 rounded-xl bg-[#111827] border border-slate-700 px-5 py-4 outline-none focus:border-blue-500"
        />

        <button
          onClick={askAI}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-8 rounded-xl font-semibold transition"
        >
          {loading ? "..." : "Send"}
        </button>

      </div>

    </div>

  );

}