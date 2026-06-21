import { prisma } from "@/lib/prisma";
import TodoList from "@/components/TodoList";

export default async function Home() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Todo
        </h1>
        <TodoList initialTodos={todos} />
      </main>
    </div>
  );
}
