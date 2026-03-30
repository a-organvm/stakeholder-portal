/**
 * Organ Registry Bridge
 *
 * Canonical source for organ-related mappings. Most organ metadata
 * derives from manifest.ts (which loads from manifest.json) to ensure
 * a single source of truth, while the directory bridge stays local so
 * browser/runtime consumers do not need to recompute it from manifest
 * data at render time.
 */

import { getOrgans } from "./manifest";

export const ORGAN_COLORS: Record<string, string> = {
  "ORGAN-I": "#6366f1",
  "ORGAN-II": "#ec4899",
  "ORGAN-III": "#3b82f6",
  "ORGAN-IV": "#f59e0b",
  "ORGAN-V": "#10b981",
  "ORGAN-VI": "#8b5cf6",
  "ORGAN-VII": "#ef4444",
  "META-ORGANVM": "#64748b",
};

export const ORGAN_ORG_DIRS: Record<string, string> = {
  "ORGAN-I": "organvm-i-theoria",
  "ORGAN-II": "organvm-ii-poiesis",
  "ORGAN-III": "organvm-iii-ergon",
  "ORGAN-IV": "organvm-iv-taxis",
  "ORGAN-V": "organvm-v-logos",
  "ORGAN-VI": "organvm-vi-koinonia",
  "ORGAN-VII": "organvm-vii-kerygma",
  "META-ORGANVM": "meta-organvm",
};

export const ORGAN_BG_CLASSES: Record<string, string> = {
  "ORGAN-I": "bg-indigo-950/40 border-indigo-800/50",
  "ORGAN-II": "bg-pink-950/40 border-pink-800/50",
  "ORGAN-III": "bg-blue-950/40 border-blue-800/50",
  "ORGAN-IV": "bg-amber-950/40 border-amber-800/50",
  "ORGAN-V": "bg-emerald-950/40 border-emerald-800/50",
  "ORGAN-VI": "bg-violet-950/40 border-violet-800/50",
  "ORGAN-VII": "bg-red-950/40 border-red-800/50",
  "META-ORGANVM": "bg-slate-900/40 border-slate-700/50",
};

export function getOrganColor(organKey: string): string {
  return ORGAN_COLORS[organKey] ?? ORGAN_COLORS["META-ORGANVM"];
}

export function getOrganBgClass(organKey: string): string {
  return ORGAN_BG_CLASSES[organKey] ?? ORGAN_BG_CLASSES["META-ORGANVM"];
}

export function getOrganOrgDir(organKey: string): string | undefined {
  return ORGAN_ORG_DIRS[organKey];
}

export function getOrganName(organKey: string): string | undefined {
  const organs = getOrgans();
  const organ = organs.find((o) => o.key === organKey);
  return organ?.name;
}

export function getOrganGreek(organKey: string): string | undefined {
  const organs = getOrgans();
  const organ = organs.find((o) => o.key === organKey);
  return organ?.greek;
}

export function getAllOrganKeys(): string[] {
  return getOrgans().map((o) => o.key);
}

export interface OrganSummary {
  key: string;
  name: string;
  greek: string;
  org: string;
  color: string;
  bgClass: string;
}

export function getOrganSummary(organKey: string): OrganSummary | undefined {
  const organs = getOrgans();
  const organ = organs.find((o) => o.key === organKey);
  if (!organ) return undefined;

  return {
    key: organ.key,
    name: organ.name,
    greek: organ.greek,
    org: organ.org,
    color: ORGAN_COLORS[organ.key] ?? ORGAN_COLORS["META-ORGANVM"],
    bgClass: ORGAN_BG_CLASSES[organ.key] ?? ORGAN_BG_CLASSES["META-ORGANVM"],
  };
}

export function getAllOrganSummaries(): OrganSummary[] {
  return getOrgans().map((organ) => ({
    key: organ.key,
    name: organ.name,
    greek: organ.greek,
    org: organ.org,
    color: ORGAN_COLORS[organ.key] ?? ORGAN_COLORS["META-ORGANVM"],
    bgClass: ORGAN_BG_CLASSES[organ.key] ?? ORGAN_BG_CLASSES["META-ORGANVM"],
  }));
}
