export default function NotesList({ notes = [] }) {
  if (!notes.length) {
    return <p className="empty-state-text">No internal notes added yet.</p>;
  }

  return (
    <div className="notes-list">
      {notes.map((note, index) => (
        <article key={`${note.createdAt}-${index}`} className="note-card">
          <div className="note-card-top">
            <strong>{note.author || "Admin"}</strong>
            <span>{note.createdAt ? new Date(note.createdAt).toLocaleString() : "N/A"}</span>
          </div>
          <p>{note.text}</p>
        </article>
      ))}
    </div>
  );
}