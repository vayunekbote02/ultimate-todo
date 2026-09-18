import React, { useState } from "react";

const e = React.createElement;

export default function NameModal({ currentName, onClose, onSave }) {
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
    onClose();
  };

  return e(
    "div",
    { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" },
    e(
      "div",
      { className: "w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4" },
      e(
        "div",
        { className: "flex items-center justify-between" },
        e("h3", { className: "text-sm font-semibold text-white" }, "Set Your Name"),
        e("button", { onClick: onClose, className: "text-zinc-500 hover:text-white text-base font-bold" }, "\u2715")
      ),
      e(
        "form",
        { onSubmit: handleSubmit, className: "flex flex-col gap-3" },
        e("input", {
          type: "text",
          autoFocus: true,
          value: name,
          onChange: (evt) => setName(evt.target.value),
          placeholder: "e.g. Alex",
          className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
        }),
        e(
          "button",
          {
            type: "submit",
            disabled: saving || !name.trim(),
            className: "w-full py-2 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition disabled:opacity-40",
          },
          saving ? "Saving..." : "Save Name"
        )
      )
    )
  );
}