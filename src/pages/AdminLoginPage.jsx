import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/authService";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await loginAdmin(formData.email, formData.password);
      navigate("/admin/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="section-label">Admin Login</span>
          <h1>Sign in to the dashboard</h1>
          <p>Access the support management area with your admin credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button type="submit" className="primary-btn full-width-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </section>
  );
}