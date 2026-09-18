import React, { useState, useRef, useEffect } from "react";

const e = React.createElement;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPicker({ selectedDate, onSelectDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const dropdownRef = useRef(null);

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeMonth = (offset) => {
    let newM = viewMonth + offset;
    let newY = viewYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setViewMonth(newM);
    setViewYear(newY);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(viewYear, viewMonth, d));
  }

  const isSameDay = (d1, d2) =>
    d1 &&
    d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return e(
    "div",
    { className: "relative inline-block text-left", ref: dropdownRef },
    e(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        className:
          "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:border-zinc-700 transition shadow-sm",
      },
      e("span", { className: "text-emerald-400" }, "\uD83D\uDDD3"),
      e(
        "span",
        null,
        selectedDate.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })
      ),
      e("span", { className: "text-[10px] text-zinc-500" }, "\u25BE")
    ),

    isOpen &&
      e(
        "div",
        {
          className:
            "absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 p-3.5 shadow-2xl z-50",
        },
        e(
          "div",
          { className: "flex items-center justify-between pb-2.5 border-b border-zinc-800/80 mb-2.5" },
          e(
            "button",
            {
              type: "button",
              onClick: () => changeMonth(-1),
              className: "w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 hover:text-white transition",
            },
            "<"
          ),
          e(
            "span",
            { className: "text-xs font-bold text-white tracking-wide" },
            MONTH_NAMES[viewMonth] + " " + viewYear
          ),
          e(
            "button",
            {
              type: "button",
              onClick: () => changeMonth(1),
              className: "w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 hover:text-white transition",
            },
            ">"
          )
        ),
        e(
          "div",
          { className: "grid grid-cols-7 gap-1 text-center mb-1" },
          ["S", "M", "T", "W", "T", "F", "S"].map((day, idx) =>
            e("span", { key: idx, className: "text-[10px] font-bold text-zinc-500" }, day)
          )
        ),
        e(
          "div",
          { className: "grid grid-cols-7 gap-1" },
          calendarDays.map((d, index) => {
            if (!d) return e("div", { key: "empty-" + index, className: "h-8 w-8" });
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, new Date());

            let cellClass = "h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ";
            if (isSelected) {
              cellClass += "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20";
            } else if (isToday) {
              cellClass += "bg-zinc-800 text-emerald-400 border border-emerald-500/40";
            } else {
              cellClass += "text-zinc-300 hover:bg-zinc-800 hover:text-white";
            }

            return e(
              "button",
              {
                key: d.toISOString(),
                type: "button",
                onClick: () => {
                  onSelectDate(d);
                  setIsOpen(false);
                },
                className: cellClass,
              },
              d.getDate()
            );
          })
        )
      )
  );
}