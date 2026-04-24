import { motion, AnimatePresence } from 'framer-motion';
import type { DocumentItem } from '../types';

export type StationId = 'intake' | 'extract' | 'classify' | 'route';

export interface StationState {
  id: StationId;
  label: string;
  docsHere: DocumentItem[];
  halted: boolean;
}

export interface RouteCompletion {
  id: string;
  docId: string;
  docName: string;
  compartmentName: string;
  durationMs: number;
  createdAt: number;
}

interface PipelineTrackProps {
  stations: StationState[];
  haltedStationId: StationId | null;
  completions: RouteCompletion[];
}

const STATE_COLORS = {
  idle:   { dot: 'rgba(255,255,255,0.2)', glow: 'transparent', label: '#71717a' },
  active: { dot: '#3b82f6',                glow: 'rgba(59,130,246,0.4)', label: '#93c5fd' },
  halted: { dot: '#f59e0b',                glow: 'rgba(245,158,11,0.5)', label: '#fbbf24' },
  done:   { dot: '#34d399',                glow: 'rgba(52,211,153,0.3)', label: '#86efac' },
};

function stationStateKind(s: StationState, hasRecentCompletion: boolean): keyof typeof STATE_COLORS {
  if (s.halted) return 'halted';
  if (s.docsHere.length === 0) {
    // Briefly flash Route green when a doc just filed.
    if (s.id === 'route' && hasRecentCompletion) return 'done';
    return 'idle';
  }
  if (s.id === 'route') return 'done';
  return 'active';
}

export function PipelineTrack({ stations, haltedStationId, completions }: PipelineTrackProps) {
  const hasRecentCompletion = completions.length > 0;

  return (
    <div className="pipeline-track">
      {stations.map((station, i) => {
        const kind = stationStateKind(station, hasRecentCompletion);
        const color = STATE_COLORS[kind];
        const isLast = i === stations.length - 1;
        const connectorHalted = haltedStationId && station.id === haltedStationId;
        const isRouteBloomAnchor = station.id === 'route';

        return (
          <div key={station.id} className="pipeline-segment">
            {/* Station marker */}
            <div className="pipeline-station" data-halted-station={station.id === haltedStationId || undefined}>
              {/* Success bloom: floats below Route dot on completion (pure CSS lifecycle). */}
              {isRouteBloomAnchor && (
                <div className="pipeline-bloom-layer">
                  {completions.slice(-2).map(c => (
                    <div key={c.id} className="pipeline-bloom">
                      <span className="pipeline-bloom-check">✓</span>
                      <span className="pipeline-bloom-name">
                        {c.docName.length > 18 ? c.docName.slice(0, 16) + '…' : c.docName}
                      </span>
                      <span className="pipeline-bloom-arrow">→</span>
                      <span className="pipeline-bloom-dest">{c.compartmentName}</span>
                      <span className="pipeline-bloom-dur">· {(c.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              )}

              <motion.div
                className="pipeline-dot"
                style={{
                  background: color.dot,
                  boxShadow: color.glow !== 'transparent' ? `0 0 12px 2px ${color.glow}` : 'none',
                }}
                animate={kind === 'active' || kind === 'halted' ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: kind === 'halted' ? 1.6 : 1.2, ease: 'easeInOut' }}
              />
              <div className="pipeline-station-labels">
                <span className="pipeline-station-label" style={{ color: color.label }}>
                  {station.label}
                </span>
                {/* Only show subtext when there's a real signal (halted or in flight).
                    Empty '—' on idle stations was pure visual noise. */}
                {(station.halted || station.docsHere.length > 0) && (
                  <span className="pipeline-station-count">
                    {station.halted
                      ? `${station.docsHere.length} HALTED`
                      : `${station.docsHere.length} IN FLIGHT`}
                  </span>
                )}
              </div>

              {/* In-flight chips — layoutId lets them slide between stations */}
              {station.docsHere.length > 0 && !station.halted && (
                <div className="pipeline-chips">
                  <AnimatePresence>
                    {station.docsHere.slice(0, 3).map(d => (
                      <motion.span
                        key={d.id}
                        layoutId={`chip-${d.id}`}
                        initial={{ opacity: 0, y: -6, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                        className="pipeline-chip"
                      >
                        {d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Connector to next station */}
            {!isLast && (
              <div className={`pipeline-connector ${connectorHalted ? 'is-halted' : ''} ${kind === 'active' ? 'is-active' : ''}`}>
                <span className="pipeline-connector-line" />
                {kind === 'active' && (
                  <motion.span
                    className="pipeline-connector-pulse"
                    animate={{ x: ['0%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
