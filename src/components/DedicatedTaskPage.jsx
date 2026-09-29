import React, { useState, useEffect } from "react";

const e = React.createElement;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DedicatedTaskPage({
  task,
  allTasks,
  activeDateKey,
  isMainDone,
  completions,
  onBack,
  onNavigateToTask,
  onToggleTask,
  onAddSubtask,
  onDeleteSubtask,
  onSaveNotes,
}) {
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    setEditNotes(task.notes || "");
  }, [task]);

  // Compute nested subtasks (tasks where parentId matches current task)
  const childSubtasks = allTasks.filter((t) => t.parentId === task.id);
  const completedDateTasks = completions[activeDateKey] || [];
  const completedCount = childSubtasks.filter((s) => completedDateTasks.includes(s.id)).length;

  // Construct recursive breadcrumbs from root down to current task
  const breadcrumbs = [];
  let curr = task;
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = curr.parentId ? allTasks.find((t) => t.id === curr.parentId) : null;
  }

  // Format recurrence label with sorted day names
  const repeatSubtitle = (() => {
    if (task.repeatType === "daily") return "Repeats every day";
    if (task.repeatType === "once") return "Just for today";
    if (task.repeatType === "custom" && task.days && task.days.length > 0) {
      const sortedDays = [...task.days].sort((a, b) => a - b);
      return "Repeats on " + sortedDays.map((d) => DAY_NAMES[d]).join(", ");
    }
    return "Repeats on selected days";
  })();

  const submitSubtask = (evt) => {
    evt.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(newSubtaskTitle.trim(), task.id);
    setNewSubtaskTitle("");
  };

  return e(
    "div",
    { className: "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center selection:bg-zinc-800" },
    e(
      "main",
      { className: "w-full max-w-md flex flex-col gap-5 p-4 pb-16 pt-3" },

      // Header with dynamic Back button and Viewing Date
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
            className: "flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 transition",
          },
          e("span", { className: "font-bold text-sm leading-none" }, "\u2190"),
          e("span", null, task.parentId ? "Up One Level" : "All Routines")
        ),
        e(
          "div",
          { className: "text-right" },
          e("p", { className: "text-[10px] uppercase font-mono text-zinc-500" }, "Active Date"),
          e("p", { className: "text-xs font-semibold text-zinc-300" }, activeDateKey)
        )
      ),

      // Breadcrumb Navigation
      breadcrumbs.length > 1 &&
        e(
          "nav",
          { className: "flex items-center flex-wrap gap-1 text-xs text-zinc-500 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 overflow-x-auto" },
          breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return e(
              "span",
              { key: crumb.id, className: "flex items-center gap-1 shrink-0" },
              idx > 0 && e("span", { className: "text-zinc-600 font-mono" }, "/"),
              isLast
                ? e("span", { className: "text-emerald-400 font-medium" }, crumb.title)
                : e(
                    "button",
                    {
                      onClick: () => {
                        onSaveNotes(editNotes);
                        onNavigateToTask(crumb.id);
                      },
                      className: "hover:text-zinc-200 transition underline underline-offset-2",
                    },
                    crumb.title
                  )
            );
          })
        ),

      // Current Task Details Card
      e(
        "div",
        { className: "flex items-start justify-between gap-3 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4" },
        e(
          "div",
          { className: "flex flex-col flex-1" },
          e("h1", { className: "text-lg font-bold text-white leading-tight" + (isMainDone ? " line-through text-zinc-500" : "") }, task.title),
          e("span", { className: "text-[11px] text-zinc-400 mt-1 font-medium" }, repeatSubtitle)
        ),
        e(
          "button",
          {
            onClick: () => onToggleTask(task.id, activeDateKey),
            className:
              "h-8 w-8 rounded-lg flex items-center justify-center border text-sm transition-colors shrink-0 " +
              (isMainDone ? "bg-emerald-500 border-emerald-500 text-black font-bold" : "border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500"),
          },
          "\u2713"
        )
      ),

      // Subtasks List Section
      e(
        "section",
        { className: "flex flex-col gap-3" },
        e(
          "div",
          { className: "flex items-center justify-between" },
          e("h2", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider" }, "Subtasks"),
          e("span", { className: "text-[11px] font-mono text-zinc-500" }, completedCount + " / " + childSubtasks.length)
        ),
        e(
          "div",
          { className: "flex flex-col gap-2" },
          childSubtasks.length === 0
            ? e("div", { className: "text-center py-6 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-xl" }, "No nested tasks yet. Add one below.")
            : childSubtasks.map((sub) => {
                const isSubDone = completedDateTasks.includes(sub.id);
                const subChildren = allTasks.filter((t) => t.parentId === sub.id);

                return e(
                  "div",
                  {
                    key: sub.id,
                    className: "flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition",
                  },
                  e(
                    "div",
                    { className: "flex items-center gap-3 flex-1 overflow-hidden" },
                    e(
                      "button",
                      {
                        onClick: () => onToggleTask(sub.id, activeDateKey),
                        className:
                          "h-5 w-5 rounded-md flex items-center justify-center border text-xs transition-colors shrink-0 " +
                          (isSubDone ? "bg-emerald-500 border-emerald-500 text-black font-bold" : "border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500"),
                      },
                      "\u2713"
                    ),
                    e(
                      "div",
                      {
                        onClick: () => {
                          onSaveNotes(editNotes);
                          onNavigateToTask(sub.id);
                        },
                        className: "cursor-pointer flex-1 truncate",
                      },
                      e("span", { className: "text-sm text-zinc-200" + (isSubDone ? " line-through text-zinc-500" : "") }, sub.title),
                      subChildren.length > 0 &&
                        e("span", { className: "text-[11px] text-zinc-500 ml-2" }, "(" + subChildren.length + " nested)")
                    )
                  ),
                  e(
                    "div",
                    { className: "flex items-center gap-2 shrink-0" },
                    e(
                      "button",
                      {
                        onClick: () => {
                          onSaveNotes(editNotes);
                          onNavigateToTask(sub.id);
                        },
                        className: "text-[11px] text-emerald-400 hover:text-emerald-300 font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 transition",
                      },
                      "Open \u2192"
                    ),
                    e(
                      "button",
                      {
                        onClick: () => onDeleteSubtask(sub.id),
                        className: "text-zinc-600 hover:text-red-400 text-xs px-2 py-1 transition",
                      },
                      "\u2715"
                    )
                  )
                );
              })
        ),
        e(
          "form",
          { onSubmit: submitSubtask, className: "flex items-center gap-2 mt-1" },
          e("input", {
            type: "text",
            placeholder: "Add subtask to this level...",
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

      // Notes & Context Section
      e(
        "section",
        { className: "flex flex-col gap-2 pt-2 border-t border-zinc-900" },
        e("label", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider block" }, "Notes & Context"),
        e("textarea", {
          rows: 4,
          placeholder: "Add instructions, checklist details, or reflections...",
          value: editNotes,
          onChange: (evt) => setEditNotes(evt.target.value),
          onBlur: () => onSaveNotes(editNotes),
          className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
        })
      )
    )
  );
}