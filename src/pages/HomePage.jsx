import { Link } from "react-router-dom";

export default function HomePage() {
	return (
		<div className="home-page">
			<section className="hero-section">
				<div className="hero-content">
					<span className="eyebrow">Enterprise IT Service Desk · Demo</span>
					<h1>A realistic enterprise IT service desk, built end to end.</h1>
					<p>
						HelpDesk Pro is a portfolio demonstration of ITIL-aligned incident
						management, L1/L2/L3 operations, SLA tracking, an interactive
						troubleshooting workbench, a simulated Microsoft 365 / Entra ID
						admin lab, asset management, and a tamper-proof audit trail — with
						real role-based security enforced server-side.
					</p>
					<div className="hero-actions">
						<Link to="/login" className="primary-btn">
							Explore the Demo
						</Link>
						<Link to="/login" className="secondary-btn">
							Sign In
						</Link>
					</div>
					<p className="hero-note">
						Simulated environment — all employees, tickets, devices, and
						directory accounts are fictional.
					</p>
				</div>

				<div className="hero-panel">
					<div className="hero-card">
						<h3>What it demonstrates</h3>
						<ul className="hero-list">
							<li>Role-based access (Admin / L1 / L2 / L3 / Employee)</li>
							<li>ITIL incidents, SLAs, escalation &amp; queues</li>
							<li>Interactive troubleshooting workbench</li>
							<li>Microsoft 365 / Entra ID admin lab (simulated)</li>
							<li>Assets, knowledge base, approvals, audit &amp; reporting</li>
						</ul>
					</div>

					<div className="hero-card">
						<h3>One-click role sign-in</h3>
						<div className="hero-mini-stats">
							<div className="mini-stat-card">
								<strong>Pick a role</strong>
								<span>Sign in as an admin, technician, or employee from the login screen.</span>
							</div>
							<div className="mini-stat-card">
								<strong>Explore safely</strong>
								<span>Each role is limited by real security rules — no setup required.</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="feature-grid-section">
				<div className="section-heading">
					<span className="section-label">For recruiters &amp; hiring managers</span>
					<h2>Explore realistic service-desk scenarios.</h2>
					<p className="section-support-text">
						Sign in with any role and walk a full incident lifecycle — triage,
						diagnostics, escalation, resolution, and audit — in a guided demo.
					</p>
				</div>

				<div className="feature-grid">
					<article className="feature-card">
						<h3>Real workflows</h3>
						<p>
							Incidents move through an enforced lifecycle with calculated
							priority, SLA clocks, and support-group routing — not mockups.
						</p>
					</article>

					<article className="feature-card">
						<h3>Technical depth</h3>
						<p>
							Interactive diagnostics for DNS, VPN, account lockouts, Outlook/
							M365, and a P1 outage — with simulated command output.
						</p>
					</article>

					<article className="feature-card">
						<h3>Secure by design</h3>
						<p>
							Authorization is enforced by Cloud Firestore rules and custom-claim
							roles, backed by an automated security test suite.
						</p>
					</article>
				</div>
			</section>

			<section className="cta-shell">
				<div className="cta-card">
					<div>
						<span className="section-label">Get started</span>
						<h2>Open the demo and pick a role.</h2>
						<p>
							No account creation needed — one-click sign-in as any role, with a
							guided walkthrough once you're in.
						</p>
					</div>
					<div className="cta-actions">
						<Link to="/login" className="primary-btn">
							Explore the Demo
						</Link>
						<Link to="/login" className="secondary-btn">
							Sign In
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
