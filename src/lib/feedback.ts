/**
 * Feedback Capture System
 *
 * Collects user feedback on responses for continuous improvement.
 * Supports: correct, missing, irrelevant, unsafe signals.
 */

import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Feedback types
// ---------------------------------------------------------------------------

export type FeedbackSignal = "correct" | "missing" | "irrelevant" | "unsafe";
export type FeedbackAnswerability = "answerable" | "partial" | "unanswerable";

export interface FeedbackContext {
  strategy: string | null;
  answerability: FeedbackAnswerability | null;
  answerability_reason: string | null;
  suggestions: string[];
}

export interface FeedbackEntry {
  id: string;
  query: string;
  response_text: string;
  signal: FeedbackSignal;
  comment: string | null;
  citation_ids: string[];      // which citations were relevant
  created_at: string;
  client_id: string;           // anonymized
  context: FeedbackContext | null;
}

export interface FeedbackStats {
  total: number;
  by_signal: Record<FeedbackSignal, number>;
  satisfaction_rate: number;   // correct / total
  last_feedback: string | null;
}

// ---------------------------------------------------------------------------
// In-memory feedback store
// ---------------------------------------------------------------------------

const feedbackStore: FeedbackEntry[] = [];
let feedbackCounter = 0;

export function submitFeedback(
  query: string,
  responseText: string,
  signal: FeedbackSignal,
  comment: string | null = null,
  citationIds: string[] = [],
  clientId = "anonymous",
  context: FeedbackContext | null = null
): FeedbackEntry {
  feedbackCounter += 1;
  const entry: FeedbackEntry = {
    id: `fb-${feedbackCounter}`,
    query,
    response_text: responseText.slice(0, 2000),
    signal,
    comment,
    citation_ids: citationIds,
    created_at: new Date().toISOString(),
    client_id: clientId,
    context,
  };

  feedbackStore.push(entry);
  persistFeedbackEvent(entry);

  // Keep store bounded
  if (feedbackStore.length > 10_000) {
    feedbackStore.splice(0, feedbackStore.length - 10_000);
  }

  return entry;
}

export function getFeedbackStats(): FeedbackStats {
  const bySignal: Record<FeedbackSignal, number> = {
    correct: 0,
    missing: 0,
    irrelevant: 0,
    unsafe: 0,
  };

  for (const entry of feedbackStore) {
    bySignal[entry.signal] = (bySignal[entry.signal] || 0) + 1;
  }

  return {
    total: feedbackStore.length,
    by_signal: bySignal,
    satisfaction_rate: feedbackStore.length > 0
      ? bySignal.correct / feedbackStore.length
      : 0,
    last_feedback: feedbackStore.length > 0
      ? feedbackStore[feedbackStore.length - 1].created_at
      : null,
  };
}

export function getRecentFeedback(limit = 50): FeedbackEntry[] {
  return feedbackStore.slice(-limit).reverse();
}

export function getFeedbackByClientId(clientId: string): FeedbackEntry[] {
  return feedbackStore.filter((entry) => entry.client_id === clientId);
}

export function getTrainingDataset(): Array<{
  query: string;
  response: string;
  label: FeedbackSignal;
}> {
  return feedbackStore.map((e) => ({
    query: e.query,
    response: e.response_text,
    label: e.signal,
  }));
}

export function resetFeedback(): void {
  feedbackStore.length = 0;
  feedbackCounter = 0;
}

export function deleteFeedbackByClientId(clientId: string): number {
  if (!clientId) return 0;
  const before = feedbackStore.length;
  const kept = feedbackStore.filter((entry) => entry.client_id !== clientId);
  feedbackStore.length = 0;
  feedbackStore.push(...kept);
  return before - feedbackStore.length;
}

export function purgeFeedbackBefore(cutoffIso: string): number {
  const cutoffMs = Date.parse(cutoffIso);
  if (!Number.isFinite(cutoffMs)) return 0;

  const before = feedbackStore.length;
  const kept = feedbackStore.filter((entry) => {
    const entryMs = Date.parse(entry.created_at);
    if (!Number.isFinite(entryMs)) return true;
    return entryMs >= cutoffMs;
  });
  feedbackStore.length = 0;
  feedbackStore.push(...kept);
  return before - feedbackStore.length;
}

function shouldPersistFeedbackEvents(): boolean {
  if (process.env.FEEDBACK_PERSIST_DISABLED === "1") return false;
  if (process.env.NODE_ENV === "test") return false;
  return true;
}

function getFeedbackEventLogPath(): string {
  return process.env.FEEDBACK_EVENT_LOG_PATH
    ?? join(process.cwd(), ".codex", "telemetry", "feedback-events.ndjson");
}

function persistFeedbackEvent(entry: FeedbackEntry): void {
  if (!shouldPersistFeedbackEvents()) return;
  const logPath = getFeedbackEventLogPath();
  const serialized = JSON.stringify({
    ...entry,
    persisted_at: new Date().toISOString(),
  });

  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, `${serialized}\n`, "utf-8");
  } catch {
    // Best-effort persistence only.
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SIGNALS: FeedbackSignal[] = ["correct", "missing", "irrelevant", "unsafe"];

export function isValidSignal(signal: string): signal is FeedbackSignal {
  return VALID_SIGNALS.includes(signal as FeedbackSignal);
}
