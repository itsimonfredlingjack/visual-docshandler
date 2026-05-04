import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layers, ArrowRight, Mail, ShieldAlert, Search, PlusCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DocumentItem, ArchivedDocument } from './types';
import { ChatView, type Message } from './components/ChatView';
import { DocumentPagePreview } from './components/DocumentPagePreview';
import { PipelineTrack, type StationId, type StationState, type RouteCompletion } from './components/PipelineTrack';
import { RetrievalPalette } from './components/RetrievalPalette';
import { ARCHIVE, findArchiveByName, previewFromLiveDoc } from './data/archiveFixtures';
import { getMockAnswer } from './data/mockAnswers';
import type { AnswerActionId } from './data/mockAnswers';

// ─── Static data ───────────────────────────────────────────────
const SEED_DOCS: DocumentItem[] = [
  {
    id: 'd1',
    name: 'Marketing_v4.pdf',
    type: 'PDF',
    source: 'Slack',
    status: 'filed',
    destination: 'Project Ledger',
    receivedAt: '13:58:00',
  },
  {
    id: 'd2',
    name: 'Unsigned_NDA_Acme.pdf',
    type: 'PDF',
    source: 'Email',
    status: 'uncertain',
    extractedTags: ['Legal', 'Signature Missing'],
    explanation: {
      confidence: 60,
      ruleApplied: 'No signature detected. Rule LEGAL_SIGNATURE_REQUIRED not satisfied.',
    },
    scenario: 'uncertain',
    receivedAt: '22:15:00',
    haltedAt: '22:15:24',
    evidence: {
      sender: 'legal@acme-corp.com',
      subject: 'Re: Mutual NDA — Draft v3 for countersignature',
      fileSize: '142 KB · 4 pages',
      preview: 'Attached please find the revised mutual NDA. Please review and return a counter-signed copy at your earliest convenience.',
      receivedIso: '2026-04-23 22:15:24',
    },
  },
];

function nowMs() {
  return Date.now();
}

function shortRandomId(length = 7) {
  return Math.random().toString(36).substring(2, 2 + length);
}

function currentTimeWithSeconds() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── App ───────────────────────────────────────────────────────
function App() {
  const [riverDocs, setRiverDocs] = useState<DocumentItem[]>(SEED_DOCS);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [isResolving, setIsResolving] = useState(false);
  const [resolveVerb, setResolveVerb] = useState<'request-sig' | 'mark-exception' | 'force-route' | null>(null);
  /** Archive doc currently displayed in the right workbench. Null = use the
      derived default (halted live doc → most-recent filed → nothing). */
  const [focusedArchiveId, setFocusedArchiveId] = useState<string | null>(null);

  // Success-moment state
  const [routeCompletions, setRouteCompletions] = useState<RouteCompletion[]>([]);
  const ingestStartRef = useRef<Map<string, number>>(new Map());

  // Retrieval palette
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteInitialQuery, setPaletteInitialQuery] = useState<string | null>(null);
  const [retrievedSpecimen, setRetrievedSpecimen] = useState<{ doc: ArchivedDocument; fromRect: DOMRect | null; openedAt: number } | null>(null);
  const paletteReturnFocusRef = useRef<HTMLElement | null>(null);

  // ── Derived state ──
  const activeDocs  = riverDocs.filter(d => d.status !== 'filed');
  const filedDocs   = riverDocs.filter(d => d.status === 'filed');
  const haltedDocs  = activeDocs.filter(d => d.status === 'uncertain');
  const haltedDoc   = haltedDocs[0] ?? null;
  const inFlightDoc = activeDocs.find(d => d.status === 'dropped' || d.status === 'analyzing' || d.status === 'routing') ?? null;
  const activeAnswer = [...messages].reverse().find(m => m.role === 'assistant' && m.result)?.result ?? null;

  const hasLiveProcessing = inFlightDoc !== null;
  const showTransportSignals = hasLiveProcessing;

  /**
   * What the right workbench shows. Priority:
   *   1. User-clicked source pill from chat → that archive doc.
   *   2. In-flight doc (synthesized preview, plays the pipeline animation).
   *   3. Halted doc (synthesized preview, halt overlay, resolve verbs below).
   *   4. Most recent filed doc, if any.
   *   5. Default: first archive entry, so the workbench is never blank.
   */
  const focusedDoc: { doc: ArchivedDocument; halt: DocumentItem | null; isLive: boolean } | null = useMemo(() => {
    if (focusedArchiveId) {
      const found = ARCHIVE.find(d => d.id === focusedArchiveId);
      if (found) return { doc: found, halt: null, isLive: false };
    }
    if (inFlightDoc) {
      return { doc: previewFromLiveDoc(inFlightDoc), halt: null, isLive: true };
    }
    if (haltedDoc) {
      return { doc: previewFromLiveDoc(haltedDoc), halt: haltedDoc, isLive: true };
    }
    const lastFiled = filedDocs[filedDocs.length - 1];
    if (lastFiled) {
      const archived = findArchiveByName(lastFiled.name);
      if (archived) return { doc: archived, halt: null, isLive: false };
    }
    return ARCHIVE[0] ? { doc: ARCHIVE[0], halt: null, isLive: false } : null;
  }, [focusedArchiveId, inFlightDoc, haltedDoc, filedDocs]);

  // ── Chat logic ──
  const handleSendMessage = (query: string) => {
    const userMsg: Message = {
      id: shortRandomId(),
      role: 'user',
      content: query,
      receivedAt: currentTimeWithSeconds(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const result = getMockAnswer(query, haltedDocs.length > 0);
      const assistantMsg: Message = {
        id: shortRandomId(),
        role: 'assistant',
        content: result.answer,
        result,
        receivedAt: currentTimeWithSeconds(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleAction = (id: AnswerActionId) => {
    if (id === 'add-documents') {
      handleIntake('perfect');
      return;
    }
    if (id === 'open-sources') {
      openPaletteWithQuery(activeAnswer?.query ?? null);
      return;
    }
  };

  /** Chat user clicked a source pill → focus that doc in the right workbench. */
  const handleSourceClick = useCallback((title: string) => {
    const found = findArchiveByName(title);
    if (found) setFocusedArchiveId(found.id);
  }, []);

  const openPaletteWithQuery = useCallback((q: string | null) => {
    const active = document.activeElement;
    paletteReturnFocusRef.current = active instanceof HTMLElement ? active : null;
    setPaletteInitialQuery(q);
    setIsPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsPaletteOpen(false);
    const returnTarget = paletteReturnFocusRef.current;
    paletteReturnFocusRef.current = null;
    if (returnTarget) {
      requestAnimationFrame(() => returnTarget.focus());
    }
  }, []);

  const markFiled = useCallback((docId: string, docName: string, destination: string) => {
    const startedAt = ingestStartRef.current.get(docId);
    const completedAt = nowMs();
    const durationMs = startedAt ? completedAt - startedAt : 0;
    ingestStartRef.current.delete(docId);

    const completionId = shortRandomId();
    setRouteCompletions(prev => [...prev, {
      id: completionId,
      docId,
      docName,
      compartmentName: destination,
      durationMs,
      createdAt: completedAt,
    }]);

    setTimeout(() => {
      setRouteCompletions(prev => prev.filter(c => c.id !== completionId));
    }, 3600);
  }, []);

  const handleIntake = (scenario: 'perfect' | 'uncertain') => {
    const isPerf = scenario === 'perfect';
    const nowStr = currentTimeWithSeconds();
    const newDoc: DocumentItem = {
      id: shortRandomId(),
      name: isPerf ? 'Q4_Projections_Approved.pdf' : 'Untitled_Scan_994.pdf',
      type: 'PDF',
      source: isPerf ? 'Local' : 'Email',
      status: 'dropped',
      scenario,
      receivedAt: nowStr,
    };

    setRetrievedSpecimen(null);
    setFocusedArchiveId(null);
    setRiverDocs(prev => [...prev, newDoc]);
    ingestStartRef.current.set(newDoc.id, nowMs());

    setTimeout(() => {
      setRiverDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'analyzing' } : d));

      setTimeout(() => {
        if (isPerf) {
          setRiverDocs(prev => prev.map(d => d.id === newDoc.id ? {
            ...d,
            status: 'routing',
            destination: 'Project Ledger',
            extractedTags: ['Financial', 'Q4', 'Approved'],
          } : d));
          setTimeout(() => {
            setRiverDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'filed' } : d));
            markFiled(newDoc.id, newDoc.name, 'Project Ledger');
          }, 1500);
        } else {
          setRiverDocs(prev => prev.map(d => d.id === newDoc.id ? {
            ...d,
            status: 'uncertain',
            haltedAt: currentTimeWithSeconds(),
            extractedTags: ['Unknown Format', 'Unsigned'],
            explanation: {
              confidence: 42,
              ruleApplied: 'Grounding failure. Rule LEGAL_SIGNATURE_REQUIRED not satisfied.',
            },
          } : d));
        }
      }, 2000);
    }, 1200);
  };

  const stationIdForStatus = (s: DocumentItem['status']): StationId => {
    if (s === 'dropped') return 'intake';
    if (s === 'analyzing') return 'extract';
    if (s === 'uncertain') return 'classify';
    if (s === 'classifying') return 'classify';
    if (s === 'routing') return 'route';
    return 'intake';
  };
  const stations: StationState[] = (
    [
      { id: 'intake',   label: 'Intake' },
      { id: 'extract',  label: 'Extract' },
      { id: 'classify', label: 'Classify' },
      { id: 'route',    label: 'Route' },
    ] as const
  ).map(s => {
    const docsHere = activeDocs.filter(d => stationIdForStatus(d.status) === s.id);
    const halted = docsHere.some(d => d.status === 'uncertain');
    return { ...s, docsHere, halted };
  });
  const haltedStation: StationId | null = haltedDocs.length > 0 ? 'classify' : null;

  const haltConfidence = haltedDoc?.explanation?.confidence ?? 0;
  const HALT_THRESHOLD = 85;
  const haltReason = haltedDoc?.explanation?.ruleApplied ?? 'Needs review';
  const conciseHaltReason = haltReason.split('.').find(segment => segment.trim().length > 0)?.trim() ?? haltReason;

  const handleResolve = useCallback((docId: string, verb: 'request-sig' | 'mark-exception') => {
    if (isResolving) return;
    if (verb === 'mark-exception') {
      const shouldProceed = window.confirm('File this document as an exception? This action will be audit-logged.');
      if (!shouldProceed) return;
    }
    const doc = riverDocs.find(d => d.id === docId);
    const docName = doc?.name ?? 'Document';
    setIsResolving(true);
    setResolveVerb(verb);
    ingestStartRef.current.set(docId, nowMs());

    if (verb === 'request-sig') {
      setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'analyzing' } : d));
      setTimeout(() => {
        setRiverDocs(prev => prev.map(d => d.id === docId ? {
          ...d, status: 'routing', destination: 'Project Ledger',
          extractedTags: ['Legal', 'Signature Pending'],
        } : d));
        setTimeout(() => {
          setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'filed' } : d));
          markFiled(docId, docName, 'Project Ledger');
          setIsResolving(false);
          setResolveVerb(null);
        }, 800);
      }, 1100);
    } else {
      setRiverDocs(prev => prev.map(d => d.id === docId ? {
        ...d, status: 'routing', destination: 'Project Ledger',
        extractedTags: ['Legal', 'Exception'],
      } : d));
      setTimeout(() => {
        setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'filed' } : d));
        markFiled(docId, docName, 'Project Ledger');
        setIsResolving(false);
        setResolveVerb(null);
      }, 700);
    }
  }, [isResolving, markFiled, riverDocs]);

  useEffect(() => {
    const isTextEntryTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      if (isPaletteOpen) return;
      if (e.key === 'Escape' && retrievedSpecimen) {
        setRetrievedSpecimen(null);
        return;
      }
      if (e.key === 'Escape' && focusedArchiveId) {
        setFocusedArchiveId(null);
        return;
      }
      // ⌘/Ctrl+Enter resolves the active halt with "Request signature".
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && haltedDoc && !isResolving) {
        if (isTextEntryTarget(e.target)) return;
        e.preventDefault();
        handleResolve(haltedDoc.id, 'request-sig');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleResolve, isPaletteOpen, isResolving, haltedDoc, retrievedSpecimen, focusedArchiveId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isPaletteOpen) {
          closePalette();
          return;
        }
        openPaletteWithQuery(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closePalette, isPaletteOpen, openPaletteWithQuery]);

  const handleRetrievalSelect = (doc: ArchivedDocument, rect: DOMRect | null) => {
    setIsPaletteOpen(false);
    paletteReturnFocusRef.current = null;
    setRetrievedSpecimen({ doc, fromRect: rect, openedAt: nowMs() });
  };

  // What kicker label sits above the rendered page in the workbench header.
  const workbenchKicker = inFlightDoc
    ? `Importing — ${inFlightDoc.name}`
    : haltedDoc
      ? 'Needs review'
      : focusedArchiveId && focusedDoc
        ? focusedDoc.doc.name
        : filedDocs.length > 0
          ? 'Last filed'
          : 'No document';

  return (
    <div className={`app-shell layout-chat-first ${retrievedSpecimen ? 'has-retrieval' : ''} ${messages.length > 0 ? 'has-messages' : ''} ${haltedDoc ? 'has-halt' : ''}`}>

      {/* ════════ HEADER ════════════════════════════════════════ */}
      <header className="app-header">
        <div className="app-brand">
          <Layers size={18} />
          <div className="app-brand-copy">
            <span className="app-brand-title">LiveFlow</span>
            <span className="app-brand-kicker">Visual document workbench</span>
          </div>
        </div>
        <div className="app-header-actions">
          <button
            className="header-search-bar focus-ring"
            onClick={() => openPaletteWithQuery(null)}
            aria-label="Search documents (⌘K)"
          >
            <Search size={14} color="#8a8a93" />
            <span className="header-search-placeholder">Retrieve a document or ask a question…</span>
            <span className="header-search-kbd">⌘K</span>
          </button>
          <button
            onClick={() => handleIntake('perfect')}
            className="util-btn-primary util-btn-import focus-ring"
            aria-label="Import document"
            disabled={hasLiveProcessing}
          >
            <PlusCircle size={15} />
            <span>Import document</span>
          </button>
        </div>
      </header>

      {/* ════════ BODY: chat + workbench ════════════════════════ */}
      <div className="app-body has-side-panel">

        {/* ── Left: chat ── */}
        <div className="chat-canvas">
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            onAction={handleAction}
            onSourceClick={handleSourceClick}
            indexedCount={ARCHIVE.length}
            haltedCount={haltedDocs.length}
          />
        </div>

        {/* ── Right: workbench (rendered document lives here) ── */}
        <div className="pipeline-panel workbench-panel">
          <div className="workbench-header">
            <span className={`workbench-kicker ${haltedDoc ? 'is-halted' : inFlightDoc ? 'is-active' : ''}`}>
              <span className="workbench-kicker-dot" />
              <span>{workbenchKicker}</span>
            </span>
            {focusedArchiveId && (
              <button
                type="button"
                className="workbench-clear focus-ring"
                onClick={() => setFocusedArchiveId(null)}
              >
                Clear focus
              </button>
            )}
          </div>

          {showTransportSignals && (
            <div className="workbench-track">
              <PipelineTrack stations={stations} haltedStationId={haltedStation} completions={routeCompletions} />
            </div>
          )}

          <div className="workbench-stage">
            <AnimatePresence mode="wait">
              {focusedDoc ? (
                <motion.div
                  key={focusedDoc.doc.id}
                  className="workbench-page-wrap"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                >
                  <DocumentPagePreview
                    doc={focusedDoc.doc}
                    haltedReason={focusedDoc.halt ? haltReason : undefined}
                  />
                  {!focusedDoc.halt && focusedDoc.isLive && inFlightDoc && (
                    <div className="workbench-flight">
                      <span className="workbench-flight-dot" />
                      <span>{stationLabelFor(inFlightDoc.status)}</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="workbench-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="workbench-empty-eyebrow">WORKBENCH · READY</span>
                  <p className="workbench-empty-copy">
                    Import a document or run a query. The rendered page will land here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {focusedDoc?.halt && (
            <div className="workbench-resolve" key="resolve">
              <div className="workbench-resolve-meta">
                <div className="workbench-resolve-meta-row">
                  <span className="workbench-resolve-meta-label">Issue</span>
                  <span className="workbench-resolve-meta-value">{conciseHaltReason}</span>
                </div>
                <div className="workbench-resolve-meta-row">
                  <span className="workbench-resolve-meta-label">Confidence</span>
                  <span className="workbench-resolve-meta-value">
                    <span className="workbench-resolve-conf">{haltConfidence}%</span>
                    <span className="workbench-resolve-conf-needs"> · needs {HALT_THRESHOLD}%</span>
                  </span>
                </div>
              </div>

              <div className="workbench-resolve-verbs">
                <button
                  onClick={() => handleResolve(focusedDoc.halt!.id, 'request-sig')}
                  className="workbench-verb is-primary focus-ring"
                  disabled={isResolving}
                >
                  <Mail size={15} />
                  <span className="workbench-verb-copy">
                    <span className="workbench-verb-title">
                      {isResolving && resolveVerb === 'request-sig' ? 'Requesting signature…' : 'Request signature'}
                    </span>
                    <span className="workbench-verb-sub">Email sender · resolves halt</span>
                  </span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => handleResolve(focusedDoc.halt!.id, 'mark-exception')}
                  className="workbench-verb is-secondary focus-ring"
                  disabled={isResolving}
                >
                  <ShieldAlert size={15} />
                  <span className="workbench-verb-copy">
                    <span className="workbench-verb-title">
                      {isResolving && resolveVerb === 'mark-exception' ? 'Filing exception…' : 'Mark as exception'}
                    </span>
                    <span className="workbench-verb-sub">File without signature · audit-logged</span>
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {isPaletteOpen && (
        <RetrievalPalette
          key={`palette-${paletteInitialQuery ?? 'blank'}`}
          isOpen={isPaletteOpen}
          initialQuery={paletteInitialQuery}
          onClose={closePalette}
          onSelect={handleRetrievalSelect}
        />
      )}
    </div>
  );
}

function stationLabelFor(status: DocumentItem['status']): string {
  switch (status) {
    case 'dropped':    return 'INTAKE · received';
    case 'analyzing':  return 'EXTRACT · scanning';
    case 'classifying':return 'CLASSIFY · matching rules';
    case 'routing':    return 'ROUTE · arriving at compartment';
    default:           return '';
  }
}

export default App;
