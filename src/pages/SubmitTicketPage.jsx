import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../utils/constants";

export default function SubmitTicketPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    issueTitle: "",
    category: TICKET_CATEGORIES[0] || "",
    priority: TICKET_PRIORITIES[0] || "",
    description: "",
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
      await addDoc(collection(db, "tickets"), {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        issueTitle: formData.issueTitle.trim(),
        category: formData.category,
        priority: formData.priority,
        description: formData.description.trim(),
        status: "Open",
        createdAt: serverTimestamp(),
      });

      setFormData({
        fullName: "",
        email: "",
        issueTitle: "",
        category: TICKET_CATEGORIES[0] || "",
        priority: TICKET_PRIORITIES[0] || "",
        description: "",
      });

      setSubmitSuccess("Ticket submitted successfully.");
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
    <section className="section">
      <h1>Submit a Ticket</h1>
      <p>Fill out the form below to report your issue.</p>

      {submitSuccess ? <p>{submitSuccess}</p> : null}
      {submitError ? <p className="form-error">{submitError}</p> : null}

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="issueTitle">Issue Title</label>
          <input
            id="issueTitle"
            name="issueTitle"
            type="text"
            value={formData.issueTitle}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          >
            {TICKET_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          >
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="description">Issue Description</label>
          <textarea
            id="description"
            name="description"
            rows="6"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px" }}
          />
        </div>

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}
        </button>
      </form>
    </section>
  );
}