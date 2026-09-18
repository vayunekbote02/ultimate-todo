import React, { useState, useEffect } from "react";

const e = React.createElement;

export default function DedicatedTaskPage({
  task,
  activeDateKey,
  isMainDone,
  subtaskDoneList,
  onBack,
  onToggleMain,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onSaveNotes,
}) {
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    setEditNotes(task.notes || "");
  }, [task]);

  const submitSubtask = (evt) => {
    evt.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  return e(
    "div",
    { className: "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center selection:bg-zinc-800" },
    e(
      "main",
      { className: "w-full max-w-md flex flex-col gap-6 p-4 pb-16 pt-3" },
      e(
        "header",
        { className: "flex items-center justify-between border-b border-zinc-900 pb-3" },
        e(
          "button",
          {
            onClick: () => {
              onSaveNotes(editNotes);
              onBack();
            },
            className: "flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800",
          },
          e("span", { className: "font-bold text-sm leading-none" }, "\u2190"),
          e("span", null, "Back")
        ),
        e(
          "div",
          { className: "text-right" },
          e("p", { className: "text-[10px] uppercase font-mono text-zinc-500" }, "Active Date"),
          e("p", { className: "text-xs font-semibold text-zinc-300" }, activeDateKey)
        )
      ),

      e(
        "div",
        { className: "flex items-start justify-between gap-3 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4" },
        e(
          "div",
          { className: "flex flex-col flex-1" },
          e("h1", { className: "text-lg font-bold text-white leading-tight" + (isMainDone ? " line-through text-zinc-500" : "") }, task.title),
          e("span", { className: "text-[11px] text-zinc-500 mt-1" }, task.repeatType === "daily" ? "Repeats every day" : "Repeats on selected weekdays")
        ),
        e(
          "button",
          {
            onClick: onToggleMain,
            className:
              "h-8 w-8 rounded-lg flex items-center justify-center border text-sm transition-colors shrink-0 " +
              (isMainDone ? "bg-emerald-500 border-emerald-500 text-black font-bold" : "border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500"),
          },
          "\u2713"
        )
      ),

      e(
        "section",
        { className: "flex flex-col gap-3" },
        e(
          "div",
          { className: "flex items-center justify-between" },
          e("h2", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider" }, "Subtasks"),
          e(
            "span",
            { className: "text-[11px] font-mono text-zinc-500" },
            ((task.subtasks || []).filter((s) => subtaskDoneList.includes(s.id)).length) + " / " + ((task.subtasks || []).length)
          )
        ),
        e(
          "div",
          { className: "flex flex-col gap-2" },
          (!task.subtasks || task.subtasks.length === 0)
            ? e("div", { className: "text-center py-6 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-xl" }, "No subtasks yet. Add one below.")
            : task.subtasks.map((sub) => {
                const isSubDone = subtaskDoneList.includes(sub.id);
                return e(
                  "div",
                  {
                    key: sub.id,
                    className: "flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition",
                  },
                  e(
                    "div",
                    {
                      onClick: () => onToggleSubtask(sub.id),
                      className: "flex items-center gap-3 flex-1 cursor-pointer",
                    },
                    e(
                      "div",
                      {
                        className:
                          "h-5 w-5 rounded-md flex items-center justify-center border text-xs transition-colors shrink-0 " +
                          (isSubDone ? "bg-emerald-500 border-emerald-500 text-black font-bold" : "border-zinc-700 bg-zinc-950 text-transparent"),
                      },
                      "\u2713"
                    ),
                    e("span", { className: "text-sm text-zinc-200" + (isSubDone ? " line-through text-zinc-500" : "") }, sub.title)
                  ),
                  e(
                    "button",
                    {
                      onClick: () => onDeleteSubtask(sub.id),
                      className: "text-zinc-600 hover:text-red-400 text-xs px-2 py-1 transition",
                    },
                    "\u2715"
                  )
                );
              })
        ),
        e(
          "form",
          { onSubmit: submitSubtask, className: "flex items-center gap-2 mt-1" },
          e("input", {
            type: "text",
            placeholder: "Add a new subtask...",
            value: newSubtaskTitle,
            onChange: (evt) => setNewSubtaskTitle(evt.target.value),
            className: "flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          }),
          e(
            "button",
            {
              type: "submit",
              disabled: !newSubtaskTitle.trim(),
              className: "py-2 px-3.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-sm transition hover:bg-zinc-200 disabled:opacity-40",
            },
            "+"
          )
        )
      ),

      e(
        "section",
        { className: "flex flex-col gap-2 pt-2 border-t border-zinc-900" },
        e("label", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider block" }, "Notes & Context"),
        e("textarea", {
          rows: 5,
          placeholder: "Add instructions or reflections...",
          value: editNotes,
          onChange: (evt) => setEditNotes(evt.target.value),
          onBlur: () => onSaveNotes(editNotes),
          className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
        })
      )
    )
  );
}