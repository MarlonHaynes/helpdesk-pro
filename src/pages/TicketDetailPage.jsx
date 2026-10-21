import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { PERMISSIONS as P } from "../auth/roles";
import {
  getTicketById,
  getTicketEvents,
  getTicketNotes,
  transitionStatus,
  assignTicket,
  escalateTicket,
  setPriorityFields,
  recordFirstResponse,
  addNote,
  confirmResolution,
  reopenByRequester,
} from "../services/ticketService";
import { getStaffUsers } from "../services/userService";
import { toTicketView } from "../domain/ticketView";
import { allowedTransitions, IMPACT_LEVELS, URGENCY_LEVELS, SUPPORT_GROUPS, RESOLUTION_CODES } from "../domain/itsm";
import { formatRemaining } from "../domain/sla";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/tickets/Badges";
import { formatDateTime } from "../utils/formatDate";

export default function TicketDetailPage() {
  const { id } = useParams();
  const { currentUser, role, can, isStaff, profile } = useAuth();
  const [raw, setRaw] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const actor = useMemo(
    () => ({ uid: currentUser.uid, email: currentUser.email, displayName: profile?.displayName, role }),
    [currentUser, profile, role]
  );

  const reload = useCallback(async () => {
    const t = await getTicketById(id);
    setRaw(t);
    if (t) {
      const ev = await getTicketEvents(id).catch(() => []);
      setEvents(ev);
      const ns = await getTicketNotes(id).catch(() => []);
      setNotes(ns);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await reload();
        if (can(P.TICKET_ASSIGN)) {
          const s = await getStaffUsers().catch(() => []);
          if (active) setStaff(s);
        }
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load this ticket. You may not have access.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [reload, can]);

  const ticket = useMemo(() => (raw ? toTicketView(raw) : null), [raw]);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      console.error(e);
      setError(e.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="center-state"><div className="spinner" /><p>Loading ticket…</p></div>;
  if (!ticket) return (
    <div className="page"><p className="empty-state">{error || "Ticket not found."}</p>
      <Link className="link" to="/app">← Back to dashboard</Link></div>
  );

  const isOwner = ticket.requesterUid === currentUser.uid;
  const visibleNotes = isStaff ? notes : notes.filter((n) => n.visibility === "requester");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumb"><Link className="link" to={isStaff ? "/app/tickets" : "/app/my-tickets"}>← Back</Link></div>
          <h1>{ticket.shortDescription}</h1>
          <p className="muted mono">{ticket.ticketNumber} · {ticket.recordType}</p>
        </div>
        <div className="head-badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <SlaBadge sla={ticket.sla} />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <h2>Details</h2>
            <p className="pre">{ticket.description || "No detailed description provided."}</p>
            <dl className="kv two-col">
              <div><dt>Requester</dt><dd>{ticket.requesterName} <span className="muted">({ticket.requesterEmail})</span></dd></div>
              <div><dt>Department</dt><dd>{ticket.department || "—"}</dd></div>
              <div><dt>Category</dt><dd>{ticket.category}{ticket.subcategory ? ` / ${ticket.subcategory}` : ""}</dd></div>
              <div><dt>Service affected</dt><dd>{ticket.serviceAffected || "—"}</dd></div>
              <div><dt>Support group</dt><dd>{ticket.supportGroup}</dd></div>
              <div><dt>Assignee</dt><dd>{ticket.assignedTechName || "Unassigned"}</dd></div>
              <div><dt>Impact / Urgency</dt><dd>{ticket.impact} / {ticket.urgency}</dd></div>
              <div><dt>Escalation level</dt><dd>{ticket.escalationLevel}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>SLA</h2>
            <div className="sla-clocks">
              <SlaClock title="Response" clock={ticket.sla.response} due={ticket.slaResponseDueAt} />
              <SlaClock title="Resolution" clock={ticket.sla.resolution} due={ticket.slaResolutionDueAt} />
            </div>
          </section>

          {(ticket.resolutionSummary || ticket.rootCause) && (
            <section className="panel">
              <h2>Resolution</h2>
              {ticket.resolutionCode && <p><strong>Code:</strong> {ticket.resolutionCode}</p>}
              {ticket.rootCause && <p><strong>Root cause:</strong> {ticket.rootCause}</p>}
              {ticket.resolutionSummary && <p className="pre">{ticket.resolutionSummary}</p>}
            </section>
          )}

          <NotesSection
            notes={visibleNotes}
            isStaff={isStaff}
            canInternal={can(P.TICKET_INTERNAL_NOTES)}
            busy={busy}
            onAdd={(body, visibility) => run(() => addNote(id, actor, { body, visibility }))}
          />

          <section className="panel">
            <h2>Activity timeline</h2>
            {events.length === 0 ? <p className="empty-state">No events recorded.</p> : (
              <ol className="timeline">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{ev.summary}</strong>
                      <div className="muted small">
                        {ev.actorName} · {formatDateTime(ev.at)}
                        {ev.reason ? ` · ${ev.reason}` : ""}
                      </div>
                      {ev.details && <p className="pre small">{ev.details}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="detail-side">
          {isStaff && (
            <StaffActions
              ticket={ticket}
              role={role}
              can={can}
              staff={staff}
              actor={actor}
              busy={busy}
              run={run}
            />
          )}
          {isOwner && (
            <RequesterActions ticket={ticket} actor={actor} busy={busy} run={run} />
          )}
        </aside>
      </div>
    </div>
  );
}

function SlaClock({ title, clock, due }) {
  const tone = { met: "ok", ok: "ok", warning: "warn", breached: "danger", "n/a": "" }[clock.state] || "";
  return (
    <div className={`sla-clock sla-${tone}`}>
      <span className="sla-clock-title">{title}</span>
      <span className="sla-clock-value">
        {clock.state === "met" ? "Met"
          : clock.state === "breached" ? `Breached by ${formatRemaining(clock.remainingMs)}`
          : clock.state === "n/a" ? "—"
          : `${formatRemaining(clock.remainingMs)} left`}
      </span>
      <span className="sla-clock-due muted small">{due ? `Due ${formatDateTime(due)}` : ""}</span>
    </div>
  );
}

function NotesSection({ notes, isStaff, canInternal, busy, onAdd }) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState(isStaff ? "internal" : "requester");
  return (
    <section className="panel">
      <h2>{isStaff ? "Notes & updates" : "Updates"}</h2>
      {notes.length === 0 ? <p className="empty-state">No notes yet.</p> : (
        <ul className="notes">
          {notes.map((n) => (
            <li key={n.id} className={`note note-${n.visibility}`}>
              <div className="note-head">
                <strong>{n.authorName}</strong>
                <span className="muted small">{formatDateTime(n.at)}</span>
                <span className={`note-tag ${n.visibility === "internal" ? "tag-internal" : "tag-public"}`}>
                  {n.visibility === "internal" ? "Internal" : "Requester-facing"}
                </span>
              </div>
              <p className="pre">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form
        className="note-form"
        onSubmit={(e) => { e.preventDefault(); if (body.trim()) { onAdd(body.trim(), visibility); setBody(""); } }}
      >
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note…" />
        <div className="note-form-actions">
          {canInternal && (
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="internal">Internal note</option>
              <option value="requester">Requester-facing</option>
            </select>
          )}
          <button className="secondary-btn" disabled={busy || !body.trim()}>Add note</button>
        </div>
      </form>
    </section>
  );
}

function StaffActions({ ticket, can, staff, actor, busy, run }) {
  const transitions = allowedTransitions(ticket.status);
  const [resolve, setResolve] = useState({ code: RESOLUTION_CODES[0], rootCause: "", summary: "" });
  const [esc, setEsc] = useState({ group: SUPPORT_GROUPS[1], handoff: "" });
  const [impact, setImpact] = useState(ticket.impact);
  const [urgency, setUrgency] = useState(ticket.urgency);

  return (
    <div className="panel action-panel">
      <h2>Actions</h2>

      {!ticket.firstResponseAt && (
        <button className="secondary-btn block" disabled={busy}
          onClick={() => run(() => recordFirstResponse(ticket, actor))}>
          Record first response
        </button>
      )}

      {can(P.TICKET_ASSIGN) && (
        <div className="action-group">
          <label>Assign to</label>
          <select
            disabled={busy}
            value={ticket.assignedTechUid || ""}
            onChange={(e) => {
              const t = staff.find((s) => s.uid === e.target.value);
              if (t) run(() => assignTicket(ticket, t, actor));
            }}
          >
            <option value="">— select technician —</option>
            {staff.map((s) => <option key={s.uid} value={s.uid}>{s.displayName} ({s.role})</option>)}
          </select>
        </div>
      )}

      <div className="action-group">
        <label>Change status</label>
        <div className="btn-wrap">
          {transitions.filter((s) => s !== "Resolved" && s !== "Closed" && s !== "Escalated").map((s) => (
            <button key={s} className="chip-btn" disabled={busy}
              onClick={() => run(() => transitionStatus(ticket, s, actor))}>{s}</button>
          ))}
        </div>
      </div>

      {can(P.TICKET_SET_PRIORITY) && (
        <div className="action-group">
          <label>Reassess priority</label>
          <div className="inline-selects">
            <select value={impact} onChange={(e) => setImpact(e.target.value)} disabled={busy}>
              {IMPACT_LEVELS.map((i) => <option key={i}>{i}</option>)}
            </select>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} disabled={busy}>
              {URGENCY_LEVELS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <button className="chip-btn" disabled={busy}
              onClick={() => run(() => setPriorityFields(ticket, { impact, urgency }, actor))}>Apply</button>
          </div>
        </div>
      )}

      {can(P.TICKET_ESCALATE) && transitions.includes("Escalated") && (
        <div className="action-group">
          <label>Escalate</label>
          <select value={esc.group} onChange={(e) => setEsc({ ...esc, group: e.target.value })} disabled={busy}>
            {SUPPORT_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <textarea rows={2} placeholder="Handoff notes: work done, outstanding issues, business impact…"
            value={esc.handoff} onChange={(e) => setEsc({ ...esc, handoff: e.target.value })} disabled={busy} />
          <button className="secondary-btn block" disabled={busy || !esc.handoff.trim()}
            onClick={() => run(() => escalateTicket(ticket, { toGroup: esc.group, handoff: esc.handoff.trim() }, actor))}>
            Escalate ticket
          </button>
        </div>
      )}

      {can(P.TICKET_RESOLVE) && transitions.includes("Resolved") && (
        <div className="action-group">
          <label>Resolve</label>
          <select value={resolve.code} onChange={(e) => setResolve({ ...resolve, code: e.target.value })} disabled={busy}>
            {RESOLUTION_CODES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Root cause" value={resolve.rootCause}
            onChange={(e) => setResolve({ ...resolve, rootCause: e.target.value })} disabled={busy} />
          <textarea rows={3} placeholder="Resolution summary (required)" value={resolve.summary}
            onChange={(e) => setResolve({ ...resolve, summary: e.target.value })} disabled={busy} />
          <button className="primary-btn block" disabled={busy || !resolve.summary.trim()}
            onClick={() => run(() => transitionStatus(ticket, "Resolved", actor, {
              resolutionCode: resolve.code, rootCause: resolve.rootCause, resolutionSummary: resolve.summary.trim(),
            }))}>
            Mark resolved
          </button>
        </div>
      )}

      {can(P.TICKET_CLOSE) && transitions.includes("Closed") && (
        <button className="secondary-btn block" disabled={busy}
          onClick={() => run(() => transitionStatus(ticket, "Closed", actor))}>Close ticket</button>
      )}
    </div>
  );
}

function RequesterActions({ ticket, actor, busy, run }) {
  if (ticket.status !== "Resolved") return null;
  return (
    <div className="panel action-panel">
      <h2>Your actions</h2>
      <p className="muted small">This ticket is marked resolved. Please confirm or reopen it.</p>
      <button className="primary-btn block" disabled={busy}
        onClick={() => run(() => confirmResolution(ticket, actor))}>Confirm resolved</button>
      <button className="secondary-btn block" disabled={busy}
        onClick={() => run(() => reopenByRequester(ticket, actor))}>
        Reopen ticket
      </button>
    </div>
  );
}
