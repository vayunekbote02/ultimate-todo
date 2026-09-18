import React, { useRef } from "react";
import CalendarPicker from "./CalendarPicker";

const e = React.createElement;

export default function ScheduleTab({
  tasks,
  completions,
  subtaskCompletions,
  selectedDate,
  selectedDateKey,
  todayKey,
  onChangeDateOffset,
  onSelectDate,
  onJumpToToday,
  onOpenTask,
  onToggleTask,
}) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (evt) => {
    touchStartX.current = evt.targetTouches[0].clientX;
  };
  const handleTouchMove = (evt) => {
    touchEndX.current = evt.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) onChangeDateOffset(1);
    else if (diff < -50) onChangeDateOffset(-1);
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const selectedDayOfWeek = selectedDate.getDay();
  const visibleTasks = tasks.filter((t) => {
    if (t.repeatType === "once") {
      return t.targetDate === selectedDateKey;
    }
    if (t.repeatType === "daily") return true;
    return t.days && t.days.includes(selectedDayOfWeek);
  });

  return e(
    "div",
    {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      className: "flex flex-col gap-4 select-none",
    },
    e(
      "div",
      { className: "flex flex-col gap-2.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3" },
      e(
        "div",
        { className: "flex items-center justify-between" },
        e(
          "button",
          {
            onClick: () => onChangeDateOffset(-1),
            className: "h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white font-mono font-bold text-sm flex items-center justify-center transition",
          },
          "<"
        ),
        e(CalendarPicker, {
          selectedDate: selectedDate,
          onSelectDate: onSelectDate,
        }),
        e(
          "button",
          {
            onClick: () => onChangeDateOffset(1),
            className: "h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white font-mono font-bold text-sm flex items-center justify-center transition",
          },
          ">"
        )
      ),
      selectedDateKey !== todayKey &&
        e(
          "div",
          { className: "flex items-center justify-center pt-1 border-t border-zinc-800/60" },
          e(
            "button",
            {
              onClick: onJumpToToday,
              className: "text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-full transition flex items-center gap-1",
            },
            e("span", { className: "text-xs" }, "\u21BA"),
            "Jump to Today"
          )
        )
    ),

    e(
      "section",
      { className: "flex flex-col gap-2" },
      visibleTasks.length === 0
        ? e("div", { className: "text-center py-12 text-zinc-600 text-sm" }, "No tasks scheduled for this day.")
        : visibleTasks.map((task) => {
            const isCompleted = (completions[selectedDateKey] || []).includes(task.id);
            const subDoneCount = (task.subtasks || []).filter((s) => (subtaskCompletions[selectedDateKey] || []).includes(s.id)).length;
            const totalSub = (task.subtasks || []).length;
            const cardClass = isCompleted
              ? "bg-zinc-900/30 border-zinc-900 text-zinc-500"
              : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-200";

            return e(
              "div",
              {
                key: task.id,
                className: "flex items-center justify-between p-3.5 rounded-xl border transition-all " + cardClass,
              },
              e(
                "div",
                {
                  onClick: () => onOpenTask(task.id),
                  className: "flex flex-col flex-1 pr-3 cursor-pointer",
                },
                e("span", { className: "text-sm font-medium" + (isCompleted ? " line-through text-zinc-500" : "") }, task.title),
                totalSub > 0 &&
                  e("span", { className: "text-xs text-zinc-500 mt-0.5" }, subDoneCount + "/" + totalSub + " subtasks done")
              ),
              e(
                "button",
                {
                  onClick: () => onToggleTask(task.id, selectedDateKey),
                  className:
                    "h-6 w-6 rounded-md flex items-center justify-center border text-xs transition-colors shrink-0 " +
                    (isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                      : "border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500"),
                },
                "\u2713"
              )
            );
          })
    )
  );
}