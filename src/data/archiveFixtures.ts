import type { ArchivedDocument, DocumentItem } from '../types';

export const ARCHIVE: ArchivedDocument[] = [
  {
    id: 'arc-1',
    name: 'Mutual_NDA_Orion_2025.pdf',
    docType: 'nda',
    summary: 'Mutual NDA between LiveFlow and Orion Analytics, effective 2025-11-02, 24-month term.',
    filedAt: '2025-11-03',
    compartment: 'Project Ledger',
    source: 'Email',
    fileSize: '138 KB · 4 pages',
    keywords: ['nda', 'orion', 'confidentiality', 'legal', 'mutual', 'contract', '2025'],
    extraction: {
      kind: 'nda',
      parties: ['LiveFlow Inc.', 'Orion Analytics Ltd.'],
      effective: '2025-11-02',
      term: '24 months',
      signatories: [
        { name: 'Simon Fredling', party: 'LiveFlow Inc.', signed: true },
        { name: 'Maya Okafor', party: 'Orion Analytics Ltd.', signed: true },
      ],
      governingLaw: 'State of Delaware, USA',
      keyClauses: [
        { label: 'Permitted Use', value: 'Evaluation of integration partnership' },
        { label: 'Return / Destruction', value: '30 days after termination' },
        { label: 'Carve-outs', value: 'Independently developed / publicly available' },
      ],
    },
  },
  {
    id: 'arc-2',
    name: 'Q4_Projections_Approved.pdf',
    docType: 'projections',
    summary: 'Q4 2025 financial projections, approved by board 2025-10-28, revenue +18% YoY.',
    filedAt: '2025-10-28',
    compartment: 'Project Ledger',
    source: 'Local',
    fileSize: '412 KB · 12 pages',
    keywords: ['q4', 'projections', 'financial', 'revenue', 'board', 'approved', '2025'],
    extraction: {
      kind: 'projections',
      period: 'Q4 2025',
      preparedBy: 'Finance Ops',
      headline: 'Revenue +18% YoY driven by mid-market expansion',
      metrics: [
        { label: 'Revenue',       value: '$4.82M',   delta: '+18% YoY' },
        { label: 'Gross Margin',  value: '71%',      delta: '+3pp'     },
        { label: 'Net New ARR',   value: '$1.2M',    delta: '+22% QoQ' },
        { label: 'Burn',          value: '$340K/mo', delta: '-12%'     },
        { label: 'Runway',        value: '22 mo',    delta: '+4 mo'    },
      ],
      narrative: 'Mid-market cohort outperformed plan by 9%. SMB churn flat. Enterprise pipeline unchanged.',
    },
  },
  {
    id: 'arc-3',
    name: 'Invoice_AWS_Q4_Infra.pdf',
    docType: 'invoice',
    summary: 'AWS infrastructure invoice, $14,500.00, due 2026-04-30, outstanding.',
    filedAt: '2026-04-01',
    compartment: 'Project Ledger',
    source: 'Email',
    fileSize: '84 KB · 2 pages',
    keywords: ['invoice', 'aws', 'infrastructure', 'q4', 'outstanding', 'billing'],
    extraction: {
      kind: 'invoice',
      vendor: 'Amazon Web Services',
      amount: '$14,500.00',
      due: '2026-04-30',
      lineItems: [
        { label: 'EC2 compute (m7g.large × 12)', amount: '$6,820.00' },
        { label: 'RDS Postgres (db.r6g.xlarge)', amount: '$3,240.00' },
        { label: 'S3 storage + transfer',        amount: '$1,980.00' },
        { label: 'CloudFront + Route53',         amount: '$1,120.00' },
        { label: 'Support plan (Business)',      amount: '$1,340.00' },
      ],
      poNumber: 'PO-2026-0041',
      status: 'outstanding',
    },
  },
  {
    id: 'arc-4',
    name: 'Market_Analysis_Vertical_AI_2026.pdf',
    docType: 'report',
    summary: 'Vertical AI market analysis 2026: $14.2B TAM, legal-ops a top-3 growth segment.',
    filedAt: '2026-02-11',
    compartment: 'Strategic Archive',
    source: 'Slack',
    fileSize: '2.1 MB · 34 pages',
    keywords: ['market', 'analysis', 'vertical', 'ai', 'research', 'tam', '2026'],
    extraction: {
      kind: 'report',
      title: 'Vertical AI Market Analysis 2026',
      author: 'Strand & Kubo Research',
      published: '2026-02-05',
      abstract: 'Vertical AI applications, particularly in legal-ops, finance-ops, and compliance automation, are projected to reach $14.2B TAM by 2028 (34% CAGR).',
      findings: [
        'Legal-ops automation leads growth at 38% CAGR through 2028',
        'Mid-market (100-1000 FTE) is the fastest-adopting segment',
        'Incumbent vendors moving downmarket but hampered by generic UX',
        'Buyers prioritise "visible work" over raw capability in vendor selection',
        'Retrieval quality, not model quality, is the top differentiator reported',
      ],
    },
  },
  {
    id: 'arc-5',
    name: 'MOU_Atlas_Partners_2026.pdf',
    docType: 'mou',
    summary: 'MOU with Atlas Partners on joint GTM, effective 2026-03-15, 12-month pilot.',
    filedAt: '2026-03-16',
    compartment: 'Strategic Archive',
    source: 'Email',
    fileSize: '96 KB · 3 pages',
    keywords: ['mou', 'atlas', 'partnership', 'gtm', 'pilot', 'contract', 'legal', '2026'],
    extraction: {
      kind: 'mou',
      parties: ['LiveFlow Inc.', 'Atlas Partners LLP'],
      effective: '2026-03-15',
      purpose: 'Joint go-to-market for mid-market legal operations, 12-month pilot.',
      commitments: [
        { party: 'LiveFlow Inc.',      commitment: 'Dedicated solutions engineer, shared Slack, rev-share 70/30.' },
        { party: 'Atlas Partners LLP', commitment: 'Named account list (40 orgs), quarterly pipeline reviews.' },
      ],
      termination: 'Either party with 30 days notice after month 6.',
    },
  },
  {
    id: 'arc-6',
    name: 'SOC2_Audit_Findings_2026_Q1.pdf',
    docType: 'compliance',
    summary: 'SOC 2 Type II audit Q1 2026: pass with conditions, two medium findings remediated.',
    filedAt: '2026-04-08',
    compartment: 'Project Ledger',
    source: 'Local',
    fileSize: '1.3 MB · 22 pages',
    keywords: ['soc2', 'compliance', 'audit', 'security', 'findings', 'q1', '2026'],
    extraction: {
      kind: 'compliance',
      framework: 'SOC 2 Type II',
      period: '2026-Q1 (Jan 1 – Mar 31)',
      auditor: 'Prescott & Hart LLP',
      summary: 'Controls operating effectively over the period with two medium-severity findings, both remediated prior to report issuance.',
      findings: [
        { severity: 'medium', area: 'Access Review', note: 'Quarterly access review completed 9 days past window; process adjusted.' },
        { severity: 'medium', area: 'Change Mgmt',   note: 'Two production changes lacked secondary approver; policy updated.' },
        { severity: 'low',    area: 'Log Retention', note: 'Retention policy documented but not automated; tracked as roadmap item.' },
      ],
      verdict: 'pass-with-conditions',
    },
  },
];

// Simple fuzzy matching: score on substring hits across name, summary, keywords,
// compartment, source. Tie-break by recency.
export function matchArchive(query: string, docs: ArchivedDocument[] = ARCHIVE): ArchivedDocument[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = docs.map(doc => {
    const haystack = [
      doc.name,
      doc.summary,
      doc.compartment,
      doc.source,
      ...doc.keywords,
    ].join(' ').toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 10;
      if (doc.name.toLowerCase().includes(term)) score += 6;
      if (doc.keywords.some(k => k === term)) score += 4;
    }
    // Only apply recency tie-breaker to docs that actually matched a term.
    if (score > 0) {
      const ageDays = Math.max(
        1,
        (Date.now() - Date.parse(doc.filedAt)) / 86_400_000,
      );
      score += 3 / Math.log10(ageDays + 10);
    }
    return { doc, score };
  });

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.doc);
}

export function recentArchive(n = 4, docs: ArchivedDocument[] = ARCHIVE): ArchivedDocument[] {
  return [...docs]
    .sort((a, b) => Date.parse(b.filedAt) - Date.parse(a.filedAt))
    .slice(0, n);
}

export function findArchiveByName(name: string): ArchivedDocument | undefined {
  return ARCHIVE.find(d => d.name === name);
}

/**
 * Build an ArchivedDocument-shaped preview for a doc that's still live in the
 * pipeline (halted, in flight) and therefore has no extraction yet. Heuristic
 * by filename so the right panel can render the page even before the AI step.
 */
export function previewFromLiveDoc(live: DocumentItem): ArchivedDocument {
  const lower = live.name.toLowerCase();
  const senderEmail = live.evidence?.sender ?? '';
  const senderDomain = senderEmail.split('@')[1]?.split('.')[0] ?? 'counterparty';
  const counterpartyName =
    senderDomain.charAt(0).toUpperCase() + senderDomain.slice(1) + ' Corp.';

  if (lower.includes('nda')) {
    return {
      id: `live-${live.id}`,
      name: live.name,
      docType: 'nda',
      summary: live.evidence?.subject ?? 'Non-disclosure agreement, draft',
      filedAt: live.receivedAt,
      compartment: 'Pending',
      source: live.source === 'Local' ? 'Local' : live.source,
      fileSize: live.evidence?.fileSize ?? '— · — pages',
      keywords: ['nda', 'draft'],
      extraction: {
        kind: 'nda',
        parties: ['LiveFlow Inc.', counterpartyName],
        effective: 'Pending countersignature',
        term: '24 months',
        signatories: [
          { name: 'Simon Fredling',          party: 'LiveFlow Inc.',  signed: true  },
          { name: 'Awaiting countersignature', party: counterpartyName, signed: false },
        ],
        governingLaw: 'State of Delaware, USA',
        keyClauses: [
          { label: 'Permitted Use',        value: 'Evaluation of partnership opportunity' },
          { label: 'Return / Destruction', value: '30 days after termination' },
          { label: 'Carve-outs',           value: 'Independently developed / publicly available' },
        ],
      },
    };
  }

  // Generic fallback — short report-style page so something always renders.
  return {
    id: `live-${live.id}`,
    name: live.name,
    docType: 'report',
    summary: live.evidence?.subject ?? 'Document received, awaiting classification',
    filedAt: live.receivedAt,
    compartment: 'Pending',
    source: live.source === 'Local' ? 'Local' : live.source,
    fileSize: live.evidence?.fileSize ?? '— · — pages',
    keywords: [],
    extraction: {
      kind: 'report',
      title: live.name,
      author: live.evidence?.sender ?? live.source,
      published: live.receivedAt,
      abstract:
        live.evidence?.preview ??
        'No preview text was extracted from this document. The system is still classifying its contents.',
      findings: [],
    },
  };
}
