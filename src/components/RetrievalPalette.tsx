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

export function RetrievalPalette({ isOpen, initialQuery, onClose, onSelect }: RetrievalPaletteProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

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

  const handlePaletteKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isTextEntry = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab' && paletteRef.current) {
      const tabbables = Array.from(
        paletteRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(el => !el.hasAttribute('disabled'));

      if (tabbables.length === 0) return;
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && (isTextEntry || target.classList.contains('retrieval-list-row'))) {
      e.preventDefault();
      if (e.key === 'ArrowDown') {
        setSelectedIdx(i => Math.min(i + 1, results.length - 1));
      } else {
        setSelectedIdx(i => Math.max(i - 1, 0));
      }
      return;
    }

    if (e.key === 'Enter' && selected && (target === inputRef.current || target.classList.contains('retrieval-list-row'))) {
      e.preventDefault();
      openSelected();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="retrieval-backdrop is-open"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={paletteRef}
        className="retrieval-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retrieval-title"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handlePaletteKeyDown}
      >
            <div className="retrieval-header">
              <h2 id="retrieval-title" className="sr-only">Retrieval palette</h2>
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
                aria-label="Retrieve a document or ask a question"
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
                    <SpecimenCard doc={selected} compact />
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
