/**
 * Compliance utilities for retention and subject-data operations.
 */

import { getPlatformConfig } from "./platform-config";
import {
  getFeedbackByClientId,
  deleteFeedbackByClientId,
  purgeFeedbackBefore,
} from "./feedback";
import {
  getAuditEntriesByUserId,
  deleteAuditEntriesByUserId,
  purgeAuditBefore,
} from "./security";

export interface SubjectDataExport {
  client_id: string;
  generated_at: string;
  feedback_entries: ReturnType<typeof getFeedbackByClientId>;
  audit_entries: ReturnType<typeof getAuditEntriesByUserId>;
  policy: {
    gdpr_enabled: boolean;
    ccpa_enabled: boolean;
    hipaa_enabled: boolean;
  };
}

export interface SubjectDeleteResult {
  client_id: string;
  deleted_feedback_entries: number;
  deleted_audit_entries: number;
}

export interface RetentionResult {
  cutoff_feedback: string;
  cutoff_audit: string;
  purged_feedback_entries: number;
  purged_audit_entries: number;
}

function toIsoDaysAgo(days: number, now = Date.now()): string {
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}

export function exportSubjectData(clientId: string): SubjectDataExport {
  const cfg = getPlatformConfig();
  return {
    client_id: clientId,
    generated_at: new Date().toISOString(),
    feedback_entries: getFeedbackByClientId(clientId),
    audit_entries: getAuditEntriesByUserId(clientId),
    policy: {
      gdpr_enabled: cfg.compliance.gdpr_enabled,
      ccpa_enabled: cfg.compliance.ccpa_enabled,
      hipaa_enabled: cfg.compliance.hipaa_enabled,
    },
  };
}

export function deleteSubjectData(clientId: string): SubjectDeleteResult {
  return {
    client_id: clientId,
    deleted_feedback_entries: deleteFeedbackByClientId(clientId),
    deleted_audit_entries: deleteAuditEntriesByUserId(clientId),
  };
}

export function applyRetentionPolicies(now = Date.now()): RetentionResult {
  const cfg = getPlatformConfig();
  const feedbackCutoff = toIsoDaysAgo(cfg.retention.feedback_days, now);
  const auditCutoff = toIsoDaysAgo(cfg.retention.audit_days, now);

  return {
    cutoff_feedback: feedbackCutoff,
    cutoff_audit: auditCutoff,
    purged_feedback_entries: purgeFeedbackBefore(feedbackCutoff),
    purged_audit_entries: purgeAuditBefore(auditCutoff),
  };
}
