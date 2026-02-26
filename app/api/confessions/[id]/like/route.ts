import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type } = await req.json();
  const cookieStore = cookies();
  const userId = (await cookieStore).get("userId")?.value;

  if (!type || !userId) {
    return NextResponse.json(
      { error: "Reaction type and user ID required" },
      { status: 400 }
    );
  }


  const existing = await prisma.reaction.findUnique({
    where: {
      confessionId_userId: {
        confessionId: id,
        userId,
      },
    },
  });

  if (!existing) {
    await prisma.reaction.create({
      data: {
        confessionId: id,
        userId,
        type,
      },
    });
  } else if (existing.type === type) {
    await prisma.reaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.reaction.update({
      where: { id: existing.id },
      data: { type },
    });
  }

  const grouped = await prisma.reaction.groupBy({
    by: ["type"],
    where: { confessionId: id },
    _count: {
      type: true,
    },
  });

  const reactionCounts = grouped.reduce((acc, item) => {
    acc[item.type] = item._count.type;
    return acc;
  }, {} as Record<string, number>);

  const userReaction =
    !existing
      ? type
      : existing.type === type
        ? null
        : type;

  return NextResponse.json({
    reactions: reactionCounts,
    userReaction,
  });
}