# Justice Clock delivery status

This repository is the dedicated Justice Clock India product repository.

Current hard rule: the Supreme Court Justice Clock must show source status and missing fields honestly. It must not invent unavailable court metrics.

Current delay rule: the Indian Supreme Court Judgments public S3 metadata import must not fabricate time-to-judgment start years from citation years or judgment years. If the source record lacks a genuine filing, registration, diary, or structured case-year signal, `diaryYear` and `caseYear` stay empty and the record is excluded from historical estimated time-to-judgment metrics.

Current case-type rule: if a source record lacks a reliable case-type or docket-type field, the normalized `caseType` must be `Unclassified`, not a synthetic whole-corpus bucket.

