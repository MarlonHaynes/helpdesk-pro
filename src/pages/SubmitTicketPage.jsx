import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { createTicket } from "../services/ticketService";
import {
  RECORD_TYPES,
  CATEGORIES,
  SUBCATEGORIES,
  IMPACT_LEVELS,
  URGENCY_LEVELS,
  derivePriority,
} from "../domain/itsm";
import { PriorityBadge } from "../components/tickets/Badges";

export default function SubmitTicketPage() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    recordType: "Incident",
    shortDescription: "",
    description: "",
    category: "Identity & Access",
    subcategory: "",
    serviceAffected: "",
    department: profile?.department ?? "",
    contact: currentUser?.email ?? "",
    impact: "Low",
    urgency: "Low",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const priority = useMemo(
    () => derivePriority(form.impact, form.urgency),
    [form.impact, form.urgency]
  );
  const subs = SUBCATEGORIES[form.category] ?? [];

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.shortDescription.trim()) {
      setError("Please enter a short description.");
      return;
    }
    setBusy(true);
    try {
      const { id } = await createTicket(form, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: profile?.displayName,
        role: "employee",
      });
      navigate(`/app/tickets/${id}`);
    } catch (err) {
      console.error(err);
      setError("Could not submit the request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Submit a Service Request</h1>
          <p className="muted">
            Priority is calculated from impact and urgency — you don't set it directly.
          </p>
        </div>
      </div>

      <form className="card-form" onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label>Record type</label>
            <select value={form.recordType} onChange={(e) => update("recordType", e.target.value)}>
              {RECORD_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Service affected</label>
            <input value={form.serviceAffected} onChange={(e) => update("serviceAffected", e.target.value)} placeholder="e.g. Outlook, VPN, Finance app" />
          </div>
        </div>

        <div className="form-group">
          <label>Short description *</label>
          <input value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} placeholder="One-line summary" required />
        </div>

        <div className="form-group">
          <label>Detailed description</label>
          <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What's happening, when it started, any error messages…" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => { update("category", e.target.value); update("subcategory", ""); }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Subcategory</label>
            <select value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)}>
              <option value="">—</option>
              {subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Department</label>
            <input value={form.department} onChange={(e) => update("department", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Contact</label>
            <input value={form.contact} onChange={(e) => update("contact", e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Impact</label>
            <select value={form.impact} onChange={(e) => update("impact", e.target.value)}>
              {IMPACT_LEVELS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Urgency</label>
            <select value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
              {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Calculated priority</label>
            <div className="prio-preview"><PriorityBadge priority={priority} /></div>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
