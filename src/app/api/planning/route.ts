import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planningItems } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const dept = url.searchParams.get("dept");
  const phase = url.searchParams.get("phase");
  const status = url.searchParams.get("status");
  const owner = url.searchParams.get("owner");

  const conditions = [];
  if (month) conditions.push(eq(planningItems.month, month));
  if (dept) conditions.push(eq(planningItems.dept, dept));
  if (phase) conditions.push(eq(planningItems.phase, phase));
  if (status) conditions.push(eq(planningItems.status, status as "not_started" | "in_progress" | "blocked" | "done"));
  if (owner) conditions.push(eq(planningItems.owner, owner));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(planningItems)
    .where(where)
    .orderBy(asc(planningItems.position));

  return NextResponse.json(items);
}
