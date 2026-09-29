import React, { useMemo } from "react";

const e = React.createElement;

function getPaddedDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `\({y}-\){m}-${d}`;
}

export default function DashboardTab({
  tasks,
  completions,
  today,
  todayKey,
  onOpenSchedule,
  onOpenTask,
  onToggleTask,
}) {
  const totalCompletions = useMemo(() => {
    return Object.values(completions).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
  }, [completions]);

  // Compute Current Streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const todayList = completions[todayKey] || [];
    let offset = todayList.length > 0 ? 0 : 1;

    while (true) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const key = getPaddedDateKey(d);

      if (completions[key] && completions[key].length > 0) {
        streak++;
        offset++;
      } else {
        break;
      }
    }
    return streak;
  }, [completions, todayKey]);

  // Generate consecutive 70 days leading up to today
  const activityDays = useMemo(() => {
    const days = [];
    for (let i = 69; i >= 0; i--) {
      let dateKey;
      if (i === 0) {
        dateKey = todayKey; // Ensure today's square always matches todayKey identically
      } else {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateKey = getPaddedDateKey(d);
      }

      const count = completions[dateKey] && Array.isArray(completions[dateKey])
        ? completions[dateKey].length
        : 0;

      days.push({ date: dateKey, count });
    }
    return days;
  }, [completions, todayKey]);

  // Vivid GitHub-style colors using direct styles to bypass any Tailwind purge issues
  const getCellStyles = (count) => {
    if (count === 0) {
      return { backgroundColor: "#27272a", borderColor: "#3f3f46" }; // zinc-800
    }
    if (count === 1) {
      return { backgroundColor: "#065f46", borderColor: "#047857" }; // emerald-800 (rich, clearly visible green)
    }
    if (count === 2) {
      return { backgroundColor: "#059669", borderColor: "#10b981" }; // emerald-600 (vivid green)
    }
    return { backgroundColor: "#34d399", borderColor: "#6ee7b7" }; // emerald-400 (bright highlight)
  };

  const todayTasks = tasks.filter((t) => {
    if (t.repeatType === "once") return t.targetDate === todayKey;
    if (t.repeatType === "daily") return true;
    return t.days && t.days.includes(today.getDay());
  });

  return e(
    "div",
    { className: "flex flex-col gap-5" },
    e(
      "section",
      { className: "grid grid-cols-2 gap-3" },
      e(
        "div",
        { className: "bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col" },
        e("span", { className: "text-xs font-medium text-zinc-500" }, "Completed Today"),
        e("span", { className: "text-2xl font-bold text-white mt-1" }, (completions[todayKey] || []).length)
      ),
      e(
        "div",
        { className: "bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col" },
        e("span", { className: "text-xs font-medium text-zinc-500" }, "All Time"),
        e("span", { className: "text-2xl font-bold text-white mt-1" }, totalCompletions)
      )
    ),

    e(
      "section",
      { className: "bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3" },
      e(
        "div",
        { className: "flex items-center justify-between" },
        e("span", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider" }, "Activity (Last 10 Weeks)"),
        e(
          "span",
          { className: "text-[11px] font-mono text-emerald-400 font-medium flex items-center gap-1" },
          e("span", null, "\uD83D\uDD25"),
          `${currentStreak} day streak`
        )
      ),
      e(
        "div",
        { className: "flex justify-between overflow-x-auto py-1" },
        e(
          "div",
          { className: "grid grid-flow-col grid-rows-7 gap-1.5 w-full" },
          activityDays.map((day) =>
            e("div", {
              key: day.date,
              title: `\({day.date}:\){day.count} completed`,
              style: getCellStyles(day.count),
              className: "w-full aspect-square rounded-[3px] border transition-colors",
            })
          )
        )
      ),
      e(
        "div",
        { className: "flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 pt-1" },
        e("span", null, "Less"),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px]", style: getCellStyles(0) }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px]", style: getCellStyles(1) }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px]", style: getCellStyles(2) }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px]", style: getCellStyles(3) }),
        e("span", null, "More")
      )
    ),

    e(
      "section",
      { className: "flex flex-col gap-2" },
      e(
        "div",
        { className: "flex items-center justify-between" },
        e("span", { className: "text-xs font-semibold text-zinc-400 uppercase tracking-wider" }, "Today Checklist"),
        e(
          "button",
          {
            onClick: onOpenSchedule,
            className: "text-xs text-emerald-400 hover:underline font-medium",
          },
          "Open Schedule"
        )
      ),
      todayTasks.length === 0
        ? e("div", { className: "text-center py-8 text-zinc-600 text-xs" }, "No tasks scheduled for today.")
        : todayTasks.map((task) => {
            const isCompleted = (completions[todayKey] || []).includes(task.id);

            return e(
              "div",
              {
                key: task.id,
                className: "flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition",
              },
              e(
                "div",
                {
                  onClick: () => onOpenTask(task.id),
                  className: "flex-1 cursor-pointer pr-3 overflow-hidden",
                },
                e("p", { className: "text-sm font-medium text-zinc-200" + (isCompleted ? " line-through text-zinc-500" : "") }, task.title)
              ),
              e(
                "button",
                {
                  onClick: () => onToggleTask(task.id, todayKey),
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