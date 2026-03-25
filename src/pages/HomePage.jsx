import { Link } from "react-router-dom";

export default function HomePage() {
	return (
		<div className="home-page">
			<section className="hero-section">
				<div className="hero-content">
					<span className="eyebrow">HelpDesk Pro</span>
					<h1>We&apos;re here to help you get things resolved.</h1>
					<p>
						Submit a support request, track your open tickets, and stay
						informed at every step. Friendly support, made simple.
					</p>
					<div className="hero-actions">
						<Link to="/submit-ticket" className="primary-btn">
							Submit a Request
						</Link>
						<Link to="/my-tickets" className="secondary-btn">
							Find My Tickets
						</Link>
					</div>
				</div>

				<div className="hero-panel">
					<div className="hero-card">
						<h3>What we can help with</h3>
						<ul className="hero-list">
							<li>Technical issues and software problems</li>
							<li>Account access and login trouble</li>
							<li>Hardware and device support</li>
							<li>Network and connectivity questions</li>
							<li>General IT requests and inquiries</li>
						</ul>
					</div>

					<div className="hero-card">
						<h3>How it works</h3>
						<div className="hero-mini-stats">
							<div className="mini-stat-card">
								<strong>1. Submit</strong>
								<span>Describe your issue and we&apos;ll route it to the right person</span>
							</div>
							<div className="mini-stat-card">
								<strong>2. Track</strong>
								<span>Follow progress with your email. No account needed.</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="feature-grid-section">
				<div className="section-heading">
					<span className="section-label">Here to Help</span>
					<h2>Clear tools for a smooth support experience.</h2>
					<p className="section-support-text">
						No complicated portals or confusing steps. Just a calm, organised
						way to get help and stay informed.
					</p>
				</div>

				<div className="feature-grid">
					<article className="feature-card">
						<h3>Easy Request Submission</h3>
						<p>
							Tell us what&apos;s going on in a quick, friendly form. We gather just
							enough detail to help you as fast as possible.
						</p>
					</article>

					<article className="feature-card">
						<h3>Track Your Tickets</h3>
						<p>
							Look up your requests anytime using the email you submitted with.
							No account or login required.
						</p>
					</article>

					<article className="feature-card">
						<h3>Always in the Loop</h3>
						<p>
							Our team updates ticket status as things progress, so you always
							know exactly where your request stands.
						</p>
					</article>
				</div>
			</section>

			<section className="cta-shell">
				<div className="cta-card">
					<div>
						<span className="section-label">Get started</span>
						<h2>Ready to submit a request or check an existing one?</h2>
						<p>
							We&apos;re here to help. Open a new ticket or look up your request
							status, whichever you need right now.
						</p>
					</div>
					<div className="cta-actions">
						<Link to="/submit-ticket" className="primary-btn">
							Submit a Ticket
						</Link>
						<Link to="/my-tickets" className="secondary-btn">
							My Tickets
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}