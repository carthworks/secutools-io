"use client";

import React, { useEffect, useState } from "react";

/* ---------------------------
   Helper functions
--------------------------- */
function generatePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}<>?";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function evaluateStrength(pwd: string): { label: string; score: number } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  return { label, score };
}

/* ---------------------------
   Component
--------------------------- */
export default function PasswordStrengthTicker(): JSX.Element {
  const [password, setPassword] = useState<string>("");
  const [strength, setStrength] = useState<{ label: string; score: number }>({
    label: "Weak",
    score: 1,
  });
  const [animateEmoji, setAnimateEmoji] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const pwd = generatePassword();
      const evalResult = evaluateStrength(pwd);
      setPassword(pwd);
      setStrength(evalResult);

      // Trigger emoji bounce animation
      setAnimateEmoji(true);
      setTimeout(() => setAnimateEmoji(false), 600);
    };
    update();
    const interval = setInterval(update, 4000);
    return () => clearInterval(interval);
  }, []);

  /* Emoji mapping */
  const emoji =
    strength.label === "Strong"
      ? "😄"
      : strength.label === "Medium"
      ? "😐"
      : "😢";

  const color =
    strength.label === "Strong"
      ? "bg-green-500"
      : strength.label === "Medium"
      ? "bg-yellow-500"
      : "bg-red-500";

  const emojiColor =
    strength.label === "Strong"
      ? "text-green-600"
      : strength.label === "Medium"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="w-full text-center py-2 my-2 bg-slate-100 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 font-mono text-sm flex items-center justify-center gap-2">
      <span className="text-slate-700 dark:text-slate-300">Password:</span>
      <span className="font-semibold text-indigo-600 dark:text-indigo-400 select-all">
        {password}
      </span>
      <span className="text-slate-500">|</span>
      <span className="text-slate-700 dark:text-slate-300">Strength:</span>
      <span
        className={`font-semibold ${
          strength.label === "Strong"
            ? "text-green-600"
            : strength.label === "Medium"
            ? "text-yellow-500"
            : "text-red-500"
        }`}
      >
        {strength.label}
      </span>

      {/* Emoji with bounce animation */}
      <span
        className={`ml-1 text-lg ${emojiColor} ${
          animateEmoji ? "animate-bounce" : ""
        }`}
      >
        {emoji}
      </span>

      {/* Strength bar animation */}
      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden ml-2">
        <div
          className={`h-2 transition-all duration-500 ease-in-out ${color}`}
          style={{
            width:
              strength.label === "Weak"
                ? "33%"
                : strength.label === "Medium"
                ? "66%"
                : "100%",
          }}
        ></div>
      </div>
    </div>
  );
}
