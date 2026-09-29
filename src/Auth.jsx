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

  const handleEmailAuth = async (evt) => {
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
        setMessage("Sign up successful! Please check your email or sign in.");
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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err.message || "Failed to initiate Google Sign-In.");
      setLoading(false);
    }
  };

  return e(
    "div",
    { className: "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-zinc-800" },
    e(
      "div",
      { className: "w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5" },

      // Header
      e(
        "div",
        { className: "flex flex-col gap-1 text-center" },
        e("p", { className: "text-xs font-semibold uppercase tracking-wider text-zinc-500" }, "Ultimate TODO"),
        e("h1", { className: "text-xl font-bold tracking-tight text-white" }, isSignUp ? "Create an account" : "Welcome back")
      ),

      // Status notifications
      errorMsg && e("div", { className: "p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 text-center" }, errorMsg),
      message && e("div", { className: "p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 text-center" }, message),

      // Google Sign-In Button
      e(
        "button",
        {
          type: "button",
          disabled: loading,
          onClick: handleGoogleSignIn,
          className:
            "w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition border border-zinc-700 hover:border-zinc-600 shadow-sm disabled:opacity-50",
        },
        e(
          "svg",
          { className: "w-4 h-4 shrink-0", viewBox: "0 0 24 24" },
          e("path", {
            fill: "#4285F4",
            d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
          }),
          e("path", {
            fill: "#34A853",
            d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
          }),
          e("path", {
            fill: "#FBBC05",
            d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z",
          }),
          e("path", {
            fill: "#EA4335",
            d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z",
          })
        ),
        loading ? "Connecting..." : "Continue with Google"
      ),

      // Divider
      e(
        "div",
        { className: "flex items-center gap-3 my-0.5" },
        e("div", { className: "flex-1 h-px bg-zinc-800" }),
        e("span", { className: "text-[11px] uppercase tracking-wider text-zinc-500 font-medium" }, "or with email"),
        e("div", { className: "flex-1 h-px bg-zinc-800" })
      ),

      // Email & Password Form
      e(
        "form",
        { onSubmit: handleEmailAuth, className: "flex flex-col gap-3.5" },
        e(
          "div",
          null,
          e("label", { className: "text-xs text-zinc-400 font-medium block mb-1" }, "Email"),
          e("input", {
            type: "email",
            required: true,
            value: email,
            onChange: (evt) => setEmail(evt.target.value),
            placeholder: "you@example.com",
            className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          })
        ),
        e(
          "div",
          null,
          e("label", { className: "text-xs text-zinc-400 font-medium block mb-1" }, "Password"),
          e("input", {
            type: "password",
            required: true,
            value: password,
            onChange: (evt) => setPassword(evt.target.value),
            placeholder: "••••••••",
            className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          })
        ),
        e(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "mt-1 w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition disabled:opacity-50",
          },
          loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"
        )
      ),

      // Mode Switcher
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
          isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"
        )
      )
    )
  );
}