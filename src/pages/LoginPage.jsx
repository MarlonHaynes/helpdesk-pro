import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../services/authService";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../auth/demoAccounts";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../auth/roles";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e, creds) {
    if (e) e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const em = creds?.email ?? email;
      const pw = creds?.password ?? password;
      await login(em, pw);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        "Sign-in failed. If you're running locally, make sure the demo data has been seeded (npm run seed)."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-grid">
        <div className="auth-card">
          <span className="section-label">Sign in</span>
          <h1>HelpDesk Pro</h1>
          <p className="muted">
            Enterprise IT Service Desk — <strong>Demo / Simulated Environment</strong>.
          </p>

          <form onSubmit={(e) => signIn(e)} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.example"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary-btn full-width-btn" disabled={busy}>
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="demo-panel">
          <span className="section-label">Explore the demo</span>
          <h2>One-click role sign-in</h2>
          <p className="muted">
            Each account is a fictional identity with permissions strictly limited
            to its role. Pick a perspective to explore:
          </p>
          <ul className="demo-role-list">
            {DEMO_ACCOUNTS.map((acct) => (
              <li key={acct.email}>
                <button
                  type="button"
                  className="demo-role-btn"
                  disabled={busy}
                  onClick={() => signIn(null, { email: acct.email, password: DEMO_PASSWORD })}
                >
                  <span className="demo-role-name">{ROLE_LABELS[acct.role]}</span>
                  <span className="demo-role-desc">{ROLE_DESCRIPTIONS[acct.role]}</span>
                  <span className="demo-role-email">{acct.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="demo-note">
            Shared demo password: <code>{DEMO_PASSWORD}</code>. All data is fictional
            and generated for this demonstration.
          </p>
        </div>
      </div>
    </section>
  );
}
