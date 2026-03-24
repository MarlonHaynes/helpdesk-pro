import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-section not-found-page">
      <span className="section-label">404 Error</span>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or may have been moved.</p>
      <Link to="/" className="primary-btn">
        Return Home
      </Link>
    </section>
  );
}