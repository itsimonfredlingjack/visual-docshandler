import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { DocumentItem } from '../types';

interface DocumentSlabProps {
  doc: DocumentItem;
  onClick?: () => void;
  isRouting?: boolean;
  isReviewing?: boolean;
}

// Which halt-causing tags get red treatment instead of amber
const HALT_TAGS = ['signature missing', 'unsigned', 'unknown format', 'grounding failure'];

function isHaltTag(tag: string) {
  return HALT_TAGS.some(h => tag.toLowerCase().includes(h.toLowerCase()));
}

// Severity color palette
const SEVERITY = {
  critical: { text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  warning:  { text: 'rgba(251,191,36,0.75)', bg: 'rgba(251,191,36,0.05)', border: 'rgba(251,191,36,0.15)' },
};

// Provide a human-readable source provenance string
function formatProvenance(doc: DocumentItem) {
  const timeStr = doc.receivedAt || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const shortTime = timeStr.split(':').slice(0, 2).join(':');
  return `${doc.source} · Received ${shortTime}`;
}

export function DocumentSlab({ doc, onClick, isRouting, isReviewing }: DocumentSlabProps) {
  const isHalted   = doc.status === 'uncertain';
  const isAnalyzing = doc.status === 'analyzing';
  const isDropped  = doc.status === 'dropped';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  // Processing trail nodes
  const trail = [
    { label: 'Received', done: true,  error: false },
    { label: 'Extracted', done: !isDropped && !isAnalyzing, error: false },
    { label: 'Routing', done: false, error: isHalted },
  ];

  return (
    <motion.div
      layout
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${doc.name} — ${isHalted ? 'Halted, requires review' : isAnalyzing ? 'Extracting' : isRouting ? 'Routing' : doc.status}`}
      className={`material-slab relative cursor-pointer select-none focus-ring ${isHalted ? 'is-halted' : ''}`}
      style={{ width: 520, padding: '18px 22px', transition: 'background 0.15s', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      whileHover={{ background: isHalted ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.04)' }}
      initial={{ opacity: 0, scale: 0.93, y: -24, rotateX: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      {/* Scanning wash — active during extraction */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="scan"
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ borderRadius: 12, zIndex: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-x-0"
              style={{
                height: 120,
                background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.02) 60%, rgba(59,130,246,0.1) 95%, rgba(59,130,246,0.3) 100%)',
                borderBottom: '1px solid rgba(59,130,246,0.6)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.15)',
              }}
              animate={{ top: ['-120px', '120%'] }}
              transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content z-layer above scan */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Provenance line ── */}
        <div className="util-microtype" style={{ marginBottom: 10 }}>
          {formatProvenance(doc)} &nbsp;·&nbsp; {doc.id.toUpperCase()}
        </div>

        {/* ── Header row: name + status badge ── */}
        <div className="flex items-start justify-between" style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <div style={{
              padding: 8,
              borderRadius: 8,
              background: isHalted ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
              color: isHalted ? '#fbbf24' : 'rgba(255,255,255,0.3)',
              flexShrink: 0,
            }}>
              <FileText size={20} />
            </div>
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div className="text-white font-semibold leading-tight" style={{ fontSize: 18, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>
                {doc.name}
              </div>
              {/* Calm metadata line replacing the old three-pill grid */}
              <div className="slab-meta-row">
                <span className="val">{doc.source}</span>
                <span className="sep">·</span>
                <span className="val">{doc.type}</span>
                <span className="sep">·</span>
                <span style={{ color: isHalted ? '#fbbf24' : 'var(--text-secondary)' }}>
                  {isHalted ? 'Legal contract' : isAnalyzing ? 'Classifying…' : 'Document'}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge + review affordance */}
          {isHalted && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="halt-badge-pulse flex items-center gap-1.5"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                  color: '#fbbf24',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 6,
                  padding: '5px 10px',
                }}
              >
                <AlertCircle size={13} />
                HALTED
              </div>
              {!isReviewing && (
                <span style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  color: '#a1a1aa',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5,
                  padding: '4px 8px',
                }}>
                  REVIEW →
                </span>
              )}
            </div>
          )}

          {isAnalyzing && (
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: '#60a5fa',
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                borderRadius: 6,
                padding: '5px 10px',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(96,165,250,0.3)', borderTopColor: '#60a5fa' }}
              />
              Extracting
            </div>
          )}

          {isRouting && (
            <div className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                color: '#34d399',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: 6, padding: '5px 10px',
              }}
            >
              <CheckCircle size={13} />
              Routing
            </div>
          )}
        </div>

        {/* ── Entity tags ── */}
        {doc.extractedTags && doc.extractedTags.length > 0 && (
          <div style={{ paddingTop: 2, marginBottom: 12 }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              fontFamily: 'Geist, sans-serif',
              fontWeight: 500,
              marginBottom: 8,
            }}>
              Extracted entities
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {doc.extractedTags.map((tag, i) => {
                const isError = isHalted && isHaltTag(tag);
                return (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.25 }}
                    style={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      padding: '4px 10px',
                      borderRadius: 5,
                      fontWeight: 500,
                      color: isError ? SEVERITY.critical.text : SEVERITY.warning.text,
                      background: isError ? SEVERITY.critical.bg : SEVERITY.warning.bg,
                      border: `1px solid ${isError ? SEVERITY.critical.border : SEVERITY.warning.border}`,
                    }}
                  >
                    {tag}
                  </motion.span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Processing trail ── */}
        <div className="process-trail" style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {trail.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`process-trail-step ${step.done && !step.error ? 'done' : ''} ${step.error ? 'error' : ''}`}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                  background: step.error ? '#f59e0b' : step.done ? '#71717a' : '#27272a',
                  boxShadow: step.error ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                }} />
                {step.error ? `✗ ${step.label} Blocked` : step.label}
              </div>
              {i < trail.length - 1 && (
                <div className={`process-trail-connector ${trail[i+1].error ? 'error' : ''}`} />
              )}
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
