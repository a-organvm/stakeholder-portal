import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planningItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface ReorderItem {
  id: string;
  position: number;
  columnValue?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, columnField } = body as {
    items: ReorderItem[];
    columnField?: "month" | "status" | "dept" | "phase";
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  // Update each item's position and optionally its column value
  for (const item of items) {
    const set: Record<string, unknown> = {
      position: item.position,
      updatedAt: sql`now()`,
    };

    if (columnField && item.columnValue !== undefined) {
      set[columnField] = item.columnValue;
    }

    await db
      .update(planningItems)
      .set(set)
      .where(eq(planningItems.id, item.id));
  }

  return NextResponse.json({ updated: items.length });
}
