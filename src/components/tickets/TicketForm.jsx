import { useMemo, useState } from "react";
import { createTicket } from "../../services/ticketService";
import { uploadTicketScreenshot } from "../../services/storageService";
import generateTicketCode from "../../utils/generateTicketCode";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "../../utils/constants";

const initialFormData = {
  fullName: "",
  email: "",
  issueTitle: "",
  issueDescription: "",
  category: TICKET_CATEGORIES[0],
  priority: TICKET_PRIORITIES[1],
};

export default function TicketForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return "";
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Only PNG, JPG, JPEG, or WEBP image files are allowed.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must be 5MB or less.");
      setSelectedFile(null);
      return;
    }

    setFormError("");
    setSelectedFile(file);
  }

  function validateForm() {
    if (!formData.fullName.trim()) {
      return "Full name is required.";
    }

    if (!formData.email.trim()) {
      return "Email is required.";
    }

    if (!formData.issueTitle.trim()) {
      return "Issue title is required.";
    }

    if (!formData.issueDescription.trim()) {
      return "Issue description is required.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccessData(null);

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketCode = generateTicketCode();

      let screenshotUrl = "";
      let screenshotPath = "";

      if (selectedFile) {
        const uploadResult = await uploadTicketScreenshot(selectedFile);
        screenshotUrl = uploadResult.downloadURL;
        screenshotPath = uploadResult.fullPath;
      }

      const result = await createTicket({
        ticketCode,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        issueTitle: formData.issueTitle.trim(),
        issueDescription: formData.issueDescription.trim(),
        category: formData.category,
        priority: formData.priority,
        status: "Open",
        assignedTechnician: "",
        screenshotUrl,
        screenshotPath,
        notes: [],
      });

      setSuccessData({
        id: result.id,
        ticketCode,
        email: formData.email.trim().toLowerCase(),
      });

      setFormData(initialFormData);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating ticket:", error);
      setFormError("Something went wrong while submitting your ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ticket-form-wrapper">
      <form onSubmit={handleSubmit} className="ticket-form-card">
        <div className="ticket-form-grid">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
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
              placeholder="Enter your email"
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
            placeholder="Brief summary of the issue"
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
          <label htmlFor="issueDescription">Issue Description</label>
          <textarea
            id="issueDescription"
            name="issueDescription"
            rows="6"
            placeholder="Describe the issue in detail"
            value={formData.issueDescription}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="screenshot">Optional Screenshot</label>
          <input
            id="screenshot"
            name="screenshot"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
          <p className="field-helper-text">
            Upload PNG, JPG, JPEG, or WEBP up to 5MB.
          </p>
        </div>

        {previewUrl && (
          <div className="image-preview-card">
            <p className="image-preview-label">Selected Screenshot Preview</p>
            <img src={previewUrl} alt="Selected screenshot preview" className="image-preview" />
          </div>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <button
          type="submit"
          className="primary-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}
        </button>
      </form>

      {successData && (
        <div className="success-message-card">
          <span className="section-label">Ticket Submitted</span>
          <h2>Your support request was created successfully.</h2>
          <p>
            Your ticket code is <strong>{successData.ticketCode}</strong>.
          </p>
          <p>
            You can use <strong>{successData.email}</strong> on the My Tickets
            page to view this request.
          </p>
        </div>
      )}
    </div>
  );
}