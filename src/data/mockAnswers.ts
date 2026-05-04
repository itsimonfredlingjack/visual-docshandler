export type AnswerStatus = 'grounded' | 'needs-review' | 'not-enough-source-evidence';

export type AnswerActionId =
  | 'open-sources'
  | 'add-documents';

export interface MockAnswerFact {
  label: string;
  value: string;
}

export interface MockAnswerSource {
  title: string;
  meta: string;
  excerpt: string;
  kind: 'file' | 'email' | 'status' | 'comparison';
}

export interface MockAnswerAction {
  id: AnswerActionId;
  label: string;
  description: string;
  tone?: 'primary' | 'secondary';
}

export interface MockAnswerResult {
  query: string;
  answer: string;
  facts: MockAnswerFact[];
  sources: MockAnswerSource[];
  actions: MockAnswerAction[];
  status: AnswerStatus;
  confidence: string;
  processSteps: string[];
}

export const SUGGESTED_QUERIES = [] as const; // Keeping exported constant empty so we don't break imports if any remain

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getMockAnswer(query: string, hasHalt: boolean): MockAnswerResult {
  const originalQuery = query.trim() || 'Empty query';
  const q = normalizeQuery(originalQuery);

  // 1. Source conflict case
  if (q.includes('compare') || (q.includes('acme') && q.includes('atlas'))) {
    return {
      query: originalQuery,
      answer: 'The Atlas NDA is signed and filed in Project Ledger. The Acme NDA is currently halted because a countersignature is missing.',
      facts: [
        { label: 'Acme', value: 'Missing countersignature' },
        { label: 'Atlas', value: 'Filed reference' },
        { label: 'Difference', value: 'Signature evidence' },
      ],
      sources: [
        {
          title: 'Unsigned_NDA_Acme.pdf',
          meta: 'Email - Legal - halted',
          excerpt: 'No countersignature detected. Rule LEGAL_SIGNATURE_REQUIRED was not satisfied.',
          kind: 'file',
        },
        {
          title: 'Atlas_Partners_2026.pdf',
          meta: 'Filed NDA - Project Ledger',
          excerpt: 'Named account list and partner commitments were filed after completion.',
          kind: 'comparison',
        },
      ],
      actions: [
        {
          id: 'open-sources',
          label: 'Open sources',
          description: 'Inspect the extracted document and email evidence.',
          tone: 'primary',
        },
      ],
      status: 'grounded',
      confidence: 'Grounded in 2 mock sources',
      processSteps: ['Retrieve Acme', 'Retrieve Atlas', 'Compare evidence', 'Answer'],
    };
  }

  // 2. Grounded answer case
  if (q.includes('acme') || q.includes('marketing') || q.includes('filed')) {
    return {
      query: originalQuery,
      answer: 'The Acme document is a mutual NDA draft. Marketing_v4 was filed to the Project Ledger at 13:58.',
      facts: [
        { label: 'Acme', value: 'Mutual NDA draft' },
        { label: 'Marketing', value: 'Filed' },
      ],
      sources: [
        {
          title: 'Unsigned_NDA_Acme.pdf',
          meta: 'Email - Legal',
          excerpt: 'Attached please find the revised mutual NDA. Please review and return a counter-signed copy at your earliest convenience.',
          kind: 'email',
        },
        {
          title: 'Marketing_v4.pdf',
          meta: 'Slack - Project Ledger',
          excerpt: 'Marketing plan v4 approved for Project Ledger.',
          kind: 'file',
        }
      ],
      actions: [
        {
          id: 'open-sources',
          label: 'Open sources',
          description: 'View the source documents for this answer.',
          tone: 'secondary',
        },
      ],
      status: 'grounded',
      confidence: 'Grounded in 2 mock sources',
      processSteps: ['Retrieve Acme docs', 'Read email context', 'Extract obligation', 'Answer'],
    };
  }

  // 3. Not enough evidence case
  if (hasHalt) {
    return {
      query: originalQuery,
      answer: 'I cannot answer that from grounded evidence yet, but there is a halted document you can review.',
      facts: [
        { label: 'Status', value: 'Not enough evidence' },
        { label: 'Halted docs', value: '1+' },
      ],
      sources: [],
      actions: [
        {
          id: 'open-sources',
          label: 'Open sources',
          description: 'Inspect the halted item and its extracted evidence.',
          tone: 'primary',
        },
      ],
      status: 'not-enough-source-evidence',
      confidence: 'Insufficient evidence for a grounded answer',
      processSteps: ['Search archive', 'Detect halted material', 'Request human review'],
    };
  }

  return {
    query: originalQuery,
    answer: 'I do not have enough source evidence to answer that yet.',
    facts: [
      { label: 'Status', value: 'Not enough evidence' },
      { label: 'Sources found', value: '0' },
    ],
    sources: [],
    actions: [
      {
        id: 'add-documents',
        label: 'Add documents',
        description: 'Provide more context to the workspace.',
        tone: 'primary',
      },
    ],
    status: 'not-enough-source-evidence',
    confidence: 'No grounded source evidence',
    processSteps: ['Search archive', 'No evidence found', 'Refuse unsupported answer'],
  };
}
