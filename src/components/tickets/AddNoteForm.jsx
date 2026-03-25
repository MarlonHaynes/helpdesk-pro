import { useState } from "react";

export default function AddNoteForm({ onAddNote, isSubmitting }) {
  const [noteText, setNoteText] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!noteText.trim()) return;

    await onAddNote(noteText.trim());
    setNoteText("");
  }

  return (
    <form onSubmit={handleSubmit} className="add-note-form">
      <div className="form-group">
        <label htmlFor="internalNote">Add Internal Note</label>
        <textarea
          id="internalNote"
          rows="4"
          placeholder="Add an internal support note"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={isSubmitting}>
        {isSubmitting ? "Saving Note..." : "Add Note"}
      </button>
    </form>
  );
}