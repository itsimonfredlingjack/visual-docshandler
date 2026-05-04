import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { DocumentItem } from '../types';

interface DocumentSlabProps {
  doc: DocumentItem;
  onClick?: () => void;
  isRouting?: boolean;
  isReviewing?: boolean;
}

function shortTime(value?: string) {
  if (!value) return null;
  const parts = value.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
}

export function DocumentSlab({ doc, onClick, isRouting, isReviewing }: DocumentSlabProps) {
  const isHalted = doc.status === 'uncertain';
  const isAnalyzing = doc.status === 'analyzing';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const receivedLabel = shortTime(doc.receivedAt);
  const metaParts = [doc.source, doc.type, receivedLabel ? `Received ${receivedLabel}` : null].filter(Boolean);
  const visibleTags = (doc.extractedTags ?? []).slice(0, 2);

  return (
    <motion.div
      layout
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${doc.name} — ${isHalted ? 'Halted, requires review' : isAnalyzing ? 'Extracting' : isRouting ? 'Routing' : doc.status}`}
      className={`material-slab doc-slab focus-ring ${isHalted ? 'is-halted' : ''}`}
      initial={{ opacity: 0, scale: 0.93, y: -24, rotateX: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="scan"
            className="doc-slab-scan"
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="doc-slab-scan-bar"
              animate={{ top: ['-120px', '120%'] }}
              transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="doc-slab-content">
        <div className="doc-slab-head">
          <div className="doc-slab-main">
            <div className={`doc-slab-icon ${isHalted ? 'is-halted' : ''}`}>
              <FileText size={18} />
            </div>
            <div className="doc-slab-copy">
              <div className="doc-slab-name">
                {doc.name}
              </div>
              <div className="slab-meta-row doc-slab-meta">
                {metaParts.map((part, idx) => (
                  <span key={`${part}-${idx}`} className="val">
                    {idx > 0 && <span className="sep doc-slab-meta-sep">·</span>}
                    {part}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isHalted && (
            <div className="doc-slab-status-row">
              <div className="halt-badge-pulse doc-slab-halt-badge">
                <AlertCircle size={12} />
                HALTED
              </div>
              {!isReviewing && (
                <span className="doc-slab-review-badge">
                  REVIEW
                </span>
              )}
            </div>
          )}

          {isAnalyzing && (
            <div className="doc-slab-pill doc-slab-pill-analyzing">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="doc-slab-spinner"
              />
              Extracting
            </div>
          )}

          {isRouting && (
            <div className="doc-slab-pill doc-slab-pill-routing">
              <CheckCircle size={12} />
              Routing
            </div>
          )}
        </div>

        {isHalted && doc.explanation?.ruleApplied && (
          <div className="doc-slab-rule">
            {doc.explanation.ruleApplied}
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="doc-slab-tags">
            {visibleTags.map(tag => (
              <span key={tag} className="entity-chip is-neutral">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
