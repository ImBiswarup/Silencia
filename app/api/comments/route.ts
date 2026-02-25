import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const cookieStore = cookies();
    const userId = (await cookieStore).get("userId")?.value;
    try {
        const { confessionId, text } = await req.json();

        if (!confessionId || !text?.trim()) {
            return NextResponse.json(
                { error: "Invalid input" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User ID required" },
                { status: 400 }
            );
        }

        const comment = await prisma.comment.create({
            data: {
                confessionId,
                text,
                userId: userId,
            },
            include: {
                user: true,
            },
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const confessionId = searchParams.get("confessionId");

    if (!confessionId) {
        return NextResponse.json(
            { error: "Confession ID required" },
            { status: 400 }
        );
    }

    const comments = await prisma.comment.findMany({
        where: { confessionId },
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
        },
    });

    return NextResponse.json(comments);
}