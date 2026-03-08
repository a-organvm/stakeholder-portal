import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planningItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const set: Record<string, unknown> = {};
  const allowedFields = ["status", "position", "month", "dept", "phase", "notes", "issueUrl", "blockedBy"] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      set[field] = body[field];
    }
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const result = await db
    .update(planningItems)
    .set({
      ...(body.status !== undefined && { status: body.status }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.month !== undefined && { month: body.month }),
      ...(body.dept !== undefined && { dept: body.dept }),
      ...(body.phase !== undefined && { phase: body.phase }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.issueUrl !== undefined && { issueUrl: body.issueUrl }),
      ...(body.blockedBy !== undefined && { blockedBy: body.blockedBy }),
      updatedAt: sql`now()`,
    })
    .where(eq(planningItems.id, id))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db
    .delete(planningItems)
    .where(eq(planningItems.id, id))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
