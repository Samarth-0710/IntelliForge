"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const body = new URLSearchParams();

      body.append("username", email);
      body.append("password", password);

      const res = await api.post("/auth/login", body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem(
        "token",
        res.data.access_token
      );

      router.push("/dashboard");
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-[400px] rounded-xl bg-slate-900 p-8 shadow-xl border border-slate-700">

        <h1 className="text-4xl font-bold text-white">
          IntelliForge
        </h1>

        <p className="text-slate-400 mb-8">
          Security Operations Center
        </p>

        <input
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-700 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-700 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-white font-semibold"
        >
          Login
        </button>

      </div>
    </div>
  );
}