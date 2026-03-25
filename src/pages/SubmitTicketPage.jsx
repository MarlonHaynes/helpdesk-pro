import { useState } from "react";
import { createTicket } from "../services/ticketService";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../utils/constants";
import generateTicketCode from "../utils/generateTicketCode";

export default function SubmitTicketPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    issueTitle: "",
    category: TICKET_CATEGORIES[0] || "",
    priority: TICKET_PRIORITIES[0] || "",
    issueDescription: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      await createTicket({
        ticketCode: generateTicketCode(),
        fullName: formData.fullName.trim(),
        requesterEmail: formData.email.trim(),
        issueTitle: formData.issueTitle.trim(),
        category: formData.category,
        priority: formData.priority,
        issueDescription: formData.issueDescription.trim(),
        status: "Open",
        assignedTechnician: "",
        screenshotUrl: "",
        screenshotPath: "",
        notes: [],
      });

      setFormData({
        fullName: "",
        email: "",
        issueTitle: "",
        category: TICKET_CATEGORIES[0] || "",
        priority: TICKET_PRIORITIES[0] || "",
        issueDescription: "",
      });

      setSubmitSuccess("Your request has been received! We\u2019ll get on it as soon as we can.");
    } catch (error) {
      console.error("Error submitting ticket:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the ticket."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="submit-ticket-page">
      <section className="page-section page-intro-card">
        <span className="section-label">Submit a Request</span>
        <h1>Let us know what&apos;s going on.</h1>
        <p>
          Fill in the details below and we&apos;ll add your request to the support
          queue right away. The more context you share, the faster we can help.
        </p>
      </section>

      <section className="ticket-form-card submit-ticket-form-card">
        {submitSuccess ? <p className="success-inline-message">{submitSuccess}</p> : null}
        {submitError ? <p className="form-error">{submitError}</p> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="ticket-form-grid">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jane Thompson"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="issueTitle">Issue Title</label>
            <input
              id="issueTitle"
              name="issueTitle"
              type="text"
              placeholder="Example: Unable to sync email on mobile"
              value={formData.issueTitle}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ticket-form-grid">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Issue Description</label>
            <textarea
              id="description"
              name="issueDescription"
              rows="7"
              placeholder="Include steps to reproduce, expected result, and any error details."
              value={formData.issueDescription}
              onChange={handleChange}
              required
            />
            <p className="field-helper-text">
              Detailed context helps reduce back-and-forth and speeds up resolution.
            </p>
          </div>

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Request"}
          </button>
        </form>
      </section>
    </div>
  );
}