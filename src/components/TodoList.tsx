"use client";

import { useState } from "react";

type Status = "none" | "circle" | "triangle" | "x";

type Todo = {
  id: number;
  title: string;
  done: boolean;
  status: string;
  date: string | null;
  order: number;
  createdAt: Date | string;
};

const NEXT_STATUS: Record<Status, Status> = {
  none: "circle",
  circle: "triangle",
  triangle: "x",
  x: "none",
};

const STATUS_DISPLAY: Record<Status, { icon: string; className: string }> = {
  none: { icon: "○", className: "text-zinc-300 dark:text-zinc-600" },
  circle: { icon: "○", className: "text-green-500" },
  triangle: { icon: "△", className: "text-amber-500" },
  x: { icon: "✕", className: "text-red-500" },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Calendar({
  selectedDate,
  onSelectDate,
  todosByDate,
}: {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  todosByDate: Record<string, number>;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = formatDate(today);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="px-2 py-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="px-2 py-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-zinc-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasTodos = (todosByDate[dateStr] ?? 0) > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors
                ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : isToday
                      ? "font-semibold text-zinc-900 ring-1 ring-zinc-300 dark:text-zinc-50 dark:ring-zinc-600"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
              {day}
              {hasTodos && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3 text-center">
          <button
            onClick={() => onSelectDate(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            전체 보기
          </button>
        </div>
      )}
    </div>
  );
}

function normalize(todos: Todo[]): Todo[] {
  return [...todos]
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .map((t, i) => ({ ...t, order: i }));
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(() => normalize(initialTodos));
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todosByDate = todos.reduce<Record<string, number>>((acc, t) => {
    if (t.date) acc[t.date] = (acc[t.date] ?? 0) + 1;
    return acc;
  }, {});

  const visibleTodos = todos.filter((t) =>
    selectedDate ? t.date === selectedDate : true
  );

  async function persistReorder(updated: Todo[]) {
    await fetch("/api/todos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: updated.map((t) => ({ id: t.id, order: t.order })),
      }),
    });
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date: selectedDate }),
    });
    const newTodo: Todo = await res.json();

    setTodos((prev) => {
      const sorted = [...prev];
      // Insert at top of visible section
      const insertIdx = selectedDate
        ? sorted.findIndex((t) => t.date === selectedDate)
        : 0;
      const pos = insertIdx === -1 ? 0 : insertIdx;
      sorted.splice(pos, 0, { ...newTodo, order: pos });
      const renumbered = sorted.map((t, i) => ({ ...t, order: i }));
      persistReorder(renumbered);
      return renumbered;
    });
    setTitle("");
  }

  async function updateStatus(id: number) {
    const todo = todos.find((t) => t.id === id)!;
    const newStatus = NEXT_STATUS[(todo.status as Status) in NEXT_STATUS ? (todo.status as Status) : "none"];
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function deleteTodo(id: number) {
    setTodos((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      const renumbered = filtered.map((t, i) => ({ ...t, order: i }));
      return renumbered;
    });
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  async function moveTodo(id: number, direction: "up" | "down") {
    setTodos((prev) => {
      const visible = prev.filter((t) =>
        selectedDate ? t.date === selectedDate : true
      );
      const idx = visible.findIndex((t) => t.id === id);
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === visible.length - 1) return prev;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const idxA = prev.findIndex((t) => t.id === visible[idx].id);
      const idxB = prev.findIndex((t) => t.id === visible[swapIdx].id);

      const next = [...prev];
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      const renumbered = next.map((t, i) => ({ ...t, order: i }));
      persistReorder(renumbered);
      return renumbered;
    });
  }

  return (
    <div>
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todosByDate={todosByDate}
      />

      <form onSubmit={addTodo} className="mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            selectedDate ? `${selectedDate}의 할 일` : "할 일을 입력하세요"
          }
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          추가
        </button>
      </form>

      {selectedDate && (
        <p className="mb-3 text-xs text-zinc-400">
          {selectedDate} · {visibleTodos.length}개
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visibleTodos.map((todo, idx) => {
          const safeStatus: Status = todo.status in STATUS_DISPLAY ? (todo.status as Status) : "none";
          const sd = STATUS_DISPLAY[safeStatus];
          return (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <button
                onClick={() => updateStatus(todo.id)}
                title="상태 변경 (○→△→✕→○)"
                className={`w-5 shrink-0 text-center text-base font-medium leading-none transition-colors ${sd.className}`}
              >
                {sd.icon}
              </button>

              <span
                className={`flex-1 text-sm ${
                  todo.status === "x"
                    ? "text-zinc-400 line-through"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {todo.title}
              </span>

              <div className="flex flex-col">
                <button
                  onClick={() => moveTodo(todo.id, "up")}
                  disabled={idx === 0}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-0 dark:hover:text-zinc-400"
                  style={{ fontSize: 10, lineHeight: 1.2 }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveTodo(todo.id, "down")}
                  disabled={idx === visibleTodos.length - 1}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-0 dark:hover:text-zinc-400"
                  style={{ fontSize: 10, lineHeight: 1.2 }}
                >
                  ▼
                </button>
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="shrink-0 text-xs text-zinc-400 hover:text-red-500"
              >
                삭제
              </button>
            </li>
          );
        })}
        {visibleTodos.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-400">
            {selectedDate ? "이 날의 할 일이 없습니다" : "할 일이 없습니다"}
          </li>
        )}
      </ul>
    </div>
  );
}
