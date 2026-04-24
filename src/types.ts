export type ProcessPhase = 'dropped' | 'analyzing' | 'classifying' | 'uncertain' | 'routing' | 'filed';

export interface DocumentRouteExplanation {
  matchedProject?: string;
  detectedParticipants?: string[];
  extractedEntities?: string[];
  similarDocs?: string[];
  ruleApplied?: string;
  confidence: number;
  competingDestination?: string; // For uncertainty
}

export interface DocumentEvidence {
  sender?: string;
  subject?: string;
  fileSize?: string;
  preview?: string;
  receivedIso?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'IMAGE' | 'AUDIO';
  source: 'Local' | 'Email' | 'Slack';
  status: ProcessPhase;
  extractedTags?: string[];
  destination?: string;
  explanation?: DocumentRouteExplanation;
  scenario?: 'perfect' | 'uncertain';
  receivedAt: string;
  haltedAt?: string;
  evidence?: DocumentEvidence;
}

// ─── Retrieval archive types ─────────────────────────────────

export type DocType = 'nda' | 'invoice' | 'report' | 'projections' | 'mou' | 'compliance';

export interface ExtractionNDA {
  kind: 'nda';
  parties: string[];
  effective: string;
  term: string;
  signatories: { name: string; party: string; signed: boolean }[];
  governingLaw: string;
  keyClauses: { label: string; value: string }[];
}

export interface ExtractionInvoice {
  kind: 'invoice';
  vendor: string;
  amount: string;
  due: string;
  lineItems: { label: string; amount: string }[];
  poNumber?: string;
  status: 'paid' | 'outstanding' | 'overdue';
}

export interface ExtractionProjections {
  kind: 'projections';
  period: string;
  preparedBy: string;
  headline: string;
  metrics: { label: string; value: string; delta?: string }[];
  narrative: string;
}

export interface ExtractionReport {
  kind: 'report';
  title: string;
  author: string;
  published: string;
  abstract: string;
  findings: string[];
}

export interface ExtractionMOU {
  kind: 'mou';
  parties: string[];
  effective: string;
  purpose: string;
  commitments: { party: string; commitment: string }[];
  termination: string;
}

export interface ExtractionCompliance {
  kind: 'compliance';
  framework: string;
  period: string;
  auditor: string;
  summary: string;
  findings: { severity: 'low' | 'medium' | 'high'; area: string; note: string }[];
  verdict: 'pass' | 'pass-with-conditions' | 'fail';
}

export type DocExtraction =
  | ExtractionNDA
  | ExtractionInvoice
  | ExtractionProjections
  | ExtractionReport
  | ExtractionMOU
  | ExtractionCompliance;

export interface ArchivedDocument {
  id: string;
  name: string;
  docType: DocType;
  summary: string;
  filedAt: string;
  compartment: string;
  source: 'Email' | 'Slack' | 'Local' | 'API';
  fileSize: string;
  keywords: string[];
  extraction: DocExtraction;
}
