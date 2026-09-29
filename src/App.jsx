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

  const [activeTab, setActiveTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dedicatedTaskId, setDedicatedTaskId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

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
      // 1. Fetch all tasks (roots and subtasks together)
      const { data: tasksData, error: taskErr } = await supabase
        .from("tasks")
        .select("id, parent_id, title, notes, repeat_type, days, target_date");

      if (!taskErr && tasksData) {
        setTasks(
          tasksData.map((t) => ({
            id: t.id,
            parentId: t.parent_id,
            title: t.title,
            notes: t.notes || "",
            repeatType: t.repeat_type,
            days: t.days || [],
            targetDate: t.target_date || null,
          }))
        );
      }

      // 2. Fetch completions
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
    }

    loadData();
  }, [session]);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const selectedDateKey = formatDateKey(selectedDate);

  const dedicatedTask = useMemo(() => {
    return tasks.find((t) => t.id === dedicatedTaskId) || null;
  }, [tasks, dedicatedTaskId]);

  // Top-level root tasks for the main lists
  const rootTasks = useMemo(() => {
    return tasks.filter((t) => !t.parentId);
  }, [tasks]);

  // Read custom display_name first, then Google metadata full_name / name, and fall back to email username
  const displayName =
    session?.user?.user_metadata?.display_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "";

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

    // Update only this specific task
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

  const handleAddSubtask = async (title, parentId) => {
    const parent = tasks.find((t) => t.id === parentId);
    const payload = {
      user_id: session.user.id,
      parent_id: parentId,
      title: title,
      notes: "",
      repeat_type: parent ? parent.repeatType : "daily",
      days: parent ? parent.days : [],
      target_date: parent ? parent.targetDate : null,
    };

    const { data, error } = await supabase.from("tasks").insert(payload).select().single();

    if (!error && data) {
      setTasks((prev) => [
        ...prev,
        {
          id: data.id,
          parentId: data.parent_id,
          title: data.title,
          notes: data.notes || "",
          repeatType: data.repeat_type,
          days: data.days || [],
          targetDate: data.target_date || null,
        },
      ]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    // Delete task and all descendants from local state
    const idsToDelete = new Set([taskId]);
    let added = true;
    while (added) {
      added = false;
      tasks.forEach((t) => {
        if (t.parentId && idsToDelete.has(t.parentId) && !idsToDelete.has(t.id)) {
          idsToDelete.add(t.id);
          added = true;
        }
      });
    }

    setTasks((prev) => prev.filter((t) => !idsToDelete.has(t.id)));

    // Parent deletion cascades to descendants in Postgres
    await supabase.from("tasks").delete().match({ id: taskId, user_id: session.user.id });

    if (dedicatedTaskId && idsToDelete.has(dedicatedTaskId)) {
      setDedicatedTaskId(null);
    }
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
      parent_id: null,
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
          parentId: null,
          title: data.title,
          notes: data.notes || "",
          repeatType: data.repeat_type,
          days: data.days || [],
          targetDate: data.target_date || null,
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

    return e(DedicatedTaskPage, {
      task: dedicatedTask,
      allTasks: tasks,
      activeDateKey: activeDateKey,
      isMainDone: isMainDone,
      completions: completions,
      onBack: () => {
        // Navigate to immediate parent if nested, otherwise return to dashboard/schedule
        if (dedicatedTask.parentId) {
          setDedicatedTaskId(dedicatedTask.parentId);
        } else {
          setDedicatedTaskId(null);
        }
      },
      onNavigateToTask: (id) => setDedicatedTaskId(id),
      onToggleTask: toggleTaskForDate,
      onAddSubtask: handleAddSubtask,
      onDeleteSubtask: handleDeleteTask,
      onSaveNotes: handleSaveNotes,
    });
  }

  return e(
    "div",
    { className: "min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center selection:bg-zinc-800" },
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
              onClick: () => setIsNameModalOpen(true),
              className: "text-[11px] uppercase tracking-wider font-semibold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition",
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
          tasks: rootTasks,
          completions: completions,
          today: today,
          todayKey: todayKey,
          onOpenSchedule: () => {
            setSelectedDate(new Date());
            setActiveTab("schedule");
          },
          onOpenTask: setDedicatedTaskId,
          onToggleTask: toggleTaskForDate,
        }),

      activeTab === "schedule" &&
        e(ScheduleTab, {
          tasks: rootTasks,
          completions: completions,
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
          onClick: () => setActiveTab("home"),
          className: "flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition " +
            (activeTab === "home" ? "text-emerald-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"),
        },
        e("span", { className: "text-sm font-bold" }, "\u25A3"),
        e("span", null, "Dashboard")
      ),
      e(
        "button",
        {
          onClick: () => {
            setSelectedDate(new Date());
            setActiveTab("schedule");
          },
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