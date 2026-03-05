import { buildTier1Context, buildTier2Context } from "@/lib/retrieval";
import { hybridRetrieve } from "@/lib/hybrid-retrieval";
import { planQuery } from "@/lib/query-planner";
import { buildCitations, buildCitationInstructions, buildCitedResponse } from "@/lib/citations";
import { maskPii, buildAccessContext, logAudit } from "@/lib/security";
import { getManifest } from "@/lib/manifest";
import type { Repo } from "@/lib/types";
import type { Citation } from "@/lib/citations";

// Simple in-memory rate limiter: 10 req/min per IP
type RateLimitEntry = {
  timestamps: number[];
  lastSeen: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_KEYS = 5_000;
const TRUST_PROXY_IP_HEADERS = process.env.TRUST_PROXY_IP_HEADERS === "1";
const EDGE_RATE_LIMIT_ENABLED = process.env.EDGE_RATE_LIMIT_ENABLED === "1";
const EDGE_BLOCK_HEADER = process.env.EDGE_BLOCK_HEADER || "x-edge-rate-limit-blocked";
const EDGE_REMAINING_HEADER = process.env.EDGE_REMAINING_HEADER || "x-ratelimit-remaining";
const EDGE_RETRY_AFTER_HEADER = process.env.EDGE_RETRY_AFTER_HEADER || "retry-after";
const MAX_MESSAGE_COUNT = 10;
const MAX_MESSAGE_CHARS = 4_000;
const DEFAULT_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OSS_LLM_API_URL = "https://text.pollinations.ai/openai";
const DEFAULT_OSS_LLM_MODEL = "openai-fast";
const manifest = getManifest();

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function repoLink(repo: Repo): string {
  return `[${repo.display_name}](/repos/${repo.slug})`;
}

function scoreRepoHint(repo: Repo, hint: string): number {
  const normalizedHint = normalizeText(hint);
  const slug = normalizeText(repo.slug);
  const name = normalizeText(repo.name);
  const display = normalizeText(repo.display_name);
  let score = 0;

  if (slug === normalizedHint || name === normalizedHint || display === normalizedHint) {
    score += 100;
  }
  if (slug.includes(normalizedHint) || name.includes(normalizedHint) || display.includes(normalizedHint)) {
    score += 60;
  }

  const tokens = normalizedHint.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (slug.includes(token)) score += 10;
    if (name.includes(token)) score += 10;
    if (display.includes(token)) score += 8;
    if (normalizeText(repo.description).includes(token)) score += 3;
    if (normalizeText(repo.ai_context).includes(token)) score += 1;
  }

  return score;
}

function findRepoByHint(hint: string): Repo | null {
  const scored = manifest.repos
    .map((repo) => ({ repo, score: scoreRepoHint(repo, hint) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.repo || null;
}

function listTopRepoSuggestions(hint: string, count = 3): Repo[] {
  return manifest.repos
    .map((repo) => ({ repo, score: scoreRepoHint(repo, hint) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.repo);
}

function buildDeterministicAnswer(queryText: string): string | null {
  const query = queryText.trim();
  if (!query) return null;

  const q = normalizeText(query);

  if (q.includes("what is organvm")) {
    const s = manifest.system;
    return [
      "### What ORGANVM Is",
      `ORGANVM is an eight-organ creative-institutional system spanning **${s.total_repos} repositories** across **${s.total_organs} organs**.`,
      `Current system status: **${s.active_repos} active**, **${s.archived_repos} archived**, with **${manifest.deployments.length} live deployments** tracked in this snapshot.`,
    ].join("\n\n");
  }

  if (q.includes("last sprint") || q.includes("recent sprint")) {
    const s = manifest.system;
    const sprintNames = s.sprint_names.length ? s.sprint_names.join(", ") : "None listed";
    return [
      "### Last Sprint Status",
      `There are currently **${s.sprints_completed} completed sprints** in this snapshot (tracking since **${s.launch_date}**).`,
      `Sprint history labels: ${sprintNames}.`,
    ].join("\n\n");
  }

  if (
    (q.includes("how many repos") || q.includes("repo count")) &&
    (q.includes("each organ") || q.includes("per organ"))
  ) {
    const lines = manifest.organs
      .map((o) => `- **${o.key} (${o.name})**: ${o.repo_count} repos`)
      .join("\n");
    return `### Repo Count by Organ\n${lines}`;
  }

  if (q.includes("flagship repos")) {
    const flagships = manifest.repos
      .filter((r) => r.tier.toLowerCase() === "flagship")
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    if (!flagships.length) return "No flagship repositories are marked in this manifest snapshot.";
    return [
      "### Flagship Repositories",
      ...flagships.map(
        (r) =>
          `- ${repoLink(r)} — ${r.organ}, status: ${r.status}, promotion: ${r.promotion_status}`
      ),
    ].join("\n");
  }

  if (q.includes("deployed") && (q.includes("product") || q.includes("deployment"))) {
    const repoByName = new Map(manifest.repos.map((r) => [r.name, r]));
    const lines = manifest.deployments.slice(0, 20).map((d) => {
      const repo = repoByName.get(d.repo);
      return repo
        ? `- ${repoLink(repo)}: ${d.url}`
        : `- **${d.repo}**: ${d.url}`;
    });
    return [
      "### Deployed Products (Top 20)",
      ...lines,
      "",
      `Total tracked deployments: ${manifest.deployments.length}`,
    ].join("\n");
  }

  if (q.includes("omega") && q.includes("status")) {
    const omegaMentions = manifest.repos.filter((r) =>
      normalizeText([r.name, r.display_name, r.description, r.ai_context].join(" ")).includes("omega")
    );

    if (!omegaMentions.length) {
      return [
        "There is no dedicated **omega status** field in the current schema.",
        "No repositories in this snapshot explicitly mention omega in their metadata.",
      ].join("\n\n");
    }

    return [
      "There is no dedicated **omega status** field in the current schema.",
      "Closest omega-related references in this snapshot:",
      ...omegaMentions.map((r) => `- ${repoLink(r)} — ${r.description}`),
    ].join("\n");
  }

  const techStackMatch = query.match(/tech\s*stack\s*(?:for|of)\s+(.+?)(?:[?.!]|$)/i);
  if (techStackMatch?.[1]) {
    const rawHint = techStackMatch[1].trim();
    const repo = findRepoByHint(rawHint);
    if (repo) {
      return [
        `### Tech Stack for ${repo.display_name}`,
        `Repo: ${repoLink(repo)}`,
        `- Organ: ${repo.organ}`,
        `- Tier: ${repo.tier}`,
        `- Status: ${repo.status}`,
        `- Promotion: ${repo.promotion_status}`,
        `- Stack: ${repo.tech_stack.length ? repo.tech_stack.join(", ") : "Not specified"}`,
        `- Deployments: ${repo.deployment_urls.length ? repo.deployment_urls.join(", ") : "None listed"}`,
      ].join("\n");
    }

    const suggestions = listTopRepoSuggestions(rawHint);
    return [
      `I could not find a repository named **${rawHint}** in the current ${manifest.system.total_repos}-repo snapshot.`,
      suggestions.length
        ? `Closest matches:\n${suggestions.map((r) => `- ${repoLink(r)}`).join("\n")}`
        : "No close name matches were found in the current manifest.",
    ].join("\n\n");
  }

  return null;
}

function createSseResponse(
  text: string,
  citations?: Citation[],
  meta?: { confidence?: number; coverage?: number; strategy?: string }
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
      );
      if (citations && citations.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            citations,
            confidence_score: meta?.confidence ?? 0,
            citation_coverage: meta?.coverage ?? 0,
            strategy: meta?.strategy ?? "unknown",
          })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildOfflineResponse(
  queryText: string,
  tier1: string,
  tier2: string,
  reason?: string
): string {
  const query = queryText.trim() || "the ORGANVM system";
  const systemLines = tier1
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 7);
  const relevantRepos = tier2
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- **"))
    .slice(0, 8);

  const repoSection =
    relevantRepos.length > 0
      ? relevantRepos.join("\n")
      : "No ranked repository matches were found in the local manifest snapshot.";

  return [
    `### ORGANVM Snapshot Response`,
    `The live OSS model path is currently unavailable, so this answer is generated from local manifest context for **${query}**.`,
    "",
    "#### System Overview",
    ...systemLines.map((line) => `- ${line}`),
    "",
    "#### Relevant Repositories",
    repoSection,
    "",
    reason ? `Provider note: ${reason}` : null,
    "Primary provider: `GROQ_API_KEY` + `GROQ_MODEL` (default `llama-3.3-70b-versatile`).",
    "Fallback provider: `OSS_LLM_API_URL=https://text.pollinations.ai/openai`, `OSS_LLM_MODEL=openai-fast`.",
  ].join("\n");
}

type OpenAICompatibleMessage = {
  role: "assistant";
  content?: string | Array<{ type?: string; text?: string }>;
};

type OpenAICompatibleResponse = {
  choices?: Array<{ message?: OpenAICompatibleMessage }>;
  error?: { message?: string };
};

type ProviderConfig = {
  apiUrl: string;
  model: string;
  apiKey?: string;
  providerName: string;
};

function getProviderConfig(): ProviderConfig {
  // allow-secret: env lookup only, no hardcoded credential.
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    return {
      apiUrl: process.env.GROQ_API_URL || DEFAULT_GROQ_API_URL,
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      apiKey: groqApiKey, // allow-secret: env-derived token pass-through.
      providerName: "Groq",
    };
  }

  return {
    // allow-secret: optional env lookup for provider token.
    apiUrl: process.env.OSS_LLM_API_URL || DEFAULT_OSS_LLM_API_URL,
    model: process.env.OSS_LLM_MODEL || DEFAULT_OSS_LLM_MODEL,
    apiKey: process.env.OSS_LLM_API_KEY, // allow-secret: env-derived token pass-through.
    providerName: "anonymous OSS fallback",
  };
}

function extractProviderText(data: OpenAICompatibleResponse): string | null {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  return null;
}

async function generateModelResponse(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const provider = getProviderConfig();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(provider.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        stream: false,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 350);
      throw new Error(`${provider.providerName} HTTP ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as OpenAICompatibleResponse;
    const text = extractProviderText(data);
    if (text) return text;
    if (data.error?.message) throw new Error(data.error.message);
    throw new Error("OSS provider returned no assistant text.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function buildAnonymousClientKey(request: Request): string {
  const ua = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  const lang = request.headers.get("accept-language") || "";
  return `anon:${hashString(`${ua}|${accept}|${lang}`)}`;
}

function getTrustedProxyIp(request: Request): string | null {
  if (request.headers.has("cf-ray")) {
    return parseForwardedIp(request.headers.get("cf-connecting-ip"));
  }
  if (request.headers.has("x-vercel-id")) {
    return parseForwardedIp(request.headers.get("x-forwarded-for"));
  }
  if (TRUST_PROXY_IP_HEADERS) {
    return (
      parseForwardedIp(request.headers.get("x-forwarded-for")) ||
      parseForwardedIp(request.headers.get("x-real-ip")) ||
      parseForwardedIp(request.headers.get("cf-connecting-ip"))
    );
  }
  return null;
}

function getClientKey(request: Request): string {
  const trustedIp = getTrustedProxyIp(request);
  if (trustedIp) return `ip:${trustedIp}`;
  return buildAnonymousClientKey(request);
}

function getEdgeRateLimitDecision(request: Request): {
  limited: boolean;
  retryAfter: string | null;
} {
  if (!EDGE_RATE_LIMIT_ENABLED) return { limited: false, retryAfter: null };

  const blocked = request.headers.get(EDGE_BLOCK_HEADER);
  if (blocked === "1" || blocked?.toLowerCase() === "true") {
    return {
      limited: true,
      retryAfter: request.headers.get(EDGE_RETRY_AFTER_HEADER),
    };
  }

  const remaining = Number(request.headers.get(EDGE_REMAINING_HEADER));
  if (Number.isFinite(remaining) && remaining <= 0) {
    return {
      limited: true,
      retryAfter: request.headers.get(EDGE_RETRY_AFTER_HEADER),
    };
  }

  return { limited: false, retryAfter: null };
}

function evictOldestRateLimitKeys(targetSize: number): void {
  if (rateLimitMap.size <= targetSize) return;
  const keysByLastSeen = [...rateLimitMap.entries()]
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    .map(([key]) => key);
  const removeCount = rateLimitMap.size - targetSize;
  for (let i = 0; i < removeCount; i += 1) {
    const key = keysByLastSeen[i];
    if (key) rateLimitMap.delete(key);
  }
}

function cleanupRateLimitMap(now: number): void {
  for (const [clientKey, entry] of rateLimitMap.entries()) {
    const recent = entry.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length > 0) {
      rateLimitMap.set(clientKey, { timestamps: recent, lastSeen: entry.lastSeen });
    } else {
      rateLimitMap.delete(clientKey);
    }
  }
  evictOldestRateLimitKeys(MAX_RATE_LIMIT_KEYS);
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  cleanupRateLimitMap(now);

  const current = rateLimitMap.get(clientKey) || { timestamps: [], lastSeen: now };
  if (current.timestamps.length >= RATE_LIMIT) return true;

  current.timestamps.push(now);
  current.lastSeen = now;
  rateLimitMap.set(clientKey, current);
  return false;
}

function rateLimitResponse(retryAfter: string | null = null): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (retryAfter) headers["Retry-After"] = retryAfter;
  return new Response(
    JSON.stringify({ error: "Rate limited. Try again in a minute." }),
    { status: 429, headers }
  );
}

export async function POST(request: Request) {
  const edgeDecision = getEdgeRateLimitDecision(request);
  if (edgeDecision.limited) return rateLimitResponse(edgeDecision.retryAfter);

  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const rawMessages =
    typeof body === "object" && body !== null && "messages" in body
      ? (body as { messages?: unknown }).messages
      : undefined;

  const messages: ChatMessage[] = Array.isArray(rawMessages)
    ? rawMessages
        .filter((m): m is ChatMessage => {
          if (typeof m !== "object" || m === null) return false;
          const candidate = m as { role?: unknown; content?: unknown };
          return (
            (candidate.role === "user" || candidate.role === "assistant") &&
            typeof candidate.content === "string"
          );
        })
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, MAX_MESSAGE_CHARS),
        }))
        .slice(-MAX_MESSAGE_COUNT)
    : [];

  if (!messages.length) {
    return new Response(
      JSON.stringify({ error: "No messages provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract the latest user query for retrieval
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();
  const queryText =
    typeof lastUserMessage?.content === "string"
      ? lastUserMessage.content
      : "";

  // Security: mask PII in query
  const sanitizedQuery = maskPii(queryText);

  // Audit log
  const accessCtx = buildAccessContext(request);
  logAudit("chat_query", "chat", accessCtx, true, "Query accepted", {
    query_length: sanitizedQuery.length,
  });

  // Query planning
  const queryPlan = planQuery(sanitizedQuery);

  // Build context (legacy tier system for fallback)
  const tier1 = buildTier1Context();
  const tier2 = buildTier2Context(sanitizedQuery);

  // Deterministic answers (no LLM needed)
  const deterministicAnswer = buildDeterministicAnswer(sanitizedQuery);
  if (deterministicAnswer) {
    return createSseResponse(deterministicAnswer);
  }

  // Hybrid retrieval with citations
  const retrieval = hybridRetrieve(sanitizedQuery, {
    maxSources: queryPlan.strategy === "single_repo" ? 5 : 15,
    includeGraph: queryPlan.strategy === "graph_traversal" || queryPlan.strategy === "cross_organ",
  });

  const citations = buildCitations(retrieval.sources);
  const citationInstructions = buildCitationInstructions(citations);

  const systemPrompt = `You are the ORGANVM Intelligence Assistant. You provide information about the ORGANVM eight-organ creative-institutional system to investors, partners, and stakeholders.

Answer using ONLY the context below. Reference specific repo names and deployment URLs when relevant. If you lack information to answer, say so — never fabricate facts. Format responses with markdown. Be concise and professional.

Repo names in your responses should be formatted as links to their detail pages: [Display Name](/repos/slug).

${citationInstructions}

=== SYSTEM OVERVIEW ===
${retrieval.tier1}

=== EVIDENCE-GROUNDED CONTEXT ===
${retrieval.context}`;

  try {
    const responseText = await generateModelResponse(messages, systemPrompt);
    const cited = buildCitedResponse(responseText, retrieval.sources);
    return createSseResponse(
      maskPii(responseText),
      cited.citations,
      {
        confidence: cited.confidence_score,
        coverage: cited.citation_coverage,
        strategy: retrieval.strategy,
      }
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown provider error";
    return createSseResponse(buildOfflineResponse(sanitizedQuery, tier1, tier2, reason));
  }
}
