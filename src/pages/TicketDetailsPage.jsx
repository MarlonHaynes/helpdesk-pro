import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StatusBadge from "../components/tickets/StatusBadge";
import NotesList from "../components/tickets/NotesList";
import AddNoteForm from "../components/tickets/AddNoteForm";
import { useAuth } from "../components/layout/AuthContext";
import {
  getTicketById,
  updateTicket,
  addTicketNote,
} from "../services/ticketService";
import { TICKET_STATUSES } from "../utils/constants";
import formatDate from "../utils/formatDate";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [status, setStatus] = useState("Open");
  const [assignedTechnician, setAssignedTechnician] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTicket() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const foundTicket = await getTicketById(id);

        if (!foundTicket) {
          setErrorMessage("Ticket not found.");
          setTicket(null);
          return;
        }

        setTicket(foundTicket);
        setStatus(foundTicket.status || "Open");
        setAssignedTechnician(foundTicket.assignedTechnician || "");
      } catch (error) {
        console.error("Error loading ticket:", error);
        setErrorMessage("Unable to load ticket details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [id]);

  async function refreshTicket() {
    const updatedTicket = await getTicketById(id);
    setTicket(updatedTicket);
    setStatus(updatedTicket.status || "Open");
    setAssignedTechnician(updatedTicket.assignedTechnician || "");
  }

  async function handleSaveDetails() {
    setSaveMessage("");
    setErrorMessage("");
    setIsSavingDetails(true);

    try {
      await updateTicket(id, {
        status,
        assignedTechnician: assignedTechnician.trim(),
      });

      await refreshTicket();
      setSaveMessage("Ticket details updated successfully.");
    } catch (error) {
      console.error("Error updating ticket:", error);
      setErrorMessage("Unable to update ticket details.");
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleAddNote(noteText) {
    setSaveMessage("");
    setErrorMessage("");
    setIsSavingNote(true);

    try {
      await addTicketNote(id, {
        text: noteText,
        author: currentUser?.email || "Admin",
        createdAt: new Date().toISOString(),
      });

      await refreshTicket();
      setSaveMessage("Internal note added successfully.");
    } catch (error) {
      console.error("Error adding note:", error);
      setErrorMessage("Unable to add note.");
    } finally {
      setIsSavingNote(false);
    }
  }

  if (isLoading) {
    return (
      <section className="page-section">
        <p>Loading ticket details...</p>
      </section>
    );
  }

  if (errorMessage && !ticket) {
    return (
      <section className="page-section">
        <h1>Ticket Details</h1>
        <p className="form-error">{errorMessage}</p>
      </section>
    );
  }

  return (
    <div className="ticket-details-page">
      <section className="page-section ticket-details-shell">
        <div className="ticket-details-header">
          <div>
            <span className="section-label">Ticket Details</span>
            <h1>{ticket.issueTitle}</h1>
            <p className="ticket-details-subtitle">
              {ticket.ticketCode} • Submitted by {ticket.fullName}
            </p>
          </div>

          <StatusBadge status={ticket.status} />
        </div>

        {saveMessage && <p className="success-inline-message">{saveMessage}</p>}
        {errorMessage && ticket && <p className="form-error">{errorMessage}</p>}

        <div className="ticket-details-grid">
          <div className="ticket-details-main">
            <div className="detail-card">
              <h2>Issue Summary</h2>
              <div className="detail-list">
                <div className="detail-row">
                  <span>Requester</span>
                  <strong>{ticket.fullName}</strong>
                </div>
                <div className="detail-row">
                  <span>Email</span>
                  <strong>{ticket.email}</strong>
                </div>
                <div className="detail-row">
                  <span>Category</span>
                  <strong>{ticket.category}</strong>
                </div>
                <div className="detail-row">
                  <span>Priority</span>
                  <strong>{ticket.priority}</strong>
                </div>
                <div className="detail-row">
                  <span>Date Submitted</span>
                  <strong>{formatDate(ticket.createdAt)}</strong>
                </div>
                <div className="detail-row">
                  <span>Last Updated</span>
                  <strong>{formatDate(ticket.updatedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <h2>Description</h2>
              <p className="description-block">{ticket.issueDescription}</p>
            </div>

            {ticket.screenshotUrl && (
              <div className="detail-card">
                <h2>Attached Screenshot</h2>
                <a
                  href={ticket.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-btn screenshot-link-btn"
                >
                  Open Full Screenshot
                </a>

                <div className="ticket-screenshot-wrap">
                  <img
                    src={ticket.screenshotUrl}
                    alt="Ticket attachment"
                    className="ticket-screenshot"
                  />
                </div>
              </div>
            )}

            <div className="detail-card">
              <h2>Internal Notes</h2>
              <NotesList notes={ticket.notes || []} />

              {currentUser && (
                <div className="note-form-wrap">
                  <AddNoteForm
                    onAddNote={handleAddNote}
                    isSubmitting={isSavingNote}
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="ticket-details-sidebar">
            <div className="detail-card workflow-card">
              <h2>Workflow</h2>

              <div className="detail-list">
                <div className="detail-row">
                  <span>Current Status</span>
                  <strong>{ticket.status}</strong>
                </div>
                <div className="detail-row">
                  <span>Assigned Technician</span>
                  <strong>{ticket.assignedTechnician || "Unassigned"}</strong>
                </div>
              </div>

              {currentUser ? (
                <div className="admin-control-panel">
                  <div className="form-group">
                    <label htmlFor="status">Update Status</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      {TICKET_STATUSES.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="assignedTechnician">
                      Assign Technician
                    </label>
                    <input
                      id="assignedTechnician"
                      type="text"
                      placeholder="Enter technician name"
                      value={assignedTechnician}
                      onChange={(event) =>
                        setAssignedTechnician(event.target.value)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="primary-btn full-width-btn"
                    onClick={handleSaveDetails}
                    disabled={isSavingDetails}
                  >
                    {isSavingDetails ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <p className="read-only-message">
                  Admin controls are only available to signed-in administrators.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}