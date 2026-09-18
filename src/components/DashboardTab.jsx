import React, { useMemo } from "react";

const e = React.createElement;

export default function DashboardTab({
  tasks,
  completions,
  subtaskCompletions,
  today,
  todayKey,
  onOpenSchedule,
  onOpenTask,
  onToggleTask,
}) {
  const totalCompletions = useMemo(() => {
    return Object.values(completions).reduce((sum, arr) => sum + arr.length, 0);
  }, [completions]);

  const activityDays = useMemo(() => {
    const days = [];
    for (let i = 69; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = year + "-" + month + "-" + day;
      const count = completions[dateKey] ? completions[dateKey].length : 0;
      days.push({ date: dateKey, count });
    }
    return days;
  }, [completions]);

  const getCellColor = (count) => {
    if (count === 0) return "bg-zinc-800/40 border-zinc-800/80";
    if (count === 1) return "bg-emerald-950/60 border-emerald-800/50";
    if (count === 2) return "bg-emerald-700/60 border-emerald-600/50";
    if (count >= 3) return "bg-emerald-400 border-emerald-300";
    return "bg-zinc-800/40 border-zinc-800/80";
  };

  const todayTasks = tasks.filter((t) => {
    if (t.repeatType === "once") {
      return t.targetDate === todayKey;
    }
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
        e("span", { className: "text-[11px] font-mono text-zinc-500" }, (completions[todayKey] || []).length + " today")
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
              title: day.date + ": " + day.count + " completed",
              className: "w-full aspect-square rounded-[3px] border transition-colors " + getCellColor(day.count),
            })
          )
        )
      ),
      e(
        "div",
        { className: "flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 pt-1" },
        e("span", null, "Less"),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px] bg-zinc-800" }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px] bg-emerald-950" }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px] bg-emerald-700" }),
        e("div", { className: "w-2.5 h-2.5 rounded-[2px] bg-emerald-400" }),
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
            const subDoneCount = (task.subtasks || []).filter((s) => (subtaskCompletions[todayKey] || []).includes(s.id)).length;
            const totalSub = (task.subtasks || []).length;

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
                  className: "flex-1 cursor-pointer pr-3",
                },
                e("p", { className: "text-sm font-medium text-zinc-200" + (isCompleted ? " line-through text-zinc-500" : "") }, task.title),
                totalSub > 0 &&
                  e("p", { className: "text-[11px] text-zinc-500 mt-0.5" }, subDoneCount + "/" + totalSub + " subtasks done")
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