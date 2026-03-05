import { submitFeedback, isValidSignal, getFeedbackStats } from "@/lib/feedback";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof body !== "object" || body === null) {
    return new Response(
      JSON.stringify({ error: "Request body must be an object" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { query, response_text, signal, comment, citation_ids } = body as Record<string, unknown>;

  if (typeof query !== "string" || !query.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing required field: query" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof response_text !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: response_text" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof signal !== "string" || !isValidSignal(signal)) {
    return new Response(
      JSON.stringify({ error: "Invalid signal. Must be: correct, missing, irrelevant, or unsafe" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const entry = submitFeedback(
    query,
    response_text,
    signal,
    typeof comment === "string" ? comment : null,
    Array.isArray(citation_ids) ? citation_ids.filter((id): id is string => typeof id === "string") : []
  );

  return new Response(
    JSON.stringify({ id: entry.id, status: "recorded" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  const stats = getFeedbackStats();
  return new Response(
    JSON.stringify(stats),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
