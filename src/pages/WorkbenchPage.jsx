import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { SCENARIOS, getScenario } from "../workbench/scenarios";
import WorkbenchRunner from "../components/workbench/WorkbenchRunner";
import { addEvent, addNote } from "../services/ticketService";
import { logAudit } from "../services/auditService";

export default function WorkbenchPage() {
  const { currentUser, role, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const ticketId = params.get("ticket");
  const activeId = params.get("scenario");
  const active = activeId ? getScenario(activeId) : null;
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const actor = useMemo(
    () => ({ uid: currentUser.uid, email: currentUser.email, displayName: profile?.displayName, role }),
    [currentUser, profile, role]
  );

  function launch(id) {
    const p = new URLSearchParams(params);
    p.set("scenario", id);
    setParams(p);
    setRecorded(false);
  }
  function back() {
    const p = new URLSearchParams(params);
    p.delete("scenario");
    setParams(p);
  }

  async function record(score) {
    if (!ticketId) return;
    setRecording(true);
    try {
      const summary = `Workbench exercise "${active.title}" completed — ${score.correct} correct / ${score.wrong} incorrect decisions.`;
      await addEvent(ticketId, actor, { eventType: "ticket.workbench_run", summary, details: active.stages.find((s) => s.type === "resolution")?.correctiveAction ?? null });
      await addNote(ticketId, actor, {
        visibility: "internal",
        body: `Troubleshooting Workbench — ${active.title}\nRoot cause: ${active.stages.find((s) => s.type === "resolution")?.rootCause}\nCorrective action: ${active.stages.find((s) => s.type === "resolution")?.correctiveAction}`,
      });
      await logAudit(actor, { eventType: "workbench.run_recorded", targetType: "ticket", targetId: ticketId, newValue: active.id });
      setRecorded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setRecording(false);
    }
  }

  if (active) {
    return (
      <div className="page page-narrow">
        <div className="page-head">
          <div>
            <div className="crumb"><button className="link linkbtn" onClick={back}>← All scenarios</button></div>
            <h1>{active.title}</h1>
            <p className="muted">{active.category} · {active.difficulty}
              {ticketId ? <> · linked to ticket <span className="mono">{ticketId.slice(0, 8)}</span></> : null}</p>
          </div>
        </div>
        {recorded && <p className="banner-ok">Recorded to the ticket timeline and internal notes.</p>}
        <div className="panel">
          <WorkbenchRunner
            scenario={active}
            onRecord={ticketId ? record : null}
            recording={recording}
          />
        </div>
        {active.linkedArticleIds?.length > 0 && (
          <div className="panel">
            <h2>Related knowledge</h2>
            <ul className="kb-links">
              {active.linkedArticleIds.map((id) => (
                <li key={id}><Link className="link" to={`/app/knowledge/${id}`}>{id}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Troubleshooting Workbench</h1>
          <p className="muted">Interactive, safe-simulation diagnostics. No commands are executed — tools reveal realistic predefined output. Launch a scenario to practice, or open one from a ticket to record the exercise.</p>
        </div>
      </div>
      <div className="wb-grid">
        {SCENARIOS.map((s) => (
          <button key={s.id} className="wb-card" onClick={() => launch(s.id)}>
            {s.demoLabel && <span className="wb-demo-tag">Demo {s.demoLabel}</span>}
            <h3>{s.title}</h3>
            <p className="muted small">{s.category}</p>
            <span className="wb-diff">{s.difficulty}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
