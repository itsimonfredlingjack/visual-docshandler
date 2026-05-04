import type { ReactNode } from 'react';
import { Paperclip, FileText, FileSpreadsheet, ScrollText, Handshake, ShieldCheck, Receipt } from 'lucide-react';
import type { ArchivedDocument, DocExtraction } from '../types';

const TYPE_META: Record<ArchivedDocument['docType'], { label: string; Icon: typeof FileText; accent: string }> = {
  nda:         { label: 'NDA',           Icon: ScrollText,       accent: '#93c5fd' },
  invoice:     { label: 'INVOICE',       Icon: Receipt,          accent: '#fbbf24' },
  report:      { label: 'REPORT',        Icon: FileText,         accent: '#d4d4d8' },
  projections: { label: 'PROJECTIONS',   Icon: FileSpreadsheet,  accent: '#86efac' },
  mou:         { label: 'MOU',           Icon: Handshake,        accent: '#c4b5fd' },
  compliance:  { label: 'COMPLIANCE',    Icon: ShieldCheck,      accent: '#6ee7b7' },
};

interface SpecimenCardProps {
  doc: ArchivedDocument;
  compact?: boolean;
}

type QuickFact = {
  label: string;
  value: string;
};

function quickFacts(extraction: DocExtraction): QuickFact[] {
  switch (extraction.kind) {
    case 'nda': {
      const signedCount = extraction.signatories.filter(s => s.signed).length;
      return [
        { label: 'Parties', value: extraction.parties.slice(0, 2).join(' · ') },
        { label: 'Term', value: extraction.term },
        { label: 'Signatures', value: `${signedCount}/${extraction.signatories.length} signed` },
      ];
    }
    case 'invoice':
      return [
        { label: 'Vendor', value: extraction.vendor },
        { label: 'Amount', value: extraction.amount },
        { label: 'Due', value: extraction.due },
      ];
    case 'projections': {
      const leadMetric = extraction.metrics[0];
      return [
        { label: 'Period', value: extraction.period },
        { label: 'Prepared by', value: extraction.preparedBy },
        { label: leadMetric?.label ?? 'Metric', value: leadMetric?.value ?? 'n/a' },
      ];
    }
    case 'report':
      return [
        { label: 'Author', value: extraction.author },
        { label: 'Published', value: extraction.published },
        { label: 'Findings', value: `${extraction.findings.length}` },
      ];
    case 'mou':
      return [
        { label: 'Parties', value: extraction.parties.slice(0, 2).join(' · ') },
        { label: 'Effective', value: extraction.effective },
        { label: 'Commitments', value: `${extraction.commitments.length}` },
      ];
    case 'compliance': {
      const highCount = extraction.findings.filter(f => f.severity === 'high').length;
      return [
        { label: 'Framework', value: extraction.framework },
        { label: 'Period', value: extraction.period },
        { label: 'High findings', value: `${highCount}` },
      ];
    }
  }
}

export function SpecimenCard({ doc, compact = false }: SpecimenCardProps) {
  const meta = TYPE_META[doc.docType];
  const Icon = meta.Icon;
  const quick = quickFacts(doc.extraction);

  return (
    <div className="specimen-card">
      <div className="specimen-card-header">
        <div className="specimen-card-type" style={{ color: meta.accent, borderColor: `${meta.accent}44` }}>
          <Icon size={12} />
          <span>{meta.label}</span>
        </div>
        <h3 className="specimen-card-name">{doc.name}</h3>
        <p className="specimen-card-summary">{doc.summary}</p>
      </div>

      {compact ? (
        <div className="specimen-card-body specimen-card-body-compact">
          <div className="spec-quick-facts">
            {quick.map((item) => (
              <div key={item.label} className="spec-quick-fact">
                <span className="spec-quick-label">{item.label}</span>
                <span className="spec-quick-value">{item.value}</span>
              </div>
            ))}
          </div>
          <details className="specimen-details">
            <summary>Show extracted fields</summary>
            <div className="specimen-details-body">
              <ExtractionBody extraction={doc.extraction} />
            </div>
          </details>
        </div>
      ) : (
        <div className="specimen-card-body">
          <ExtractionBody extraction={doc.extraction} />
        </div>
      )}

      <div className="specimen-card-source">
        <Paperclip size={11} color="#71717a" />
        <span className="specimen-card-source-name">{doc.name}</span>
        <span className="specimen-card-source-meta">
          {doc.fileSize} · {doc.source} · filed {doc.filedAt}
        </span>
        <button
          className="specimen-card-source-open focus-ring"
          title="Original attached — not rendered in prototype"
          aria-label="View original attachment"
          type="button"
          onClick={(e) => e.stopPropagation()}
        >
          view original →
        </button>
      </div>
    </div>
  );
}

function ExtractionBody({ extraction }: { extraction: DocExtraction }) {
  switch (extraction.kind) {
    case 'nda':
      return (
        <div className="spec-grid">
          <Field label="Parties"        value={extraction.parties.join(' · ')} />
          <Field label="Effective"      value={extraction.effective} />
          <Field label="Term"           value={extraction.term} />
          <Field label="Governing Law"  value={extraction.governingLaw} />
          <div className="spec-full">
            <FieldLabel>Signatories</FieldLabel>
            <ul className="spec-list">
              {extraction.signatories.map(s => (
                <li key={s.name}>
                  <span className="spec-sig-dot" data-signed={s.signed || undefined} />
                  <span className="spec-sig-name">{s.name}</span>
                  <span className="spec-sig-party">· {s.party}</span>
                  <span className="spec-sig-status">{s.signed ? 'SIGNED' : 'PENDING'}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="spec-full">
            <FieldLabel>Key Clauses</FieldLabel>
            <ul className="spec-kv-list">
              {extraction.keyClauses.map(c => (
                <li key={c.label}><span className="spec-kv-label">{c.label}</span><span className="spec-kv-value">{c.value}</span></li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'invoice':
      return (
        <div className="spec-grid">
          <Field label="Vendor"  value={extraction.vendor} />
          <Field label="Amount"  value={extraction.amount} emphasis />
          <Field label="Due"     value={extraction.due} />
          <Field label="Status"  value={extraction.status.toUpperCase()} status={extraction.status} />
          {extraction.poNumber && <Field label="PO #" value={extraction.poNumber} />}
          <div className="spec-full">
            <FieldLabel>Line Items</FieldLabel>
            <ul className="spec-kv-list">
              {extraction.lineItems.map(li => (
                <li key={li.label}><span className="spec-kv-label">{li.label}</span><span className="spec-kv-value">{li.amount}</span></li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'projections':
      return (
        <div className="spec-grid">
          <Field label="Period"       value={extraction.period} />
          <Field label="Prepared by"  value={extraction.preparedBy} />
          <div className="spec-full">
            <FieldLabel>Headline</FieldLabel>
            <p className="spec-prose">{extraction.headline}</p>
          </div>
          <div className="spec-full">
            <FieldLabel>Metrics</FieldLabel>
            <div className="spec-metric-row">
              {extraction.metrics.map(m => (
                <div key={m.label} className="spec-metric">
                  <div className="spec-metric-label">{m.label}</div>
                  <div className="spec-metric-value">{m.value}</div>
                  {m.delta && <div className="spec-metric-delta">{m.delta}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="spec-full">
            <FieldLabel>Narrative</FieldLabel>
            <p className="spec-prose">{extraction.narrative}</p>
          </div>
        </div>
      );

    case 'report':
      return (
        <div className="spec-grid">
          <Field label="Title"      value={extraction.title} />
          <Field label="Author"     value={extraction.author} />
          <Field label="Published"  value={extraction.published} />
          <div className="spec-full">
            <FieldLabel>Abstract</FieldLabel>
            <p className="spec-prose">{extraction.abstract}</p>
          </div>
          <div className="spec-full">
            <FieldLabel>Findings</FieldLabel>
            <ul className="spec-bullets">
              {extraction.findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>
      );

    case 'mou':
      return (
        <div className="spec-grid">
          <Field label="Parties"    value={extraction.parties.join(' · ')} />
          <Field label="Effective"  value={extraction.effective} />
          <div className="spec-full">
            <FieldLabel>Purpose</FieldLabel>
            <p className="spec-prose">{extraction.purpose}</p>
          </div>
          <div className="spec-full">
            <FieldLabel>Commitments</FieldLabel>
            <ul className="spec-kv-list">
              {extraction.commitments.map(c => (
                <li key={c.party}><span className="spec-kv-label">{c.party}</span><span className="spec-kv-value">{c.commitment}</span></li>
              ))}
            </ul>
          </div>
          <div className="spec-full">
            <FieldLabel>Termination</FieldLabel>
            <p className="spec-prose">{extraction.termination}</p>
          </div>
        </div>
      );

    case 'compliance':
      return (
        <div className="spec-grid">
          <Field label="Framework"  value={extraction.framework} />
          <Field label="Period"     value={extraction.period} />
          <Field label="Auditor"    value={extraction.auditor} />
          <Field label="Verdict"    value={extraction.verdict.replace(/-/g, ' ').toUpperCase()} verdict={extraction.verdict} />
          <div className="spec-full">
            <FieldLabel>Summary</FieldLabel>
            <p className="spec-prose">{extraction.summary}</p>
          </div>
          <div className="spec-full">
            <FieldLabel>Findings</FieldLabel>
            <ul className="spec-findings">
              {extraction.findings.map((f, i) => (
                <li key={i} data-severity={f.severity}>
                  <span className="spec-finding-sev">{f.severity.toUpperCase()}</span>
                  <span className="spec-finding-area">{f.area}</span>
                  <span className="spec-finding-note">{f.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
  }
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="spec-field-label util-microtype">{children}</div>;
}

function Field({ label, value, emphasis, status, verdict }: {
  label: string;
  value: string;
  emphasis?: boolean;
  status?: 'paid' | 'outstanding' | 'overdue';
  verdict?: 'pass' | 'pass-with-conditions' | 'fail';
}) {
  return (
    <div className="spec-field">
      <FieldLabel>{label}</FieldLabel>
      <div
        className="spec-field-value"
        data-emphasis={emphasis || undefined}
        data-status={status || undefined}
        data-verdict={verdict || undefined}
      >
        {value}
      </div>
    </div>
  );
}
