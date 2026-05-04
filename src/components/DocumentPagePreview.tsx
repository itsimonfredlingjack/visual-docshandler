import type { ArchivedDocument, DocExtraction } from '../types';

interface DocumentPagePreviewProps {
  doc: ArchivedDocument;
  /** When set, renders a halt watermark + amber framing instead of the
      neutral filed look. Used for the active halted doc. */
  haltedReason?: string;
}

export function DocumentPagePreview({ doc, haltedReason }: DocumentPagePreviewProps) {
  return (
    <article className={`docpage ${haltedReason ? 'is-halted' : ''}`}>
      <div className="docpage-paper">
        <div className="docpage-corner docpage-corner-tl" />
        <div className="docpage-corner docpage-corner-tr" />

        {haltedReason && (
          <div className="docpage-halt-watermark" aria-hidden>DRAFT — UNSIGNED</div>
        )}

        <div className="docpage-body">
          <DocumentPageContent extraction={doc.extraction} doc={doc} halted={!!haltedReason} />
        </div>

        <div className="docpage-footer">
          <span className="docpage-footer-id">{doc.name}</span>
          <span className="docpage-footer-meta">{doc.fileSize}</span>
        </div>
      </div>

      {haltedReason && (
        <div className="docpage-halt-callout">
          <span className="docpage-halt-tag">HALTED</span>
          <span className="docpage-halt-text">{haltedReason}</span>
        </div>
      )}
    </article>
  );
}

function DocumentPageContent({
  extraction,
  doc,
  halted,
}: {
  extraction: DocExtraction;
  doc: ArchivedDocument;
  halted: boolean;
}) {
  switch (extraction.kind) {
    case 'nda':
      return <NdaPage extraction={extraction} halted={halted} />;
    case 'invoice':
      return <InvoicePage extraction={extraction} doc={doc} />;
    case 'projections':
      return <ProjectionsPage extraction={extraction} doc={doc} />;
    case 'report':
      return <ReportPage extraction={extraction} />;
    case 'mou':
      return <MouPage extraction={extraction} />;
    case 'compliance':
      return <CompliancePage extraction={extraction} />;
  }
}

/* ──────────────────────────────────────────────────────────────
   NDA — formal legal document
   ────────────────────────────────────────────────────────────── */

function NdaPage({
  extraction,
  halted,
}: {
  extraction: Extract<DocExtraction, { kind: 'nda' }>;
  halted: boolean;
}) {
  const [partyA, partyB] = extraction.parties;
  return (
    <>
      <div className="docpage-eyebrow">CONFIDENTIAL · MUTUAL AGREEMENT</div>
      <h1 className="docpage-title">Mutual Non-Disclosure Agreement</h1>
      <div className="docpage-meta">
        <span>Effective {extraction.effective}</span>
        <span className="docpage-meta-sep">·</span>
        <span>Term {extraction.term}</span>
        <span className="docpage-meta-sep">·</span>
        <span>Governed by {extraction.governingLaw}</span>
      </div>

      <div className="docpage-rule" />

      <p className="docpage-prose">
        This Mutual Non-Disclosure Agreement (the &ldquo;Agreement&rdquo;) is
        entered into by and between <strong>{partyA}</strong> and{' '}
        <strong>{partyB}</strong> (collectively, the &ldquo;Parties&rdquo;) with
        respect to confidential information exchanged in connection with the
        purposes set forth below.
      </p>

      {extraction.keyClauses.map(clause => (
        <section key={clause.label} className="docpage-clause">
          <h3 className="docpage-clause-heading">{clause.label}</h3>
          <p className="docpage-prose">{clause.value}</p>
        </section>
      ))}

      <div className="docpage-rule docpage-rule-soft" />

      <div className="docpage-signature-block">
        {extraction.signatories.map(sig => (
          <div key={sig.name} className="docpage-signature">
            <div className={`docpage-signature-line ${sig.signed && !halted ? 'is-signed' : ''}`}>
              {sig.signed && !halted && (
                <span className="docpage-signature-mark" aria-hidden>{cursive(sig.name)}</span>
              )}
            </div>
            <div className="docpage-signature-name">{sig.name}</div>
            <div className="docpage-signature-party">{sig.party}</div>
            <div className={`docpage-signature-status ${sig.signed && !halted ? 'is-signed' : 'is-pending'}`}>
              {sig.signed && !halted ? 'SIGNED' : 'AWAITING'}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function cursive(name: string) {
  // The SVG of a hand-signed name is overkill; the typeface itself carries
  // signature-feel via .docpage-signature-mark in CSS.
  return name;
}

/* ──────────────────────────────────────────────────────────────
   Invoice
   ────────────────────────────────────────────────────────────── */

function InvoicePage({
  extraction,
  doc,
}: {
  extraction: Extract<DocExtraction, { kind: 'invoice' }>;
  doc: ArchivedDocument;
}) {
  return (
    <>
      <div className="docpage-invoice-head">
        <div>
          <div className="docpage-eyebrow">INVOICE</div>
          <h1 className="docpage-title docpage-title-tight">{extraction.vendor}</h1>
          {extraction.poNumber && (
            <div className="docpage-meta">PO {extraction.poNumber}</div>
          )}
        </div>
        <div className="docpage-invoice-amount">
          <div className="docpage-eyebrow">Amount due</div>
          <div className="docpage-amount-value">{extraction.amount}</div>
          <div className="docpage-meta">Due {extraction.due}</div>
          <div className={`docpage-status-tag is-${extraction.status}`}>
            {extraction.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="docpage-rule" />

      <table className="docpage-line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th className="docpage-amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {extraction.lineItems.map(item => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td className="docpage-amount-col">{item.amount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th className="docpage-amount-col">{extraction.amount}</th>
          </tr>
        </tfoot>
      </table>

      <div className="docpage-meta docpage-meta-quiet">
        Filed {doc.filedAt}
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Projections
   ────────────────────────────────────────────────────────────── */

function ProjectionsPage({
  extraction,
  doc,
}: {
  extraction: Extract<DocExtraction, { kind: 'projections' }>;
  doc: ArchivedDocument;
}) {
  return (
    <>
      <div className="docpage-eyebrow">{extraction.period} · FINANCIAL PROJECTIONS</div>
      <h1 className="docpage-title">{extraction.headline}</h1>
      <div className="docpage-meta">
        Prepared by {extraction.preparedBy}
        <span className="docpage-meta-sep">·</span>
        Approved {doc.filedAt}
      </div>

      <div className="docpage-rule" />

      <div className="docpage-metric-grid">
        {extraction.metrics.map(m => (
          <div key={m.label} className="docpage-metric">
            <div className="docpage-metric-label">{m.label}</div>
            <div className="docpage-metric-value">{m.value}</div>
            {m.delta && <div className="docpage-metric-delta">{m.delta}</div>}
          </div>
        ))}
      </div>

      <h3 className="docpage-section-heading">Narrative</h3>
      <p className="docpage-prose">{extraction.narrative}</p>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Report
   ────────────────────────────────────────────────────────────── */

function ReportPage({
  extraction,
}: {
  extraction: Extract<DocExtraction, { kind: 'report' }>;
}) {
  return (
    <>
      <div className="docpage-eyebrow">RESEARCH REPORT</div>
      <h1 className="docpage-title">{extraction.title}</h1>
      <div className="docpage-meta">
        {extraction.author}
        <span className="docpage-meta-sep">·</span>
        Published {extraction.published}
      </div>

      <div className="docpage-rule" />

      <h3 className="docpage-section-heading">Abstract</h3>
      <p className="docpage-prose docpage-prose-lead">{extraction.abstract}</p>

      <h3 className="docpage-section-heading">Key findings</h3>
      <ol className="docpage-findings">
        {extraction.findings.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ol>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   MOU
   ────────────────────────────────────────────────────────────── */

function MouPage({
  extraction,
}: {
  extraction: Extract<DocExtraction, { kind: 'mou' }>;
}) {
  const [partyA, partyB] = extraction.parties;
  return (
    <>
      <div className="docpage-eyebrow">MEMORANDUM OF UNDERSTANDING</div>
      <h1 className="docpage-title">
        Between {partyA} and {partyB}
      </h1>
      <div className="docpage-meta">Effective {extraction.effective}</div>

      <div className="docpage-rule" />

      <h3 className="docpage-section-heading">Purpose</h3>
      <p className="docpage-prose">{extraction.purpose}</p>

      <h3 className="docpage-section-heading">Commitments</h3>
      {extraction.commitments.map(c => (
        <div key={c.party} className="docpage-commitment">
          <div className="docpage-commitment-party">{c.party}</div>
          <p className="docpage-prose">{c.commitment}</p>
        </div>
      ))}

      <h3 className="docpage-section-heading">Termination</h3>
      <p className="docpage-prose">{extraction.termination}</p>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Compliance
   ────────────────────────────────────────────────────────────── */

const VERDICT_LABEL: Record<
  Extract<DocExtraction, { kind: 'compliance' }>['verdict'],
  string
> = {
  pass: 'Pass',
  'pass-with-conditions': 'Pass with conditions',
  fail: 'Fail',
};

function CompliancePage({
  extraction,
}: {
  extraction: Extract<DocExtraction, { kind: 'compliance' }>;
}) {
  return (
    <>
      <div className="docpage-eyebrow">{extraction.framework} · AUDIT REPORT</div>
      <h1 className="docpage-title docpage-title-tight">
        {extraction.period}
      </h1>
      <div className="docpage-meta">Auditor {extraction.auditor}</div>

      <div className={`docpage-verdict is-${extraction.verdict}`}>
        <span className="docpage-verdict-label">Verdict</span>
        <span className="docpage-verdict-value">{VERDICT_LABEL[extraction.verdict]}</span>
      </div>

      <h3 className="docpage-section-heading">Summary</h3>
      <p className="docpage-prose">{extraction.summary}</p>

      <h3 className="docpage-section-heading">Findings</h3>
      <ul className="docpage-finding-list">
        {extraction.findings.map((f, i) => (
          <li key={i} data-severity={f.severity}>
            <span className="docpage-finding-sev">{f.severity.toUpperCase()}</span>
            <div>
              <div className="docpage-finding-area">{f.area}</div>
              <div className="docpage-finding-note">{f.note}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
