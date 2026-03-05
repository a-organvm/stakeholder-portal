import { describe, it, expect, beforeEach } from "vitest";
import {
  submitFeedback,
  getFeedbackStats,
  getRecentFeedback,
  getTrainingDataset,
  isValidSignal,
  resetFeedback,
} from "@/lib/feedback";

describe("feedback system", () => {
  beforeEach(() => resetFeedback());

  it("records feedback entries", () => {
    submitFeedback("test query", "test response", "correct");
    const stats = getFeedbackStats();
    expect(stats.total).toBe(1);
    expect(stats.by_signal.correct).toBe(1);
  });

  it("tracks satisfaction rate", () => {
    submitFeedback("q1", "r1", "correct");
    submitFeedback("q2", "r2", "correct");
    submitFeedback("q3", "r3", "irrelevant");

    const stats = getFeedbackStats();
    expect(stats.satisfaction_rate).toBeCloseTo(2 / 3, 2);
  });

  it("returns recent feedback in reverse chronological order", () => {
    submitFeedback("first", "r1", "correct");
    submitFeedback("second", "r2", "missing");

    const recent = getRecentFeedback();
    expect(recent[0].query).toBe("second");
    expect(recent[1].query).toBe("first");
  });

  it("generates training dataset", () => {
    submitFeedback("q1", "r1", "correct");
    submitFeedback("q2", "r2", "irrelevant");

    const dataset = getTrainingDataset();
    expect(dataset).toHaveLength(2);
    expect(dataset[0].label).toBe("correct");
  });

  it("validates signal types", () => {
    expect(isValidSignal("correct")).toBe(true);
    expect(isValidSignal("missing")).toBe(true);
    expect(isValidSignal("irrelevant")).toBe(true);
    expect(isValidSignal("unsafe")).toBe(true);
    expect(isValidSignal("invalid")).toBe(false);
    expect(isValidSignal("")).toBe(false);
  });

  it("stores optional comment and citation_ids", () => {
    const entry = submitFeedback(
      "query",
      "response",
      "missing",
      "Need more detail",
      ["cite-1", "cite-2"]
    );

    expect(entry.comment).toBe("Need more detail");
    expect(entry.citation_ids).toEqual(["cite-1", "cite-2"]);
  });
});
