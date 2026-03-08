/**
 * Seed planning_items table from the Styx monthly operations calendar markdown.
 *
 * Usage: npx tsx scripts/seed-planning.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const CALENDAR_PATH = resolve(
  __dirname,
  "../src/data/planning/planning--monthly-calendar--2026-03-08.md"
);

const MONTH_MAP: Record<string, string> = {
  "March 2026": "2026-03",
  "April 2026": "2026-04",
  "May 2026": "2026-05",
  "June 2026": "2026-06",
  "July 2026": "2026-07",
  "August 2026": "2026-08",
  "September 2026": "2026-09",
  "October 2026": "2026-10",
  "November 2026": "2026-11",
  "December 2026": "2026-12",
};

const PHASE_MAP: Record<string, string> = {
  "2026-03": "Beta",
  "2026-04": "Beta",
  "2026-05": "Gamma",
  "2026-06": "Gamma",
  "2026-07": "Delta",
  "2026-08": "Delta",
  "2026-09": "Delta",
  "2026-10": "Omega",
  "2026-11": "Omega",
  "2026-12": "Omega",
};

const STATUS_MAP: Record<string, "not_started" | "in_progress" | "blocked" | "done"> = {
  "Not Started": "not_started",
  "Partial": "in_progress",
  "In Progress": "in_progress",
  "Stub": "in_progress",
  "Done": "done",
  "Blocked": "blocked",
};

interface ParsedItem {
  id: string;
  title: string;
  dept: string;
  owner: string;
  month: string;
  phase: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  position: number;
  blockedBy: string | null;
}

function parseCalendar(content: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  let currentMonth = "";
  let inItemsTable = false;
  let position = 0;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect month headers: "## March 2026"
    const monthMatch = line.match(/^## (\w+ \d{4})$/);
    if (monthMatch && MONTH_MAP[monthMatch[1]]) {
      currentMonth = MONTH_MAP[monthMatch[1]];
      inItemsTable = false;
      position = 0;
      continue;
    }

    // Detect "All Items This Month" table start
    if (line === "### All Items This Month") {
      inItemsTable = true;
      continue;
    }

    // Stop parsing table on next heading
    if (line.startsWith("###") && line !== "### All Items This Month") {
      inItemsTable = false;
      continue;
    }

    if (!inItemsTable || !currentMonth) continue;

    // Parse table rows: | # | Dept | Item | Owner | Status | Deps |
    const rowMatch = line.match(
      /^\|\s*(\d+)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/
    );
    if (!rowMatch) continue;

    const [, num, dept, title, ownerRaw, statusRaw, depsRaw] = rowMatch;

    // Clean owner: remove bold markers
    const owner = ownerRaw.replace(/\*\*/g, "").trim();

    // Map status
    const statusKey = Object.keys(STATUS_MAP).find((k) =>
      statusRaw.trim().startsWith(k)
    );
    const status = statusKey ? STATUS_MAP[statusKey] : "not_started";

    // Clean deps
    const deps = depsRaw.trim();
    const blockedBy = deps === "—" || deps === "" ? null : deps;

    // Generate ID: month-abbrev + dept + number
    const monthAbbrev = currentMonth.replace("2026-", "").replace(/^0/, "");
    const monthNames: Record<string, string> = {
      "3": "mar", "4": "apr", "5": "may", "6": "jun",
      "7": "jul", "8": "aug", "9": "sep", "10": "oct",
      "11": "nov", "12": "dec",
    };
    const id = `${monthNames[monthAbbrev]}-${dept.toLowerCase()}-${num.padStart(3, "0")}`;

    items.push({
      id,
      title: title.replace(/\*\*/g, "").trim(),
      dept: dept.toUpperCase(),
      owner,
      month: currentMonth,
      phase: PHASE_MAP[currentMonth] || "Beta",
      status,
      position: position++,
      blockedBy,
    });
  }

  return items;
}

async function main() {
  const content = readFileSync(CALENDAR_PATH, "utf-8");
  const items = parseCalendar(content);

  console.log(`Parsed ${items.length} planning items from calendar.`);

  if (items.length === 0) {
    console.error("No items parsed — check calendar format.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/stakeholder_portal",
  });

  const db = drizzle(pool, { schema });

  // Upsert each item
  let upserted = 0;
  for (const item of items) {
    await db
      .insert(schema.planningItems)
      .values({
        id: item.id,
        title: item.title,
        dept: item.dept,
        owner: item.owner,
        month: item.month,
        phase: item.phase,
        status: item.status,
        position: item.position,
        blockedBy: item.blockedBy,
      })
      .onConflictDoUpdate({
        target: schema.planningItems.id,
        set: {
          title: sql`excluded.title`,
          dept: sql`excluded.dept`,
          owner: sql`excluded.owner`,
          month: sql`excluded.month`,
          phase: sql`excluded.phase`,
          status: sql`excluded.status`,
          position: sql`excluded.position`,
          blockedBy: sql`excluded.blocked_by`,
          updatedAt: sql`now()`,
        },
      });
    upserted++;
  }

  console.log(`Upserted ${upserted} items into planning_items.`);

  // Summary by month
  const byMonth: Record<string, number> = {};
  for (const item of items) {
    byMonth[item.month] = (byMonth[item.month] || 0) + 1;
  }
  console.log("\nItems by month:");
  for (const [month, count] of Object.entries(byMonth).sort()) {
    console.log(`  ${month}: ${count}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
