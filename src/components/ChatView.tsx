import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import type { AnswerActionId, AnswerStatus, MockAnswerResult } from '../data/mockAnswers';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: MockAnswerResult;
  /** ISO time the message was created — drives the mono kicker. */
  receivedAt?: string;
}

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (query: string) => void;
  isTyping: boolean;
  onAction: (id: AnswerActionId, docId?: string) => void;
  onSourceClick?: (title: string) => void;
  indexedCount: number;
  haltedCount: number;
}

const SUGGESTED_PROMPTS = [
  'compare acme and atlas ndas',
  'what halted last night',
  'q4 projections summary',
];

const STATUS_LABEL: Record<AnswerStatus, string> = {
  'grounded': 'GROUNDED',
  'needs-review': 'NEEDS REVIEW',
  'not-enough-source-evidence': 'INSUFFICIENT EVIDENCE',
};

function shortClock(value?: string) {
  if (!value) return '—';
  const parts = value.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
}

export function ChatView({
  messages,
  onSendMessage,
  isTyping,
  onAction,
  onSourceClick,
  indexedCount,
  haltedCount,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div className="chat-container">
      <div className="chat-messages-area">
        {isEmpty ? (
          <div className="chat-empty-state">
            <div className={`chat-empty-eyebrow ${haltedCount > 0 ? 'is-halted' : ''}`}>
              <span className="chat-empty-eyebrow-dot" />
              <span>{indexedCount} documents · {haltedCount > 0 ? `${haltedCount} needs review` : 'all routed'}</span>
            </div>
            <h1 className="chat-empty-title">Ask your documents</h1>
            <p className="chat-empty-subtitle">
              Pose a question. The answer shows up here — the document opens on the right.
            </p>
            <div className="chat-empty-hints">
              <div className="chat-empty-hint-row">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    className="chat-empty-hint"
                    onClick={() => onSendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-transcript">
            <div className="chat-messages-list">
              {messages.map(msg => {
                const isUser = msg.role === 'user';
                const status = msg.result?.status;
                const isHaltedResult = status === 'needs-review';
                const kickerLabel = isUser ? 'QUERY' : 'ANSWER';
                const clock = shortClock(msg.receivedAt);

                return (
                  <motion.div
                    key={msg.id}
                    className={`chat-message-row ${isUser ? 'is-user' : 'is-assistant'} ${isHaltedResult ? 'is-halted-result' : ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  >
                    <div className="chat-message-kicker">
                      <span>{kickerLabel}</span>
                      <span className="kicker-sep">·</span>
                      <span>{clock}</span>
                      {!isUser && status && (
                        <>
                          <span className="kicker-sep">·</span>
                          <span className={`kicker-status-${status}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="chat-message-card">
                      {!isUser && status && status !== 'grounded' && msg.result?.confidence && (
                        <div className="chat-confidence-note">{msg.result.confidence}</div>
                      )}
                      <div className="chat-content">{msg.content}</div>

                      {msg.result && (msg.result.sources.length > 0 || msg.result.actions.length > 0) && (
                        <div className="chat-result-payload">
                          {msg.result.sources.length > 0 && (
                            <>
                              <div className="chat-payload-divider" />
                              <div>
                                <div className="chat-sources-header">
                                  <span className="chat-sources-label">Sources</span>
                                  <span className="chat-sources-count">{msg.result.sources.length} REF</span>
                                </div>
                                <div className="chat-sources-list">
                                  {msg.result.sources.map((src, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      className="chat-source-pill"
                                      data-kind={src.kind}
                                      onClick={() => onSourceClick?.(src.title)}
                                      title="Show document on right"
                                    >
                                      <span className="source-title">{src.title}</span>
                                      <span className="source-kind">{src.kind}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {msg.result.actions.length > 0 && (
                            <div className="chat-actions">
                              {msg.result.actions.map(act => (
                                <button
                                  key={act.id}
                                  onClick={() => onAction(act.id)}
                                  className={`chat-action-btn ${act.tone === 'primary' ? 'is-primary' : 'is-secondary'}`}
                                >
                                  {act.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <motion.div
                  className="chat-message-row is-assistant is-typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="chat-message-kicker">
                    <span>ANSWER</span>
                    <span className="kicker-sep">·</span>
                    <span>GATHERING EVIDENCE</span>
                  </div>
                  <div className="chat-message-card">
                    <div className="chat-typing-line">
                      <span className="chat-typing-dots">
                        <span /><span /><span />
                      </span>
                      <span>scanning archive · matching extractions</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={endOfMessagesRef} style={{ height: 1 }} />
            </div>
          </div>
        )}
      </div>

      <div className={`chat-input-dock ${isEmpty ? 'is-empty' : ''}`}>
        <div className="chat-input-frame">
          {isEmpty && (
            <>
              <span className="chat-frame-tr" />
              <span className="chat-frame-bl" />
            </>
          )}
          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask across your documents…"
              className="chat-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="chat-submit-btn"
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
