import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const todo = await prisma.todo.update({
    where: { id: Number(id) },
    data: {
      ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
      ...(typeof body.done === "boolean" ? { done: body.done } : {}),
      ...(typeof body.status === "string" ? { status: body.status } : {}),
      ...(body.date !== undefined ? { date: body.date } : {}),
      ...(typeof body.order === "number" ? { order: body.order } : {}),
    },
  });

  return NextResponse.json(todo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.todo.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
