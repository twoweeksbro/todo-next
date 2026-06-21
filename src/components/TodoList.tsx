"use client";

import { useState } from "react";

type Todo = {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
};

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);
  const [title, setTitle] = useState("");

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const todo = await res.json();
    setTodos((prev) => [todo, ...prev]);
    setTitle("");
  }

  async function toggleTodo(id: number, done: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done } : t))
    );
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  async function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <form onSubmit={addTodo} className="mb-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          추가
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={(e) => toggleTodo(todo.id, e.target.checked)}
              className="h-4 w-4"
            />
            <span
              className={`flex-1 text-sm ${
                todo.done
                  ? "text-zinc-400 line-through"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-xs text-zinc-400 hover:text-red-500"
            >
              삭제
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-400">
            할 일이 없습니다
          </li>
        )}
      </ul>
    </div>
  );
}
