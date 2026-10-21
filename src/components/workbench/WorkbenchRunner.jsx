import { useState } from "react";
import { DIAGNOSTIC_TOOLS } from "../../workbench/scenarios";

// Interactive, safe-simulation runner for a troubleshooting scenario.
// No command is executed anywhere — "tools" reveal predefined scenario output.
export default function WorkbenchRunner({ scenario, onComplete, onRecord, recording }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [revealed, setRevealed] = useState({}); // tool -> true
  const [picked, setPicked] = useState({}); // stageIdx -> option index
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);

  const stage = scenario.stages[stageIdx];
  const isLast = stageIdx === scenario.stages.length - 1;

  function next() {
    if (isLast) {
      setDone(true);
      onComplete?.(score);
    } else {
      setStageIdx((i) => i + 1);
    }
  }

  function revealTool(tool) {
    setRevealed((r) => ({ ...r, [tool]: true }));
  }

  function pick(optIdx) {
    if (picked[stageIdx] != null) return; // already answered
    const opt = stage.options[optIdx];
    setPicked((p) => ({ ...p, [stageIdx]: optIdx }));
    setScore((s) => ({
      correct: s.correct + (opt.correct ? 1 : 0),
      wrong: s.wrong + (opt.correct ? 0 : 1),
    }));
  }

  const answeredCorrectly = () => {
    if (stage.type !== "decision") return true;
    const idx = picked[stageIdx];
    return idx != null && stage.options[idx].correct;
  };

  const progress = Math.round(((stageIdx + (done ? 1 : 0)) / scenario.stages.length) * 100);

  return (
    <div className="wb">
      <div className="wb-progress"><span style={{ width: `${progress}%` }} /></div>

      {!done ? (
        <div className="wb-stage">
          {stage.type === "info" && (
            <>
              <h3>{stage.heading}</h3>
              <p className="pre">{stage.body}</p>
              <div className="wb-actions">
                <button className="primary-btn" onClick={next}>Continue</button>
              </div>
            </>
          )}

          {stage.type === "diagnostic" && (
            <>
              <h3>{stage.heading}</h3>
              <p className="muted small">Run each simulated tool to gather evidence. (Simulation — nothing is executed.)</p>
              <div className="wb-tools">
                {stage.tools.map((tool) => (
                  <button key={tool} className="chip-btn" onClick={() => revealTool(tool)} disabled={revealed[tool]}>
                    {DIAGNOSTIC_TOOLS[tool] || tool}
                  </button>
                ))}
              </div>
              {stage.tools.filter((t) => revealed[t]).map((t) => (
                <pre key={t} className="wb-output"><code>{stage.outputs[t]}</code></pre>
              ))}
              <div className="wb-actions">
                <button className="primary-btn" onClick={next}
                  disabled={!stage.tools.some((t) => revealed[t])}>
                  Continue
                </button>
              </div>
            </>
          )}

          {stage.type === "decision" && (
            <>
              <h3>{stage.heading}</h3>
              <div className="wb-options">
                {stage.options.map((opt, i) => {
                  const chosen = picked[stageIdx] === i;
                  const answered = picked[stageIdx] != null;
                  const cls = answered
                    ? opt.correct ? "wb-opt wb-correct" : chosen ? "wb-opt wb-wrong" : "wb-opt wb-dim"
                    : "wb-opt";
                  return (
                    <button key={i} className={cls} onClick={() => pick(i)} disabled={answered}>
                      <span>{opt.label}</span>
                      {answered && (chosen || opt.correct) && (
                        <span className="wb-feedback">{opt.feedback}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="wb-actions">
                <button className="primary-btn" onClick={next} disabled={!answeredCorrectly()}>
                  {answeredCorrectly() ? "Continue" : "Pick the correct answer to continue"}
                </button>
              </div>
            </>
          )}

          {stage.type === "resolution" && (
            <>
              <h3>Root cause & resolution</h3>
              <dl className="wb-resolution">
                <dt>Root cause</dt><dd>{stage.rootCause}</dd>
                <dt>Corrective action</dt><dd>{stage.correctiveAction}</dd>
                <dt>Verification</dt><dd>{stage.verification}</dd>
                <dt>Resolution notes</dt><dd>{stage.resolutionNotes}</dd>
                {stage.escalateTo && (<><dt>Escalate to (if needed)</dt><dd>{stage.escalateTo}</dd></>)}
              </dl>
              <div className="wb-actions">
                <button className="primary-btn" onClick={next}>Finish exercise</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="wb-summary">
          <h3>Exercise complete</h3>
          <p>Decision accuracy: <strong>{score.correct}</strong> correct
            {score.wrong > 0 ? <>, <strong>{score.wrong}</strong> incorrect</> : null}.</p>
          {onRecord && (
            <button className="secondary-btn" onClick={() => onRecord(score)} disabled={recording}>
              {recording ? "Recording…" : "Record this exercise in the ticket"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
