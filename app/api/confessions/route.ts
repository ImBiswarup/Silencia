import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const userId = (await cookieStore).get("userId")?.value;

  const confessions = await prisma.confession.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      reactions: true,
      user: true,
    },
  });

  const formatted = confessions.map((c) => {
    const reactionCounts = c.reactions.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userReaction = userId
      ? c.reactions.find((r) => r.userId === userId)
      : null;

    return {
      id: c.id,
      content: c.content,
      category: c.category,
      createdAt: c.createdAt,
      reactions: reactionCounts,
      userReaction: userReaction?.type || null,
      user: c.user,
    };
  });

  return NextResponse.json(formatted);
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: No anonymous identity" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, category } = body;

    // Validation
    if (!content || content.trim().length < 3) {
      return NextResponse.json(
        { error: "Content must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const confession = await prisma.confession.create({
      data: {
        content: content.trim(),
        category,
        userId,
      },
    });

    return NextResponse.json(confession, { status: 201 });
  } catch (error) {
    console.error("POST /confessions error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}