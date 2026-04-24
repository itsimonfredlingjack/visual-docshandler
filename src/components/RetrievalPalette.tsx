import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import type { ArchivedDocument } from '../types';
import { ARCHIVE, matchArchive, recentArchive } from '../data/archiveFixtures';
import { SpecimenCard } from './SpecimenCard';

interface RetrievalPaletteProps {
  isOpen: boolean;
  initialQuery?: string | null;
  onClose: () => void;
  onSelect: (doc: ArchivedDocument, rect: DOMRect | null) => void;
}

const SUGGESTIONS = ['acme nda', 'q4 projections', 'invoices this month'];

export function RetrievalPalette({ isOpen, initialQuery, onClose, onSelect }: RetrievalPaletteProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? matchArchive(query, ARCHIVE)
    : recentArchive(4, ARCHIVE);

  const hasQuery = query.trim().length > 0;
  const safeSelectedIdx = Math.min(selectedIdx, Math.max(0, results.length - 1));
  const selected = results[safeSelectedIdx] ?? null;

  const openSelected = useCallback(() => {
    if (!selected) return;
    const rect = cardRef.current?.getBoundingClientRect() ?? null;
    onSelect(selected, rect);
  }, [onSelect, selected]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        openSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, openSelected, results.length, selected]);

  if (!isOpen) return null;

  return (
    <div
      className="retrieval-backdrop is-open"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="retrieval-palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
            <div className="retrieval-header">
              <Search size={15} color="#71717a" />
              <input
                ref={inputRef}
                className="retrieval-input"
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                placeholder="Retrieve a document or ask a question…"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="retrieval-kbd">ESC</span>
            </div>

            <div className="retrieval-body">
              <div className="retrieval-list-col">
                {!hasQuery && (
                  <>
                    <div className="retrieval-section-label util-microtype">RECENT</div>
                    <ResultList
                      results={results}
                      selectedIdx={safeSelectedIdx}
                      onHover={setSelectedIdx}
                      onChoose={(doc, i) => {
                        setSelectedIdx(i);
                        const rect = cardRef.current?.getBoundingClientRect() ?? null;
                        onSelect(doc, rect);
                      }}
                    />
                    <div className="retrieval-section-label util-microtype" style={{ marginTop: 14 }}>TRY ASKING</div>
                    <div className="retrieval-suggestions">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          type="button"
                          className="retrieval-suggestion"
                          onClick={() => { setQuery(s); setSelectedIdx(0); inputRef.current?.focus(); }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {hasQuery && results.length > 0 && (
                  <>
                    <div className="retrieval-section-label util-microtype">
                      {results.length} RESULT{results.length === 1 ? '' : 'S'}
                    </div>
                    <ResultList
                      results={results}
                      selectedIdx={safeSelectedIdx}
                      onHover={setSelectedIdx}
                      onChoose={(doc, i) => {
                        setSelectedIdx(i);
                        const rect = cardRef.current?.getBoundingClientRect() ?? null;
                        onSelect(doc, rect);
                      }}
                    />
                  </>
                )}
                {hasQuery && results.length === 0 && (
                  <div className="retrieval-empty">
                    <div className="util-microtype" style={{ color: '#52525b', marginBottom: 8 }}>NO MATCH</div>
                    <div style={{ color: '#a1a1aa', fontSize: 13 }}>Nothing in the archive matches “{query}”.</div>
                  </div>
                )}
              </div>

              <div className="retrieval-card-col">
                {selected ? (
                  <div
                    ref={cardRef}
                    className="retrieval-card-frame"
                  >
                    <span className="obs-bracket tl" />
                    <span className="obs-bracket tr" />
                    <span className="obs-bracket bl" />
                    <span className="obs-bracket br" />
                    <div className="retrieval-preview-toolbar">
                      <div>
                        <div className="retrieval-preview-kicker">Content preview</div>
                        <div className="retrieval-preview-title">{selected.compartment}</div>
                      </div>
                      <button
                        type="button"
                        className="retrieval-open-stage focus-ring"
                        onClick={openSelected}
                      >
                        Open in stage
                        <CornerDownLeft size={12} />
                      </button>
                    </div>
                    <SpecimenCard doc={selected} />
                  </div>
                ) : (
                  <div className="retrieval-card-empty">
                    <div className="util-microtype" style={{ color: '#52525b' }}>NO SELECTION</div>
                  </div>
                )}
              </div>
            </div>

            <div className="retrieval-footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd><CornerDownLeft size={9} /></kbd> open</span>
              <span><kbd>ESC</kbd> close</span>
            </div>
      </div>
    </div>
  );
}

function ResultList({ results, selectedIdx, onHover, onChoose }: {
  results: ArchivedDocument[];
  selectedIdx: number;
  onHover: (i: number) => void;
  onChoose: (doc: ArchivedDocument, i: number) => void;
}) {
  return (
    <ul className="retrieval-list">
      {results.map((r, i) => (
        <li key={r.id}>
          <button
            type="button"
            className={`retrieval-list-row focus-ring${i === selectedIdx ? ' is-selected' : ''}`}
            onMouseEnter={() => onHover(i)}
            onFocus={() => onHover(i)}
            onClick={() => onChoose(r, i)}
          >
            <span className="retrieval-list-row-name">{r.name}</span>
            <span className="retrieval-list-row-summary">{r.summary}</span>
            <span className="retrieval-list-row-meta">{r.compartment} · {r.docType}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
