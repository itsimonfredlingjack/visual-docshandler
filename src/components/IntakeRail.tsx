import { ArrowRight, FolderOpen, Activity, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DocumentItem } from '../types';

interface Compartment {
  id: string;
  name: string;
}

interface IntakeRailProps {
  onIntake: (scenario: 'perfect' | 'uncertain') => void;
  haltedCount: number;
  recentDocs: DocumentItem[];
  selectedDocId: string | null;
  compartments: Compartment[];
  filedCounts: Record<string, number>;
  reviewOpen: boolean;
  onSelectDoc: (id: string) => void;
  flashDest: { name: string; key: number } | null;
}

export function IntakeRail({ onIntake, haltedCount, recentDocs, selectedDocId, compartments, filedCounts, reviewOpen, onSelectDoc, flashDest }: IntakeRailProps) {
  const displayDocs = [...recentDocs].reverse().slice(0, 5);
  const totalFiled = Object.values(filedCounts).reduce((a, b) => a + b, 0);
  const totalProcessed = recentDocs.length;

  return (
    <aside className="intake-rail">

      {/* ── Zone 1: Header + Actions ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="rail-section">Intake</span>
          {haltedCount > 0 && (
            <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, fontFamily: 'Geist, sans-serif' }}>
              {haltedCount} halted
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          <button
            onClick={() => onIntake('perfect')}
            className="w-full flex items-center justify-between group transition-all duration-150 focus-ring"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} color="#a1a1aa" strokeWidth={2.5} />
              <span style={{ fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Ingest Document</span>
            </span>
            <ArrowRight size={14} color="#a1a1aa" />
          </button>
        </div>

        {/* Dev sim row — visually demoted */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 22,
          paddingLeft: 2,
        }}>
          <span style={{
            fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
            color: '#8a8a93', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 4, padding: '1px 5px',
          }}>DEV</span>
          <button
            onClick={() => onIntake('uncertain')}
            className="focus-ring"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 0',
              fontSize: 11,
              color: '#8a8a93',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            simulate halt scenario
          </button>
        </div>
      </div>

      {/* ── Zone 2: Recent Documents (scrollable) ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="rail-section" style={{ marginBottom: 10, flexShrink: 0 }}>Recent</div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: '4px 10px',
          }}
        >
          {displayDocs.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', padding: '10px 2px', fontFamily: 'Geist, sans-serif' }}>
              No documents yet.
            </div>
          ) : (
            displayDocs.map((doc, i) => {
              const statusLabel = doc.status === 'filed' ? 'Filed' : doc.status === 'uncertain' ? 'Halted' : doc.status === 'routing' ? 'Routing' : 'Processing';
              const isSelected = doc.id === selectedDocId;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="intake-log-row"
                  onClick={() => doc.status === 'uncertain' && onSelectDoc(doc.id)}
                  role={doc.status === 'uncertain' ? 'button' : undefined}
                  tabIndex={doc.status === 'uncertain' ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (doc.status === 'uncertain' && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectDoc(doc.id);
                    }
                  }}
                  style={{
                    borderLeft: isSelected ? '2px solid #fbbf24' : '2px solid transparent',
                    paddingLeft: 10,
                    background: isSelected ? 'rgba(245,158,11,0.04)' : undefined,
                    borderRadius: isSelected ? 4 : 0,
                    cursor: doc.status === 'uncertain' ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{
                      fontSize: 11,
                      color: isSelected ? '#e4e4e7' : '#a1a1aa',
                      fontWeight: isSelected ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 150,
                      display: 'block',
                    }}>
                      {doc.name}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist, sans-serif' }}>
                      {doc.source}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    color: doc.status === 'uncertain' ? '#fbbf24' : 'var(--text-tertiary)',
                    flexShrink: 0,
                    fontWeight: doc.status === 'uncertain' ? 600 : 500,
                    fontFamily: 'Geist, sans-serif',
                  }}>
                    {statusLabel}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Zone 3: Destinations (pinned bottom) ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 16,
        marginTop: 16,
      }}>
        <div className="rail-section" style={{ marginBottom: 10 }}>Destinations</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {compartments.map(comp => {
            const count = filedCounts[comp.name] ?? 0;
            const isFlashing = flashDest?.name === comp.name;
            const flashSuffix = isFlashing ? `-flash-${flashDest.key}` : '';
            const baseClass = reviewOpen ? 'dest-row dest-row-thread' : 'dest-row';
            return (
              <div
                key={`${comp.id}${flashSuffix}`}
                className={`${baseClass}${isFlashing ? ' dest-row-flash' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <FolderOpen size={13} color={reviewOpen ? '#d4d4d8' : '#a1a1aa'} />
                  <span style={{
                    fontSize: 12,
                    color: reviewOpen ? '#f4f4f5' : '#d4d4d8',
                    fontWeight: 500,
                    transition: 'color 0.3s',
                  }}>{comp.name}</span>
                </div>
                <span
                  key={`count-${comp.id}-${count}`}
                  className={count > 0 ? 'dest-count-bounce' : undefined}
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'monospace',
                    color: reviewOpen ? '#d4d4d8' : 'var(--text-tertiary)',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    padding: '2px 7px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'color 0.3s',
                    display: 'inline-block',
                  }}
                >
                  {count.toString().padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* System status strip */}
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Activity size={11} color="#8a8a93" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Geist, sans-serif' }}>
              {totalProcessed} processed · {totalFiled} filed
            </span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
              v0.1.0
            </span>
          </div>
        </div>
      </div>

    </aside>
  );
}
