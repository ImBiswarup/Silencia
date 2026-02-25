import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const posts = await prisma.confession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { reactions: true, comments: true },
  });

  return NextResponse.json(posts);
}