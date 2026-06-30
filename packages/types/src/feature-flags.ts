/**
 * UI feature toggles — implementation stays in codebase; flip to re-enable.
 * Does not remove server-side upload handlers.
 */
export const FEATURE_FLAGS = {
  /** Embedded official-letter upload on create/edit forms + detail uploaders. */
  officialLetterAttachments: false,
  /** Block submit/approve when no official letter file attached. */
  officialLetterRequired: false,
  /** Show missing-letter badges and dashboard counts. */
  officialLetterIndicators: false,
  /** Contact name / phone on forms and detail pages. */
  contactFields: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
