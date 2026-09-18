import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const e = React.createElement;

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        setMessage("Sign up successful! You can now sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return e(
    "div",
    {
      className:
        "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-zinc-800",
    },
    e(
      "div",
      {
        className:
          "w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5",
      },
      e(
        "div",
        { className: "flex flex-col gap-1 text-center" },
        e(
          "p",
          {
            className:
              "text-xs font-semibold uppercase tracking-wider text-zinc-500",
          },
          "Ultimate TODO",
        ),
        e(
          "h1",
          { className: "text-xl font-bold tracking-tight text-white" },
          isSignUp ? "Create an account" : "Welcome back",
        ),
      ),
      errorMsg &&
        e(
          "div",
          {
            className:
              "p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 text-center",
          },
          errorMsg,
        ),
      message &&
        e(
          "div",
          {
            className:
              "p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 text-center",
          },
          message,
        ),
      e(
        "form",
        { onSubmit: handleAuth, className: "flex flex-col gap-3.5" },
        e(
          "div",
          null,
          e(
            "label",
            { className: "text-xs text-zinc-400 font-medium block mb-1" },
            "Email",
          ),
          e("input", {
            type: "email",
            required: true,
            value: email,
            onChange: (evt) => setEmail(evt.target.value),
            placeholder: "you@example.com",
            className:
              "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          }),
        ),
        e(
          "div",
          null,
          e(
            "label",
            { className: "text-xs text-zinc-400 font-medium block mb-1" },
            "Password",
          ),
          e("input", {
            type: "password",
            required: true,
            value: password,
            onChange: (evt) => setPassword(evt.target.value),
            placeholder: "••••••••",
            className:
              "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          }),
        ),
        e(
          "button",
          {
            type: "submit",
            disabled: loading,
            className:
              "mt-1 w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition disabled:opacity-50",
          },
          loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In",
        ),
      ),
      e(
        "div",
        { className: "text-center pt-2 border-t border-zinc-800/80" },
        e(
          "button",
          {
            type: "button",
            onClick: () => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setMessage("");
            },
            className: "text-xs text-zinc-400 hover:text-white transition",
          },
          isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Create one",
        ),
      ),
    ),
  );
}
