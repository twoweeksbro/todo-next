import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { updates } = await req.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "updates must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map(({ id, order }: { id: number; order: number }) =>
      prisma.todo.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ ok: true });
}
