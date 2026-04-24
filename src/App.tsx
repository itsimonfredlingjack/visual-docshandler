import { useCallback, useEffect, useRef, useState } from 'react';
import { Layers, ArrowRight, X, Clock, Wifi, Mail, ShieldAlert, FolderInput, Paperclip, Search, Receipt, ScrollText, Sparkles } from 'lucide-react';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion';
import type { DocumentItem, ArchivedDocument } from './types';
import { DocumentSlab } from './components/DocumentSlab';
import { IntakeRail } from './components/IntakeRail';
import { PipelineTrack, type StationId, type StationState, type RouteCompletion } from './components/PipelineTrack';
import { RetrievalPalette } from './components/RetrievalPalette';
import { SpecimenCard } from './components/SpecimenCard';

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

const COMPARTMENTS = [
  { id: 'ledger',   name: 'Project Ledger',    docCount: 1 },
  { id: 'strategy', name: 'Strategic Archive',  docCount: 0 },
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

function currentTimeMinute() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ─── App ───────────────────────────────────────────────────────
function App() {
  const [riverDocs,   setRiverDocs]   = useState<DocumentItem[]>(SEED_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string | null>('d2');
  const [drawerDismissed, setDrawerDismissed] = useState(false);

  // Success-moment state: completion blooms at Route + destination-row flash
  const [routeCompletions, setRouteCompletions] = useState<RouteCompletion[]>([]);
  const [flashDest, setFlashDest] = useState<{ name: string; key: number } | null>(null);
  const ingestStartRef = useRef<Map<string, number>>(new Map());

  // Retrieval palette + flying-to-stage flourish
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteInitialQuery, setPaletteInitialQuery] = useState<string | null>(null);
  const [retrievedSpecimen, setRetrievedSpecimen] = useState<{ doc: ArchivedDocument; fromRect: DOMRect | null; openedAt: number } | null>(null);
  const [clockLabel, setClockLabel] = useState(() => currentTimeMinute());

  const openPaletteWithQuery = (q: string | null) => {
    setPaletteInitialQuery(q);
    setIsPaletteOpen(true);
  };

  const openReviewFor = (id: string) => {
    setSelectedDocId(id);
    setDrawerDismissed(false);
  };

  // Emit a completion event: bloom at Route station + flash destination row.
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
    setFlashDest({ name: destination, key: completedAt });

    setTimeout(() => {
      setRouteCompletions(prev => prev.filter(c => c.id !== completionId));
    }, 3600);
    setTimeout(() => {
      setFlashDest(prev => (prev && prev.name === destination && nowMs() - prev.key >= 1400) ? null : prev);
    }, 1500);
  }, []);

  // ── Intake handler ──────────────────────────────────────────
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

    setRiverDocs(prev => [...prev, newDoc]);
    ingestStartRef.current.set(newDoc.id, nowMs());

    // Pipeline timing: intake (1.2s) → extract (2s) → route (1.5s) → filed
    // Slow enough to actually see the story across stations.
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
          openReviewFor(newDoc.id);
        }
      }, 2000);
    }, 1200);
  };

  // ── Derived state ────────────────────────────────────────────
  const activeDocs  = riverDocs.filter(d => d.status !== 'filed');
  const filedDocs   = riverDocs.filter(d => d.status === 'filed');
  const haltedDocs  = activeDocs.filter(d => d.status === 'uncertain');
  const reviewDoc   = selectedDocId ? activeDocs.find(d => d.id === selectedDocId && d.status === 'uncertain') : null;
  const reviewOpen  = !!reviewDoc && !drawerDismissed;

  // ── Pipeline station derivation ─────────────────────────────
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

  const confidence  = reviewDoc?.explanation?.confidence ?? 0;
  const THRESHOLD   = 85;
  const thresholdPct = `${THRESHOLD}%`;
  const confidencePct = `${confidence}%`;

  // ── Force-route handler ──────────────────────────────────────
  const handleForceRoute = (docId: string, destination: string) => {
    const doc = riverDocs.find(d => d.id === docId);
    const docName = doc?.name ?? 'Document';
    ingestStartRef.current.set(docId, nowMs());
    setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'routing', destination } : d));
    setSelectedDocId(null);
    setDrawerDismissed(false);
    setTimeout(() => {
      setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'filed' } : d));
      markFiled(docId, docName, destination);
    }, 700);
  };

  // ── Resolve-action handler (verbs that address the halt itself) ─
  const handleResolve = useCallback((docId: string, verb: 'request-sig' | 'mark-exception') => {
    const doc = riverDocs.find(d => d.id === docId);
    const docName = doc?.name ?? 'Document';
    ingestStartRef.current.set(docId, nowMs());

    if (verb === 'request-sig') {
      setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'analyzing' } : d));
      setSelectedDocId(null);
      setTimeout(() => {
        setRiverDocs(prev => prev.map(d => d.id === docId ? {
          ...d, status: 'routing', destination: 'Project Ledger',
          extractedTags: ['Legal', 'Signature Pending'],
        } : d));
        setTimeout(() => {
          setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'filed' } : d));
          markFiled(docId, docName, 'Project Ledger');
        }, 800);
      }, 1100);
    } else {
      setRiverDocs(prev => prev.map(d => d.id === docId ? {
        ...d, status: 'routing', destination: 'Project Ledger',
        extractedTags: ['Legal', 'Exception'],
      } : d));
      setSelectedDocId(null);
      setDrawerDismissed(false);
      setTimeout(() => {
        setRiverDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'filed' } : d));
        markFiled(docId, docName, 'Project Ledger');
      }, 700);
    }
  }, [markFiled, riverDocs]);

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isPaletteOpen) return;
      if (e.key === 'Escape' && retrievedSpecimen) {
        setRetrievedSpecimen(null);
        return;
      }
      if (e.key === 'Escape' && reviewOpen) {
        setDrawerDismissed(true);
      }
      if (e.key === 'Enter' && reviewDoc && reviewOpen) {
        e.preventDefault();
        handleResolve(reviewDoc.id, 'request-sig');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleResolve, isPaletteOpen, reviewOpen, reviewDoc, retrievedSpecimen]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockLabel(currentTimeMinute()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Global ⌘K / Ctrl+K → toggle retrieval palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Retrieval: user picks a doc → palette closes + flying card takes over
  const handleRetrievalSelect = (doc: ArchivedDocument, rect: DOMRect | null) => {
    setIsPaletteOpen(false);
    setRetrievedSpecimen({ doc, fromRect: rect, openedAt: nowMs() });
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`app-shell ${reviewOpen ? 'has-review' : ''} ${retrievedSpecimen ? 'has-retrieval' : ''}`}>

      {/* ════════ HEADER ════════════════════════════════════════ */}
      <header className="app-header">
        {/* Left: logo + primary search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Layers size={18} color="#a1a1aa" />
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.03em', color: '#f4f4f5' }}>
            LiveFlow
          </span>
          <button
            type="button"
            onClick={() => openPaletteWithQuery(null)}
            aria-label="Open retrieval palette"
            className="header-search-bar focus-ring"
          >
            <Search size={13} color="#a1a1aa" />
            <span className="header-search-placeholder">Retrieve a document or ask…</span>
            <span className="header-search-kbd">⌘K</span>
          </button>
        </div>

        {/* Center: a single primary section label — no disabled tabs */}
        <div className="nav-tabs">
          <div className="nav-tab active">Pipeline</div>
        </div>

        {/* Right: calm status pill — dot + human copy, amber only when halt */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div
            className={`header-status ${haltedDocs.length > 0 ? 'is-halt' : activeDocs.length > 0 ? 'is-processing' : ''}`}
            role="status"
            aria-live="polite"
          >
            <span className="dot" />
            <span>
              {haltedDocs.length > 0
                ? `${haltedDocs.length} need${haltedDocs.length === 1 ? 's' : ''} review`
                : activeDocs.length > 0
                  ? `${activeDocs.length} in flight`
                  : 'All clear'}
            </span>
          </div>
        </div>
      </header>

      {/* ════════ BODY: rail + stage ════════════════════════════ */}
      <div className="app-body">

        {/* ── Left intake rail ── */}
        <IntakeRail
          onIntake={handleIntake}
          haltedCount={haltedDocs.length}
          recentDocs={riverDocs}
          selectedDocId={selectedDocId}
          compartments={COMPARTMENTS}
          filedCounts={Object.fromEntries(
            COMPARTMENTS.map(c => [c.name, filedDocs.filter(d => d.destination === c.name).length])
          )}
          reviewOpen={reviewOpen}
          onSelectDoc={openReviewFor}
          flashDest={flashDest}
        />

        {/* ── Stage ── */}
        <LayoutGroup>
          <div className={`stage ${reviewOpen ? 'has-review' : ''} ${retrievedSpecimen ? 'has-retrieval' : ''}`}>

            {/* Pipeline track — the flow-lane docs travel through */}
            <div className="pipeline-region">
              <PipelineTrack stations={stations} haltedStationId={haltedStation} completions={routeCompletions} />
            </div>

            {/* Tether — Classify station ↓ halted card */}
            {haltedStation === 'classify' && (
              <motion.div
                className="station-tether"
                initial={{ opacity: 0, scaleY: 0.3 }}
                animate={{
                  opacity: 1,
                  scaleY: 1,
                  height: reviewOpen ? 160 : 200,
                }}
                transition={{ duration: 0.5 }}
                style={{ transformOrigin: 'top center' }}
              />
            )}


            {/* Stage floor glow — blue ambient (always), amber in halt */}
            <div className="stage-floor-glow" />

            {/* Stage vignette — darkens top + bottom edges, focuses on card zone */}
            <div className="stage-vignette" />

            {/* Card ↔ drawer tether — amber gradient wash deepening toward drawer */}
            <AnimatePresence>
              {reviewOpen && (
                <motion.div
                  key="drawer-wash"
                  className="stage-drawer-wash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </AnimatePresence>

            {/* Observation frame — corner brackets (specimen under examination) */}
            <div
              className={`obs-frame stage-obs-frame ${reviewOpen ? 'is-halted' : ''}`}
            >
              <span className="obs-bracket tl" />
              <span className="obs-bracket tr" />
              <span className="obs-bracket bl" />
              <span className="obs-bracket br" />
            </div>


            {/* ── Active document on stage ── */}
            <motion.div
              className="stage-workspace"
              animate={{
                scale: reviewOpen ? 0.96 : 1,
                opacity: retrievedSpecimen ? 0.62 : 1,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <AnimatePresence>
                {activeDocs.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="launch-pad"
                  >
                    <div className="launch-pad-hint">
                      <div className="launch-pad-headline">Nothing in flight.</div>
                      <div className="launch-pad-hint-copy">
                        Press <kbd className="launch-pad-kbd">⌘K</kbd> to retrieve a document, or <em>ingest</em> to bring a new one in.
                      </div>
                    </div>
                    <div className="launch-pad-grid">
                      <button type="button" className="launch-pad-tile focus-ring" onClick={() => openPaletteWithQuery('')}>
                        <Clock size={15} color="#a1a1aa" />
                        <div className="launch-pad-tile-body">
                          <span className="launch-pad-tile-title">Recent</span>
                          <span className="launch-pad-tile-sub">Latest filed documents</span>
                        </div>
                        <ArrowRight size={12} color="#71717a" />
                      </button>
                      <button type="button" className="launch-pad-tile focus-ring" onClick={() => openPaletteWithQuery('invoice')}>
                        <Receipt size={15} color="#fbbf24" />
                        <div className="launch-pad-tile-body">
                          <span className="launch-pad-tile-title">Invoices</span>
                          <span className="launch-pad-tile-sub">Payments and vendors</span>
                        </div>
                        <ArrowRight size={12} color="#71717a" />
                      </button>
                      <button type="button" className="launch-pad-tile focus-ring" onClick={() => openPaletteWithQuery('contract')}>
                        <ScrollText size={15} color="#93c5fd" />
                        <div className="launch-pad-tile-body">
                          <span className="launch-pad-tile-title">Contracts</span>
                          <span className="launch-pad-tile-sub">NDAs, MOUs, partnerships</span>
                        </div>
                        <ArrowRight size={12} color="#71717a" />
                      </button>
                      <button type="button" className="launch-pad-tile focus-ring" onClick={() => openPaletteWithQuery(null)}>
                        <Sparkles size={15} color="#86efac" />
                        <div className="launch-pad-tile-body">
                          <span className="launch-pad-tile-title">Ask anything</span>
                          <span className="launch-pad-tile-sub">Type a question in plain language</span>
                        </div>
                        <ArrowRight size={12} color="#71717a" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  activeDocs.map((doc, index) => {
                    const scale = Math.max(0.85, 1 - index * 0.05);
                    const yOffset = index * -24;
                    const zIndex = 30 - index;
                    return (
                      <motion.div
                        key={doc.id}
                        style={{ position: 'absolute', zIndex }}
                        initial={{ opacity: 0, scale: 0.88, y: yOffset - 20 }}
                        animate={{ opacity: 1, scale, y: yOffset }}
                        exit={{ opacity: 0, scale: scale - 0.05, y: yOffset + 16 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                      >
                        <DocumentSlab
                          doc={doc}
                          onClick={() => openReviewFor(doc.id)}
                          isRouting={doc.status === 'routing'}
                          isReviewing={reviewOpen && doc.id === reviewDoc?.id}
                        />
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.div>

            {/* ════ RETRIEVED SPECIMEN LANDING ════ */}
            {retrievedSpecimen && (
              <motion.div
                key={`retrieved-${retrievedSpecimen.doc.id}-${retrievedSpecimen.openedAt}`}
                className="retrieved-specimen-panel"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              >
                <span className="obs-bracket tl" />
                <span className="obs-bracket tr" />
                <span className="obs-bracket bl" />
                <span className="obs-bracket br" />
                <div className="retrieved-specimen-header">
                  <div>
                    <div className="retrieved-specimen-kicker">Retrieved content</div>
                    <h2>{retrievedSpecimen.doc.name}</h2>
                    <p>{retrievedSpecimen.doc.compartment} · {retrievedSpecimen.doc.source} · filed {retrievedSpecimen.doc.filedAt}</p>
                  </div>
                  <button
                    type="button"
                    className="util-btn-close focus-ring retrieved-specimen-close"
                    aria-label="Close retrieved content"
                    onClick={() => setRetrievedSpecimen(null)}
                  >
                    <X size={14} />
                    <span>Esc</span>
                  </button>
                </div>
                <SpecimenCard doc={retrievedSpecimen.doc} />
              </motion.div>
            )}

            {/* ════ REVIEW DRAWER ══════════════════════════════ */}
            <AnimatePresence>
              {reviewOpen && reviewDoc && (
                <motion.aside
                  key="drawer"
                  className="review-drawer"
                  initial={{ x: 460 }}
                  animate={{ x: 0 }}
                  exit={{ x: 460 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                >
                  {/* Drawer inner scroll area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 28px' }}>

                    {/* Drawer header — human framing, not robotic "MANUAL OVERRIDE" */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <h2 style={{
                          fontSize: 16,
                          fontWeight: 600,
                          letterSpacing: '-0.015em',
                          color: '#f4f4f5',
                          fontFamily: 'Geist, sans-serif',
                        }}>
                          Review required
                        </h2>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                          LiveFlow couldn't file this confidently. Confirm what to do.
                        </span>
                      </div>
                      <button
                        onClick={() => setDrawerDismissed(true)}
                        className="util-btn-close focus-ring"
                        aria-label="Close review drawer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          height: 32,
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8a8a93', letterSpacing: '0.04em' }}>Esc</span>
                      </button>
                    </div>
                    {/* Separator */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '18px 0 22px' }} />

                    {/* Why-it-halted block */}
                    <div style={{
                      background: 'rgba(245,158,11,0.035)',
                      border: '1px solid rgba(245,158,11,0.14)',
                      borderRadius: 10,
                      padding: 18,
                      marginBottom: 22,
                    }}>
                      <div className="drawer-section">
                        <span className="drawer-section-title" style={{ color: '#fbbf24' }}>Why it halted</span>
                      </div>
                      <div style={{ fontSize: 13.5, color: '#f4f4f5', lineHeight: 1.55, marginBottom: 14 }}>
                        {reviewDoc.explanation?.ruleApplied}
                      </div>

                      {/* Confidence bar — moved up, more prominent */}
                      <div style={{ marginBottom: 8, marginTop: 6 }}>
                        <div role="progressbar" aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${confidence}%`} style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                          <motion.div
                            style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)', borderRadius: 3 }}
                            initial={{ width: 0 }}
                            animate={{ width: confidencePct }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                          />
                          <div style={{
                            position: 'absolute', top: -4, bottom: -4,
                            left: thresholdPct,
                            width: 2,
                            background: '#a1a1aa',
                            borderRadius: 1,
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          Confidence
                        </span>
                        <span style={{ fontSize: 11.5 }}>
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{confidence}%</span>
                          <span style={{ color: 'var(--text-tertiary)' }}> · needs {THRESHOLD}%</span>
                        </span>
                      </div>

                      {/* Footer telemetry — demoted to a quiet single line */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(245,158,11,0.08)',
                        fontSize: 10.5,
                        fontFamily: 'monospace',
                        letterSpacing: '0.04em',
                        color: 'var(--text-tertiary)',
                      }}>
                        <span>halted {reviewDoc.haltedAt || reviewDoc.receivedAt}</span>
                        <span>rule · LEGAL_SIG_REQUIRED</span>
                      </div>
                    </div>

                    {/* ── Evidence block ── */}
                    {reviewDoc.evidence && (
                      <div style={{ marginBottom: 22 }}>
                        <div className="drawer-section">
                          <span className="drawer-section-title">Evidence</span>
                          <span className="drawer-section-sub">from sender</span>
                        </div>
                        <div style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10,
                          padding: 14,
                        }}>
                          {/* From / Subject — mixed case, Geist labels */}
                          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', rowGap: 7, columnGap: 10, marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist, sans-serif' }}>From</div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#d4d4d8' }}>{reviewDoc.evidence.sender}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist, sans-serif' }}>Subject</div>
                            <div style={{ fontSize: 12, color: '#e4e4e7', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {reviewDoc.evidence.subject}
                            </div>
                          </div>
                          {/* Preview quote */}
                          {reviewDoc.evidence.preview && (
                            <div style={{
                              borderLeft: '2px solid rgba(255,255,255,0.08)',
                              paddingLeft: 10,
                              fontSize: 12.5,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.55,
                              fontStyle: 'italic',
                              marginBottom: 10,
                            }}>
                              "{reviewDoc.evidence.preview}"
                            </div>
                          )}
                          {/* Attachment chip */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            paddingTop: 10,
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                          }}>
                            <Paperclip size={12} color="#8a8a93" />
                            <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                              {reviewDoc.name}
                            </span>
                            <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                              {reviewDoc.evidence.fileSize}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separator */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />

                    {/* ── Resolve actions ── */}
                    <div style={{ marginBottom: 20 }}>
                      <div className="drawer-section">
                        <span className="drawer-section-title">Resolve the halt</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                          onClick={() => handleResolve(reviewDoc.id, 'request-sig')}
                          className="util-btn-route focus-ring primary"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Mail size={15} />
                            <div>
                              <div className="route-title" style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                                Request signature
                              </div>
                              <div className="route-subtitle" style={{ fontSize: 11.5 }}>
                                Email sender · resolves halt
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: 9, fontFamily: 'monospace',
                              color: 'rgba(0,0,0,0.4)', background: 'rgba(0,0,0,0.06)',
                              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.04em',
                            }}>⏎</span>
                            <ArrowRight size={16} />
                          </div>
                        </button>

                        <button
                          onClick={() => handleResolve(reviewDoc.id, 'mark-exception')}
                          className="util-btn-route focus-ring"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldAlert size={15} color="#a1a1aa" />
                            <div>
                              <div className="route-title" style={{ fontSize: 14, fontWeight: 500, color: '#e4e4e7', marginBottom: 2 }}>
                                Mark as exception
                              </div>
                              <div className="route-subtitle" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                                File without signature · audit-logged
                              </div>
                            </div>
                          </div>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Separator */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />

                    {/* ── Route targets (secondary, file-as-is) ── */}
                    <div>
                      <div className="drawer-section">
                        <span className="drawer-section-title" style={{ color: 'var(--text-secondary)' }}>Or file as-is</span>
                        <FolderInput size={12} color="#8a8a93" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {COMPARTMENTS.map(comp => {
                          const docCount = filedDocs.filter(d => d.destination === comp.name).length;
                          return (
                            <button
                              key={comp.id}
                              onClick={() => handleForceRoute(reviewDoc.id, comp.name)}
                              className="util-btn-route-ghost focus-ring"
                            >
                              <span style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 500 }}>
                                {comp.name}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                                  {docCount === 0 ? '—' : `${docCount.toString().padStart(2, '0')}`}
                                </span>
                                <ArrowRight size={14} color="#a1a1aa" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

          </div>
        </LayoutGroup>
      </div>

      {/* ════════ STATUS BAR ══════════════════════════════════ */}
      <footer className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={10} />
            <span>Connected</span>
          </span>
          <span className="dot-sep">·</span>
          <span>{riverDocs.length} documents processed</span>
          <span className="dot-sep">·</span>
          <span>{filedDocs.length} filed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={10} />
          <span>{clockLabel}</span>
        </div>
      </footer>

      {/* ════════ RETRIEVAL PALETTE (⌘K) ═════════════════════════ */}
      {isPaletteOpen && (
        <RetrievalPalette
          key={`palette-${paletteInitialQuery ?? 'blank'}`}
          isOpen={isPaletteOpen}
          initialQuery={paletteInitialQuery}
          onClose={() => setIsPaletteOpen(false)}
          onSelect={handleRetrievalSelect}
        />
      )}
    </div>
  );
}

export default App;
