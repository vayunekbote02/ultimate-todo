import React, { useState, useRef } from "react";

const e = React.createElement;

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function CreateTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [repeatType, setRepeatType] = useState("daily");
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);

  const textareaRef = useRef(null);

  const handleNotesChange = (evt) => {
    setNotes(evt.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

    const handleSubmit = (evt) => {
        evt.preventDefault();
        if (!title.trim()) return;

        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, "0");
        const day = String(todayDate.getDate()).padStart(2, "0");
        const todayKey = year + "-" + month + "-" + day;

        onCreate({
        title: title.trim(),
        notes: notes.trim(),
        repeatType,
        days: repeatType === "custom" ? selectedDays : [],
        targetDate: repeatType === "once" ? todayKey : null,
        });
    };

  return e(
    "div",
    { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" },
    e(
      "div",
      { className: "w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl" },
      e(
        "div",
        { className: "flex items-center justify-between mb-4" },
        e("h2", { className: "text-base font-semibold text-white" }, "Create Routine"),
        e("button", { onClick: onClose, className: "text-zinc-500 hover:text-white text-lg font-bold" }, "\u2715")
      ),
      e(
        "form",
        { onSubmit: handleSubmit, className: "flex flex-col gap-4" },
        e(
          "div",
          null,
          e("label", { className: "text-xs text-zinc-400 font-medium block mb-1.5" }, "Task Name"),
          e("input", {
            type: "text",
            placeholder: "e.g. 30 Pushups, Read 10 pages",
            value: title,
            onChange: (evt) => setTitle(evt.target.value),
            autoFocus: true,
            className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500",
          })
        ),
        e(
          "div",
          null,
          e("label", { className: "text-xs text-zinc-400 font-medium block mb-1.5" }, "Notes (Optional)"),
          e("textarea", {
            ref: textareaRef,
            rows: 1,
            placeholder: "Add any extra details or steps...",
            value: notes,
            onChange: handleNotesChange,
            className: "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 max-h-24 overflow-y-auto resize-none",
          })
        ),
        e(
          "div",
          null,
          e("label", { className: "text-xs text-zinc-400 font-medium block mb-1.5" }, "Frequency"),
          e(
            "div",
            { className: "grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800" },
            e(
              "button",
              {
                type: "button",
                onClick: () => setRepeatType("daily"),
                className:
                  "py-1.5 text-xs font-medium rounded-lg transition-all " +
                  (repeatType === "daily" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"),
              },
              "Everyday"
            ),
            e(
              "button",
              {
                type: "button",
                onClick: () => setRepeatType("custom"),
                className:
                  "py-1.5 text-xs font-medium rounded-lg transition-all " +
                  (repeatType === "custom" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"),
              },
              "Days"
            ),
            e(
              "button",
              {
                type: "button",
                onClick: () => setRepeatType("once"),
                className:
                  "py-1.5 text-xs font-medium rounded-lg transition-all " +
                  (repeatType === "once" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"),
              },
              "Just Today"
            )
          )
        ),
        repeatType === "custom" &&
          e(
            "div",
            null,
            e("label", { className: "text-xs text-zinc-400 font-medium block mb-1.5" }, "Active Days"),
            e(
              "div",
              { className: "flex justify-between gap-1" },
              DAYS_OF_WEEK.map((d) => {
                const active = selectedDays.includes(d.value);
                const dayBtnClass = active
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700";
                return e(
                  "button",
                  {
                    key: d.value,
                    type: "button",
                    onClick: () => {
                      setSelectedDays((prev) =>
                        active ? prev.filter((val) => val !== d.value) : [...prev, d.value]
                      );
                    },
                    className: "flex-1 py-1.5 px-1 text-[11px] rounded-lg font-semibold flex items-center justify-center border transition-all " + dayBtnClass,
                  },
                  d.label
                );
              })
            )
          ),
        e(
          "button",
          {
            type: "submit",
            disabled: !title.trim() || (repeatType === "custom" && selectedDays.length === 0),
            className: "mt-2 w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed",
          },
          "Save Task"
        )
      )
    )
  );
}