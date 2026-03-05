import type {
  DependencyGraph,
  Deployment,
  GitStats,
  Manifest,
  Organ,
  OrganAesthetic,
  Repo,
  SystemData,
} from "@/lib/types";

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown, path: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as JsonRecord;
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`${path} must be a string`);
  }
  return value;
}

function asOptionalString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function assertNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number`);
  }
  return value;
}

function assertBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${path} must be a boolean`);
  }
  return value;
}

function assertStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  return value.map((item, index) => assertString(item, `${path}[${index}]`));
}

function assertNullableString(value: unknown, path: string): string | null {
  if (value === null) return null;
  return assertString(value, path);
}

function assertStringRecord(value: unknown, path: string): Record<string, string> {
  const record = assertRecord(value, path);
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(record)) {
    out[key] = assertString(val, `${path}.${key}`);
  }
  return out;
}

function parseSystemData(value: unknown): SystemData {
  const system = assertRecord(value, "system");
  return {
    name: assertString(system.name, "system.name"),
    tagline: assertString(system.tagline, "system.tagline"),
    total_repos: assertNumber(system.total_repos, "system.total_repos"),
    total_organs: assertNumber(system.total_organs, "system.total_organs"),
    launch_date: assertString(system.launch_date, "system.launch_date"),
    sprints_completed: assertNumber(system.sprints_completed, "system.sprints_completed"),
    sprint_names: assertStringArray(system.sprint_names, "system.sprint_names"),
    ci_workflows: assertNumber(system.ci_workflows, "system.ci_workflows"),
    dependency_edges: assertNumber(system.dependency_edges, "system.dependency_edges"),
    published_essays: assertNumber(system.published_essays, "system.published_essays"),
    active_repos: assertNumber(system.active_repos, "system.active_repos"),
    archived_repos: assertNumber(system.archived_repos, "system.archived_repos"),
  };
}

function parseOrganAesthetic(value: unknown): OrganAesthetic {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      palette: "",
      typography: "",
      tone: "",
      visual: "",
    };
  }
  const aesthetic = value as JsonRecord;
  return {
    palette: asOptionalString(aesthetic.palette),
    typography: asOptionalString(aesthetic.typography),
    tone: asOptionalString(aesthetic.tone),
    visual: asOptionalString(aesthetic.visual),
  };
}

function parseOrgan(value: unknown, index: number): Organ {
  const organ = assertRecord(value, `organs[${index}]`);
  return {
    key: assertString(organ.key, `organs[${index}].key`),
    name: assertString(organ.name, `organs[${index}].name`),
    greek: assertString(organ.greek, `organs[${index}].greek`),
    domain: assertString(organ.domain, `organs[${index}].domain`),
    org: assertString(organ.org, `organs[${index}].org`),
    description: assertString(organ.description, `organs[${index}].description`),
    repo_count: assertNumber(organ.repo_count, `organs[${index}].repo_count`),
    status: assertString(organ.status, `organs[${index}].status`),
    aesthetic: parseOrganAesthetic(organ.aesthetic),
  };
}

function parseGitStats(value: unknown, path: string): GitStats {
  const gitStats = assertRecord(value, path);
  const out: GitStats = {};
  if ("total_commits" in gitStats && gitStats.total_commits != null) {
    out.total_commits = assertNumber(gitStats.total_commits, `${path}.total_commits`);
  }
  if ("first_commit" in gitStats && gitStats.first_commit != null) {
    out.first_commit = assertString(gitStats.first_commit, `${path}.first_commit`);
  }
  if ("last_commit" in gitStats && gitStats.last_commit != null) {
    out.last_commit = assertString(gitStats.last_commit, `${path}.last_commit`);
  }
  if ("weekly_velocity" in gitStats && gitStats.weekly_velocity != null) {
    out.weekly_velocity = assertNumber(gitStats.weekly_velocity, `${path}.weekly_velocity`);
  }
  return out;
}

function parseRepo(value: unknown, index: number): Repo {
  const repo = assertRecord(value, `repos[${index}]`);
  return {
    name: assertString(repo.name, `repos[${index}].name`),
    display_name: assertString(repo.display_name, `repos[${index}].display_name`),
    slug: assertString(repo.slug, `repos[${index}].slug`),
    organ: assertString(repo.organ, `repos[${index}].organ`),
    org: assertString(repo.org, `repos[${index}].org`),
    tier: assertString(repo.tier, `repos[${index}].tier`),
    status: assertString(repo.status, `repos[${index}].status`),
    promotion_status: assertString(repo.promotion_status, `repos[${index}].promotion_status`),
    description: assertString(repo.description, `repos[${index}].description`),
    tech_stack: assertStringArray(repo.tech_stack, `repos[${index}].tech_stack`),
    ci_workflow:
      repo.ci_workflow === null
        ? null
        : assertString(repo.ci_workflow, `repos[${index}].ci_workflow`),
    dependencies: assertStringArray(repo.dependencies, `repos[${index}].dependencies`),
    produces: assertStringArray(repo.produces, `repos[${index}].produces`),
    consumes: assertStringArray(repo.consumes, `repos[${index}].consumes`),
    deployment_urls: assertStringArray(repo.deployment_urls, `repos[${index}].deployment_urls`),
    github_url: assertString(repo.github_url, `repos[${index}].github_url`),
    git_stats: parseGitStats(repo.git_stats, `repos[${index}].git_stats`),
    sections: assertStringRecord(repo.sections, `repos[${index}].sections`),
    ai_context: assertString(repo.ai_context, `repos[${index}].ai_context`),
    revenue_model: assertNullableString(repo.revenue_model, `repos[${index}].revenue_model`),
    revenue_status: assertNullableString(repo.revenue_status, `repos[${index}].revenue_status`),
    platinum_status: assertBoolean(repo.platinum_status, `repos[${index}].platinum_status`),
  };
}

function parseDependencyGraph(value: unknown): DependencyGraph {
  const graph = assertRecord(value, "dependency_graph");

  const nodesRaw = graph.nodes;
  if (!Array.isArray(nodesRaw)) {
    throw new Error("dependency_graph.nodes must be an array");
  }
  const nodes = nodesRaw.map((node, index) => {
    const parsed = assertRecord(node, `dependency_graph.nodes[${index}]`);
    return {
      id: assertString(parsed.id, `dependency_graph.nodes[${index}].id`),
      organ: assertString(parsed.organ, `dependency_graph.nodes[${index}].organ`),
      tier: assertString(parsed.tier, `dependency_graph.nodes[${index}].tier`),
    };
  });

  const edgesRaw = graph.edges;
  if (!Array.isArray(edgesRaw)) {
    throw new Error("dependency_graph.edges must be an array");
  }
  const edges = edgesRaw.map((edge, index) => {
    const parsed = assertRecord(edge, `dependency_graph.edges[${index}]`);
    return {
      from: assertString(parsed.from, `dependency_graph.edges[${index}].from`),
      to: assertString(parsed.to, `dependency_graph.edges[${index}].to`),
    };
  });

  return { nodes, edges };
}

function parseDeployment(value: unknown, index: number): Deployment {
  const deployment = assertRecord(value, `deployments[${index}]`);
  return {
    repo: assertString(deployment.repo, `deployments[${index}].repo`),
    organ: assertString(deployment.organ, `deployments[${index}].organ`),
    url: assertString(deployment.url, `deployments[${index}].url`),
  };
}

export function parseManifest(value: unknown): Manifest {
  const manifest = assertRecord(value, "manifest");

  const organsRaw = manifest.organs;
  if (!Array.isArray(organsRaw)) {
    throw new Error("organs must be an array");
  }
  const reposRaw = manifest.repos;
  if (!Array.isArray(reposRaw)) {
    throw new Error("repos must be an array");
  }
  const deploymentsRaw = manifest.deployments;
  if (!Array.isArray(deploymentsRaw)) {
    throw new Error("deployments must be an array");
  }

  return {
    generated: assertString(manifest.generated, "generated"),
    system: parseSystemData(manifest.system),
    organs: organsRaw.map(parseOrgan),
    repos: reposRaw.map(parseRepo),
    dependency_graph: parseDependencyGraph(manifest.dependency_graph),
    deployments: deploymentsRaw.map(parseDeployment),
  };
}
