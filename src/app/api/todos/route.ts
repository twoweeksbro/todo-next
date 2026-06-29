import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const todos = await prisma.todo.findMany({
    where: date ? { date } : undefined,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
  const { title, date } = await req.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const todo = await prisma.todo.create({
    data: {
      title: title.trim(),
      date: date ?? null,
    },
  });
  return NextResponse.json(todo, { status: 201 });
}
