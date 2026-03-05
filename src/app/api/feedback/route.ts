import {
  submitFeedback,
  isValidSignal,
  getFeedbackStats,
  type FeedbackAnswerability,
  type FeedbackContext,
} from "@/lib/feedback";

const MAX_QUERY_CHARS = 2000;
const MAX_RESPONSE_CHARS = 4000;
const MAX_COMMENT_CHARS = 1000;
const MAX_CITATION_IDS = 50;
const MAX_REASON_CHARS = 500;
const MAX_SUGGESTIONS = 10;
const MAX_SUGGESTION_CHARS = 200;

const ANSWERABILITY_VALUES = new Set<FeedbackAnswerability>([
  "answerable",
  "partial",
  "unanswerable",
]);

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

  const {
    query,
    response_text,
    signal,
    comment,
    citation_ids,
    strategy,
    answerability,
    answerability_reason,
    suggestions,
    client_id,
  } = body as Record<string, unknown>;

  if (typeof query !== "string" || !query.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing required field: query" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (query.length > MAX_QUERY_CHARS) {
    return new Response(
      JSON.stringify({ error: `query exceeds ${MAX_QUERY_CHARS} characters` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof response_text !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: response_text" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (response_text.length > MAX_RESPONSE_CHARS) {
    return new Response(
      JSON.stringify({ error: `response_text exceeds ${MAX_RESPONSE_CHARS} characters` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof signal !== "string" || !isValidSignal(signal)) {
    return new Response(
      JSON.stringify({ error: "Invalid signal. Must be: correct, missing, irrelevant, or unsafe" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const normalizedComment = typeof comment === "string" ? comment.trim() : null;
  if (normalizedComment && normalizedComment.length > MAX_COMMENT_CHARS) {
    return new Response(
      JSON.stringify({ error: `comment exceeds ${MAX_COMMENT_CHARS} characters` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const normalizedCitationIds = Array.isArray(citation_ids)
    ? citation_ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_CITATION_IDS)
    : [];

  const normalizedStrategy = typeof strategy === "string" ? strategy.trim().slice(0, 100) : null;
  const normalizedAnswerability =
    typeof answerability === "string" && ANSWERABILITY_VALUES.has(answerability as FeedbackAnswerability)
      ? (answerability as FeedbackAnswerability)
      : null;
  const normalizedReason =
    typeof answerability_reason === "string"
      ? answerability_reason.trim().slice(0, MAX_REASON_CHARS)
      : null;
  const normalizedSuggestions = Array.isArray(suggestions)
    ? suggestions
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_SUGGESTIONS)
        .map((s) => s.slice(0, MAX_SUGGESTION_CHARS))
    : [];
  const normalizedClientId = typeof client_id === "string" && client_id.trim()
    ? client_id.trim().slice(0, 128)
    : "anonymous";

  const context: FeedbackContext | null =
    normalizedStrategy || normalizedAnswerability || normalizedReason || normalizedSuggestions.length > 0
      ? {
          strategy: normalizedStrategy,
          answerability: normalizedAnswerability,
          answerability_reason: normalizedReason,
          suggestions: normalizedSuggestions,
        }
      : null;

  const entry = submitFeedback(
    query.trim().slice(0, MAX_QUERY_CHARS),
    response_text.trim().slice(0, MAX_RESPONSE_CHARS),
    signal,
    normalizedComment,
    normalizedCitationIds,
    normalizedClientId,
    context
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
