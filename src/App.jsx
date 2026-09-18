import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import DashboardTab from "./components/DashboardTab";
import ScheduleTab from "./components/ScheduleTab";
import DedicatedTaskPage from "./components/DedicatedTaskPage";
import CreateTaskModal from "./components/CreateTaskModal";
import NameModal from "./components/NameModal";

const e = React.createElement;

function formatDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState({});
  const [subtaskCompletions, setSubtaskCompletions] = useState({});

  const [activeTab, setActiveTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dedicatedTaskId, setDedicatedTaskId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Easter Egg State: 5 quick taps on the name triggers Party Mode
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [nameTapCount, setNameTapCount] = useState(0);

  // Switch tab and automatically reset date to today when opening schedule
  const handleTabChange = (tab) => {
    if (tab === "schedule") {
      setSelectedDate(new Date());
    }
    setActiveTab(tab);
  };

  const handleNameClick = () => {
    const nextCount = nameTapCount + 1;
    if (nextCount >= 5) {
      setEasterEggActive(true);
      setNameTapCount(0);
      setTimeout(() => setEasterEggActive(false), 3500);
    } else {
      setNameTapCount(nextCount);
      setIsNameModalOpen(true);
    }
  };

  // Authentication State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingInitial(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingInitial(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Database Records
  useEffect(() => {
    if (!session?.user) return;

    async function loadData() {
      const { data: tasksData, error: taskErr } = await supabase
        .from("tasks")
        .select("id, title, notes, repeat_type, days, target_date, subtasks(id, title)");

      if (!taskErr && tasksData) {
        setTasks(
          tasksData.map((t) => ({
            id: t.id,
            title: t.title,
            notes: t.notes || "",
            repeatType: t.repeat_type,
            days: t.days || [],
            subtasks: t.subtasks || [],
          }))
        );
      }

      const { data: compData } = await supabase
        .from("task_completions")
        .select("task_id, completed_date");

      if (compData) {
        const compMap = {};
        compData.forEach((row) => {
          if (!compMap[row.completed_date]) compMap[row.completed_date] = [];
          compMap[row.completed_date].push(row.task_id);
        });
        setCompletions(compMap);
      }

      const { data: subCompData } = await supabase
        .from("subtask_completions")
        .select("subtask_id, completed_date");

      if (subCompData) {
        const subCompMap = {};
        subCompData.forEach((row) => {
          if (!subCompMap[row.completed_date]) subCompMap[row.completed_date] = [];
          subCompMap[row.completed_date].push(row.subtask_id);
        });
        setSubtaskCompletions(subCompMap);
      }
    }

    loadData();
  }, [session]);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const selectedDateKey = formatDateKey(selectedDate);

  const dedicatedTask = useMemo(() => {
    return tasks.find((t) => t.id === dedicatedTaskId) || null;
  }, [tasks, dedicatedTaskId]);

  const displayName = session?.user?.user_metadata?.display_name || "";

  const handleUpdateName = async (newName) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: newName },
    });
    if (!error && data?.user) {
      setSession((prev) => ({ ...prev, user: data.user }));
    }
  };

  const toggleTaskForDate = async (taskId, targetDateKey) => {
    const list = completions[targetDateKey] || [];
    const isCompleted = list.includes(taskId);

    setCompletions((prev) => ({
      ...prev,
      [targetDateKey]: isCompleted ? list.filter((id) => id !== taskId) : [...list, taskId],
    }));

    if (isCompleted) {
      await supabase
        .from("task_completions")
        .delete()
        .match({ task_id: taskId, completed_date: targetDateKey, user_id: session.user.id });
    } else {
      await supabase.from("task_completions").insert({
        task_id: taskId,
        completed_date: targetDateKey,
        user_id: session.user.id,
      });
    }
  };

  const toggleSubtaskForDate = async (taskId, subtaskId, targetDateKey) => {
    const parent = tasks.find((t) => t.id === taskId);
    if (!parent) return;

    const currentSubCompletions = subtaskCompletions[targetDateKey] || [];
    const isCompleted = currentSubCompletions.includes(subtaskId);

    const updatedSub = isCompleted
      ? currentSubCompletions.filter((id) => id !== subtaskId)
      : [...currentSubCompletions, subtaskId];

    setSubtaskCompletions((prev) => ({
      ...prev,
      [targetDateKey]: updatedSub,
    }));

    if (isCompleted) {
      await supabase
        .from("subtask_completions")
        .delete()
        .match({ subtask_id: subtaskId, completed_date: targetDateKey, user_id: session.user.id });
    } else {
      await supabase.from("subtask_completions").insert({
        subtask_id: subtaskId,
        completed_date: targetDateKey,
        user_id: session.user.id,
      });

      if (parent.subtasks && parent.subtasks.length > 0) {
        const allDone = parent.subtasks.every((sub) =>
          sub.id === subtaskId ? true : updatedSub.includes(sub.id)
        );
        if (allDone) {
          const mainList = completions[targetDateKey] || [];
          if (!mainList.includes(taskId)) {
            setCompletions((prev) => ({
              ...prev,
              [targetDateKey]: [...mainList, taskId],
            }));
            await supabase.from("task_completions").insert({
              task_id: taskId,
              completed_date: targetDateKey,
              user_id: session.user.id,
            });
          }
        }
      }
    }
  };

  const handleAddSubtask = async (title) => {
    if (!dedicatedTaskId) return;

    const { data, error } = await supabase
      .from("subtasks")
      .insert({
        task_id: dedicatedTaskId,
        user_id: session.user.id,
        title: title,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === dedicatedTaskId
            ? { ...t, subtasks: [...(t.subtasks || []), { id: data.id, title: data.title }] }
            : t
        )
      );
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!dedicatedTaskId) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === dedicatedTaskId
          ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) }
          : t
      )
    );

    await supabase.from("subtasks").delete().match({ id: subtaskId, user_id: session.user.id });
  };

  const handleSaveNotes = async (newNotes) => {
    if (!dedicatedTaskId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === dedicatedTaskId ? { ...t, notes: newNotes } : t))
    );

    await supabase
      .from("tasks")
      .update({ notes: newNotes })
      .match({ id: dedicatedTaskId, user_id: session.user.id });
  };

  const handleCreateTask = async (taskData) => {
    const payload = {
      user_id: session.user.id,
      title: taskData.title,
      notes: taskData.notes,
      repeat_type: taskData.repeatType,
      days: taskData.days,
      target_date: taskData.targetDate || null,
    };

    const { data, error } = await supabase.from("tasks").insert(payload).select().single();

    if (!error && data) {
      setTasks((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          notes: data.notes || "",
          repeatType: data.repeat_type,
          days: data.days || [],
          targetDate: data.target_date || null,
          subtasks: [],
        },
      ]);
    }
    setIsCreateModalOpen(false);
  };

  if (loadingInitial) {
    return e("div", { className: "min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs font-mono" }, "Loading...");
  }

  if (!session) {
    return e(Auth, null);
  }

  if (dedicatedTask) {
    const activeDateKey = activeTab === "home" ? todayKey : selectedDateKey;
    const isMainDone = (completions[activeDateKey] || []).includes(dedicatedTask.id);
    const subtaskDoneList = subtaskCompletions[activeDateKey] || [];

    return e(DedicatedTaskPage, {
      task: dedicatedTask,
      activeDateKey: activeDateKey,
      isMainDone: isMainDone,
      subtaskDoneList: subtaskDoneList,
      onBack: () => setDedicatedTaskId(null),
      onToggleMain: () => toggleTaskForDate(dedicatedTask.id, activeDateKey),
      onToggleSubtask: (subId) => toggleSubtaskForDate(dedicatedTask.id, subId, activeDateKey),
      onAddSubtask: handleAddSubtask,
      onDeleteSubtask: handleDeleteSubtask,
      onSaveNotes: handleSaveNotes,
    });
  }

  return e(
    "div",
    { className: "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center selection:bg-zinc-800 relative overflow-x-hidden" },

    // Easter Egg Overlay
    easterEggActive &&
      e(
        "div",
        { className: "fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none animate-bounce" },
        e(
          "div",
          { className: "px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500 text-black font-extrabold text-xs shadow-xl flex items-center gap-2" },
          e("span", null, "\uD83C\uDF89"),
          e("span", null, "Overachiever Mode Unlocked! Keep crushing it!"),
          e("span", null, "\u2728")
        )
      ),

    e(
      "main",
      { className: "w-full max-w-md flex flex-col gap-5 p-4 pb-28 pt-3" },
      e(
        "header",
        { className: "flex items-center justify-between border-b border-zinc-900 pb-3" },
        e(
          "div",
          null,
          e(
            "button",
            {
              onClick: handleNameClick,
              className: "text-[11px] uppercase tracking-wider font-semibold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition select-none",
            },
            displayName ? "Hi, " + displayName : "Set your name",
            e("span", { className: "text-[10px] opacity-70" }, "\u270E")
          ),
          e("h1", { className: "text-xl font-bold tracking-tight text-white mt-0.5" },
            activeTab === "home" ? "Dashboard" : "Schedule"
          )
        ),
        e(
          "div",
          { className: "flex items-center gap-2" },
          e(
            "button",
            {
              onClick: () => supabase.auth.signOut(),
              className: "text-xs text-zinc-500 hover:text-zinc-300 font-medium px-2 py-1",
            },
            "Sign out"
          ),
          e(
            "button",
            {
              onClick: () => setIsCreateModalOpen(true),
              className: "h-8 w-8 rounded-full bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center transition hover:bg-zinc-200 active:scale-95 text-base leading-none",
            },
            "+"
          )
        )
      ),

      activeTab === "home" &&
        e(DashboardTab, {
          tasks: tasks,
          completions: completions,
          subtaskCompletions: subtaskCompletions,
          today: today,
          todayKey: todayKey,
          onOpenSchedule: () => handleTabChange("schedule"),
          onOpenTask: setDedicatedTaskId,
          onToggleTask: toggleTaskForDate,
        }),

      activeTab === "schedule" &&
        e(ScheduleTab, {
          tasks: tasks,
          completions: completions,
          subtaskCompletions: subtaskCompletions,
          selectedDate: selectedDate,
          selectedDateKey: selectedDateKey,
          todayKey: todayKey,
          onChangeDateOffset: (offset) => {
            setSelectedDate((prev) => {
              const d = new Date(prev);
              d.setDate(d.getDate() + offset);
              return d;
            });
          },
          onSelectDate: setSelectedDate,
          onJumpToToday: () => setSelectedDate(new Date()),
          onOpenTask: setDedicatedTaskId,
          onToggleTask: toggleTaskForDate,
        })
    ),

    e(
      "nav",
      { className: "fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-md flex justify-around p-2.5 z-40 max-w-md mx-auto" },
      e(
        "button",
        {
          onClick: () => handleTabChange("home"),
          className: "flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition " +
            (activeTab === "home" ? "text-emerald-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"),
        },
        e("span", { className: "text-sm font-bold" }, "\u25A3"),
        e("span", null, "Dashboard")
      ),
      e(
        "button",
        {
          onClick: () => handleTabChange("schedule"),
          className: "flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition " +
            (activeTab === "schedule" ? "text-emerald-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"),
        },
        e("span", { className: "text-sm font-bold" }, "\u2630"),
        e("span", null, "Schedule")
      )
    ),

    isCreateModalOpen &&
      e(CreateTaskModal, {
        onClose: () => setIsCreateModalOpen(false),
        onCreate: handleCreateTask,
      }),

    isNameModalOpen &&
      e(NameModal, {
        currentName: displayName,
        onClose: () => setIsNameModalOpen(false),
        onSave: handleUpdateName,
      })
  );
}